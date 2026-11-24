import { createHash, randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';
import {
  PrismaClient,
  type Currency,
  type Prisma,
  type RoleCode,
  type Workspace,
} from '@prisma/client';
import {
  buyerNames,
  cities,
  freelancers,
  professionals,
  reviewText,
  stores,
  type CityKey,
  type Copy,
} from './showcase-catalog';
import { at, createReviewedOrder } from './showcase-history';
import { showcaseId as id, showcasePhotos } from './showcase-media';

type Db = Prisma.TransactionClient;
const founded = new Date('2024-11-24T09:00:00Z');
const latest = new Date('2026-11-24T09:00:00Z');
const roleKeys = {
  STORE_OWNER: 'HOME_STORE',
  PROFESSIONAL: 'PROFESSIONALS',
  FREELANCER: 'FREELANCE',
} as const;
const legacyId = (key: string) => {
  const h = createHash('sha256')
    .update('syrian-marketplace:demo:' + key)
    .digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const catalogCopy = ([titleAr, titleEn]: Copy, [descriptionAr, descriptionEn]: Copy) => ({
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
});

function assertLocalReviewDatabase() {
  const database = new URL(process.env.DATABASE_URL ?? '');
  const local = ['127.0.0.1', 'localhost'].includes(database.hostname);
  const allowed = ['/marketplace_dev', '/marketplace_test'].includes(database.pathname);
  if (
    !local ||
    !allowed ||
    process.env.ALLOW_DEMO_SEED !== 'true' ||
    process.env.NODE_ENV === 'production'
  )
    throw new Error(
      'Showcase data requires an enabled local marketplace_dev or marketplace_test database',
    );
}

async function cityIds(db: Db) {
  const result = new Map<CityKey, string>();
  for (const key of Object.keys(cities) as CityKey[]) {
    const [governorateCode, nameAr, nameEn, centerLatitude, centerLongitude] = cities[key];
    const governorate = await db.governorate.findUniqueOrThrow({
      where: { isoCode: `SY-${governorateCode}` },
      select: { id: true },
    });
    const city = await db.city.upsert({
      where: { governorateId_nameEn: { governorateId: governorate.id, nameEn } },
      update: {},
      create: { governorateId: governorate.id, nameAr, nameEn, centerLatitude, centerLongitude },
    });
    await db.city.updateMany({
      where: { id: city.id, centerLatitude: null, centerLongitude: null },
      data: { centerLatitude, centerLongitude },
    });
    result.set(key, city.id);
  }
  return result;
}

async function account(
  db: Db,
  key: string,
  displayName: string,
  roles: RoleCode[],
  passwordHash: string,
) {
  const userId = id('account:' + key);
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: `${key}@showcase.marketplace.invalid`,
      displayName,
      passwordHash,
      locale: /[\u0600-\u06ff]/.test(displayName) ? 'ar' : 'en',
      createdAt: founded,
    },
  });
  for (const code of new Set<RoleCode>(['CUSTOMER', ...roles])) {
    const role = await db.role.findUniqueOrThrow({ where: { code }, select: { id: true } });
    await db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id, createdAt: founded },
    });
  }
  return userId;
}

async function category(db: Db, workspace: Workspace, [nameAr, nameEn]: Copy) {
  const categoryId = id(`category:${workspace}:${nameEn}`);
  await db.category.upsert({
    where: { id: categoryId },
    update: {},
    create: { id: categoryId, workspace, nameAr, nameEn, createdAt: founded },
  });
  return categoryId;
}

async function business(
  db: Db,
  input: {
    key: string;
    title: string;
    bio: string;
    cityId: string;
    type: keyof typeof roleKeys;
    trade?: string;
    experienceYears?: number;
  },
  passwordHash: string,
) {
  const { key, ...details } = input;
  const sellerId = await account(db, key, details.title, [details.type], passwordHash);
  const profileId = id('profile:' + key);
  await db.businessProfile.upsert({
    where: { id: profileId },
    update: {},
    create: { id: profileId, userId: sellerId, ...details, status: 'ACTIVE', createdAt: founded },
  });
  if (details.type !== 'FREELANCER') {
    const areaId = id('coverage:' + key);
    await db.serviceArea.upsert({
      where: { id: areaId },
      update: {},
      create: { id: areaId, profileId, cityId: details.cityId, createdAt: founded },
    });
  }
  return { cityId: details.cityId, sellerId, profileId, workspace: roleKeys[details.type] };
}

