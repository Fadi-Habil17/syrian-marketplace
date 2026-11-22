import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('SetupWorker');
  logger.log('Setup heartbeat only: no completion, payment or notification jobs registered.');
  const heartbeat = setInterval(
    () => logger.debug('Setup worker alive'),
    config.getOrThrow<number>('WORKER_POLL_MS'),
  );
  let closing = false;
  const close = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    clearInterval(heartbeat);
    await app.close();
  };
  process.once('SIGINT', () => void close());
  process.once('SIGTERM', () => void close());
}

void bootstrapWorker();
