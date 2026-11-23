import Link from 'next/link';
import { api } from '../lib/api/client';
import { choose, timestamp, type Locale } from '../lib/locale';
import { enumLabel } from '../lib/labels';
import { CommandForm } from './command-form';
import { InboxRefresh } from './inbox-refresh';
import { Empty, Heading, NextPage, Panel } from './ui';

function noticeHref(locale: Locale, category: string, resourceId: string) {
  const base = '/' + locale;
  if (category === 'case.updated') return base + '/cases/' + resourceId;
  if (category === 'driver.job.available') return base + '/driver';
  if (
    ['order.updated', 'payment.updated', 'chat.message.created', 'delivery.updated'].includes(
      category,
    )
  )
    return base + '/orders/' + resourceId;
  return base + '/orders';
}

export async function Notifications({
  locale,
  token,
  query,
}: {
  locale: Locale;
  token?: string;
  query: Record<string, string>;
}) {
  const notices = await api('listNotifications', { token, query });
  return (
    <>
      <InboxRefresh />
      <Heading>{choose(locale, 'الإشعارات', 'Notifications')}</Heading>
      <nav className="inline-links">
        <Link className="pill" href={'/' + locale + '/notifications'}>
          {choose(locale, 'الكل', 'All')}
        </Link>
        <Link className="pill" href="?unread=true">
          {choose(locale, 'غير مقروءة', 'Unread')}
        </Link>
      </nav>
      <Panel title={choose(locale, 'صندوق الإشعارات', 'Inbox')}>
        <CommandForm locale={locale} name="readAllNotifications" />
        {notices.items.length ? (
          notices.items.map((item) => (
            <div className="row-card" key={item.id}>
              <div>
                <strong>{enumLabel(locale, item.category)}</strong>
                <p>{timestamp(locale, item.createdAt)}</p>
                <Link href={noticeHref(locale, item.category, item.resourceId)}>
                  {choose(locale, 'عرض التفاصيل', 'View details')}
                </Link>
              </div>
              {!item.readAt && (
                <CommandForm
                  locale={locale}
                  name="readNotification"
                  params={{ notificationId: item.id }}
                />
              )}
            </div>
          ))
        ) : (
          <Empty locale={locale} />
        )}
        <NextPage locale={locale} cursor={notices.nextCursor} query={query} />
      </Panel>
    </>
  );
}