async function sellerRate(db: Db, cityId: string, currency: Currency, adminId: string) {
  const rate = await db.deliveryRate.upsert({
    where: { cityId_method_currency_version: { cityId, method: 'SELLER', currency, version: 1 } },
    update: {},
    create: {
      cityId,
      currency,
      adminId,
      method: 'SELLER',
      version: 1,
      effectiveAt: founded,
      feeUnits: currency === 'SYP' ? 8500n : 85n,
      createdAt: founded,
    },
  });
  return { id: rate.id, feeUnits: rate.feeUnits };
}

async function polishLegacyCatalog(db: Db) {
  await db.area.updateMany({
    where: { id: legacyId('area:demo'), nameEn: 'Demo area' },
    data: { nameAr: 'وسط المدينة', nameEn: 'City centre' },
  });
  for (const [workspace, nameAr, nameEn] of [
    ['FREELANCE', 'خدمات مستقلة', 'Freelance services'],
    ['PROFESSIONALS', 'صيانة منزلية', 'Home maintenance'],
    ['HOME_STORE', 'منتجات محلية', 'Locally made'],
  ]) {
    await db.category.updateMany({
      where: { id: legacyId(`category:${workspace}`), nameAr: 'تصنيف تجريبي' },
      data: { nameAr, nameEn },
    });
  }
  await db.storefront.updateMany({
    where: { id: legacyId('store'), nameEn: 'Demo Home Store' },
    data: {
      nameAr: 'دار القمح',
      nameEn: 'Wheat House',
      descriptionAr: 'مخبوزات خفيفة للضيافة، تُحضّر على دفعات صغيرة حسب الطلب.',
      descriptionEn: 'Small batches of home-baked snacks and treats for sharing.',
    },
  });
  for (const [role, title, bio] of [
    ['STORE_OWNER', 'دار القمح', 'مخبوزات منزلية من السلمية.'],
    ['PROFESSIONAL', 'إنارة السلمية', 'صيانة نقاط الإنارة والمفاتيح وزيارات فحص منزلية.'],
    ['FREELANCER', 'حبر وورق', 'تصميم مواد مطبوعة وتغليف لورش ومتاجر صغيرة.'],
  ]) {
    await db.businessProfile.updateMany({
      where: { id: legacyId(`profile:${role}`), title: `Demo ${role}` },
      data: { title, bio },
    });
  }
  await db.businessProfile.updateMany({
    where: {
      id: legacyId('profile:PROFESSIONAL'),
      title: 'إنارة السلمية',
      venuePublished: true,
      venueLatitude: 35.012,
      venueLongitude: 37.055,
    },
    data: { venuePublished: false, venueLatitude: null, venueLongitude: null },
  });
  for (const [role, displayName] of [
    ['CUSTOMER', 'ميس الريحان'],
    ['STORE_OWNER', 'دار القمح'],
    ['PROFESSIONAL', 'إنارة السلمية'],
    ['FREELANCER', 'حبر وورق'],
    ['DELIVERY_DRIVER', 'فارس الندى'],
    ['ADMIN', 'إدارة السوق'],
  ]) {
    await db.user.updateMany({
      where: { id: legacyId(`user:${role}`), displayName: `Demo ${role}` },
      data: { displayName },
    });
  }
  for (const currency of ['SYP', 'USD']) {
    await db.product.updateMany({
      where: { id: legacyId(`product:${currency}`), titleEn: 'Demo home-produced goods' },
      data: catalogCopy(
        ['كعك بالسمسم', 'Sesame kaak'],
        [
          'كعك مخبوز بالسمسم، مناسب مع الشاي والقهوة.',
          'Sesame biscuits to serve with tea or coffee.',
        ],
      ),
    });
    for (const [kind, original, title, description] of [
      ['FREELANCER', 'Demo design', freelancers[0]!.offers[1]![0], freelancers[0]!.offers[1]![1]],
      [
        'PROFESSIONAL',
        'Demo electrical service',
        professionals[3]!.offers[1]![0],
        professionals[3]!.offers[1]![1],
      ],
    ] as const) {
      await db.listing.updateMany({
        where: { id: legacyId(`listing:${kind}:${currency}`), titleEn: original },
        data: catalogCopy(title, description),
      });
    }
  }
}

