import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ScheduledJobsService } from './modules/jobs/scheduled-jobs.service';
import { OutboxWorker } from './modules/jobs/outbox-worker.service';
import { NotificationDispatcher } from './modules/notifications/notification-dispatcher.service';
import { FilesService } from './modules/files/files.service';

async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('MarketplaceWorker');
  let busy = false;
  let lastRetention = 0;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      if (Date.now() - lastRetention >= 86400000) {
        for (let n = 0; n < 20; n++) {
          const count = await app.get(FilesService).requestRetention();
          if (count < 100) break;
        }
        lastRetention = Date.now();
      }
      const jobs = await app.get(ScheduledJobsService).tick();
      const events = await app.get(OutboxWorker).tick();
      const pushes = await app.get(NotificationDispatcher).pushTick();
      if (jobs + events + pushes) logger.log({ jobs, events, pushes });
    } catch {
      logger.error('Worker batch failed; durable leases allow retry');
    } finally {
      busy = false;
    }
  };
  const heartbeat = setInterval(() => void tick(), config.getOrThrow<number>('WORKER_POLL_MS'));
  await tick();
  logger.log('Durable deadline, file scan, mail, outbox and Expo receipt workers active');
  let closing = false;
  const close = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    clearInterval(heartbeat);
    while (busy) await new Promise((resolve) => setTimeout(resolve, 50));
    await app.close();
  };
  process.once('SIGINT', () => void close());
  process.once('SIGTERM', () => void close());
}

void bootstrapWorker();
