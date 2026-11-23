import { access } from '../../../../features/account/access';
import { Wallet } from '../../../../features/wallet';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/wallet');
  if ('gate' in session) return session.gate;

  return <Wallet locale={locale} token={session.token} query={queryOf(await searchParams)} />;
}
