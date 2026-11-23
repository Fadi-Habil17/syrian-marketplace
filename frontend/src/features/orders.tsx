import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { operations, type Operation } from '../lib/api/registry';
import { amount, choose, timestamp, type Locale } from '../lib/locale';
import { actionLabel, enumLabel, field } from '../lib/labels';
import { CommandForm } from './command-form';
import { Back, Data, Empty, Heading, NextPage, Panel, ReadPanel, optional } from './ui';
import { Realtime } from './realtime';

type Order = ApiSchemas['Order'];
type User = ApiSchemas['User'];
type OrderProps = {
  locale: Locale;
  order: Order;
  user: User;
  token?: string;
  search: Record<string, string>;
};

export async function OrderList({
  locale,
  token,
  query,
}: {
  locale: Locale;
  token?: string;
  query: Record<string, string>;
}) {
  const page = await api('listOrders', { token, query });
  return (
    <>
      <Heading>{choose(locale, 'طلباتي', 'My orders')}</Heading>
      <form method="get" className="filters">
        <label>
          {field(locale, 'workspace')}
          <select name="workspace" defaultValue={query.workspace ?? ''}>
            <option value="">{choose(locale, 'الكل', 'All')}</option>
            {['FREELANCE', 'PROFESSIONALS', 'HOME_STORE'].map((value) => (
              <option key={value} value={value}>
                {enumLabel(locale, value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {field(locale, 'participation')}
          <select name="participation" defaultValue={query.participation ?? ''}>
            <option value="">{choose(locale, 'الكل', 'All')}</option>
            {operations.listOrders.query.participation?.enum?.map((value) => (
              <option key={String(value)} value={String(value)}>
                {enumLabel(locale, String(value))}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary">{choose(locale, 'تطبيق', 'Apply filters')}</button>
      </form>
      {page.items.length ? (
        <div className="list-cards">
          {page.items.map((order) => (
            <Link className="row-card" key={order.id} href={'/' + locale + '/orders/' + order.id}>
              <div>
                <strong>{enumLabel(locale, order.workspace)}</strong>
                <p>{order.terms.scope}</p>
                <time dateTime={order.createdAt}>{timestamp(locale, order.createdAt)}</time>
              </div>
              <div>
                <span className="pill active">{enumLabel(locale, order.state)}</span>
                <strong className="price">{amount(locale, order.total)}</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty locale={locale} />
      )}
      <NextPage locale={locale} cursor={page.nextCursor} query={query} />
    </>
  );
}

export async function OrderDetail({
  locale,
  id,
  user,
  token,
  search,
}: {
  locale: Locale;
  id: string;
  user: User;
  token?: string;
  search: Record<string, string>;
}) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await optional(api('getOrder', { token, params: { orderId: id } }));
  if (!order) notFound();
  const params = { orderId: id };
  const orders = { locale, order, user, token, search };
  const actions = await optional(api('getAllowedOrderActions', { token, params }));
  const isDraft = order.state === 'DRAFT' && order.workspace === 'HOME_STORE';
  const provider = user.activeBusinessProfile?.id === order.sellerProfileId;
  const buyer = user.id === order.buyerId;
  const available =
    actions?.items.filter((item) => item.enabled && Object.hasOwn(operations, item.operationId)) ??
    [];
  return (
    <>
      <Back locale={locale} path="/orders" title={choose(locale, 'طلباتي', 'My orders')} />
      <Heading description={order.terms.scope}>
        {isDraft
          ? choose(locale, 'مراجعة طلب المتجر', 'Review store checkout')
          : enumLabel(locale, order.workspace)}
      </Heading>
      <div className="inline-links">
        <span className="pill active">{enumLabel(locale, order.state)}</span>
        <span className="pill">{choose(locale, 'مدفوعات تجريبية', 'Simulated payments')}</span>
        {!isDraft && <Realtime locale={locale} orderId={id} version={order.version} />}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Panel title={choose(locale, 'الاتفاق والمبالغ', 'Agreement and amounts')}>
            <p className="preserve">{order.terms.scope}</p>
            <Data
              locale={locale}
              value={{
                total: order.total,
                sellerAmount: order.sellerAmount,
                deliveryFee: order.deliveryFee,
                deposit: order.deposit,
                balance: order.balance,
                held: order.held,
                ...(order.terms.deliveryMethod ? { method: order.terms.deliveryMethod } : {}),
                dueAt: order.terms.dueAt,
                startsAt: order.terms.startsAt,
                endsAt: order.terms.endsAt,
                promisedAt: order.terms.promisedDeliveryAt,
                commissionBpsSnapshot: order.commissionBpsSnapshot,
              }}
            />
            {!!order.deadlines.length && (
              <ul className="data-list">
                {order.deadlines.map((deadline) => (
                  <li key={deadline.kind}>
                    {enumLabel(locale, deadline.kind)} ·{' '}
                    <time dateTime={deadline.at}>{timestamp(locale, deadline.at)}</time>
                  </li>
                ))}
              </ul>
            )}
            {order.store?.items.length ? (
              <Data
                locale={locale}
                value={order.store.items.map((item) => {
                  const { titleAr, titleEn, ...line } = item;
                  return { title: locale === 'ar' ? titleAr : titleEn, ...line };
                })}
              />
            ) : null}
          </Panel>
          {order.store && (
            <DeliveryPanel
              locale={locale}
              token={token}
              id={order.store.deliveryId}
              buyer={buyer}
              provider={provider}
              user={user}
              state={order.state}
            />
          )}
          {!isDraft && (
            <>
              <Chat locale={locale} token={token} orderId={id} search={search} />
              {order.workspace !== 'HOME_STORE' && (
                <Services {...orders} provider={provider} buyer={buyer} />
              )}
              <Panel title={choose(locale, 'النزاعات والدعم', 'Disputes and support')}>
                <CaseLinks {...orders} />
              </Panel>
              <OrderHistory {...orders} />
            </>
          )}
        </div>
        <aside className="stack">
          <Panel title={choose(locale, 'إجراءات الطلب', 'Order actions')}>
            {available.length ? (
              available.map((item) => {
                const name = item.operationId as Operation;
                const payment = ['holdDeposit', 'holdBalance', 'checkoutStore'].includes(name);
                return (
                  <div key={name} className="order-action">
                    {item.deadlineAt && (
                      <time dateTime={item.deadlineAt}>{timestamp(locale, item.deadlineAt)}</time>
                    )}
                    {payment && (
                      <p className="payment-amount">
                        {actionLabel(locale, name)} ·{' '}
                        <bdi>
                          {amount(
                            locale,
                            name === 'holdDeposit'
                              ? order.deposit
                              : name === 'holdBalance'
                                ? order.balance
                                : order.total,
                          )}
                        </bdi>
                      </p>
                    )}
                    <CommandForm
                      locale={locale}
                      name={name}
                      params={params}
                      version={order.version}
                      defaults={
                        name === 'checkoutStore'
                          ? { draftOrderId: id }
                          : name === 'deliverService'
                            ? {
                                kind:
                                  order.workspace === 'FREELANCE'
                                    ? 'DIGITAL_FINAL'
                                    : 'ONSITE_HANDOVER',
                              }
                            : {}
                      }
                      initial={
                        name === 'agreeOrder'
                          ? { scope: order.terms.scope, dueAt: order.terms.dueAt }
                          : {}
                      }
                      hidden={[
                        'simulateFailure',
                        ...(name === 'deliverService'
                          ? [order.workspace === 'FREELANCE' ? 'proofFileId' : 'fileIds']
                          : []),
                      ]}
                      go={name === 'checkoutStore' ? 'order' : undefined}
                      upload={{
                        orderId: id,
                        accessClass:
                          name === 'deliverService' ? 'FINAL_DELIVERABLE' : 'ORDER_SHARED',
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <p>
                {choose(
                  locale,
                  'لا توجد إجراءات متاحة حالياً.',
                  'There are no available actions right now.',
                )}
              </p>
            )}
            {(buyer || provider) &&
              [
                'AWAITING_AGREEMENT',
                'BOOKING_REQUESTED',
                'SCHEDULE_PROPOSED',
                'PENDING_QUOTE',
                'QUOTE_SENT',
              ].includes(order.state) && (
                <CommandForm
                  locale={locale}
                  name="rejectOrder"
                  params={params}
                  version={order.version}
                />
              )}
            {provider && order.state === 'PENDING_QUOTE' && (
              <CommandForm
                locale={locale}
                name="agreeInspectionSchedule"
                params={params}
                version={order.version}
              />
            )}
            {buyer && order.state === 'COMPLETED' && <OrderReview locale={locale} order={order} />}
          </Panel>
        </aside>
      </div>
    </>
  );
}

async function OrderReview({ locale, order }: { locale: Locale; order: Order }) {
  const page = await optional(
    api('listVerifiedReviews', {
      params: { profileId: order.sellerProfileId },
      query: { limit: 100 },
    }),
  );
  const review = page?.items.find((item) => item.orderId === order.id);
  if (!review)
    return <CommandForm locale={locale} name="createReview" params={{ orderId: order.id }} />;
  return (
    <>
      <Data locale={locale} value={{ stars: review.stars, body: review.body }} />
      {review.version === 1 && new Date(review.editableUntil).getTime() > Date.now() && (
        <CommandForm
          locale={locale}
          name="editReview"
          params={{ reviewId: review.id }}
          initial={{ stars: review.stars, body: review.body }}
        />
      )}
    </>
  );
}

async function Services({
  locale,
  order,
  token,
  buyer,
}: OrderProps & { provider: boolean; buyer: boolean }) {
  const params = { orderId: order.id };
  const [quotes, milestones, submissions] = await Promise.all([
    order.workspace === 'PROFESSIONALS'
      ? optional(api('listOrderQuotes', { token, params }))
      : null,
    optional(api('listMilestones', { token, params })),
    optional(api('listSubmissions', { token, params })),
  ]);
  return (
    <>
      {order.service?.booking && (
        <Panel title={choose(locale, 'موعد الخدمة', 'Service appointment')}>
          <Data locale={locale} value={order.service.booking} />
        </Panel>
      )}
      {quotes?.items.length ? (
        <Panel title={choose(locale, 'عروض السعر', 'Quotes')}>
          {quotes.items.map((quote) => (
            <div className="card-block" key={quote.id}>
              <Data
                locale={locale}
                value={{ ...quote, total: { currency: quote.currency, units: quote.totalUnits } }}
              />
              {buyer && quote.state === 'SENT' && (
                <>
                  <CommandForm
                    locale={locale}
                    name="approveQuote"
                    params={{ quoteId: quote.id }}
                    version={order.version}
                  />
                  <CommandForm
                    locale={locale}
                    name="rejectQuote"
                    params={{ quoteId: quote.id }}
                    version={order.version}
                  />
                </>
              )}
            </div>
          ))}
        </Panel>
      ) : null}
      {milestones?.items.length ? (
        <Panel title={choose(locale, 'مراحل العمل', 'Milestones')}>
          <Data locale={locale} value={milestones.items} />
        </Panel>
      ) : null}
      {submissions?.items.length ? (
        <Panel title={choose(locale, 'ملفات التسليم', 'Deliverables')}>
          <div className="inline-links">
            {submissions.items.map((item) => (
              <a href={'/api/media/' + item.id} key={item.id}>
                {item.originalName}
              </a>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  );
}

export async function Chat({
  locale,
  token,
  orderId,
  search,
}: {
  locale: Locale;
  token?: string;
  orderId: string;
  search: Record<string, string>;
}) {
  const rooms = await optional(api('getOrderRooms', { token, params: { orderId } }));
  if (!rooms?.items.length) return null;
  const room = rooms.items.find((item) => item.id === search.roomId) ?? rooms.items[0];
  if (!room) return null;
  const messages = await optional(
    api('listMessages', {
      token,
      params: { orderId },
      query: { roomId: room.id, cursor: search.cursor },
    }),
  );
  return (
    <Panel title={choose(locale, 'محادثة الطلب', 'Order chat')}>
      <nav className="inline-links">
        {rooms.items.map((item) => (
          <Link
            key={item.id}
            className={'pill ' + (item.id === room.id ? 'active' : '')}
            href={'?' + new URLSearchParams({ roomId: item.id })}
          >
            {enumLabel(locale, item.kind)}
          </Link>
        ))}
      </nav>
      {messages?.items.length ? (
        <ul className="messages">
          {[...messages.items].reverse().map((message) => (
            <li key={message.id}>
              <time dateTime={message.createdAt}>{timestamp(locale, message.createdAt)}</time>
              {message.text && <p className="preserve">{message.text}</p>}
              {message.attachments.map((file) => (
                <a key={file.id} href={'/api/media/' + file.id}>
                  {file.originalName}
                </a>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <Empty locale={locale} />
      )}
      <NextPage locale={locale} cursor={messages?.nextCursor} query={{ roomId: room.id }} />
      <CommandForm
        locale={locale}
        name="sendMessage"
        params={{ orderId }}
        defaults={{ roomId: room.id }}
        hidden={['clientMessageId']}
        upload={{
          orderId,
          accessClass: room.kind === 'DELIVERY' ? 'DELIVERY_ONLY' : 'ORDER_SHARED',
        }}
        open
      />
    </Panel>
  );
}

async function CaseLinks({ locale, token, order, user }: OrderProps) {
  const cases = await optional(api('listOrderCases', { token, params: { orderId: order.id } }));
  return (
    <>
      {cases?.items.length ? (
        cases.items.map((item) => (
          <Link className="row-card" key={item.id} href={'/' + locale + '/cases/' + item.id}>
            <span>{enumLabel(locale, item.kind)}</span>
            <strong>{enumLabel(locale, item.status)}</strong>
          </Link>
        ))
      ) : (
        <Empty locale={locale} />
      )}
      {order.state === 'COMPLETED' &&
        (user.id === order.buyerId || user.activeBusinessProfile?.id === order.sellerProfileId) && (
          <CommandForm
            locale={locale}
            name="openCase"
            params={{ orderId: order.id }}
            version={order.version}
            defaults={{ kind: 'SUPPORT' }}
          />
        )}
    </>
  );
}

async function OrderHistory({ locale, token, order, search }: OrderProps) {
  const params = { orderId: order.id };
  const [payments, timeline, settlement] = await Promise.all([
    optional(api('listOrderPayments', { token, params, query: { cursor: search.paymentsCursor } })),
    optional(api('getOrderTimeline', { token, params, query: { cursor: search.timelineCursor } })),
    optional(api('getSettlement', { token, params })),
  ]);
  return (
    <>
      {payments?.items.length ? (
        <Panel title={choose(locale, 'سجل المدفوعات التجريبية', 'Simulated payment history')}>
          <Data locale={locale} value={payments.items} />
          {payments.nextCursor && (
            <Link href={'?' + new URLSearchParams({ paymentsCursor: payments.nextCursor })}>
              {choose(locale, 'مزيد من المدفوعات', 'More payments')}
            </Link>
          )}
        </Panel>
      ) : null}
      {settlement && (
        <Panel title={choose(locale, 'التسوية', 'Settlement')}>
          <Data locale={locale} value={settlement} />
        </Panel>
      )}
      <Panel title={choose(locale, 'سجل الطلب', 'Order timeline')}>
        {timeline?.items.length ? (
          <Data locale={locale} value={timeline.items} />
        ) : (
          <Empty locale={locale} />
        )}
        {timeline?.nextCursor && (
          <Link href={'?' + new URLSearchParams({ timelineCursor: timeline.nextCursor })}>
            {choose(locale, 'مزيد من الأحداث', 'More events')}
          </Link>
        )}
      </Panel>
    </>
  );
}

export async function DeliveryPanel({
  locale,
  token,
  id,
  provider,
  buyer,
  user,
  state,
}: {
  locale: Locale;
  token?: string;
  id: string;
  provider?: boolean;
  buyer?: boolean;
  user: User;
  state?: Order['state'];
}) {
  const delivery = await optional(api('getDelivery', { token, params: { deliveryId: id } }));
  if (!delivery) return null;
  const assigned =
    !!delivery.driverProfileId && user.activeBusinessProfile?.id === delivery.driverProfileId;
  const directs =
    (provider &&
      delivery.method === 'SELLER' &&
      ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(state ?? '')) ||
    assigned;
  const relevant = !['DROPPED_OFF', 'CANCELLED'].includes(delivery.status) && state !== 'DRAFT';
  const commands: Operation[] = [];
  if (directs && relevant) {
    if (['PENDING', 'ASSIGNED'].includes(delivery.status)) commands.push('recordPickup');
    if (delivery.status === 'PICKED_UP') commands.push('recordDropoff');
    commands.push('reportDeliveryException');
  }
  if (
    buyer &&
    ['PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(
      state ?? '',
    )
  )
    commands.push('reportDeliveryException');
  if (assigned && relevant && delivery.status === 'ASSIGNED')
    commands.push('releaseDriverAssignment');
  if (provider && ['READY_FOR_DELIVERY', 'DELIVERY_EXCEPTION'].includes(state ?? ''))
    commands.push('chooseDeliveryFallback', 'proposeDeliveryTerms');

  return (
    <Panel title={choose(locale, 'التوصيل', 'Delivery')}>
      <Data
        locale={locale}
        value={{
          method: delivery.method,
          status: delivery.status,
          fee: delivery.fee,
          address: delivery.address,
          events: delivery.events,
        }}
      />
      {buyer && relevant && (
        <p>
          {choose(
            locale,
            'إذا غيّر البائع شروط التوصيل، تواصل معه عبر محادثة الطلب.',
            'If the seller changes delivery terms, contact them in the order chat.',
          )}
        </p>
      )}
      {commands.map((name) => (
        <CommandForm
          key={name}
          name={name}
          locale={locale}
          params={{ deliveryId: id }}
          version={delivery.orderVersion}
          upload={{ accessClass: 'DELIVERY_ONLY', orderId: delivery.orderId }}
        />
      ))}
    </Panel>
  );
}

export async function CaseDetail({
  locale,
  id,
  user,
  token,
}: {
  locale: Locale;
  id: string;
  user: User;
  token?: string;
}) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const params = { caseId: id };
  const item = await optional(api('getCase', { token, params }));
  if (!item) notFound();
  const order = await optional(api('getOrder', { token, params: { orderId: item.orderId } }));
  const admin = user.roles.includes('ADMIN');
  const handling = item.handlingAdminId === user.id;
  const participant =
    !!order &&
    (order.buyerId === user.id || order.sellerProfileId === user.activeBusinessProfile?.id);
  const open = !['RESOLVED', 'CLOSED'].includes(item.status);
  const [evidence, proposals] = await Promise.all([
    optional(api('listEvidence', { token, params })),
    optional(api('listProposals', { token, params })),
  ]);
  return (
    <>
      <Back
        locale={locale}
        path={admin ? '/admin?tab=cases' : '/orders/' + item.orderId}
        title={
          admin
            ? choose(locale, 'لوحة الإدارة', 'Administration')
            : choose(locale, 'الطلب', 'Order')
        }
      />
      <Heading description={item.reason}>
        {enumLabel(locale, item.kind)} · {enumLabel(locale, item.status)}
      </Heading>
      <div className="dashboard-grid">
        <div className="stack">
          <Panel title={choose(locale, 'أطراف القضية والمواعيد', 'Parties and evidence deadlines')}>
            <Data locale={locale} value={item.parties} />
          </Panel>
          <Panel title={choose(locale, 'الأدلة', 'Evidence')}>
            {evidence?.items.length ? (
              <Data locale={locale} value={evidence.items} />
            ) : (
              <Empty locale={locale} />
            )}
            {open && participant && (
              <CommandForm
                locale={locale}
                name="submitEvidence"
                params={params}
                upload={{ accessClass: 'CASE_EVIDENCE', caseId: id, orderId: item.orderId }}
              />
            )}
          </Panel>
          <Panel title={choose(locale, 'الحلول المقترحة', 'Proposed resolutions')}>
            {proposals?.items.length ? (
              proposals.items.map((proposal) => (
                <div className="card-block" key={proposal.id}>
                  <Data locale={locale} value={proposal} />
                  {open && participant && order && (
                    <>
                      <CommandForm
                        locale={locale}
                        name="acceptResolutionProposal"
                        params={{ ...params, proposalId: proposal.id }}
                        version={order.version}
                      />
                      <CommandForm
                        locale={locale}
                        name="rejectResolutionProposal"
                        params={{ ...params, proposalId: proposal.id }}
                        version={order.version}
                      />
                    </>
                  )}
                </div>
              ))
            ) : (
              <Empty locale={locale} />
            )}
            {open && participant && order && (
              <>
                <CommandForm
                  locale={locale}
                  name="proposeResolution"
                  params={params}
                  version={order.version}
                />
                <CommandForm
                  locale={locale}
                  name="acceptRevisionPlan"
                  params={params}
                  version={order.version}
                />
              </>
            )}
          </Panel>
          {handling && order && (
            <OrderDetail locale={locale} id={order.id} user={user} token={token} search={{}} />
          )}
        </div>
        <aside className="stack">
          {admin && (
            <Panel title={choose(locale, 'إجراءات المشرف', 'Admin actions')}>
              <CommandForm locale={locale} name="assignAdminCase" params={params} />
              {handling && order && open && (
                <>
                  <Data
                    locale={locale}
                    value={{ held: order.held, deliveryFee: order.deliveryFee }}
                  />
                  <CommandForm
                    locale={locale}
                    name="resolveAdminCase"
                    params={params}
                    version={order.version}
                  />
                  <CommandForm
                    locale={locale}
                    name="resumeOverdueFinalPayment"
                    params={params}
                    version={order.version}
                  />
                  {order.store && (
                    <CommandForm
                      locale={locale}
                      name="reassignDelivery"
                      params={{ deliveryId: order.store.deliveryId }}
                      version={order.version}
                      upload={{ accessClass: 'CASE_EVIDENCE', caseId: id, orderId: order.id }}
                    />
                  )}
                </>
              )}
            </Panel>
          )}
          {order && (
            <ReadPanel
              locale={locale}
              title={choose(locale, 'حالة الطلب', 'Order status')}
              request={Promise.resolve(order)}
              render={(value) => (
                <Link href={'/' + locale + '/orders/' + value.id}>
                  {enumLabel(locale, value.state)}
                </Link>
              )}
            />
          )}
        </aside>
      </div>
    </>
  );
}
