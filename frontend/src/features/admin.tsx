import Link from 'next/link';
import { api } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { choose, type Locale } from '../lib/locale';
import { enumLabel } from '../lib/labels';
import { CommandForm } from './command-form';
import { geographicChoices, LocationFilter } from './account/dashboard';
import { Data, Empty, Heading, NextPage, Panel, optional } from './ui';

const tabs = [
  ['moderation', 'الإشراف', 'Moderation'],
  ['cases', 'النزاعات', 'Disputes'],
  ['rates', 'العمولة والتوصيل', 'Commission and delivery'],
  ['accounts', 'الحسابات والمحاكاة', 'Accounts and simulator'],
  ['audit', 'سجل التدقيق', 'Audit log'],
] as const;

type Props = { locale: Locale; token?: string; query: Record<string, string> };

export async function Admin({ locale, token, query }: Props) {
  const tab = tabs.find(([key]) => key === query.tab)?.[0] ?? 'moderation';
  const props = { locale, token, query: { ...query, tab } };
  return (
    <>
      <Heading>{choose(locale, 'لوحة الإدارة', 'Administration')}</Heading>
      <nav className="inline-links" aria-label={choose(locale, 'أقسام الإدارة', 'Admin sections')}>
        {tabs.map(([key, ar, en]) => (
          <Link
            aria-current={tab === key ? 'page' : undefined}
            className={'pill ' + (tab === key ? 'active' : '')}
            key={key}
            href={'?tab=' + key}
          >
            {choose(locale, ar, en)}
          </Link>
        ))}
      </nav>
      {tab === 'moderation' ? (
        <Moderation {...props} />
      ) : tab === 'cases' ? (
        <Cases {...props} />
      ) : tab === 'rates' ? (
        <Rates {...props} />
      ) : tab === 'accounts' ? (
        <Accounts {...props} />
      ) : (
        <Audit {...props} />
      )}
    </>
  );
}

async function Moderation({ locale, token, query }: Props) {
  const page = await api('listModerationQueue', { token, query: { cursor: query.cursor } });
  return (
    <Panel title={choose(locale, 'قائمة مراجعة المحتوى', 'Content moderation queue')}>
      {page.items.length ? (
        page.items.map((item) => (
          <div className="card-block" key={item.id}>
            <h3>
              {enumLabel(locale, item.resourceType)} · {enumLabel(locale, item.status)}
            </h3>
            <Data locale={locale} value={item.content ?? item} />
            <CommandForm
              locale={locale}
              name={item.resourceType === 'REVIEW' ? 'moderateReview' : 'moderateResource'}
              params={{ resourceId: item.resourceId, reviewId: item.resourceId }}
            />
          </div>
        ))
      ) : (
        <Empty locale={locale} />
      )}
      <NextPage locale={locale} cursor={page.nextCursor} query={query} />
    </Panel>
  );
}

async function Cases({ locale, token, query }: Props) {
  const page = await api('listAdminCases', { token, query: { cursor: query.cursor } });
  return (
    <Panel title={choose(locale, 'قضايا المنصة', 'Marketplace cases')}>
      {page.items.length ? (
        page.items.map((item) => (
          <Link className="row-card" key={item.id} href={'/' + locale + '/cases/' + item.id}>
            <div>
              <strong>{enumLabel(locale, item.kind)}</strong>
              <p>{item.reason}</p>
            </div>
            <span className="pill">{enumLabel(locale, item.status)}</span>
          </Link>
        ))
      ) : (
        <Empty locale={locale} />
      )}
      <NextPage locale={locale} cursor={page.nextCursor} query={query} />
    </Panel>
  );
}

