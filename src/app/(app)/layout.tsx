import { query } from '@/lib/db';
import { requireProfile } from '@/lib/auth/session';
import { AppHeader, type HeaderNotification } from '@/components/AppHeader';
import { SiteFooter } from '@/components/brand';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProfile();
  const notifications = await query<HeaderNotification>(
    `select n.id, n.title, n.body, n.link, (r.notification_id is not null) as read
     from notifications n
     left join notification_reads r on r.notification_id = n.id and r.user_id = $1
     where n.user_id is null or n.user_id = $1
     order by n.created_at desc limit 10`,
    [user.id],
  );
  return (
    <div className="app-shell">
      <AppHeader profile={{ name: profile.name, avatarKey: profile.avatarKey }} notifications={notifications} />
      <main id="conteudo">{children}</main>
      <SiteFooter />
    </div>
  );
}
