import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo, SiteFooter } from './brand';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="lp-header" style={{ position: 'absolute' }}>
        <Logo href="/" />
        <nav aria-label="Acesso">
          <Link href="/entrar" className="btn btn--red">Entrar</Link>
        </nav>
      </header>
      <main id="conteudo" className="prose-page">{children}</main>
      <SiteFooter />
    </>
  );
}
