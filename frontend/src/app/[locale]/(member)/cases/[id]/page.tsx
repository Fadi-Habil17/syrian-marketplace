import { access } from '../../../../../features/account/access';
import { CaseDetail } from '../../../../../features/orders';
import { localeOf, type RouteProps } from '../../../../../lib/locale';

export default async function Page({ params }: RouteProps) {
  const { locale: language, id } = await params;
  const locale = localeOf(language);
  const session = await access(locale, '/' + locale + '/cases/' + id);
  if ('gate' in session) return session.gate;
  return <CaseDetail locale={locale} id={id} user={session.user} token={session.token} />;
}
