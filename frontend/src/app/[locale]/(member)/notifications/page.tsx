import { access } from '../../../../features/account/access';
import { Notifications } from '../../../../features/notifications';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/notifications');
  if ('gate' in session) return session.gate;

  return (
    <Notifications locale={locale} token={session.token} query={queryOf(await searchParams)} />
  );
}
