import sharp from 'sharp';
import { validateFinalZip } from './zip-validation';
import { fail } from '../../common/errors';
export interface UploadBytes {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
export async function validateUpload(file: UploadBytes, accessClass: string) {
  const name = file.originalname;
  if (!name || name.length > 255 || /[\\/\x00-\x1f]/.test(name)) fail('INVALID_INPUT', 400);
  const ext = name.split('.').pop()!.toLowerCase(),
    b = file.buffer;
  let mime: string;
  if (b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) mime = 'image/png';
  else if (b[0] === 255 && b[1] === 216 && b[2] === 255) mime = 'image/jpeg';
  else if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP')
    mime = 'image/webp';
  else if (b.subarray(0, 5).toString() === '%PDF-') mime = 'application/pdf';
  else if (
    b.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])) ||
    b.subarray(0, 4).equals(Buffer.from([80, 75, 5, 6]))
  )
    mime = 'application/zip';
  else fail('UNSUPPORTED_MEDIA_TYPE', 415);
  const expected: Record<string, string[]> = {
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'application/zip': ['zip'],
  };
  if (
    mime !== file.mimetype ||
    !expected[mime]!.includes(ext) ||
    (mime === 'application/zip' && accessClass !== 'FINAL_DELIVERABLE')
  )
    fail('UNSUPPORTED_MEDIA_TYPE', 415);
  const maximum = mime.startsWith('image/')
    ? 10 * 1024 * 1024
    : mime === 'application/pdf'
      ? 20 * 1024 * 1024
      : 50 * 1024 * 1024;
  if (b.length === 0 || b.length > maximum) fail('FILE_TOO_LARGE', 413);
  if (mime.startsWith('image/')) {
    try {
      const image = sharp(b, { failOn: 'error', limitInputPixels: 20000000 });
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height || (metadata.pages && metadata.pages > 1))
        fail('UNSUPPORTED_MEDIA_TYPE', 415);
      const bytes = await image.rotate().toBuffer();
      if (bytes.length > maximum) fail('FILE_TOO_LARGE', 413);
      return { bytes, mime, ext };
    } catch (e) {
      if (e instanceof Error && /^[A-Z_]+$/.test(e.message)) throw e;
      fail('UNSUPPORTED_MEDIA_TYPE', 415);
    }
  }
  if (
    mime === 'application/pdf' &&
    (!b.subarray(Math.max(0, b.length - 1024)).includes(Buffer.from('%%EOF')) ||
      /\/(?:JavaScript|JS\b|Launch|OpenAction|RichMedia|EmbeddedFile)/.test(b.toString('latin1')))
  )
    fail('UNSUPPORTED_MEDIA_TYPE', 415);
  if (mime === 'application/zip') {
    try {
      await validateFinalZip(b);
    } catch {
      fail('UNSUPPORTED_MEDIA_TYPE', 415);
    }
  }
  return { bytes: b, mime, ext };
}
