import { access } from '../../../../features/account/access';
import { Workspace } from '../../../../features/workspace';
import { localeOf, queryOf, type RouteProps } from '../../../../lib/locale';

export default async function Page({ params, searchParams }: RouteProps) {
  const locale = localeOf((await params).locale);
  const session = await access(locale, '/' + locale + '/workspace');
  if ('gate' in session) return session.gate;

  return (
    <Workspace
      locale={locale}
      user={session.user}
      token={session.token}
      query={queryOf(await searchParams)}
    />
  );
}
