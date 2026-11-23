import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
export const FILE_STORAGE = Symbol('FileStorage');
export interface FileStorage {
  put(key: string, bytes: Buffer, mime: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
@Injectable()
export class S3FileStorage implements FileStorage, OnModuleDestroy {
  private readonly client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    maxAttempts: 2,
    requestHandler: { connectionTimeout: 3000, requestTimeout: 15000 },
    region: process.env.STORAGE_REGION ?? 'us-east-1',
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE !== 'false',
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY!,
      secretAccessKey: process.env.STORAGE_SECRET_KEY!,
    },
  });
  private readonly bucket = process.env.STORAGE_BUCKET!;
  async put(key: string, bytes: Buffer, mime: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: mime,
        ContentDisposition: 'attachment',
        Metadata: { visibility: 'private' },
      }),
    );
  }
  async read(key: string) {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!object.Body) throw new Error('STORAGE_OBJECT_MISSING');
    return Buffer.from(await object.Body.transformToByteArray());
  }
  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  onModuleDestroy() {
    this.client.destroy();
  }
}
