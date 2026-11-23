import sharp from 'sharp';
import { validateUpload } from './file-validation';
// Produced independently with Python's zipfile (DEFLATED), not the production parser.
const zipFixture = () =>
  Buffer.from(
    'UEsDBBQAAAAIAFSvd13/kvTAHAAAABoAAAAKAAAAcmVwb3J0LnR4dHMsKCjKL0tNUUjLzEvMUUhJzcksSy1KTMpJBQBQSwECFAAUAAAACABUr3dd/5L0wBwAAAAaAAAACgAAAAAAAAAAAAAAgAEAAAAAcmVwb3J0LnR4dFBLBQYAAAAAAQABADgAAABEAAAAAAA=',
    'base64',
  );
const zipUpload = (buffer: Buffer) =>
  validateUpload(
    { originalname: 'final.zip', mimetype: 'application/zip', buffer, size: buffer.length },
    'FINAL_DELIVERABLE',
  );
describe('Bounded final ZIP validation', () => {
  it('preserves an ordinary deflated final deliverable', async () => {
    expect((await zipUpload(zipFixture())).bytes).toEqual(zipFixture());
  });
  it('rejects a forged signature without a central directory', async () => {
    await expect(zipUpload(Buffer.from('504b030400000000504b0506', 'hex'))).rejects.toThrow(
      'UNSUPPORTED_MEDIA_TYPE',
    );
  });
  it('rejects encrypted entries that antivirus cannot inspect', async () => {
    const b = zipFixture(),
      central = b.indexOf(Buffer.from('504b0102', 'hex'));
    b.writeUInt16LE(1, 6);
    b.writeUInt16LE(1, central + 8);
    await expect(zipUpload(b)).rejects.toThrow('UNSUPPORTED_MEDIA_TYPE');
  });
  it('rejects a corrupt CRC instead of accepting an unverified payload', async () => {
    const b = zipFixture(),
      central = b.indexOf(Buffer.from('504b0102', 'hex'));
    b.writeUInt32LE(0, central + 16);
    await expect(zipUpload(b)).rejects.toThrow('UNSUPPORTED_MEDIA_TYPE');
  });
  it('rejects declared expansion over the per-entry resource limit', async () => {
    const b = zipFixture(),
      central = b.indexOf(Buffer.from('504b0102', 'hex'));
    b.writeUInt32LE(51 * 1024 * 1024, central + 24);
    await expect(zipUpload(b)).rejects.toThrow('UNSUPPORTED_MEDIA_TYPE');
  });
  it.each(['path', 'symlink', 'local-encryption', 'actual-size'])(
    'rejects unsafe archive metadata: %s',
    async (kind) => {
      const b = zipFixture(),
        central = b.indexOf(Buffer.from('504b0102', 'hex'));
      if (kind === 'path') {
        b.write('../bad.txt', 30);
        b.write('../bad.txt', central + 46);
      }
      if (kind === 'symlink') b.writeUInt32LE(0xa1ff0000, central + 38);
      if (kind === 'local-encryption') b.writeUInt16LE(1, 6);
      if (kind === 'actual-size') b.writeUInt32LE(1, central + 24);
      await expect(zipUpload(b)).rejects.toThrow('UNSUPPORTED_MEDIA_TYPE');
    },
  );
});
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
