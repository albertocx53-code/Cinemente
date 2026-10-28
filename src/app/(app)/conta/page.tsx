import Link from 'next/link';
import type { Metadata } from 'next';
import { query, queryOne } from '@/lib/db';
import { requireProfile } from '@/lib/auth/session';
import { logoutEverywhereAction } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Conta' };

export default async function AccountPage() {
  const { user, profile } = await requireProfile();
  const [license, sessions] = await Promise.all([
    queryOne<{ created_at: string; max_profiles: number; plan: string | null; hint: string | null }>(
      `select l.created_at::text, l.max_profiles, p.name as plan, c.code_hint as hint
       from licenses l left join plans p on p.id = l.plan_id left join activation_codes c on c.id = l.code_id
       where l.user_id = $1 and l.status = 'active' order by l.created_at limit 1`,
      [user.id],
    ),
    query<{ n: number }>(`select count(*)::int as n from sessions where user_id = $1 and revoked_at is null and expires_at > now()`, [user.id]),
  ]);

  return (
    <div className="account">
      <h1>Conta</h1>
      <section className="panel">
        <h4>Seus dados</h4>
        <div className="kv"><span>Nome</span><span>{user.name}</span></div>
        <div className="kv"><span>E-mail</span><span>{user.email}</span></div>
        <div className="kv"><span>Perfil em uso</span><span>{profile.name}</span></div>
      </section>
      <section className="panel">
        <h4>Seu acesso</h4>
        {license ? (
          <>
            <div className="kv"><span>Plano</span><span>{license.plan ?? 'CineMente'}</span></div>
            <div className="kv"><span>Tipo</span><span>Pagamento único · acesso vitalício</span></div>
            <div className="kv"><span>Ativado em</span><span>{new Date(license.created_at).toLocaleDateString('pt-BR')}</span></div>
            <div className="kv"><span>Código</span><span>CINE-••••-••••-{license.hint}</span></div>
            <div className="kv"><span>Limite de perfis</span><span>{license.max_profiles}</span></div>
          </>
        ) : (
          <p>Conta administrativa (sem licença de professor).</p>
        )}
      </section>
      <section className="panel">
        <h4>Segurança</h4>
        <div className="kv"><span>Sessões ativas</span><span>{sessions[0]?.n ?? 0}</span></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <Link href="/perfis?gerenciar=1" className="btn btn--ghost">Gerenciar perfis</Link>
          <form action={logoutEverywhereAction}>
            <button className="btn btn--ghost" type="submit">Sair de todos os dispositivos</button>
          </form>
          <form action="/sair" method="post">
            <button className="btn btn--red" type="submit">Sair</button>
          </form>
        </div>
      </section>
    </div>
  );
}
