import { access } from '../../../../../features/account/access';
import { DriverDelivery } from '../../../../../features/driver';
import { localeOf, queryOf, type RouteProps } from '../../../../../lib/locale';
export default async function Page({ params, searchParams }: RouteProps) {
  const { locale: language, id } = await params;
  const locale = localeOf(language);
  const session = await access(locale, '/' + locale + '/driver/' + id);
  if ('gate' in session) return session.gate;
  return (
    <DriverDelivery
      locale={locale}
      id={id}
      user={session.user}
      token={session.token}
      query={queryOf(await searchParams)}
    />
  );
}
