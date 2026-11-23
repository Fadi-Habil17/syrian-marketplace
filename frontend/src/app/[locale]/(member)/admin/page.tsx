import { access } from '../../../../features/account/access';
import { Admin } from '../../../../features/admin';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';
export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/admin', true);
  if ('gate' in session) return session.gate;
  return <Admin locale={locale} token={session.token} query={queryOf(await searchParams)} />;
}
