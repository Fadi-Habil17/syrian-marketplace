import { createHash } from 'node:crypto';
import type { PrismaClient, FileAccessClass } from '@prisma/client';
import sharp from 'sharp';
import { S3FileStorage } from '../src/modules/files/storage';
import { ClamavScanner } from '../src/modules/files/clamav-scanner';
import { validateUpload } from '../src/modules/files/file-validation';
import { DeadlinesService } from '../src/modules/jobs/deadlines.service';
export async function seedMedia(db: PrismaClient, id: (key: string) => string) {
  const storage = new S3FileStorage(),
    scanner = new ClamavScanner();
  const media = async (
    role: string,
    key: string,
    accessClass: FileAccessClass,
    orderId?: string,
  ) => {
    const fileId = id('media:' + key),
      existing = await db.fileAsset.findUnique({ where: { id: fileId } }),
      ownerId = id('user:' + role),
      storageKey = `demo/${ownerId}/${fileId}.png`,
      bytes = await sharp({
        create: {
          width: 16,
          height: 16,
          channels: 3,
          background: role === 'STORE_OWNER' ? '#be9569' : '#496d87',
        },
      })
        .png()
        .toBuffer(),
      validated = await validateUpload(
        {
          originalname: 'fictional-demo.png',
          mimetype: 'image/png',
          buffer: bytes,
          size: bytes.length,
        },
        accessClass,
      );
    if (existing?.scanStatus === 'CLEAN') {
      try {
        const saved = await storage.read(existing.storageKey);
        if (createHash('sha256').update(saved).digest('hex') === existing.sha256)
          return existing.id;
      } catch {
        /* Restore missing local demo object from its deterministic source. */
      }
    }
    if (!(await scanner.scan(validated.bytes))) throw new Error('DEMO_SCAN_REJECTED');
    await storage.put(storageKey, validated.bytes, validated.mime);
    const data = {
      ownerId,
      storageKey,
      originalName: 'fictional-demo.png',
      mimeType: validated.mime,
      extension: validated.ext,
      sizeBytes: BigInt(validated.bytes.length),
      sha256: createHash('sha256').update(validated.bytes).digest('hex'),
      accessClass,
      orderId,
      scanStatus: 'CLEAN' as const,
    };
    await db.fileAsset.upsert({
      where: { id: fileId },
      create: { id: fileId, ...data },
      update: data,
    });
    return fileId;
  };
  try {
    for (const role of ['FREELANCER', 'PROFESSIONAL', 'STORE_OWNER']) {
      const fileId = await media(role, 'catalog:' + role, 'PUBLIC_CATALOG');
      if (role === 'STORE_OWNER') {
        await db.storefront.updateMany({
          where: { id: id('store'), logoId: null },
          data: { logoId: fileId },
        });
        for (const currency of ['SYP', 'USD'])
          await db.productAsset.upsert({
            where: { productId_fileId: { productId: id('product:' + currency), fileId } },
            create: { productId: id('product:' + currency), fileId, position: 0 },
            update: {},
          });
      } else
        for (const currency of ['SYP', 'USD'])
          await db.listingAsset.upsert({
            where: { listingId_fileId: { listingId: id(`listing:${role}:${currency}`), fileId } },
            create: { listingId: id(`listing:${role}:${currency}`), fileId, position: 0 },
            update: {},
          });
    }
    for (const currency of ['SYP', 'USD']) {
      const orderId = id(`professional-order:INSPECTION_QUOTE:${currency}`),
        fileId = await media('CUSTOMER', 'inspection:' + currency, 'ORDER_SHARED', orderId);
      await db.inspectionPhoto.upsert({
        where: { inspectionId_fileId: { inspectionId: id('inspection:' + currency), fileId } },
        create: { inspectionId: id('inspection:' + currency), fileId },
        update: {},
      });
    }
    const deadlines = new DeadlinesService();
    await db.$transaction(async (tx) => {
      const address = await tx.address.findUniqueOrThrow({ where: { id: id('buyer-address') } });
      for (const currency of ['SYP', 'USD']) {
        const o = await tx.marketOrder.findUniqueOrThrow({
          where: { id: id('order:freelance:' + currency) },
          include: { serviceOrder_order: true },
        });
        if (o.state === 'AWAITING_AGREEMENT' && !o.serviceOrder_order!.dueAt) {
          const dueAt = new Date(Date.now() + 3 * 86400000),
            snapshot = o.agreementSnapshot as Record<string, any>;
          await tx.serviceOrder.update({ where: { orderId: o.id }, data: { dueAt } });
          await tx.marketOrder.update({
            where: { id: o.id },
            data: {
              agreementSnapshot: {
                ...snapshot,
                proposal: {
                  scope: snapshot.scope,
                  dueAt: dueAt.toISOString(),
                  approvedBy: [o.buyerId],
                },
              },
            },
          });
        }
        const preview = await tx.marketOrder.findUnique({
          where: { id: id('store-preview:' + currency) },
        });
        if (preview?.state === 'DRAFT')
          await tx.marketOrder.update({
            where: { id: preview.id },
            data: { addressSnapshot: JSON.parse(JSON.stringify(address)) },
          });
      }
      const requests = await tx.serviceOrder.findMany({
        where: {
          order: {
            buyerId: id('user:CUSTOMER'),
            state: {
              in: [
                'AWAITING_AGREEMENT',
                'BOOKING_REQUESTED',
                'PENDING_QUOTE',
                'QUOTE_SENT',
                'SCHEDULE_PROPOSED',
              ],
            },
          },
        },
      });
      for (const s of requests)
        if (s.responseDeadlineAt)
          await deadlines.schedule(tx, s.orderId, 'RESPONSE_EXPIRY', s.responseDeadlineAt, 1);
    });
  } finally {
    storage.onModuleDestroy();
  }
}
