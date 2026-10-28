import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { IconBook, IconChat, IconClapper, IconFilm, IconInfinity, IconLightbulb } from './icons';

export function Logo({ size = 'md', href }: { size?: 'sm' | 'md' | 'xl'; href?: string }) {
  const cls = `logo${size === 'xl' ? ' logo--xl' : size === 'sm' ? ' logo--sm' : ''}`;
  const mark = (
    <span className={cls} aria-label="CineMente">
      <b>CINE</b><i>MENTE</i>
    </span>
  );
  return href ? <Link href={href} aria-label="CineMente — início">{mark}</Link> : mark;
}

export const SLOGAN = 'O cinema transforma. O conhecimento permanece.';

const IconColumn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6.5 12 3l9 3.5H3ZM5 9h14M6.5 9v9M10 9v9M14 9v9M17.5 9v9M4 18h16M3 21h18" />
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3.2" />
  </svg>
);

export const AVATARS: Record<string, { bg: string; Icon: () => ReactNode }> = {
  a1: { bg: 'linear-gradient(135deg,#e50914,#5c0309)', Icon: IconColumn },
  a2: { bg: 'linear-gradient(135deg,#e0a83d,#7a4a06)', Icon: () => <IconLightbulb /> },
  a3: { bg: 'linear-gradient(135deg,#2c5cff,#0b1846)', Icon: () => <IconFilm /> },
  a4: { bg: 'linear-gradient(135deg,#1db97a,#063d28)', Icon: () => <IconBook /> },
  a5: { bg: 'linear-gradient(135deg,#9b4dff,#2c0b5c)', Icon: () => <IconChat /> },
  a6: { bg: 'linear-gradient(135deg,#ff6a3d,#6b1a05)', Icon: IconEye },
  a7: { bg: 'linear-gradient(135deg,#19b6d8,#063a47)', Icon: () => <IconInfinity /> },
  a8: { bg: 'linear-gradient(135deg,#d9d9d9,#4a4a4a)', Icon: () => <IconClapper /> },
};

export function Avatar({ avatarKey, size = 'lg' }: { avatarKey: string; size?: 'sm' | 'lg' }) {
  const a = AVATARS[avatarKey] ?? AVATARS.a1;
  return (
    <span className={`avatar${size === 'sm' ? ' avatar--sm' : ''}`} style={{ background: a.bg } as CSSProperties}>
      <a.Icon />
    </span>
  );
}

export function SiteFooter() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <footer className="site-footer">
      <div className="inner">
        <div className="slogan">{SLOGAN}</div>
        {support && <p>Dúvidas? Escreva para <a href={`mailto:${support}`}>{support}</a></p>}
        <nav aria-label="Rodapé">
          <Link href="/ajuda">Central de ajuda</Link>
          <Link href="/ajuda#ativacao">Como ativar meu código</Link>
          <Link href="/ajuda#acesso">Recuperar acesso</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
        <p>© {new Date().getFullYear()} CineMente. Os filmes citados pertencem aos seus titulares. O CineMente não hospeda obras sem licença.</p>
      </div>
    </footer>
  );
}
