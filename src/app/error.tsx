'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="conteudo" className="error-page">
      <div>
        <div className="code" aria-hidden="true">Ops</div>
        <h1>A projeção falhou por um instante</h1>
        <p>Algo deu errado ao carregar esta página.{error.digest ? ` Código: ${error.digest}` : ''}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reset} className="btn btn--white btn--lg">Tentar de novo</button>
          <Link href="/" className="btn btn--ghost btn--lg">Ir para o início</Link>
        </div>
      </div>
    </main>
  );
}
