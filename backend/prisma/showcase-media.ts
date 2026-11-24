import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { ClamavScanner } from '../src/modules/files/clamav-scanner';
import { validateUpload } from '../src/modules/files/file-validation';
import { S3FileStorage } from '../src/modules/files/storage';

export function showcaseId(key: string) {
  const h = createHash('sha256')
    .update('marketplace:showcase:' + key)
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function showcasePhotos(db: PrismaClient) {
  const storage = new S3FileStorage();
  const scanner = new ClamavScanner();
  return async (ownerId: string, position: number, createdAt: Date) => {
    const id = showcaseId(`photo:${ownerId}:${position}`);
    const existing = await db.fileAsset.findUnique({ where: { id } });
    if (existing?.scanStatus === 'CLEAN') {
      try {
        const bytes = await storage.read(existing.storageKey);
        if (createHash('sha256').update(bytes).digest('hex') === existing.sha256) return id;
      } catch {
        // Recreate a missing presentation asset from the original.
      }
    }
    const local = position < 16;
    const grid = local ? 4 : 2;
    const cell = local ? position : position - 16;
    const sheet = sharp(
      join(__dirname, 'showcase-assets', local ? 'local-catalog.png' : 'freelance-catalog.png'),
    );
    const { width, height } = await sheet.metadata();
    const x = cell % grid;
    const y = Math.floor(cell / grid);
    const left = Math.floor((width * x) / grid) + 3;
    const top = Math.floor((height * y) / grid) + 3;
    const bytes = await sheet
      .extract({
        left,
        top,
        width: Math.floor((width * (x + 1)) / grid) - left - 3,
        height: Math.floor((height * (y + 1)) / grid) - top - 3,
      })
      .webp({ quality: 86 })
      .toBuffer();

    const originalname = `catalog-${position + 1}.webp`;
    const file = await validateUpload(
      {
        originalname,
        mimetype: 'image/webp',
        buffer: bytes,
        size: bytes.length,
      },
      'PUBLIC_CATALOG',
    );
    if (!(await scanner.scan(file.bytes))) throw new Error('Catalog photo failed scanning');
    const storageKey = `catalog/showcase/${ownerId}/${id}.webp`;
    await storage.put(storageKey, file.bytes, file.mime);
    const data = {
      ownerId,
      storageKey,
      originalName: originalname,
      mimeType: file.mime,
      extension: file.ext,
      sizeBytes: BigInt(file.bytes.length),
      sha256: createHash('sha256').update(file.bytes).digest('hex'),
      accessClass: 'PUBLIC_CATALOG' as const,
      scanStatus: 'CLEAN' as const,
    };
    await db.fileAsset.upsert({ where: { id }, create: { id, ...data, createdAt }, update: data });
    return id;
  };
}
