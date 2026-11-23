import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '../lib/api/client';
import type { ApiSchemas } from '../lib/api/contracts';
import { amount, choose, localText, type Locale } from '../lib/locale';
import { CommandForm } from './command-form';
import { Chat, DeliveryPanel } from './orders';
import { Back, Empty, Heading, NextPage, Panel, optional } from './ui';
import { Realtime } from './realtime';

export async function Driver({
  locale,
  token,
  query,
}: {
  locale: Locale;
  token?: string;
  query: Record<string, string>;
}) {
  const assigned = query.tab === 'assignments';
  const list = await api(assigned ? 'listDriverAssignments' : 'listDriverJobs', {
    token,
    query: { cursor: query.cursor },
  });
  return (
    <>
      <Heading>{choose(locale, 'مساحة سائق التوصيل', 'Delivery driver workspace')}</Heading>
      <nav className="inline-links">
        <Link className={'pill ' + (!assigned ? 'active' : '')} href="?tab=jobs">
          {choose(locale, 'المهام المتاحة', 'Available jobs')}
        </Link>
        <Link className={'pill ' + (assigned ? 'active' : '')} href="?tab=assignments">
          {choose(locale, 'مهامي', 'My assignments')}
        </Link>
      </nav>
      <Panel
        title={
          assigned
            ? choose(locale, 'مهامي', 'My assignments')
            : choose(locale, 'المهام المتاحة', 'Available jobs')
        }
      >
        {list.items.length ? (
          list.items.map((job) => (
            <div className="row-card" key={job.id}>
              <div>
                <strong>{localText(locale, job.city.nameAr, job.city.nameEn)}</strong>
                {job.area && <p>{localText(locale, job.area.nameAr, job.area.nameEn)}</p>}
                <p>
                  {choose(locale, 'أجرة التوصيل', 'Delivery fee')} ·{' '}
                  <bdi>{amount(locale, job.fee)}</bdi>
                </p>
              </div>
              {assigned ? (
                <Link className="button outline" href={'/' + locale + '/driver/' + job.id}>
                  {choose(locale, 'عرض التوصيل', 'View delivery')}
                </Link>
              ) : (
                <CommandForm
                  locale={locale}
                  name="acceptDeliveryJob"
                  params={{ deliveryId: job.id }}
                  version={job.orderVersion}
                />
              )}
            </div>
          ))
        ) : (
          <Empty locale={locale} />
        )}
        <NextPage locale={locale} cursor={list.nextCursor} query={query} />
      </Panel>
    </>
  );
}

export async function DriverDelivery({
  locale,
  token,
  id,
  user,
  query,
}: {
  locale: Locale;
  token?: string;
  id: string;
  user: ApiSchemas['User'];
  query: Record<string, string>;
}) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const delivery = await optional(api('getDelivery', { token, params: { deliveryId: id } }));
  if (!delivery) notFound();
  return (
    <>
      <Back
        locale={locale}
        path="/driver?tab=assignments"
        title={choose(locale, 'مهامي', 'My assignments')}
      />
      <Heading>{choose(locale, 'تفاصيل التوصيل', 'Delivery details')}</Heading>
      <Realtime locale={locale} orderId={delivery.orderId} version={delivery.orderVersion} />
      <DeliveryPanel locale={locale} token={token} id={id} user={user} />
      <Chat locale={locale} token={token} orderId={delivery.orderId} search={query} />
    </>
  );
}
