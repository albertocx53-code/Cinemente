import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getShowcase } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth/session';
import { Logo } from '@/components/brand';
import { Mosaic } from '@/components/Mosaic';
import { ActivateForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Ativar acesso' };
export const dynamic = 'force-dynamic';

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user?.license) redirect('/perfis');
  const showcase = await getShowcase(10);
  return (
    <div className="auth-page">
      <Mosaic items={showcase} />
      <div className="auth-top"><Logo href="/" /></div>
      <main id="conteudo" className="auth-card">
        <h1>Ativar meu acesso</h1>
        <p className="lead">
          {user
            ? `Olá, ${user.name.split(' ')[0]}! Informe o código para liberar o acesso na sua conta.`
            : 'Informe o código individual que você recebeu após a compra e crie sua conta. Você só faz isso uma vez.'}
        </p>
        <ActivateForm initialCode={sp.codigo?.slice(0, 24)} loggedIn={!!user} />
        {!user && <p className="auth-alt">Já ativou antes? <Link href="/entrar">Entrar</Link></p>}
        <p className="auth-alt"><Link href="/ajuda#ativacao">Problemas com o código?</Link></p>
      </main>
    </div>
  );
}
