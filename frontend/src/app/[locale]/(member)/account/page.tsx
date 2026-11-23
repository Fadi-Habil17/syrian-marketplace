import { access } from '../../../../features/account/access';
import { Account } from '../../../../features/account/dashboard';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/account');
  if ('gate' in session) return session.gate;

  return (
    <Account
      locale={locale}
      user={session.user}
      token={session.token}
      query={queryOf(await searchParams)}
    />
  );
}
