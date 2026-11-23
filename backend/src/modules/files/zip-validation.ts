import { fromBuffer, type ZipFile } from 'yauzl';
import { crc32 } from 'node:zlib';

// Validation only: nothing is extracted to disk. Bounds also apply to actual streamed bytes.
export async function validateFinalZip(bytes: Buffer): Promise<void> {
  const zip = await new Promise<ZipFile>((resolve, reject) => {
    fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, value) => (error ? reject(error) : resolve(value!)),
    );
  });
  const perEntryLimit = 50 * 1024 * 1024,
    totalLimit = 100 * 1024 * 1024;
  if (zip.entryCount > 1000) {
    zip.close();
    throw new Error('ZIP entry limit');
  }
  await new Promise<void>((resolve, reject) => {
    let total = 0,
      count = 0,
      finished = false;
    const abort = (error: unknown) => {
      if (finished) return;
      finished = true;
      zip.close();
      reject(error);
    };
    zip.on('error', abort);
    zip.on('end', () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    });
    zip.on('entry', (entry) => {
      void (async () => {
        const offset = entry.relativeOffsetOfLocalHeader;
        if (
          ++count > 1000 ||
          entry.isEncrypted() ||
          ![0, 8].includes(entry.compressionMethod) ||
          entry.fileName.includes('\0') ||
          ((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000 ||
          entry.uncompressedSize > perEntryLimit ||
          total + entry.uncompressedSize > totalLimit ||
          offset + 30 > bytes.length ||
          bytes.readUInt32LE(offset) !== 0x04034b50 ||
          (bytes.readUInt16LE(offset + 6) & 0x41) !== 0 ||
          bytes.readUInt16LE(offset + 8) !== entry.compressionMethod
        )
          throw new Error('Unsafe ZIP entry');
        const stream = await new Promise<NodeJS.ReadableStream>((ok, bad) =>
          zip.openReadStream(entry, (error, value) => (error ? bad(error) : ok(value!))),
        );
        let size = 0,
          checksum = 0;
        for await (const chunk of stream as AsyncIterable<Buffer>) {
          size += chunk.length;
          total += chunk.length;
          if (size > perEntryLimit || total > totalLimit) throw new Error('ZIP expansion limit');
          checksum = crc32(chunk, checksum);
        }
        if (size !== entry.uncompressedSize || checksum !== entry.crc32)
          throw new Error('Corrupt ZIP payload');
        if (!finished) zip.readEntry();
      })().catch(abort);
    });
    zip.readEntry();
  });
}
