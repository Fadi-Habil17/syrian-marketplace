import { Injectable } from '@nestjs/common';
import { Prisma, ModerationOutcome } from '@prisma/client';
import { ApiRequest } from '../../common/actor';
import { AccessService } from '../../common/access.service';
import { CommandsService } from '../../common/commands.service';
import { fail, requireValue } from '../../common/errors';
import { page, pageArgs } from '../../common/pagination';
import { PrismaService, UnitOfWork } from '../../infrastructure/database/prisma.service';
const include = {
  buyer: { select: { displayName: true } },
  reviewVersion_review: { orderBy: { version: 'desc' as const }, take: 1 },
} satisfies Prisma.ReviewInclude;
@Injectable()
export class ReviewsService {
  constructor(
    private readonly db: PrismaService,
    private readonly access: AccessService,
    private readonly commands: CommandsService,
  ) {}
  dto(r: Prisma.ReviewGetPayload<{ include: typeof include }>) {
    const v = r.reviewVersion_review[0]!;
    return {
      ...r,
      ...v,
      id: r.id,
      buyerDisplayName: r.buyer.displayName,
      verified: true,
      createdAt: r.createdAt,
      editableUntil: new Date(r.createdAt.getTime() + 7 * 86400000),
    };
  }
  async listVerifiedReviews(r: ApiRequest) {
    requireValue(await this.db.businessProfile.findUnique({ where: { id: r.params.profileId } }));
    return page(
      (
        await this.db.review.findMany({
          where: { sellerProfileId: r.params.profileId, hidden: false },
          include,
          ...pageArgs(r.query, 'reviews:' + r.params.profileId),
        })
      ).map((x) => this.dto(x)),
      r.query,
      'reviews:' + r.params.profileId,
    );
  }
  createReview(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      const o = await this.access.order(r.params.orderId!, r.actor, tx, true);
      this.access.buyer(o, r.actor);
      if (o.state !== 'COMPLETED' || (await tx.review.findUnique({ where: { orderId: o.id } })))
        fail('REVIEW_NOT_ALLOWED');
      const row = await tx.review.create({
        data: {
          orderId: o.id,
          buyerId: r.actor.id,
          sellerProfileId: o.sellerProfileId,
          reviewVersion_review: {
            create: {
              version: 1,
              stars: r.body.stars,
              body: r.body.body?.trim() || null,
              actorId: r.actor.id,
            },
          },
        },
        include,
      });
      await this.commands.audit(tx, r.actor.id, row.id, 'review.created');
      return this.dto(row);
    });
  }
  editReview(r: ApiRequest) {
    return this.commands.run(r, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Review" WHERE "id"=${r.params.reviewId!}::uuid FOR UPDATE`;
      const row = requireValue(
        await tx.review.findFirst({
          where: { id: r.params.reviewId, buyerId: r.actor.id },
          include,
        }),
      );
      if (
        row.hidden ||
        row.reviewVersion_review[0]!.version !== 1 ||
        new Date() >= new Date(row.createdAt.getTime() + 7 * 86400000)
      )
        fail('REVIEW_NOT_ALLOWED');
      await tx.reviewVersion.create({
        data: {
          reviewId: row.id,
          version: 2,
          stars: r.body.stars,
          body: r.body.body?.trim() || null,
          actorId: r.actor.id,
        },
      });
      await this.commands.audit(tx, r.actor.id, row.id, 'review.edited');
      return this.dto(await tx.review.findUniqueOrThrow({ where: { id: row.id }, include }));
    });
  }
  async moderate(tx: UnitOfWork, id: string, outcome: ModerationOutcome) {
    return this.dto(
      await tx.review.update({
        where: { id },
        data: { hidden: ['HIDE', 'REJECT'].includes(outcome) },
        include,
      }),
    );
  }
  async inspect(tx: UnitOfWork, id: string) {
    return this.dto(requireValue(await tx.review.findUnique({ where: { id }, include })));
  }
}
