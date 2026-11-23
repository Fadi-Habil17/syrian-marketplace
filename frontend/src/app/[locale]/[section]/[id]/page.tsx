import { Detail, sectionOf } from '../../../../features/catalog';
import { localeOf, type RouteProps } from '../../../../lib/locale';

export default async function DetailPage({ params }: RouteProps) {
  const { locale, section, id } = await params;
  return <Detail locale={localeOf(locale)} section={sectionOf(section)} id={id} />;
}
