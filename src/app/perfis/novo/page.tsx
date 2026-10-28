import Link from 'next/link';
import { redirect } from 'next/navigation';
import { queryOne } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { createProfileAction } from '@/app/actions/profiles';
import { Logo } from '@/components/brand';
import { ProfileForm } from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function NewProfilePage() {
  const user = await requireUser();
  const count = (await queryOne<{ n: number }>(`select count(*)::int as n from profiles where user_id = $1`, [user.id]))?.n ?? 0;
  if (count >= (user.license?.maxProfiles ?? 5)) redirect('/perfis');
  return (
    <main id="conteudo" className="profiles-page">
      <div style={{ width: 'min(560px, 100%)' }}>
        <Logo />
        <h1 style={{ marginTop: 18 }}>Adicionar perfil</h1>
        <ProfileForm action={createProfileAction} submitLabel="Criar perfil" />
        <p style={{ marginTop: 20 }}><Link href="/perfis" className="btn btn--ghost">Cancelar</Link></p>
      </div>
    </main>
  );
}
