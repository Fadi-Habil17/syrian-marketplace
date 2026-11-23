import { Injectable, Module } from '@nestjs/common';
import type { Currency } from '@prisma/client';
import { UnitOfWork } from '../../infrastructure/database/prisma.service';
import { fail } from '../../common/errors';
@Injectable()
export class EscrowService {
  async create(tx: UnitOfWork, orderId: string, currency: Currency) {
    const account = await tx.ledgerAccount.create({ data: { orderId, currency, kind: 'ESCROW' } });
    return tx.escrow.create({ data: { orderId, currency, accountId: account.id } });
  }
  async status(tx: UnitOfWork, orderId: string, status: 'OPEN' | 'FROZEN' | 'SETTLED') {
    const e = await tx.escrow.findUniqueOrThrow({ where: { orderId } });
    if (e.status === 'SETTLED' && status !== 'SETTLED') fail('ALREADY_SETTLED');
    if (
      status === 'SETTLED' &&
      (e.heldUnits !== 0n || !(await tx.settlement.findUnique({ where: { orderId } })))
    )
      fail('INVALID_TRANSITION');
    return tx.escrow.update({ where: { id: e.id }, data: { status } });
  }
}
@Module({ providers: [EscrowService], exports: [EscrowService] })
export class EscrowModule {}