async function run(db: PrismaClient) {
  const passwordHash = await hash(randomUUID() + randomUUID(), 12);
  const [admin, placeIds] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { email: 'admin@demo.marketplace.test' },
      select: { id: true },
    }),
    cityIds(db),
  ]);
  const photos = showcasePhotos(db);
  const buyers: string[] = [];
  for (const [index, name] of buyerNames.entries()) {
    buyers.push(await account(db, `buyer-${index + 1}`, name, [], passwordHash));
  }
  await polishLegacyCatalog(db);
  let created = 0;
  let businessIndex = 0;
  const publishReviews = async (
    subject: Awaited<ReturnType<typeof business>>,
    entries: Parameters<typeof createReviewedOrder>[1][],
  ) => {
    const index = businessIndex++;
    const count = 7 + ((index * 5 + 2) % 7);
    for (let review = 0; review < count; review++) {
      const item = entries[(review + index) % entries.length]!;
      const reviewIndex = (review * 3 + index * 7) % reviewText[subject.workspace].length;
      const daysAgo =
        701 - Math.floor((review / (count - 1)) * 677) + ((index * 17 + review * 11) % 17);
      const starWeights = [5, 5, 4, 4, 5, 5, 3, 5, 5, 4];
      const createdOrder = await db.$transaction((tx) =>
        createReviewedOrder(tx, item, {
          key: `${subject.profileId}:${review}`,
          adminId: admin.id,
          buyerId: buyers[(review * 7 + index * 3) % buyers.length]!,
          start: at(latest, -daysAgo),
          stars: starWeights[reviewIndex]!,
          body: reviewText[subject.workspace][reviewIndex]!,
        }),
      );
      if (createdOrder) created++;
    }
  };

  const legacyStore = await db.storefront.findUnique({ where: { id: legacyId('store') } });
  if (legacyStore?.nameEn === 'Wheat House') {
    const sellerId = legacyId('user:STORE_OWNER');
    const fileId = await photos(sellerId, 1, founded);
    await db.storefront.updateMany({
      where: {
        id: legacyStore.id,
        OR: [{ logoId: null }, { logoId: legacyId('media:catalog:STORE_OWNER') }],
      },
      data: { logoId: fileId },
    });
    for (const currency of ['SYP', 'USD'] as const) {
      const item = await db.product.findUnique({ where: { id: legacyId(`product:${currency}`) } });
      if (item?.titleEn !== 'Sesame kaak') continue;
      await db.$transaction(async (tx) => {
        await tx.productAsset.deleteMany({
          where: { productId: item.id, fileId: legacyId('media:catalog:STORE_OWNER') },
        });
        await tx.productAsset.upsert({
          where: { productId_fileId: { productId: item.id, fileId } },
          update: {},
          create: { productId: item.id, fileId, createdAt: founded },
        });
      });
    }
  }
  for (const [role, title, photoPosition] of [
    ['PROFESSIONAL', 'إنارة السلمية', 15],
    ['FREELANCER', 'حبر وورق', 16],
  ] as const) {
    const profileId = legacyId(`profile:${role}`);
    const profile = await db.businessProfile.findUnique({ where: { id: profileId } });
    if (profile?.title !== title) continue;
    const fileId = await photos(profile.userId, photoPosition, founded);
    for (const currency of ['SYP', 'USD']) {
      const listingId = legacyId(`listing:${role}:${currency}`);
      if (!(await db.listing.findUnique({ where: { id: listingId } }))) continue;
      await db.$transaction(async (tx) => {
        await tx.listingAsset.deleteMany({
          where: { listingId, fileId: legacyId(`media:catalog:${role}`) },
        });
        await tx.listingAsset.upsert({
          where: { listingId_fileId: { listingId, fileId } },
          update: {},
          create: { listingId, fileId, createdAt: founded },
        });
      });
    }
    if (role === 'FREELANCER') {
      await db.portfolioItem.updateMany({
        where: {
          id: legacyId('portfolio'),
          kind: 'LINK',
          url: 'https://example.com/demo-portfolio',
        },
        data: { kind: 'IMAGE', title: 'دراسة هوية وتغليف', url: null, fileId },
      });
    }
  }

  for (const [index, store] of stores.entries()) {
    const cityId = placeIds.get(store.city)!;
    const subject = await business(
      db,
      {
        key: store.key,
        title: store.name[0],
        bio: store.description[0],
        cityId,
        type: 'STORE_OWNER',
      },
      passwordHash,
    );
    const categoryId = await category(db, subject.workspace, store.category);
    const storefrontId = id('store:' + store.key);
    const logoId = await photos(subject.sellerId, store.products[0]![4], founded);
    const updatedAt = at(latest, -index - 1);
    await db.storefront.upsert({
      where: { id: storefrontId },
      update: {},
      create: {
        id: storefrontId,
        logoId,
        profileId: subject.profileId,
        cityId,
        status: 'PUBLISHED',
        nameAr: store.name[0],
        nameEn: store.name[1],
        descriptionAr: store.description[0],
        descriptionEn: store.description[1],
        supportsSellerDelivery: true,
        supportsPlatformDelivery: false,
        createdAt: at(founded, index * 2),
        updatedAt,
      },
    });
    const entries = [];
    for (const [
      itemIndex,
      [title, description, price, stockOnHand, photo],
    ] of store.products.entries()) {
      const productId = id(`product:${store.key}:${itemIndex}`);
      const fileId = await photos(subject.sellerId, photo, founded);
      const item = await db.product.upsert({
        where: { id: productId },
        update: {},
        create: {
          id: productId,
          storefrontId,
          categoryId,
          ...catalogCopy(title, description),
          stockOnHand,
          priceUnits: BigInt(price),
          currency: 'SYP',
          status: 'PUBLISHED',
          createdAt: at(founded, 2 + index * 2 + itemIndex),
          updatedAt,
        },
      });
      await db.productAsset.upsert({
        where: { productId_fileId: { productId, fileId } },
        update: {},
        create: { productId, fileId, createdAt: founded },
      });
      entries.push({
        ...subject,
        ...item,
        storefrontId,
        rate: await sellerRate(db, cityId, item.currency, admin.id),
      });
    }
    await publishReviews(subject, entries);
  }

  for (const [index, provider] of [...professionals, ...freelancers].entries()) {
    const experienceYears =
      'years' in provider && typeof provider.years === 'number' ? provider.years : undefined;
    const onsite = experienceYears !== undefined;
    const subject = await business(
      db,
      {
        key: provider.key,
        title: provider.name,
        bio: provider.offers[0]![1][0],
        cityId: placeIds.get(provider.city)!,
        type: onsite ? 'PROFESSIONAL' : 'FREELANCER',
        ...(onsite ? { trade: provider.category[0], experienceYears } : {}),
      },
      passwordHash,
    );
    const categoryId = await category(db, subject.workspace, provider.category);
    const fileId = await photos(subject.sellerId, provider.photo, founded);
    if (!onsite) {
      const portfolioId = id('portfolio:' + provider.key);
      await db.portfolioItem.upsert({
        where: { id: portfolioId },
        update: {},
        create: {
          id: portfolioId,
          profileId: subject.profileId,
          fileId,
          kind: 'IMAGE',
          title: provider.offers[0]![0][0],
          createdAt: at(founded, 11 + index),
        },
      });
    }
    const entries = [];
    for (const [
      itemIndex,
      [title, description, priceUnits, duration],
    ] of provider.offers.entries()) {
      const listingId = id(`listing:${provider.key}:${itemIndex}`);
      const item = await db.listing.upsert({
        where: { id: listingId },
        update: {},
        create: {
          id: listingId,
          profileId: subject.profileId,
          categoryId,
          ...catalogCopy(title, description),
          kind: onsite ? 'PROFESSIONAL_PACKAGE' : 'FREELANCE',
          currency: onsite ? 'SYP' : 'USD',
          priceUnits: BigInt(priceUnits),
          status: 'PUBLISHED',
          durationMinutes: onsite ? duration : null,
          deliveryDays: onsite ? null : duration,
          createdAt: at(founded, 2 + index * 2 + itemIndex),
          updatedAt: at(latest, -index - 1),
        },
      });
      await db.listingAsset.upsert({
        where: { listingId_fileId: { listingId, fileId } },
        update: {},
        create: { listingId, fileId, createdAt: founded },
      });
      entries.push({ ...subject, ...item, minutes: item.durationMinutes ?? undefined });
    }
    await publishReviews(subject, entries);
  }
  console.log(
    `Showcase includes ${stores.length} stores, ${professionals.length} professional profiles, ${freelancers.length} freelance profiles and ${created} newly created historical reviews.`,
  );
}

async function main() {
  assertLocalReviewDatabase();
  const db = new PrismaClient();
  try {
    await run(db);
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Showcase seeding failed');
  process.exitCode = 1;
});
