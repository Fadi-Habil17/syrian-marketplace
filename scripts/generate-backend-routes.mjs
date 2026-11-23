import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import prettier from 'prettier';

async function write(file, content) {
  fs.writeFileSync(
    file,
    await prettier.format(content, {
      ...(await prettier.resolveConfig(file)),
      parser: file.endsWith('.json') ? 'json' : 'typescript',
    }),
  );
}
const api = YAML.parse(fs.readFileSync('docs/api/openapi.yaml', 'utf8'));
const features = [
  {
    name: 'realtime',
    type: 'Realtime',
    manualModule: true,
    imports: [],
    operations: ['createRealtimeTicket'],
  },
  {
    name: 'admin',
    type: 'Admin',
    imports: [
      ['EscrowModule', '../escrow/escrow.service'],
      ['CaseAccessModule', '../disputes/case-access.service'],
      ['CaseLifecycleModule', '../disputes/case-lifecycle.service'],
      ['PaymentsModule', '../payments/payments.module'],
      ['CommissionRatesModule', '../payments/rates.service'],
      ['DeliveryConfigModule', '../delivery/delivery-config.service'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
      ['CatalogModule', '../catalog/catalog.module'],
      ['ProfilesModule', '../profiles/profiles.module'],
      ['StoresModule', '../stores/stores.module'],
      ['ProductsModule', '../products/products.module'],
      ['ReviewsModule', '../reviews/reviews.module'],
    ],
    operations: [
      'listAuditHistory',
      'listAdminCases',
      'listCommissionRates',
      'configureCommission',
      'listDeliveryRates',
      'configureDeliveryRate',
      'listDriverZones',
      'assignDriverZone',
      'removeDriverZone',
      'listModerationQueue',
      'moderateResource',
      'moderateReview',
      'restrictAccount',
      'revokeRestriction',
      'assignAdminCase',
      'resolveAdminCase',
      'resumeOverdueFinalPayment',
    ],
  },
  {
    name: 'chat',
    type: 'Chat',
    imports: [
      ['ChatAccessModule', './chat-access.service'],
      ['FilesModule', '../files/files.module'],
    ],
    operations: ['getOrderRooms', 'listMessages', 'sendMessage'],
  },
  {
    name: 'notifications',
    type: 'Notifications',
    imports: [],
    operations: [
      'listNotifications',
      'readNotification',
      'readAllNotifications',
      'registerDevice',
      'revokeDevice',
    ],
  },
  {
    name: 'reviews',
    type: 'Reviews',
    imports: [],
    operations: ['listVerifiedReviews', 'createReview', 'editReview'],
  },
  {
    name: 'delivery',
    type: 'Delivery',
    imports: [
      ['EscrowModule', '../escrow/escrow.service'],
      ['ShippingPolicyModule', './shipping-policy.service'],
      ['CaseLifecycleModule', '../disputes/case-lifecycle.service'],
      ['PaymentsModule', '../payments/payments.module'],
      ['InventoryModule', '../inventory/inventory.service'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
    ],
    operations: [
      'reassignDelivery',
      'requestPlatformDriver',
      'getDelivery',
      'listDriverJobs',
      'listDriverAssignments',
      'acceptDeliveryJob',
      'releaseDriverAssignment',
      'recordPickup',
      'recordDropoff',
      'reportDeliveryException',
      'proposeDeliveryTerms',
      'approveDeliveryTerms',
      'chooseDeliveryFallback',
    ],
  },
  {
    name: 'disputes',
    type: 'Disputes',
    imports: [
      ['EscrowModule', '../escrow/escrow.service'],
      ['CaseAccessModule', './case-access.service'],
      ['CaseLifecycleModule', './case-lifecycle.service'],
      ['PaymentsModule', '../payments/payments.module'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
      ['SchedulingModule', '../scheduling/scheduling.service'],
    ],
    operations: [
      'listOrderCases',
      'getCase',
      'openCase',
      'listEvidence',
      'submitEvidence',
      'listProposals',
      'proposeResolution',
      'acceptResolutionProposal',
      'rejectResolutionProposal',
      'acceptRevisionPlan',
      'cancelOrder',
      'requestExtension',
      'acceptExtension',
    ],
  },
  {
    name: 'checkout',
    type: 'Checkout',
    imports: [
      ['ShippingPolicyModule', '../delivery/shipping-policy.service'],
      ['GeographyModule', '../geography/geography.module'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
    ],
    operations: ['previewStoreCheckout', 'getDeliveryOptions'],
  },
  {
    name: 'orders',
    type: 'Orders',
    imports: [
      ['PaymentsModule', '../payments/payments.module'],
      ['OrderCoreModule', './order-lifecycle.service'],
      ['OrdersReadModule', './orders-read.module'],
      ['SchedulingModule', '../scheduling/scheduling.service'],
    ],
    operations: [
      'getAllowedOrderActions',
      'rejectOrder',
      'startWork',
      'recordProgress',
      'markReady',
      'deliverService',
      'createMilestone',
      'acceptStoreOrder',
      'markStoreReady',
    ],
  },
  {
    name: 'freelance',
    type: 'Freelance',
    imports: [
      ['CatalogModule', '../catalog/catalog.module'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
    ],
    operations: ['createFreelanceOrder', 'agreeOrder'],
  },
  {
    name: 'bookings',
    type: 'Bookings',
    imports: [
      ['CatalogModule', '../catalog/catalog.module'],
      ['GeographyModule', '../geography/geography.module'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
      ['SchedulingModule', '../scheduling/scheduling.service'],
    ],
    operations: ['createBooking', 'acceptBooking', 'proposeSchedule', 'acceptSchedule'],
  },
  {
    name: 'quotes',
    type: 'Quotes',
    imports: [
      ['GeographyModule', '../geography/geography.module'],
      ['OrderCoreModule', '../orders/order-lifecycle.service'],
      ['OrdersReadModule', '../orders/orders-read.module'],
      ['SchedulingModule', '../scheduling/scheduling.service'],
    ],
    operations: [
      'requestInspectionQuote',
      'listOrderQuotes',
      'sendQuote',
      'approveQuote',
      'rejectQuote',
      'agreeInspectionSchedule',
    ],
  },
  {
    name: 'payments',
    type: 'Payments',
    service: 'FinanceHttpService',
    serviceFile: 'finance-http.service',
    manualModule: true,
    imports: [],
    operations: ['holdDeposit', 'holdBalance', 'checkoutStore', 'confirmReceipt'],
  },
  {
    name: 'orders-query',
    directory: 'orders',
    type: 'OrdersQuery',
    service: 'OrdersQueryService',
    serviceFile: 'orders-query.service',
    manualModule: true,
    imports: [],
    operations: ['listOrders', 'getOrder', 'getOrderTimeline', 'listMilestones', 'listSubmissions'],
  },
  {
    name: 'wallets',
    type: 'Wallets',
    imports: [
      ['LedgerModule', '../ledger/ledger-posting.service'],
      ['PaymentGatewayModule', '../payments/gateway.module'],
    ],
    operations: [
      'listWallets',
      'listWalletTransactions',
      'listOrderPayments',
      'getSettlement',
      'getOperation',
      'simulateWalletTopUp',
    ],
  },
  {
    name: 'stores',
    type: 'Stores',
    imports: [
      ['ProductsModule', '../products/products.module'],
      ['CatalogModule', '../catalog/catalog.module'],
      ['GeographyModule', '../geography/geography.module'],
    ],
    operations: [
      'listStores',
      'createStore',
      'getStore',
      'updateStore',
      'publishStore',
      'deactivateStore',
    ],
  },
  {
    name: 'products',
    type: 'Products',
    imports: [
      ['CatalogModule', '../catalog/catalog.module'],
      ['InventoryModule', '../inventory/inventory.service'],
    ],
    operations: [
      'listProducts',
      'createProduct',
      'getProduct',
      'updateProduct',
      'publishProduct',
      'deactivateProduct',
      'setProductStock',
    ],
  },
  {
    name: 'catalog',
    type: 'Catalog',
    imports: [],
    operations: [
      'listCategories',
      'listListings',
      'createListing',
      'getListing',
      'updateListing',
      'publishListing',
      'deactivateListing',
    ],
  },
  {
    name: 'profiles',
    type: 'Profiles',
    imports: [
      ['CatalogModule', '../catalog/catalog.module'],
      ['StoresModule', '../stores/stores.module'],
      ['UsersModule', '../users/users.service'],
    ],
    operations: [
      'getMe',
      'updateMe',
      'listOwnBusinessProfiles',
      'createBusinessProfile',
      'updateBusinessProfile',
      'switchBusinessWorkspace',
      'reactivateBusinessProfile',
      'getPublicProfile',
      'createPortfolioItem',
      'removePortfolioItem',
      'listServiceAreas',
      'addServiceArea',
      'removeServiceArea',
    ],
  },
  {
    name: 'geography',
    type: 'Geography',
    imports: [],
    operations: [
      'listGovernorates',
      'listCities',
      'listAreas',
      'listAddresses',
      'createAddress',
      'updateAddress',
      'archiveAddress',
    ],
  },
];
const implemented = [
  'uploadFile',
  'getFileStatus',
  'downloadFile',
  'getHealth',
  'register',
  'login',
  'refreshSession',
  'verifyEmail',
  'forgotPassword',
  'resetPassword',
  'logout',
  'getSessionUser',
];
for (const feature of features) {
  const dir = `backend/src/modules/${feature.directory ?? feature.name}`,
    service = feature.service ?? `${feature.type}Service`,
    serviceFile = feature.serviceFile ?? `${feature.name}.service`;
  let methods = '';
  const source = fs.readFileSync(`${dir}/${serviceFile}.ts`, 'utf8');
  for (const id of feature.operations) {
    if (!new RegExp('\\b' + id + '\\(').test(source))
      throw Error(`Missing actual service method ${id}`);
    let found;
    for (const [url, verbs] of Object.entries(api.paths))
      for (const [verb, operation] of Object.entries(verbs))
        if (operation.operationId === id) found = { url, verb, operation };
    if (!found) throw Error('Unknown operation ' + id);
    const { url, verb, operation: o } = found,
      route = url.replace('/api/v1/', '').replace(/\{(\w+)\}/g, ':$1'),
      status = Number(Object.keys(o.responses).find((x) => x.startsWith('2')));
    methods += `\n ${o.security?.length === 0 ? '@Public() ' : ''}${url.includes('/admin/') ? "@Roles('ADMIN') " : ''}@${verb[0].toUpperCase() + verb.slice(1)}('${route}') @HttpCode(${status}) @Operation('${id}')\n ${id}(@Req() request:ApiRequest){return this.service.${id}(request);}\n`;
    implemented.push(id);
  }
  await write(
    `${dir}/${feature.name}.controller.ts`,
    `// Generated thin transport adapter. Edit service policies and route manifest configuration.\nimport { Controller,Get,Post,Patch,Delete,HttpCode,Req } from '@nestjs/common';\nimport { ApiRequest,Operation,Public,Roles } from '../../common/actor';\nimport { ${service} } from './${serviceFile}';\n@Controller()\nexport class ${feature.type}Controller {\n constructor(private readonly service:${service}){}\n${methods}}\n`,
  );
  if (feature.manualModule) continue;
  const imports = feature.imports.map(([n, p]) => `import {${n}} from '${p}';`).join('\n');
  await write(
    `${dir}/${feature.name}.module.ts`,
    `import { Module } from '@nestjs/common';\nimport {${feature.type}Controller} from './${feature.name}.controller';\nimport {${feature.type}Service} from './${feature.name}.service';\n${imports}\n${feature.name === 'catalog' ? "import {CatalogPolicy} from './catalog.policy';" : ''}\n@Module({imports:[${feature.imports.map(([n]) => n).join(',')}],controllers:[${feature.type}Controller],providers:[${feature.type}Service${feature.name === 'catalog' ? ',CatalogPolicy' : ''}],exports:[${feature.type}Service${feature.name === 'catalog' ? ',CatalogPolicy' : ''}]})\nexport class ${feature.type}Module {}\n`,
  );
}
await write(
  'backend/src/route-manifest.json',
  JSON.stringify(
    { implemented, features: features.map((f) => ({ name: f.name, operations: f.operations })) },
    null,
    2,
  ) + '\n',
);
console.info(
  `Generated thin controllers for ${features.length} feature modules. ${implemented.length} actual HTTP handlers registered.`,
);
