ALTER TABLE "NotificationDelivery"
  ADD COLUMN "providerTicketId" varchar(200),
  ADD COLUMN "providerAcceptedAt" timestamptz(3),
  ADD COLUMN "receiptCheckedAt" timestamptz(3);
