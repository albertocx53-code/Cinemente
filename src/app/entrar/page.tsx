import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getShowcase } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth/session';
import { Logo } from '@/components/brand';
import { Mosaic } from '@/components/Mosaic';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volta?: string; saiu?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect('/perfis');
  const showcase = await getShowcase(10);
  return (
    <div className="auth-page">
      <Mosaic items={showcase} />
      <div className="auth-top"><Logo href="/" /></div>
      <main id="conteudo" className="auth-card">
        <h1>Entrar</h1>
        {sp.saiu && <div className="form-ok" role="status">Você saiu de todos os dispositivos.</div>}
        <LoginForm volta={sp.volta} />
        <div className="divider">ou</div>
        <p className="auth-alt">Recebeu um código? <Link href="/ativar">Ativar meu acesso</Link></p>
      </main>
    </div>
  );
}
