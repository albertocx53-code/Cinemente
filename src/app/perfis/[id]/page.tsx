import Link from 'next/link';
import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { deleteProfileAction, updateProfileAction } from '@/app/actions/profiles';
import { Logo } from '@/components/brand';
import { ProfileForm } from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser();
  const p = await queryOne<{ id: string; name: string; avatar_key: string; preferences: { disciplinas?: string[] } }>(
    `select id, name, avatar_key, preferences from profiles where id = $1 and user_id = $2`,
    [id, user.id],
  );
  if (!p) notFound();
  return (
    <main id="conteudo" className="profiles-page">
      <div style={{ width: 'min(560px, 100%)' }}>
        <Logo />
        <h1 style={{ marginTop: 18 }}>Editar perfil</h1>
        <ProfileForm
          action={updateProfileAction}
          submitLabel="Salvar alterações"
          initial={{ id: p.id, name: p.name, avatarKey: p.avatar_key, disciplinas: p.preferences?.disciplinas ?? [] }}
        />
        <div className="profiles-actions" style={{ marginTop: 24 }}>
          <Link href="/perfis?gerenciar=1" className="btn btn--ghost">Cancelar</Link>
          <form action={deleteProfileAction}>
            <input type="hidden" name="id" value={p.id} />
            <button type="submit" className="btn btn--ghost" style={{ color: '#ff9da2', borderColor: 'rgba(229,9,20,.6)' }}>Excluir perfil</button>
          </form>
        </div>
        <p className="limit-note">Excluir um perfil apaga a lista e o histórico dele. A conta continua ativa.</p>
      </div>
    </main>
  );
}
