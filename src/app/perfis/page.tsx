import Link from 'next/link';
import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { createProfileAction, selectProfileAction } from '@/app/actions/profiles';
import { Avatar, Logo } from '@/components/brand';
import { ProfileForm } from '@/components/ProfileForm';
import { IconPencil, IconPlus } from '@/components/icons';

export const metadata: Metadata = { title: 'Perfis' };
export const dynamic = 'force-dynamic';

export default async function ProfilesPage({ searchParams }: { searchParams: Promise<{ gerenciar?: string; bemvindo?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const profiles = await query<{ id: string; name: string; avatar_key: string }>(
    `select id, name, avatar_key from profiles where user_id = $1 order by created_at`,
    [user.id],
  );
  const limit = user.license?.maxProfiles ?? 5;
  const manage = sp.gerenciar === '1';

  if (profiles.length === 0) {
    return (
      <main id="conteudo" className="profiles-page">
        <div style={{ width: 'min(560px, 100%)' }}>
          <Logo size="xl" />
          <h1 style={{ marginTop: 18 }}>{sp.bemvindo ? 'Acesso ativado! Crie seu perfil' : 'Crie seu primeiro perfil'}</h1>
          <ProfileForm action={createProfileAction} submitLabel="Criar perfil e entrar" />
        </div>
      </main>
    );
  }

  return (
    <main id="conteudo" className="profiles-page">
      <div>
        <div style={{ position: 'absolute', top: 22, left: 'var(--gutter)' }}><Logo /></div>
        <h1>{manage ? 'Gerenciar perfis' : 'Quem vai preparar a aula hoje?'}</h1>
        <div className="profiles">
          {profiles.map((p) =>
            manage ? (
              <Link key={p.id} href={`/perfis/${p.id}`} className="profile-tile" aria-label={`Editar perfil ${p.name}`}>
                <span style={{ position: 'relative', display: 'block', width: '100%', borderRadius: 8, overflow: 'hidden' }}>
                  <Avatar avatarKey={p.avatar_key} />
                  <span className="avatar-edit"><IconPencil /></span>
                </span>
                <span>{p.name}</span>
              </Link>
            ) : (
              <form key={p.id} action={selectProfileAction}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="profile-tile">
                  <Avatar avatarKey={p.avatar_key} />
                  <span>{p.name}</span>
                </button>
              </form>
            ),
          )}
          {profiles.length < limit && (
            <Link href="/perfis/novo" className="profile-tile add-tile">
              <span className="avatar"><IconPlus /></span>
              <span>Adicionar perfil</span>
            </Link>
          )}
        </div>
        <div className="profiles-actions">
          {manage ? (
            <Link href="/perfis" className="btn btn--white">Concluído</Link>
          ) : (
            <Link href="/perfis?gerenciar=1" className="btn btn--ghost">Gerenciar perfis</Link>
          )}
        </div>
        <p className="limit-note">Sua licença permite até {limit} perfis. Cada perfil tem sua própria lista e histórico.</p>
      </div>
    </main>
  );
}
