import { access } from '../../../../features/account/access';
import { OrderList } from '../../../../features/orders';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/orders');
  if (session.gate) return session.gate;
  return <OrderList locale={locale} token={session.token} query={queryOf(await searchParams)} />;
}
