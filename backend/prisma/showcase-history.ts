import { createHash } from 'node:crypto';
import type {
  Currency,
  Installment,
  JournalKind,
  OrderState,
  Prisma,
  Workspace,
} from '@prisma/client';
import { serviceSplit } from '../src/modules/payments/domain/money';
import { showcaseId } from './showcase-media';

type Tx = Prisma.TransactionClient;
type Item = {
  id: string;
  titleAr: string;
  titleEn: string;
  currency: Currency;
  priceUnits: bigint;
};
type Subject = { profileId: string; sellerId: string; cityId: string; workspace: Workspace };
type OrderStory = Subject &
  Item & { storefrontId?: string; rate?: { id: string; feeUnits: bigint }; minutes?: number };

const dayMs = 86_400_000;
export const at = (base: Date, days: number, hours = 0) =>
  new Date(base.getTime() + days * dayMs + hours * 3_600_000);

async function post(
  tx: Tx,
  journal: {
    operationKey: string;
    currency: Currency;
    kind: JournalKind;
    postedAt: Date;
    actorId: string;
    orderId?: string;
  },
  debit: string,
  credits: { accountId: string; creditUnits: bigint }[],
) {
  const total = credits.reduce((sum, entry) => sum + entry.creditUnits, 0n);
  const record = await tx.ledgerJournal.create({
    data: {
      ...journal,
      requestHash: createHash('sha256').update(journal.operationKey).digest('hex'),
    },
  });
  await tx.ledgerEntry.createMany({
    data: [{ accountId: debit, debitUnits: total }, ...credits].map((entry) => ({
      ...entry,
      journalId: record.id,
      currency: journal.currency,
      createdAt: journal.postedAt,
    })),
  });
  return record;
}

async function wallet(tx: Tx, userId: string, currency: Currency, createdAt: Date) {
  const id = showcaseId(`wallet:${userId}:${currency}`);
  const account = await tx.ledgerAccount.upsert({
    where: { id },
    update: {},
    create: { id, userId, currency, kind: 'AVAILABLE', createdAt },
  });
  return tx.wallet.upsert({
    where: { userId_currency: { userId, currency } },
    update: {},
    create: { userId, currency, accountId: account.id, createdAt },
  });
}

