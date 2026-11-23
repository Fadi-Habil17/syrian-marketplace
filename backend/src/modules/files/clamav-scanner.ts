import { Injectable } from '@nestjs/common';
import { createConnection } from 'node:net';
export const FILE_SCANNER = Symbol('FileScanner');
export interface FileScanner {
  scan(bytes: Buffer): Promise<boolean>;
}
@Injectable()
export class ClamavScanner implements FileScanner {
  async scan(bytes: Buffer): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const socket = createConnection({
          host: process.env.CLAMAV_HOST ?? '127.0.0.1',
          port: Number(process.env.CLAMAV_PORT ?? 3310),
        }),
        chunks: Buffer[] = [];
      let finished = false;
      const done = (error?: Error) => {
        if (finished) return;
        finished = true;
        socket.destroy();
        if (error) reject(error);
      };
      socket.setTimeout(30000, () => done(new Error('SCANNER_TIMEOUT')));
      socket.once('error', done);
      socket.on('data', (part: Buffer) => {
        chunks.push(part);
        if (chunks.reduce((n, b) => n + b.length, 0) > 1024) {
          done(new Error('SCANNER_UNAVAILABLE'));
          return;
        }
        if (part.includes(0)) {
          const reply = Buffer.concat(chunks).toString().replaceAll('\0', '').trim();
          finished = true;
          socket.destroy();
          if (reply === 'stream: OK') resolve(true);
          else if (reply.endsWith(' FOUND')) resolve(false);
          else reject(new Error('SCANNER_UNAVAILABLE'));
        }
      });
      socket.once('connect', () => {
        socket.write(Buffer.from('zINSTREAM\0'));
        for (let start = 0; start < bytes.length; start += 65536) {
          const chunk = bytes.subarray(start, start + 65536),
            size = Buffer.alloc(4);
          size.writeUInt32BE(chunk.length);
          socket.write(size);
          socket.write(chunk);
        }
        socket.write(Buffer.alloc(4));
      });
      socket.once('end', () => {
        if (!finished) done(new Error('SCANNER_UNAVAILABLE'));
      });
      socket.once('close', () => {
        if (!finished) done(new Error('SCANNER_UNAVAILABLE'));
      });
    });
  }
}