async function Rates({ locale, token, query }: Props) {
  const [commissions, deliveries, zones, locations] = await Promise.all([
    api('listCommissionRates', { token, query: { cursor: query.commissionCursor } }),
    api('listDeliveryRates', { token, query: { cursor: query.rateCursor } }),
    api('listDriverZones', { token, query: { cursor: query.zoneCursor } }),
    geographicChoices(locale, query),
  ]);
  const more = (key: string, cursor: string | null) =>
    cursor && (
      <Link
        className="button outline"
        href={'?' + new URLSearchParams({ ...query, [key]: cursor })}
      >
        {choose(locale, 'الصفحة التالية', 'Next page')}
      </Link>
    );
  return (
    <div className="stack">
      <Panel title={choose(locale, 'العمولات', 'Commission rates')}>
        <p>
          {choose(
            locale,
            'مئة نقطة أساسية تساوي ١٪. اختر بلا قيمة لتعديل العمولة العامة.',
            '100 basis points equal 1%. Select No value for the global rate.',
          )}
        </p>
        <CommandForm locale={locale} name="configureCommission" initial={{ workspace: null }} />
        {commissions.items.length ? (
          <Data locale={locale} value={commissions.items} />
        ) : (
          <Empty locale={locale} />
        )}
        {more('commissionCursor', commissions.nextCursor)}
      </Panel>
      <Panel title={choose(locale, 'أجور التوصيل', 'Delivery rates')}>
        <LocationFilter locale={locale} choices={locations} query={query} />
        <CommandForm locale={locale} name="configureDeliveryRate" choices={locations} />
        {deliveries.items.length ? (
          <Data locale={locale} value={deliveries.items} />
        ) : (
          <Empty locale={locale} />
        )}
        {more('rateCursor', deliveries.nextCursor)}
      </Panel>
      <Panel title={choose(locale, 'نطاقات عمل السائقين', 'Driver zones')}>
        <CommandForm locale={locale} name="assignDriverZone" choices={locations} />
        {zones.items.length ? (
          zones.items.map((zone) => (
            <div className="card-block" key={zone.id}>
              <Data locale={locale} value={zone} />
              <CommandForm locale={locale} name="removeDriverZone" params={{ zoneId: zone.id }} />
            </div>
          ))
        ) : (
          <Empty locale={locale} />
        )}
        {more('zoneCursor', zones.nextCursor)}
      </Panel>
    </div>
  );
}

async function Accounts({ locale, token, query }: Props) {
  const id = /^[0-9a-f-]{36}$/i.test(query.deliveryId ?? '') ? query.deliveryId : undefined;
  const delivery = id
    ? await optional(api('getDelivery', { token, params: { deliveryId: id } }))
    : null;
  return (
    <div className="stack">
      <Panel title={choose(locale, 'تقييد الحسابات', 'Account restrictions')}>
        <CommandForm locale={locale} name="restrictAccount" />
        <CommandForm locale={locale} name="revokeRestriction" />
      </Panel>
      <Panel title={choose(locale, 'محافظ المحاكي', 'Simulated wallets')}>
        <CommandForm locale={locale} name="simulateWalletTopUp" />
      </Panel>
      <Panel title={choose(locale, 'إعادة تعيين التوصيل', 'Delivery reassignment')}>
        <form method="get" className="filters">
          <input type="hidden" name="tab" value="accounts" />
          <label>
            {choose(locale, 'معرّف التوصيل', 'Delivery ID')}
            <input name="deliveryId" defaultValue={id} required />
          </label>
          <button className="button soft">{choose(locale, 'عرض', 'Look up')}</button>
        </form>
        {id &&
          (delivery ? (
            <>
              <Data
                locale={locale}
                value={{ id: delivery.id, orderId: delivery.orderId, status: delivery.status }}
              />
              <CommandForm
                locale={locale}
                name="reassignDelivery"
                params={{ deliveryId: delivery.id }}
                version={delivery.orderVersion}
                hidden={['custodyEvidenceFileIds']}
              />
            </>
          ) : (
            <p className="notice">
              {choose(
                locale,
                'لا يمكن عرض هذا التوصيل بالحساب الحالي.',
                'This delivery is unavailable to the current account.',
              )}
            </p>
          ))}
      </Panel>
    </div>
  );
}

async function Audit({ locale, token, query }: Props) {
  const page = await api('listAuditHistory', { token, query: { cursor: query.cursor } });
  return (
    <Panel title={choose(locale, 'سجل التدقيق', 'Audit history')}>
      {page.items.length ? (
        page.items.map((item: ApiSchemas['AuditRecord']) => (
          <div className="card-block" key={item.id}>
            <h3>{item.action}</h3>
            <Data locale={locale} value={item} />
          </div>
        ))
      ) : (
        <Empty locale={locale} />
      )}
      <NextPage locale={locale} cursor={page.nextCursor} query={query} />
    </Panel>
  );
}
