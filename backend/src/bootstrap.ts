import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { requestContext } from './common/request-context';
import { ApiRequest } from './common/actor';
import { apiContract } from './infrastructure/http/contracts.service';
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.use(helmet());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    (req as ApiRequest).requestId = requestId;
    requestContext.run({ requestId }, next);
  });
  app
    .getHttpAdapter()
    .getInstance()
    .set('json replacer', (_key: string, value: unknown) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGINS').split(','),
    credentials: true,
  });
  SwaggerModule.setup('api/docs', app, apiContract as any);
  app.enableShutdownHooks();
  return app;
}
