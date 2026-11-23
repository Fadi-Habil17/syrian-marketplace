import { access } from '../../../../features/account/access';
import { Driver } from '../../../../features/driver';
import { choose, localeOf, queryOf, type RouteProps } from '../../../../lib/locale';
import { Heading } from '../../../../features/ui';
export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/driver');
  if ('gate' in session) return session.gate;
  if (session.user.activeBusinessProfile?.type !== 'DELIVERY_DRIVER')
    return (
      <Heading>
        {choose(locale, 'هذه الصفحة لسائقي التوصيل', 'Delivery driver access required')}
      </Heading>
    );
  return <Driver locale={locale} token={session.token} query={queryOf(await searchParams)} />;
}
