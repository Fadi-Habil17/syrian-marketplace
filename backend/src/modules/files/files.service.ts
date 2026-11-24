import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { FileAsset, FileAccessClass } from '@prisma/client';
import { Actor, ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
import { FILE_STORAGE, FileStorage } from './storage';
import { FILE_SCANNER, FileScanner } from './clamav-scanner';
import { UploadBytes, validateUpload } from './file-validation';
@Injectable()
export class FilesService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    @Inject(FILE_SCANNER) private readonly scanner: FileScanner,
  ) {}
  async authorize(file: FileAsset, actor: Actor | undefined, tx: UnitOfWork = this.db) {
    if (file.deletedAt) fail('NOT_FOUND', 404);
    if (
      file.ownerId === actor?.id &&
      !['CASE_EVIDENCE', 'DELIVERY_ONLY'].includes(file.accessClass)
    )
      return;
    if (file.accessClass === 'PUBLIC_CATALOG') {
      if (
        actor?.roles.includes('ADMIN') &&
        ((await tx.listingAsset.findFirst({ where: { fileId: file.id } })) ||
          (await tx.productAsset.findFirst({ where: { fileId: file.id } })) ||
          (await tx.storefront.findFirst({ where: { logoId: file.id } })) ||
          (await tx.portfolioItem.findFirst({ where: { fileId: file.id } })))
      ) {
        await this.commands.audit(tx, actor.id, file.id, 'moderation.file_read');
        return;
      }
      const visible = { status: 'PUBLISHED' as const, profile: { status: 'ACTIVE' as const } };
      if (
        (await tx.listingAsset.findFirst({ where: { fileId: file.id, listing: visible } })) ||
        (await tx.productAsset.findFirst({
          where: { fileId: file.id, product: { status: 'PUBLISHED', storefront: visible } },
        })) ||
        (await tx.storefront.findFirst({ where: { logoId: file.id, ...visible } })) ||
        (await tx.portfolioItem.findFirst({
          where: { fileId: file.id, archivedAt: null, profile: { status: 'ACTIVE' } },
        }))
      )
        return;
      fail('NOT_FOUND', 404);
    }
    if (!actor) fail('AUTH_REQUIRED', 401);
    if (file.accessClass === 'CASE_EVIDENCE') {
      const c = requireValue(
        await tx.caseRecord.findUnique({
          where: { id: file.caseId! },
          include: {
            order: { include: { sellerProfile: true } },
            caseEvidence_case: { where: { fileId: file.id } },
          },
        }),
      );
      if (c.handlingAdminId === actor.id && actor.roles.includes('ADMIN')) return;
      if (
        [c.order.buyerId, c.order.sellerProfile.userId].includes(actor.id) &&
        (file.ownerId === actor.id || c.caseEvidence_case.some((e) => e.visibility === 'SHARED'))
      )
        return;
      fail('NOT_FOUND', 404);
    }
    if (!file.orderId) fail('NOT_FOUND', 404);
    if (file.accessClass === 'DELIVERY_ONLY') {
      const order = requireValue(
        await tx.marketOrder.findUnique({
          where: { id: file.orderId },
          include: {
            sellerProfile: true,
            storeOrder_order: {
              include: {
                delivery_storeOrder: {
                  include: {
                    driverAssignment_delivery: {
                      where: { status: { in: ['ASSIGNED', 'PICKED_UP'] } },
                      include: { driver: true },
                    },
                  },
                },
              },
            },
          },
        }),
      );
      if (
        [order.buyerId, order.sellerProfile.userId].includes(actor.id) ||
        order.storeOrder_order?.delivery_storeOrder?.driverAssignment_delivery.some(
          (a) => a.driver.userId === actor.id,
        ) ||
        (actor.roles.includes('ADMIN') &&
          (await tx.caseRecord.findFirst({
            where: { orderId: order.id, handlingAdminId: actor.id },
          })))
      )
        return;
      fail('NOT_FOUND', 404);
    }
    const order = await this.access.order(file.orderId, actor, tx);
    if (
      file.accessClass === 'FINAL_DELIVERABLE' &&
      actor.id === order.buyerId &&
      !(await tx.paymentAttempt.findFirst({
        where: { orderId: order.id, installment: 'BALANCE', status: 'SUCCEEDED' },
      }))
    )
      fail('FORBIDDEN', 403);
  }
  async upload(r: ApiRequest, file: UploadBytes) {
    if (!file) fail('INVALID_INPUT', 400);
    if (r.actor.restrictions.includes('SUSPENSION') && r.body.accessClass !== 'CASE_EVIDENCE')
      fail('ACCOUNT_RESTRICTED', 403);
    const b = r.body as { accessClass: FileAccessClass; orderId?: string; caseId?: string };
    if (
      ![
        'PUBLIC_CATALOG',
        'ORDER_SHARED',
        'FINAL_DELIVERABLE',
        'DELIVERY_ONLY',
        'CASE_EVIDENCE',
      ].includes(b.accessClass)
    )
      fail('INVALID_INPUT', 400);
    if (b.accessClass === 'PUBLIC_CATALOG') {
      await this.access.profile(r.actor);
    }
    if (b.accessClass === 'CASE_EVIDENCE') {
      const c = requireValue(
        await this.db.caseRecord.findUnique({
          where: { id: b.caseId },
          include: { order: { include: { sellerProfile: true } } },
        }),
      );
      if (
        ![c.order.buyerId, c.order.sellerProfile.userId].includes(r.actor.id) &&
        !(c.handlingAdminId === r.actor.id && r.actor.roles.includes('ADMIN'))
      )
        fail('NOT_FOUND', 404);
      b.orderId = c.orderId;
    }
    if (b.orderId) {
      if (b.accessClass === 'DELIVERY_ONLY') {
        const fake = { ...b, id: randomUUID(), ownerId: '', deletedAt: null } as FileAsset;
        await this.authorize(fake, r.actor);
      } else {
        const order = await this.access.order(b.orderId, r.actor);
        if (b.accessClass === 'FINAL_DELIVERABLE') this.access.seller(order, r.actor);
      }
    } else if (['FINAL_DELIVERABLE', 'DELIVERY_ONLY'].includes(b.accessClass))
      fail('INVALID_INPUT', 400);
    const content = await validateUpload(file, b.accessClass),
      id = randomUUID(),
      storageKey = `quarantine/${r.actor.id}/${id}`;
    await this.storage.put(storageKey, content.bytes, content.mime);
    r.body = {
      ...b,
      sha256: createHash('sha256').update(content.bytes).digest('hex'),
      originalName: file.originalname,
    };
    try {
      const saved = await this.commands.run(r, async (tx) => {
        if (b.accessClass === 'DELIVERY_ONLY')
          await this.authorize(
            { ...b, id, ownerId: r.actor.id, deletedAt: null } as FileAsset,
            r.actor,
            tx,
          );
        else if (b.orderId) await this.access.order(b.orderId, r.actor, tx);
        const f = await tx.fileAsset.create({
          data: {
            id,
            ownerId: r.actor.id,
            orderId: b.orderId,
            caseId: b.caseId,
            accessClass: b.accessClass,
            storageKey,
            originalName: file.originalname,
            mimeType: content.mime,
            extension: content.ext,
            sizeBytes: BigInt(content.bytes.length),
            sha256: r.body.sha256,
            scanStatus: 'QUARANTINED',
          },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateId: id,
            aggregateVersion: 1,
            type: 'file.scan.requested',
            deduplicationKey: `scan:${id}`,
            payload: { fileId: id },
          },
        });
        await this.commands.audit(tx, r.actor.id, id, 'file.quarantined');
        return f;
      });
      if (saved.id !== id) await this.storage.remove(storageKey);
      return saved;
    } catch (e) {
      await this.storage.remove(storageKey).catch(() => undefined);
      throw e;
    }
  }
  async scan(id: string) {
    const f = requireValue(await this.db.fileAsset.findUnique({ where: { id } }));
    if (f.scanStatus !== 'QUARANTINED') return f;
    const bytes = await this.storage.read(f.storageKey);
    if (createHash('sha256').update(bytes).digest('hex') !== f.sha256) fail('INVALID_INPUT', 400);
    const clean = await this.scanner.scan(bytes);
    return this.db.atomic(async (tx) => {
      await tx.fileAsset.updateMany({
        where: { id, scanStatus: 'QUARANTINED' },
        data: { scanStatus: clean ? 'CLEAN' : 'REJECTED' },
      });
      await this.commands.audit(tx, null, id, clean ? 'file.clean' : 'file.rejected');
      return tx.fileAsset.findUniqueOrThrow({ where: { id } });
    });
  }
  async requestRetention() {
    const cutoff = new Date(Date.now() - 365 * 86400000);
    return this.db.atomic(async (tx) => {
      const files = await tx.fileAsset.findMany({
        where: {
          deletedAt: null,
          accessClass: { not: 'PUBLIC_CATALOG' },
          order: {
            state: { in: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'REJECTED', 'EXPIRED'] },
            completedAt: { lt: cutoff },
            caseRecord_order: { none: { status: { in: ['OPEN', 'ADMIN_REVIEW'] } } },
          },
        },
        take: 100,
        orderBy: { id: 'asc' },
      });
      const at = new Date();
      let count = 0;
      for (const f of files) {
        const changed = await tx.fileAsset.updateMany({
          where: { id: f.id, deletedAt: null },
          data: { deletedAt: at },
        });
        if (!changed.count) continue;
        await tx.outboxEvent.create({
          data: {
            aggregateId: f.id,
            aggregateVersion: 1,
            type: 'file.removal.requested',
            deduplicationKey: `retention:${f.id}:${at.getTime()}`,
            payload: { fileId: f.id },
          },
        });
        await this.commands.audit(tx, null, f.id, 'file.retention.tombstone');
        count++;
      }
      return count;
    });
  }
  async removeRetained(id: string) {
    const f = await this.db.fileAsset.findUniqueOrThrow({ where: { id } });
    if (!f.deletedAt) return;
    if (
      f.orderId &&
      (await this.db.caseRecord.findFirst({
        where: { orderId: f.orderId, status: { in: ['OPEN', 'ADMIN_REVIEW'] } },
      }))
    ) {
      await this.db.fileAsset.update({ where: { id }, data: { deletedAt: null } });
      return;
    }
    await this.storage.remove(f.storageKey);
  }
  async getFileStatus(r: ApiRequest) {
    const f = requireValue(await this.db.fileAsset.findUnique({ where: { id: r.params.fileId } }));
    await this.authorize(f, r.actor);
    return f;
  }
  async download(r: ApiRequest) {
    const f = await this.getFileStatus(r);
    if (f.scanStatus !== 'CLEAN') fail('FORBIDDEN', 403);
    const bytes = await this.storage.read(f.storageKey);
    await this.authorize(f, r.actor);
    if (createHash('sha256').update(bytes).digest('hex') !== f.sha256)
      fail('TEMPORARILY_UNAVAILABLE', 503);
    return { file: f, bytes };
  }
}
