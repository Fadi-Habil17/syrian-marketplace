-- Infrastructure-only baseline; no business tables or demo identities yet.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "SetupMetadata" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "SetupMetadata_pkey" PRIMARY KEY ("key")
);
