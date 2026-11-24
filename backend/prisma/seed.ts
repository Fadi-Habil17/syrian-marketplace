import { createHash } from 'node:crypto';
import { hash as bcryptHash } from 'bcrypt';
import { Prisma, PrismaClient, RoleCode, Currency } from '@prisma/client';
import { LocalSimulatedGateway } from '../src/modules/payments/infrastructure/local-simulated-gateway';
import { serviceSplit } from '../src/modules/payments/domain/money';
import { seedMedia } from './seed-media';

const prisma = new PrismaClient();

export function demoId(key: string): string {
  const h = createHash('sha256').update(`syrian-marketplace:demo:${key}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true')
    throw new Error('Demo seed requires ALLOW_DEMO_SEED=true and a nonproduction database');
  for (const key of [
    'STORAGE_ENDPOINT',
    'STORAGE_BUCKET',
    'STORAGE_ACCESS_KEY',
    'STORAGE_SECRET_KEY',
    'CLAMAV_HOST',
  ])
    if (!process.env[key])
      throw new Error('Demo media requires configured private S3 storage and ClamAV');
  const password = 'Marketplace123!';
  const passwordHash = await bcryptHash(password, 12);
  const gateway = new LocalSimulatedGateway();
  await prisma.$transaction(
    async (tx) => {
      const userId = (r: string) => demoId(`user:${r}`),
        profileId = (r: string) => demoId(`profile:${r}`);
      for (const code of Object.values(RoleCode))
        await tx.role.upsert({
          where: { code },
          update: {},
          create: { id: demoId(`role:${code}`), code, name: code.replaceAll('_', ' ') },
        });
      for (const role of Object.values(RoleCode)) {
        await tx.user.upsert({
          where: { id: userId(role) },
          update: {},
          create: {
            id: userId(role),
            email: `${role.toLowerCase()}@demo.marketplace.test`,
            displayName: `Demo ${role}`,
            passwordHash,
            locale: 'ar',
          },
        });
        for (const granted of new Set([RoleCode.CUSTOMER, role]))
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: userId(role), roleId: demoId(`role:${granted}`) } },
            update: {},
            create: {
              id: demoId(`grant:${role}:${granted}`),
              userId: userId(role),
              roleId: demoId(`role:${granted}`),
            },
          });
      }
      await tx.country.upsert({
        where: { code: 'SY' },
        update: {},
        create: { id: demoId('SY'), code: 'SY', nameAr: 'سوريا', nameEn: 'Syria' },
      });
      const governorates = [
        ['DI', 'دمشق', 'Damascus'],
        ['RD', 'ريف دمشق', 'Rif Dimashq'],
        ['HL', 'حلب', 'Aleppo'],
        ['HM', 'حماة', 'Hama'],
        ['HI', 'حمص', 'Homs'],
        ['LA', 'اللاذقية', 'Latakia'],
        ['TA', 'طرطوس', 'Tartus'],
        ['ID', 'إدلب', 'Idlib'],
        ['RA', 'الرقة', 'Raqqa'],
        ['DY', 'دير الزور', 'Deir ez-Zor'],
        ['HA', 'الحسكة', 'Al Hasakah'],
        ['DR', 'درعا', 'Daraa'],
        ['SU', 'السويداء', 'As Suwayda'],
        ['QU', 'القنيطرة', 'Quneitra'],
      ];
      for (const [code, ar, en] of governorates)
        await tx.governorate.upsert({
          where: { isoCode: `SY-${code}` },
          update: {},
          create: {
            id: demoId(`gov:${code}`),
            countryId: demoId('SY'),
            isoCode: `SY-${code}`,
            nameAr: ar!,
            nameEn: en!,
          },
        });
      const city = demoId('city:Salamiyah'),
        area = demoId('area:demo');
      await tx.city.upsert({
        where: { id: city },
        update: {},
        create: {
          id: city,
          governorateId: demoId('gov:HM'),
          nameAr: 'السلمية',
          nameEn: 'Salamiyah',
          centerLatitude: 35.01127,
          centerLongitude: 37.05324,
        },
      });
      await tx.area.upsert({
        where: { id: area },
        update: {},
        create: { id: area, cityId: city, nameAr: 'منطقة تجريبية', nameEn: 'Demo area' },
      });
      await tx.address.upsert({
        where: { id: demoId('buyer-address') },
        update: {},
        create: {
          id: demoId('buyer-address'),
          userId: userId('CUSTOMER'),
          cityId: city,
          areaId: area,
          label: 'Demo home',
          details: 'Fictional review address; not a real customer location.',
          contactName: 'Demo Buyer',
          contactPhone: '+000000000000',
        },
      });
      await tx.address.upsert({
        where: { id: demoId('buyer-pinned-address') },
        update: {},
        create: {
          id: demoId('buyer-pinned-address'),
          userId: userId('CUSTOMER'),
          cityId: city,
          areaId: area,
          label: 'Demo pinned destination',
          details: 'Fictional delivery entrance',
          contactName: 'Demo Buyer',
          contactPhone: '+000000000000',
          latitude: 35.011,
          longitude: 37.052,
        },
      });
      for (const type of [
        'FREELANCER',
        'PROFESSIONAL',
        'STORE_OWNER',
        'DELIVERY_DRIVER',
      ] as const) {
        await tx.businessProfile.upsert({
          where: { id: profileId(type) },
          update: {},
          create: {
            id: profileId(type),
            userId: userId(type),
            type,
            status: 'ACTIVE',
            title: `Demo ${type}`,
            bio: 'ملف تجريبي للمراجعة / Fictional demo profile',
            cityId: city,
            ...(type === 'PROFESSIONAL'
              ? {
                  trade: 'Electrician',
                  experienceYears: 5,
                  venuePublished: true,
                  venueLatitude: 35.012,
                  venueLongitude: 37.055,
                }
              : {}),
          },
        });
        if (type !== 'DELIVERY_DRIVER')
          await tx.serviceArea.upsert({
            where: { id: demoId(`service-area:${type}`) },
            update: {},
            create: {
              id: demoId(`service-area:${type}`),
              profileId: profileId(type),
              cityId: city,
              areaId: area,
            },
          });
      }
      await tx.driverZone.upsert({
        where: { id: demoId('driver-zone') },
        update: {},
        create: {
          id: demoId('driver-zone'),
          profileId: profileId('DELIVERY_DRIVER'),
          governorateId: demoId('gov:HM'),
          cityId: city,
        },
      });
      await tx.profileSkill.upsert({
        where: { profileId_name: { profileId: profileId('FREELANCER'), name: 'Design' } },
        update: {},
        create: { id: demoId('skill'), profileId: profileId('FREELANCER'), name: 'Design' },
      });
      await tx.profileLanguage.upsert({
        where: {
          profileId_languageCode: { profileId: profileId('FREELANCER'), languageCode: 'ar' },
        },
        update: {},
        create: {
          id: demoId('language'),
          profileId: profileId('FREELANCER'),
          languageCode: 'ar',
          proficiency: 'Native',
        },
      });
      await tx.portfolioItem.upsert({
        where: { id: demoId('portfolio') },
        update: {},
        create: {
          id: demoId('portfolio'),
          profileId: profileId('FREELANCER'),
          kind: 'LINK',
          title: 'Fictional portfolio',
          url: 'https://example.com/demo-portfolio',
        },
      });
      for (const workspace of ['FREELANCE', 'PROFESSIONALS', 'HOME_STORE'] as const)
        await tx.category.upsert({
          where: { id: demoId(`category:${workspace}`) },
          update: {},
          create: {
            id: demoId(`category:${workspace}`),
            workspace,
            nameAr: 'تصنيف تجريبي',
            nameEn: `Demo ${workspace}`,
          },
        });
      const store = demoId('store');
      await tx.storefront.upsert({
        where: { id: store },
        update: {},
        create: {
          id: store,
          profileId: profileId('STORE_OWNER'),
          cityId: city,
          nameAr: 'متجر منزلي تجريبي',
          nameEn: 'Demo Home Store',
          descriptionAr: 'منتجات تجريبية للمراجعة',
          descriptionEn: 'Fictional review goods',
          status: 'PUBLISHED',
        },
      });
      if (!(await tx.commissionRate.findUnique({ where: { id: demoId('global-rate') } })))
        await tx.commissionRate.create({
          data: {
            id: demoId('global-rate'),
            workspace: null,
            basisPoints: 0,
            version: 1,
            adminId: userId('ADMIN'),
          },
        });
      if (!(await tx.commissionRate.findUnique({ where: { id: demoId('freelance-zero-rate') } })))
        await tx.commissionRate.create({
          data: {
            id: demoId('freelance-zero-rate'),
            workspace: 'FREELANCE',
            basisPoints: 0,
            version: 1,
            adminId: userId('ADMIN'),
          },
        });
      for (const currency of Object.values(Currency)) {
        const units = currency === 'SYP' ? 30000n : 1200n;
        for (const kind of ['SIMULATOR_CLEARING', 'COMMISSION'] as const)
          await tx.ledgerAccount.upsert({
            where: { id: demoId(`platform:${kind}:${currency}`) },
            update: {},
            create: { id: demoId(`platform:${kind}:${currency}`), kind, currency },
          });
        for (const role of Object.values(RoleCode)) {
          const accountId = demoId(`wallet-account:${role}:${currency}`);
          await tx.ledgerAccount.upsert({
            where: { id: accountId },
            update: {},
            create: { id: accountId, userId: userId(role), kind: 'AVAILABLE', currency },
          });
          await tx.wallet.upsert({
            where: { userId_currency: { userId: userId(role), currency } },
            update: {},
            create: {
              id: demoId(`wallet:${role}:${currency}`),
              userId: userId(role),
              currency,
              accountId,
            },
          });
          const operationKey = `seed:topup:${role}:${currency}`;
          if (!(await tx.ledgerJournal.findUnique({ where: { operationKey } }))) {
            const credit = currency === 'SYP' ? 1000000n : 100000n;
            const r = await gateway.payout(
              {
                operationKey,
                requestHash: createHash('sha256').update(operationKey).digest('hex'),
                orderId: null,
                actorId: userId('ADMIN'),
                currency,
                kind: 'SIMULATED_TOPUP',
                postings: [
                  {
                    accountId: demoId(`platform:SIMULATOR_CLEARING:${currency}`),
                    debitUnits: credit,
                    creditUnits: 0n,
                  },
                  { accountId, debitUnits: 0n, creditUnits: credit },
                ],
              },
              tx,
            );
            if (r.status !== 'succeeded') throw new Error('Demo topup failed');
            await tx.auditRecord.create({
              data: {
                actorId: userId('ADMIN'),
                action: 'simulator.seed-topup',
                aggregateId: accountId,
                requestId: operationKey,
                metadata: { currency, units: credit.toString(), simulated: true },
              },
            });
          }
        }
        for (const type of ['FREELANCER', 'PROFESSIONAL'] as const)
          await tx.listing.upsert({
            where: { id: demoId(`listing:${type}:${currency}`) },
            update: {},
            create: {
              id: demoId(`listing:${type}:${currency}`),
              profileId: profileId(type),
              categoryId: demoId(
                `category:${type === 'FREELANCER' ? 'FREELANCE' : 'PROFESSIONALS'}`,
              ),
              kind: type === 'FREELANCER' ? 'FREELANCE' : 'PROFESSIONAL_PACKAGE',
              titleAr: type === 'FREELANCER' ? 'تصميم تجريبي' : 'صيانة كهربائية تجريبية',
              titleEn: type === 'FREELANCER' ? 'Demo design' : 'Demo electrical service',
              descriptionAr: 'نطاق تجريبي واضح',
              descriptionEn: 'Fictional fixed review scope',
              currency,
              priceUnits: units,
              deliveryDays: type === 'FREELANCER' ? 3 : null,
              durationMinutes: type === 'PROFESSIONAL' ? 60 : null,
              status: 'PUBLISHED',
            },
          });
        await tx.product.upsert({
          where: { id: demoId(`product:${currency}`) },
          update: {},
          create: {
            id: demoId(`product:${currency}`),
            storefrontId: store,
            categoryId: demoId('category:HOME_STORE'),
            titleAr: 'منتج منزلي تجريبي',
            titleEn: 'Demo home-produced goods',
            descriptionAr: 'منتج تجريبي',
            descriptionEn: 'Fictional review product',
            currency,
            priceUnits: units,
            stockOnHand: 20,
            status: 'PUBLISHED',
          },
        });
        for (const method of ['SELLER', 'PLATFORM_DRIVER'] as const)
          await tx.deliveryRate.upsert({
            where: { id: demoId(`rate:${currency}:${method}`) },
            update: {},
            create: {
              id: demoId(`rate:${currency}:${method}`),
              cityId: city,
              adminId: userId('ADMIN'),
              method,
              currency,
              feeUnits: currency === 'SYP' ? 3000n : 100n,
              version: 1,
            },
          });
        const orderId = demoId(`order:freelance:${currency}`),
          split = serviceSplit(units);
        if (!(await tx.marketOrder.findUnique({ where: { id: orderId } }))) {
          await tx.marketOrder.create({
            data: {
              id: orderId,
              buyerId: userId('CUSTOMER'),
              sellerProfileId: profileId('FREELANCER'),
              workspace: 'FREELANCE',
              state: 'AWAITING_AGREEMENT',
              currency,
              agreedTotalUnits: units,
              eligibleSellerUnits: units,
              agreementSnapshot: {
                scope: 'Fictional demo design',
                titleAr: 'تصميم تجريبي',
                titleEn: 'Demo design',
              },
            },
          });
          await tx.serviceOrder.create({
            data: {
              id: demoId(`service:${currency}`),
              orderId,
              kind: 'FREELANCE',
              listingId: demoId(`listing:FREELANCER:${currency}`),
              depositUnits: split.deposit,
              balanceUnits: split.balance,
              responseDeadlineAt: new Date(Date.now() + 72 * 3600000),
            },
          });
          const escrowId = demoId(`escrow-account:${currency}`);
          await tx.ledgerAccount.create({
            data: { id: escrowId, orderId, currency, kind: 'ESCROW' },
          });
          await tx.escrow.create({
            data: { id: demoId(`escrow:${currency}`), orderId, currency, accountId: escrowId },
          });
          await tx.chatRoom.create({
            data: { id: demoId(`room:${currency}`), orderId, kind: 'ORDER_SHARED' },
          });
          await tx.orderTransition.create({
            data: {
              orderId,
              actorId: userId('CUSTOMER'),
              fromState: 'DRAFT',
              toState: 'AWAITING_AGREEMENT',
              version: 1,
              reason: 'Fictional seed request',
              operationKey: `seed:order:${currency}`,
            },
          });
        }
        const tomorrow = new Date(Math.ceil((Date.now() + 86400000) / 1800000) * 1800000),
          end = new Date(tomorrow.getTime() + 3600000),
          due = new Date(end.getTime() + 86400000);
        for (const kind of ['FIXED_BOOKING', 'INSPECTION_QUOTE'] as const) {
          const id = demoId(`professional-order:${kind}:${currency}`),
            sid = demoId(`professional-service:${kind}:${currency}`);
          if (await tx.marketOrder.findUnique({ where: { id } })) continue;
          const state = kind === 'FIXED_BOOKING' ? 'BOOKING_REQUESTED' : 'PENDING_QUOTE';
          await tx.marketOrder.create({
            data: {
              id,
              buyerId: userId('CUSTOMER'),
              sellerProfileId: profileId('PROFESSIONAL'),
              workspace: 'PROFESSIONALS',
              state,
              currency,
              agreedTotalUnits: kind === 'FIXED_BOOKING' ? units : null,
              eligibleSellerUnits: kind === 'FIXED_BOOKING' ? units : null,
              agreementSnapshot: { scope: 'Fictional professional service request' },
              addressSnapshot: { cityId: city, areaId: area, details: 'Fictional review address' },
            },
          });
          await tx.serviceOrder.create({
            data: {
              id: sid,
              orderId: id,
              kind,
              listingId:
                kind === 'FIXED_BOOKING' ? demoId(`listing:PROFESSIONAL:${currency}`) : null,
              depositUnits: kind === 'FIXED_BOOKING' ? split.deposit : null,
              balanceUnits: kind === 'FIXED_BOOKING' ? split.balance : null,
              responseDeadlineAt: new Date(Date.now() + 72 * 3600000),
              dueAt: due,
            },
          });
          if (kind === 'FIXED_BOOKING')
            await tx.booking.create({
              data: {
                id: demoId(`booking:${currency}`),
                serviceOrderId: sid,
                state: 'REQUESTED',
                requestedStartsAt: tomorrow,
                requestedEndsAt: end,
              },
            });
          else {
            await tx.inspectionRequest.create({
              data: {
                id: demoId(`inspection:${currency}`),
                serviceOrderId: sid,
                addressId: demoId('buyer-address'),
                description:
                  'Fictional inspection request; attach real demo images only after upload support exists.',
              },
            });
            const q = await tx.quote.create({
              data: {
                id: demoId(`quote:${currency}`),
                serviceOrderId: sid,
                state: 'DRAFT',
                version: 1,
                currency,
                totalUnits: units,
                scope: 'Fictional itemized draft, not yet approved/fundable',
                startsAt: tomorrow,
                endsAt: end,
                dueAt: due,
              },
            });
            await tx.quoteItem.create({
              data: {
                id: demoId(`quote-item:${currency}`),
                quoteId: q.id,
                description: 'Demo labor and materials',
                quantity: 1,
                unitPriceUnits: units,
              },
            });
          }
          const account = await tx.ledgerAccount.create({
            data: {
              id: demoId(`professional-escrow-account:${kind}:${currency}`),
              orderId: id,
              currency,
              kind: 'ESCROW',
            },
          });
          await tx.escrow.create({
            data: {
              id: demoId(`professional-escrow:${kind}:${currency}`),
              orderId: id,
              accountId: account.id,
              currency,
            },
          });
          await tx.chatRoom.create({
            data: {
              id: demoId(`professional-room:${kind}:${currency}`),
              orderId: id,
              kind: 'ORDER_SHARED',
            },
          });
          await tx.orderTransition.create({
            data: {
              orderId: id,
              actorId: userId('CUSTOMER'),
              fromState: 'DRAFT',
              toState: state,
              version: 1,
              reason: 'Fictional unfunded professional request',
              operationKey: `seed:professional:${kind}:${currency}`,
            },
          });
        }
        const preview = demoId(`store-preview:${currency}`),
          method = currency === 'SYP' ? 'SELLER' : 'PLATFORM_DRIVER',
          fee = currency === 'SYP' ? 3000n : 100n;
        if (!(await tx.marketOrder.findUnique({ where: { id: preview } }))) {
          await tx.marketOrder.create({
            data: {
              id: preview,
              buyerId: userId('CUSTOMER'),
              sellerProfileId: profileId('STORE_OWNER'),
              workspace: 'HOME_STORE',
              state: 'DRAFT',
              currency,
              agreedTotalUnits: units + fee,
              eligibleSellerUnits: units,
              deliveryFeeUnits: fee,
              agreementSnapshot: { scope: 'Fictional single-seller store preview' },
              addressSnapshot: { cityId: city, areaId: area, details: 'Fictional review address' },
              checkoutExpiresAt: new Date(Date.now() + 15 * 60000),
            },
          });
          const so = await tx.storeOrder.create({
            data: { id: demoId(`store-order:${currency}`), orderId: preview, storefrontId: store },
          });
          await tx.orderItem.create({
            data: {
              id: demoId(`order-item:${currency}`),
              storeOrderId: so.id,
              productId: demoId(`product:${currency}`),
              quantity: 1,
              unitPriceUnits: units,
              currency,
              productSnapshot: { titleAr: 'منتج تجريبي', titleEn: 'Demo product' },
            },
          });
          await tx.delivery.create({
            data: {
              id: demoId(`delivery:${currency}`),
              storeOrderId: so.id,
              rateId: demoId(`rate:${currency}:${method}`),
              method,
              currency,
              feeUnits: fee,
              cityId: city,
              areaId: area,
              termsSnapshot: { method, feeUnits: fee.toString(), promisedAt: due.toISOString() },
            },
          });
          const account = await tx.ledgerAccount.create({
            data: {
              id: demoId(`store-escrow-account:${currency}`),
              orderId: preview,
              currency,
              kind: 'ESCROW',
            },
          });
          await tx.escrow.create({
            data: {
              id: demoId(`store-escrow:${currency}`),
              orderId: preview,
              accountId: account.id,
              currency,
            },
          });
          for (const kind of ['ORDER_SHARED', 'DELIVERY'] as const)
            await tx.chatRoom.create({
              data: { id: demoId(`store-room:${kind}:${currency}`), orderId: preview, kind },
            });
        }
      }
      await tx.setupMetadata.upsert({
        where: { key: 'phase' },
        update: { value: 'database-contracts' },
        create: { key: 'phase', value: 'database-contracts' },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 },
  );
  await seedMedia(prisma, demoId);
  console.info('Fictional isolated demo accounts; login through /api/v1/auth/login:');
  for (const role of Object.values(RoleCode))
    console.info(`${role}: ${role.toLowerCase()}@demo.marketplace.test / ${password}`);
  console.info(
    'Both currencies funded through balanced immutable simulator journals; reruns do not top up twice or reset existing accounts.',
  );
}

main()
  .catch(() => {
    console.error(
      'Demo seed failed. Check ALLOW_DEMO_SEED, connectivity, applied migrations and PostgreSQL constraints.',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
