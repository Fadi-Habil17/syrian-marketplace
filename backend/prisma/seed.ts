import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.setupMetadata.upsert({
    where: { key: 'phase' },
    update: { value: 'setup' },
    create: { key: 'phase', value: 'setup' },
  });
  console.info(
    'Foundation metadata seeded. Business roles, wallets and demo logins are not implemented.',
  );
}

main()
  .catch(() => {
    console.error('Foundation seed failed. Check database connectivity and applied migrations.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
