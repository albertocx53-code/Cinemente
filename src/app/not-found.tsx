import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function NotFound() {
  return (
    <main id="conteudo" className="error-page">
      <div>
        <Logo />
        <div className="code" aria-hidden="true">404</div>
        <h1>Esta cena foi cortada na edição</h1>
        <p>A página que você procura não existe ou mudou de endereço.</p>
        <Link href="/navegar" className="btn btn--white btn--lg">Voltar ao catálogo</Link>
      </div>
    </main>
  );
}
