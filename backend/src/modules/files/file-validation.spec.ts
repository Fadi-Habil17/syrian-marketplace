import sharp from 'sharp';
import { validateUpload } from './file-validation';
describe('Upload validation before private persistence', () => {
  let png: Buffer;
  beforeAll(async () => {
    png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#abcdef' } })
      .png()
      .toBuffer();
  });
  it('decodes and sanitizes a genuine PNG', async () => {
    const r = await validateUpload(
      { originalname: 'demo.png', mimetype: 'image/png', buffer: png, size: png.length },
      'PUBLIC_CATALOG',
    );
    expect(r.mime).toBe('image/png');
    expect((await sharp(r.bytes).metadata()).width).toBe(2);
  });
  it.each([
    ['demo.jpg', 'image/png'],
    ['demo.png', 'image/jpeg'],
    ['../demo.png', 'image/png'],
    ['demo.svg', 'image/svg+xml'],
  ])('rejects mismatched metadata or traversal: %s', async (name, mimetype) => {
    await expect(
      validateUpload(
        { originalname: name, mimetype, buffer: png, size: png.length },
        'PUBLIC_CATALOG',
      ),
    ).rejects.toThrow();
  });
  it('rejects active PDF content without invoking an external parser', async () => {
    const bytes = Buffer.from('%PDF-1.4\n/JavaScript\n%%EOF');
    await expect(
      validateUpload(
        {
          originalname: 'unsafe.pdf',
          mimetype: 'application/pdf',
          buffer: bytes,
          size: bytes.length,
        },
        'PUBLIC_CATALOG',
      ),
    ).rejects.toThrow('UNSUPPORTED_MEDIA_TYPE');
  });
});
