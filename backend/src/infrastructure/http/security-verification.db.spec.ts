import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../app.module';
import { configureApp } from '../../bootstrap';
import { apiContract } from './contracts.service';

const routes = Object.entries(apiContract.paths).flatMap(([path, operations]: [string, any]) =>
  Object.entries(operations)
    .filter(([method]) => ['get', 'post', 'patch', 'put', 'delete'].includes(method))
    .map(([method, operation]: [string, any]) => ({ path, method, operation })),
);
const privateRoutes = routes.filter(({ operation }) => {
  const security = operation.security ?? apiContract.security;
  return security.length && security.every((grant: object) => Object.keys(grant).length > 0);
});
const run = process.env.DATABASE_TEST_URL ? describe : describe.skip;
run('Complete contract authentication boundary and admin RBAC', () => {
  let app: INestApplication, customer: string;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    customer = (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@demo.marketplace.test',
          password: 'Marketplace123!',
          client: 'WEB',
        })
        .expect(200)
    ).body.accessToken;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });
  it.each(privateRoutes)('requires authentication for $method $path', async ({ method, path }) => {
    const url = path.replace(/\{[^}]+\}/g, randomUUID());
    const response = await (request(app.getHttpServer()) as any)[method](url).send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|postgresql:|stack|SELECT /);
  });
  it.each(routes.filter(({ path }) => path.startsWith('/api/v1/admin/')))(
    'rejects customer permissions for $method $path',
    async ({ method, path }) => {
      await (request(app.getHttpServer()) as any)
        [method](path.replace(/\{[^}]+\}/g, randomUUID()))
        .auth(customer, { type: 'bearer' })
        .send({})
        .expect(403);
    },
  );
  it('serves live Swagger with the canonical OpenAPI 3.1 contract', async () => {
    await request(app.getHttpServer()).get('/api/docs/').expect(200);
    const document = (await request(app.getHttpServer()).get('/api/docs-json').expect(200)).body;
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths).toEqual(apiContract.paths);
  });
});