export async function createReviewedOrder(
  tx: Tx,
  story: OrderStory,
  input: {
    key: string;
    buyerId: string;
    adminId: string;
    start: Date;
    stars: number;
    body: string;
  },
) {
  const { start, buyerId, adminId, key, stars, body } = input;
  const orderId = showcaseId(`order:${key}`);
  if (await tx.marketOrder.findUnique({ where: { id: orderId }, select: { id: true } }))
    return false;

  const { currency, profileId, sellerId, workspace, cityId, priceUnits } = story;
  const store = workspace === 'HOME_STORE';
  const onsite = workspace === 'PROFESSIONALS';
  const fee = story.rate?.feeUnits ?? 0n;
  const total = priceUnits + fee;
  const readyAt = at(start, store ? 1 : 4);
  const deliveredAt = at(readyAt, 1, 4);
  const completedAt = at(deliveredAt, 0, 4);
  const reviewedAt = at(completedAt, 1 + (stars % 3));
  const scope = `${story.titleAr} · ${story.titleEn}`;
  const buyer = await wallet(tx, buyerId, currency, at(start, -1));
  const seller = await wallet(tx, sellerId, currency, at(start, -1));
  const clearing = await tx.ledgerAccount.findFirstOrThrow({
    where: { currency, kind: 'SIMULATOR_CLEARING' },
    select: { id: true },
  });
  await post(
    tx,
    {
      operationKey: `showcase:topup:${orderId}`,
      kind: 'SIMULATED_TOPUP',
      currency,
      actorId: adminId,
      postedAt: at(start, 0, 1),
    },
    clearing.id,
    [{ accountId: buyer.accountId, creditUnits: total }],
  );

  const states: OrderState[] = store
    ? [
        'PAID_IN_ESCROW',
        'PREPARING',
        'READY_FOR_DELIVERY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'COMPLETED',
      ]
    : [
        onsite ? 'BOOKING_REQUESTED' : 'AWAITING_AGREEMENT',
        'AWAITING_DEPOSIT',
        'DEPOSIT_HELD',
        'IN_PROGRESS',
        'READY_FOR_FINAL_PAYMENT',
        'FULLY_FUNDED',
        'DELIVERED',
        'COMPLETED',
      ];
  await tx.marketOrder.create({
    data: {
      id: orderId,
      workspace,
      currency,
      buyerId,
      sellerProfileId: profileId,
      state: 'COMPLETED',
      agreedTotalUnits: total,
      eligibleSellerUnits: priceUnits,
      deliveryFeeUnits: fee,
      commissionBpsSnapshot: 0,
      agreementSnapshot: { scope, dueAt: deliveredAt.toISOString() },
      termsAcceptedAt: start,
      ...(store || onsite
        ? { addressSnapshot: { cityId, details: 'العنوان موضّح للمشارك في الطلب' } }
        : {}),
      deliveredAt,
      completedAt,
      buyerConfirmedAt: completedAt,
      reviewDeadlineAt: at(deliveredAt, 3),
      createdAt: start,
      updatedAt: completedAt,
      version: states.length,
    },
  });
  const escrow = await tx.ledgerAccount.create({
    data: { orderId, currency, kind: 'ESCROW', createdAt: start },
  });
  await tx.escrow.create({ data: { orderId, currency, accountId: escrow.id, createdAt: start } });

  const payments: { installment: Installment; kind: JournalKind; units: bigint; postedAt: Date }[] =
    [];
  if (store) {
    if (!story.storefrontId || !story.rate)
      throw new Error('Store history requires a storefront and rate');
    const storeOrder = await tx.storeOrder.create({
      data: {
        orderId,
        storefrontId: story.storefrontId,
        acceptedAt: at(start, 0, 3),
        createdAt: start,
      },
    });
    const item = await tx.orderItem.create({
      data: {
        storeOrderId: storeOrder.id,
        productId: story.id,
        quantity: 1,
        currency,
        unitPriceUnits: priceUnits,
        productSnapshot: { titleAr: story.titleAr, titleEn: story.titleEn },
        createdAt: start,
      },
    });
    await tx.stockReservation.create({
      data: {
        orderItemId: item.id,
        productId: story.id,
        quantity: 1,
        status: 'CONSUMED',
        createdAt: start,
      },
    });
    const delivery = await tx.delivery.create({
      data: {
        storeOrderId: storeOrder.id,
        rateId: story.rate.id,
        method: 'SELLER',
        currency,
        feeUnits: fee,
        cityId,
        status: 'DROPPED_OFF',
        droppedOffAt: deliveredAt,
        createdAt: start,
        termsSnapshot: {
          method: 'SELLER',
          feeUnits: fee.toString(),
          promisedAt: deliveredAt.toISOString(),
        },
      },
    });
    await tx.deliveryEvent.create({
      data: {
        deliveryId: delivery.id,
        type: 'DROPOFF',
        actorId: sellerId,
        occurredAt: deliveredAt,
      },
    });
    payments.push({
      installment: 'FULL',
      kind: 'STORE_HOLD',
      units: total,
      postedAt: at(start, 0, 2),
    });
  } else {
    const { deposit, balance } = serviceSplit(total);
    const ready = { summary: 'اكتمل العمل المتفق عليه وأصبح جاهزاً للتسليم.' };
    const service = await tx.serviceOrder.create({
      data: {
        orderId,
        listingId: story.id,
        kind: onsite ? 'FIXED_BOOKING' : 'FREELANCE',
        depositUnits: deposit,
        balanceUnits: balance,
        depositDeadlineAt: at(start, 1),
        dueAt: deliveredAt,
        readyAt,
        readinessEvidence: ready,
        balanceDeadlineAt: at(readyAt, 3),
        createdAt: start,
      },
    });
    await tx.submission.create({
      data: {
        serviceOrderId: service.id,
        kind: 'READINESS',
        version: 1,
        evidence: ready,
        actorId: sellerId,
        submittedAt: readyAt,
        createdAt: readyAt,
      },
    });
    if (onsite) {
      const endsAt = new Date(readyAt.getTime() + (story.minutes ?? 60) * 60_000);
      await tx.booking.create({
        data: {
          serviceOrderId: service.id,
          state: 'CONFIRMED',
          requestedStartsAt: readyAt,
          requestedEndsAt: endsAt,
          providerAcceptedAt: at(start, 0, 2),
          buyerAcceptedAt: at(start, 0, 2),
          createdAt: start,
        },
      });
      await tx.scheduleReservation.create({
        data: {
          serviceOrderId: service.id,
          providerId: profileId,
          startsAt: readyAt,
          endsAt,
          status: 'RELEASED',
          createdAt: start,
        },
      });
      await tx.submission.create({
        data: {
          serviceOrderId: service.id,
          kind: 'ONSITE_HANDOVER',
          version: 1,
          evidence: { summary: 'استعراض التشغيل مع صاحب الطلب بعد انتهاء الزيارة.' },
          actorId: sellerId,
          submittedAt: deliveredAt,
          createdAt: deliveredAt,
        },
      });
    }
    payments.push(
      { installment: 'DEPOSIT', kind: 'DEPOSIT_HOLD', units: deposit, postedAt: at(start, 0, 3) },
      { installment: 'BALANCE', kind: 'BALANCE_HOLD', units: balance, postedAt: at(readyAt, 0, 3) },
    );
  }

  for (const payment of payments) {
    const operationKey = `showcase:hold:${orderId}:${payment.installment}`;
    const journal = await post(
      tx,
      {
        operationKey,
        orderId,
        currency,
        actorId: buyerId,
        kind: payment.kind,
        postedAt: payment.postedAt,
      },
      buyer.accountId,
      [{ accountId: escrow.id, creditUnits: payment.units }],
    );
    await tx.paymentAttempt.create({
      data: {
        operationKey,
        orderId,
        actorId: buyerId,
        currency,
        installment: payment.installment,
        units: payment.units,
        journalId: journal.id,
        providerReference: `sim-${journal.id}`,
        status: 'SUCCEEDED',
        createdAt: payment.postedAt,
      },
    });
  }
  const operationKey = `showcase:settle:${orderId}`;
  const journal = await post(
    tx,
    {
      operationKey,
      orderId,
      currency,
      kind: 'SETTLEMENT',
      actorId: buyerId,
      postedAt: completedAt,
    },
    escrow.id,
    [{ accountId: seller.accountId, creditUnits: total }],
  );
  await tx.settlement.create({
    data: {
      operationKey,
      orderId,
      journalId: journal.id,
      currency,
      heldUnits: total,
      mode: 'BUYER_CONFIRMATION',
      reason: 'أكّد المشتري الاستلام',
      createdAt: completedAt,
      allocation_settlement: {
        create: [
          { currency, recipientId: seller.accountId, kind: 'SELLER_NET', units: priceUnits },
          ...(fee > 0n
            ? [
                {
                  currency,
                  recipientId: seller.accountId,
                  kind: 'SELLER_DELIVERY' as const,
                  units: fee,
                },
              ]
            : []),
        ],
      },
    },
  });
  await tx.escrow.update({
    where: { orderId },
    data: { status: 'SETTLED', updatedAt: completedAt },
  });

  const milestoneTimes = store
    ? [payments[0]!.postedAt, at(start, 0, 3), readyAt, at(readyAt, 1), deliveredAt, completedAt]
    : [
        start,
        at(start, 0, 2),
        payments[0]!.postedAt,
        at(start, 1),
        readyAt,
        payments[1]!.postedAt,
        deliveredAt,
        completedAt,
      ];
  await tx.orderTransition.createMany({
    data: states.map((toState, i) => ({
      orderId,
      fromState: states[i - 1] ?? 'DRAFT',
      toState,
      version: i + 1,
      createdAt: milestoneTimes[i],
      reason: toState === 'COMPLETED' ? 'أكّد المشتري الاستلام' : 'تحديث حالة الطلب',
      operationKey: `showcase:state:${orderId}:${i + 1}`,
    })),
  });
  await tx.review.create({
    data: {
      orderId,
      buyerId,
      sellerProfileId: profileId,
      createdAt: reviewedAt,
      updatedAt: reviewedAt,
      reviewVersion_review: {
        create: { version: 1, stars, body, actorId: buyerId, createdAt: reviewedAt },
      },
    },
  });
  return true;
}
