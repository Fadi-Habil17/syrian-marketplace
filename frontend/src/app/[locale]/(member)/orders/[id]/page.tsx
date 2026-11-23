import { access } from '../../../../../features/account/access';
import { OrderDetail } from '../../../../../features/orders';
import { localeOf, queryOf, type RouteProps } from '../../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const { locale: language, id } = await params;
  const locale = localeOf(language);
  const session = await access(locale, '/' + locale + '/orders/' + id);
  if ('gate' in session) return session.gate;
  return (
    <OrderDetail
      locale={locale}
      id={id}
      user={session.user}
      token={session.token}
      search={queryOf(await searchParams)}
    />
  );
}
