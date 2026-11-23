import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService, UnitOfWork } from '../infrastructure/database/prisma.service';
import { ApiRequest } from './actor';
import { requestContext } from './request-context';
import { fail, DomainError, apiFailure } from './errors';
export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}
function canonical(value: any): any {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((k) => [k, canonical(value[k])]),
      )
    : Array.isArray(value)
      ? value.map(canonical)
      : value;
}
@Injectable()
export class CommandsService {
  constructor(private readonly db: PrismaService) {}
  async run<T>(
    r: ApiRequest,
    work: (tx: UnitOfWork) => Promise<T>,
    participants: string[] = [],
  ): Promise<T> {
    const key = String(r.headers['idempotency-key'] ?? ''),
      route = r.path,
      requestHash = createHash('sha256')
        .update(JSON.stringify(canonical({ body: r.body ?? null, params: r.params })))
        .digest('hex');
    let outcome: T;
    try {
      outcome = await this.db.atomic(async (tx) => {
        let orderId = r.params.orderId ?? r.body?.draftOrderId;
        if (!orderId && r.params.quoteId)
          orderId = (
            await tx.quote.findUnique({
              where: { id: r.params.quoteId },
              select: { serviceOrder: { select: { orderId: true } } },
            })
          )?.serviceOrder.orderId;
        if (!orderId && r.params.caseId)
          orderId = (
            await tx.caseRecord.findUnique({
              where: { id: r.params.caseId },
              select: { orderId: true },
            })
          )?.orderId;
        if (!orderId && r.params.deliveryId)
          orderId = (
            await tx.delivery.findUnique({
              where: { id: r.params.deliveryId },
              select: { storeOrder: { select: { orderId: true } } },
            })
          )?.storeOrder.orderId;
        const order = orderId
          ? await tx.marketOrder.findUnique({
              where: { id: orderId },
              select: { buyerId: true, sellerProfile: { select: { userId: true } } },
            })
          : null;
        await this.db.lockUsers(tx, [
          r.actor.id,
          ...participants,
          ...(order ? [order.buyerId, order.sellerProfile.userId] : []),
        ]);
        const live = await tx.user.findUnique({
          where: { id: r.actor.id },
          include: {
            userRole_user: { where: { revokedAt: null }, include: { role: true } },
            restriction_user: {
              where: {
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        });
        if (
          !live ||
          live.archivedAt ||
          !(await tx.session.findFirst({
            where: {
              id: r.actor.sessionId,
              userId: r.actor.id,
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
          }))
        )
          fail('SESSION_REVOKED', 401);
        r.actor = {
          ...r.actor,
          roles: live.userRole_user
            .map((g) => g.role.code)
            .filter(
              (code) =>
                code !== 'ADMIN' || !live.restriction_user.some((r) => r.kind === 'SUSPENSION'),
            ),
          restrictions: live.restriction_user.map((g) => g.kind),
          verified: !!live.verifiedAt,
        };
        if (
          r.path.includes('/admin/') &&
          (!r.actor.roles.includes('ADMIN') || Date.now() / 1000 - r.actor.authTime > 900)
        )
          fail('FORBIDDEN', 403);
        if (
          r.actor.restrictions.includes('SUSPENSION') &&
          !/\/(cases|evidence|proposals|revisions)(\/|$)/.test(r.path) &&
          !r.path.endsWith('/files/uploads')
        )
          fail('ACCOUNT_RESTRICTED', 403);
        if (key) {
          const previous = await tx.idempotencyRecord.findUnique({
            where: { actorId_route_key: { actorId: r.actor.id, route, key } },
          });
          if (previous) {
            if (previous.requestHash !== requestHash) fail('IDEMPOTENCY_CONFLICT');
            return previous.response as T;
          }
        }
        const result = await work(tx);
        if (key)
          await tx.idempotencyRecord.create({
            data: {
              actorId: r.actor.id,
              route,
              key,
              requestHash,
              httpStatus: (result as any)?.failure ? 422 : 200,
              response: jsonValue(result ?? null),
              expiresAt: new Date(Date.now() + 7 * 86400000),
            },
          });
        return result;
      });
    } catch (error) {
      const failure = apiFailure(error);
      if (
        !key ||
        failure.status >= 500 ||
        failure.code === 'IDEMPOTENCY_CONFLICT' ||
        failure.code === 'REQUEST_IN_PROGRESS'
      )
        throw error;
      // The failed unit of work has rolled back. Cache only its rejection in a
      // separate transaction; never commit partial domain changes with an error.
      outcome = await this.db.atomic(async (tx) => {
        await this.db.lockUsers(tx, [r.actor.id]);
        const previous = await tx.idempotencyRecord.findUnique({
          where: { actorId_route_key: { actorId: r.actor.id, route, key } },
        });
        if (previous) {
          if (previous.requestHash !== requestHash) fail('IDEMPOTENCY_CONFLICT');
          return previous.response as T;
        }
        const response = {
          __failure: { code: failure.code, status: failure.status, details: failure.details },
        };
        await tx.idempotencyRecord.create({
          data: {
            actorId: r.actor.id,
            route,
            key,
            requestHash,
            httpStatus: failure.status,
            response: jsonValue(response),
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
        return response as T;
      });
    }
    const rejection = (outcome as any)?.__failure;
    if (rejection) throw new DomainError(rejection.code, rejection.status, rejection.details);
    return outcome;
  }
  async audit(
    tx: UnitOfWork,
    actorId: string | null,
    aggregateId: string,
    action: string,
    metadata: Prisma.InputJsonObject = {},
  ) {
    await tx.auditRecord.create({
      data: {
        actorId,
        aggregateId,
        action,
        metadata,
        requestId: requestContext.getStore()?.requestId ?? randomUUID(),
      },
    });
  }
}
