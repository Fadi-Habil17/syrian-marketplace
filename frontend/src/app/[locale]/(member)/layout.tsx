import Link from 'next/link';
import type { ReactNode } from 'react';
import { currentUser } from '../../../lib/session';
import { choose, localeOf } from '../../../lib/locale';

export default async function MemberLayout({
  children,
  params,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const locale = localeOf((await params).locale);
  const user = await currentUser();
  const root = '/' + locale;
  return (
    <>
      {user && (
        <nav
          className="workspace-nav"
          aria-label={choose(locale, 'الحساب ومساحات العمل', 'Account and workspaces')}
        >
          <Link href={root + '/account'}>{choose(locale, 'حسابي', 'My account')}</Link>
          <Link href={root + '/orders'}>{choose(locale, 'طلباتي', 'My orders')}</Link>
          <Link href={root + '/notifications'}>{choose(locale, 'الإشعارات', 'Notifications')}</Link>
          <Link href={root + '/wallet'}>{choose(locale, 'المحفظة', 'Wallet')}</Link>
          <Link href={root + '/workspace'}>{choose(locale, 'مساحة العمل', 'Workspace')}</Link>
          {user.activeBusinessProfile?.type === 'DELIVERY_DRIVER' && (
            <Link href={root + '/driver'}>{choose(locale, 'التوصيل', 'Delivery')}</Link>
          )}
          {user.roles.includes('ADMIN') && (
            <Link href={root + '/admin'}>{choose(locale, 'الإدارة', 'Administration')}</Link>
          )}
        </nav>
      )}
      {children}
    </>
  );
}
