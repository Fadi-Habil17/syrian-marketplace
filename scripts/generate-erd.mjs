import { Prisma } from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const groups = {
  'Identity and access': [
    'User',
    'Role',
    'UserRole',
    'Session',
    'VerificationToken',
    'Restriction',
  ],
  'Geography, profiles and catalog': [
    'Country',
    'Governorate',
    'City',
    'Area',
    'Address',
    'BusinessProfile',
    'ProfileSkill',
    'ProfileLanguage',
    'ServiceArea',
    'DriverZone',
    'FileAsset',
    'PortfolioItem',
    'Category',
    'Listing',
    'ListingAsset',
    'Storefront',
    'Product',
    'ProductAsset',
    'ModerationDecision',
  ],
  'Orders, scheduling, quotes and inventory': [
    'MarketOrder',
    'ServiceOrder',
    'Booking',
    'InspectionRequest',
    'InspectionPhoto',
    'Quote',
    'QuoteItem',
    'ScheduleReservation',
    'Milestone',
    'Submission',
    'StoreOrder',
    'OrderItem',
    'StockReservation',
    'StockReconciliation',
    'OrderTransition',
  ],
  'Wallets, financial transactions and escrow': [
    'CommissionRate',
    'LedgerAccount',
    'Wallet',
    'Escrow',
    'LedgerJournal',
    'LedgerEntry',
    'PaymentAttempt',
    'Settlement',
    'Allocation',
    'IdempotencyRecord',
  ],
  Delivery: [
    'DeliveryRate',
    'Delivery',
    'DeliveryTermsRevision',
    'DriverAssignment',
    'DeliveryEvent',
  ],
  'Cases, chat and verified reviews': [
    'CaseRecord',
    'CaseParty',
    'CaseEvidence',
    'ResolutionProposal',
    'ProposalApproval',
    'AdminDecision',
    'ChatRoom',
    'ChatMessage',
    'MessageAttachment',
    'Review',
    'ReviewVersion',
  ],
  'Notifications, jobs and audit': [
    'OutboxEvent',
    'ScheduledJob',
    'Notification',
    'DeviceToken',
    'NotificationDelivery',
    'AuditRecord',
  ],
};
const models = Prisma.dmmf.datamodel.models.filter((m) => m.name !== 'SetupMetadata');
const names = Object.values(groups).flat();
if (names.length !== models.length || models.some((m) => !names.includes(m.name)))
  throw new Error('ERD group coverage does not match Prisma models');
let output =
  '# Implemented relational database design\n\nGenerated from the canonical Prisma datamodel by `npm run db:erd`. There are ' +
  models.length +
  ' domain models plus the unchanged legacy SetupMetadata table. All domain primary identifiers are PostgreSQL UUIDs with database-generated defaults; Country now has a UUID primary key and unique code. Money is BIGINT stored units (SYP pounds / USD cents), never floating point. LedgerJournal represents a financial transaction; PaymentAttempt represents its simulated provider result.\n\nThe schema and migration files are implemented; application against a live PostgreSQL database is a separate validation result in [database and contract report](DATABASE_CONTRACT_REPORT.md). Enum definitions and exact nullability/indexes are authoritative in `backend/prisma/schema.prisma`. PK, FK and UK below are literal datamodel constraints. Every physical relation is shown once, including references crossing diagrams.\n';
for (const [heading, list] of Object.entries(groups)) {
  output += `\n## ${heading}\n\n\`\`\`mermaid\nerDiagram\n`;
  for (const name of list) {
    const model = models.find((m) => m.name === name);
    const fks = new Set(model.fields.flatMap((f) => f.relationFromFields ?? []));
    for (const relation of model.fields.filter((f) => f.relationFromFields?.length)) {
      const unique =
        relation.relationFromFields.some((n) => model.fields.find((f) => f.name === n)?.isUnique) ||
        model.uniqueFields.some((u) => u.every((n) => relation.relationFromFields.includes(n)));
      output += `  ${relation.type} ${relation.isRequired ? '||' : 'o|'}--${unique ? 'o|' : 'o{'} ${model.name} : ${relation.name}\n`;
    }
    output += `  ${name} {\n`;
    for (const f of model.fields.filter((f) => f.kind !== 'object')) {
      const type =
        f.type === 'String'
          ? f.nativeType?.[0] === 'Uuid'
            ? 'uuid'
            : 'string'
          : f.kind === 'enum'
            ? 'string'
            : f.type.toLowerCase();
      const keys = [f.isId ? 'PK' : '', fks.has(f.name) ? 'FK' : '', f.isUnique ? 'UK' : ''].filter(
        Boolean,
      );
      output += `    ${type} ${f.name}${keys.length ? ' ' + keys.join(',') : ''}\n`;
    }
    output += '  }\n';
  }
  output += '```\n';
}
output += `
## PostgreSQL invariants beyond Prisma notation

The domain_constraints migration supplies partial unique indexes for one active business profile, one active driver assignment, successful installment/adjustment uniqueness, one unresolved financial case, platform/wallet accounts, and nullable global/city-wide scopes. It adds provider/time exclusion with btree_gist; minor-unit, stock, price, review, deadline and geographic parent checks; exact service split and itemized totals; and deferred cross-row integrity checks.

Ledger entries and journals are immutable and must be inserted in one transaction. Entry triggers maintain account and escrow balances; direct balance writes and late journal appends fail. Deferred checks require at least two balanced entries in one currency. Settlement uniqueness, grouped recipient credits, held-unit conservation, snapshotted commission, recipient ownership, case gating and review eligibility are checked before commit. Historical records use RESTRICT rather than cascading deletes.

Database constraints do not replace authenticated backend policies. Transaction-safe financial application commands coordinate holds, inventory, cases, settlement, audit, idempotency and outbox. Cancellation negotiation, revisions, delivery changes, worker scheduling, HTTP controllers and client integration remain subsequent application slices; their contracts are specified now. See [database implementation notes](DATABASE.md) for lock ordering, privileges, migration and seed instructions.
`;
const prettier = await import('prettier');
const file = new URL('../docs/ERD.md', import.meta.url);
output = await prettier.format(output, {
  parser: 'markdown',
  ...(await prettier.resolveConfig(fileURLToPath(file))),
});
if (process.argv.includes('--check')) {
  if ((await readFile(file, 'utf8')) !== output)
    throw new Error('ERD is stale; run npm run db:erd after prisma generate');
  console.info(`ERD matches all ${models.length} Prisma models and physical relations.`);
} else {
  await writeFile(file, output);
  console.info(`Generated ERD for ${models.length} models.`);
}
