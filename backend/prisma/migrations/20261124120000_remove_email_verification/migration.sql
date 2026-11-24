-- Retire queued address-verification messages without touching password resets.
UPDATE "OutboxEvent" SET "publishedAt" = CURRENT_TIMESTAMP, "claimedUntil" = NULL
WHERE "type" = 'identity.email' AND "publishedAt" IS NULL
AND "deduplicationKey" IN (
  SELECT 'identity-mail:' || "id"::text FROM "VerificationToken" WHERE "kind" = 'EMAIL'
);
DELETE FROM "VerificationToken" WHERE "kind" = 'EMAIL';
ALTER TYPE "VerificationKind" RENAME TO "VerificationKind_old";
CREATE TYPE "VerificationKind" AS ENUM ('PASSWORD_RESET', 'REALTIME_TICKET');
ALTER TABLE "VerificationToken" ALTER COLUMN "kind" TYPE "VerificationKind"
USING "kind"::text::"VerificationKind";
DROP TYPE "VerificationKind_old";
ALTER TABLE "User" DROP COLUMN "verifiedAt";
