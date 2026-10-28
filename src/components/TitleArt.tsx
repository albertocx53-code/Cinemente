// Arte editorial própria do CineMente.
// Usada quando o título não tem pôster autorizado (nunca inventamos pôsteres de filmes reais).
// Se poster_url / backdrop_url existir (imagem com direito de uso), ela é exibida no lugar.
import type { CSSProperties, ReactNode } from 'react';
import type { TitleArt as Art } from '@/lib/format';

type Props = {
  title: string;
  art: Art;
  imageUrl?: string | null;
  variant?: 'poster' | 'wide' | 'fill';
  showText?: boolean;
  className?: string;
  seed?: string;
};

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

function Motif({ kind, seed }: { kind?: string; seed: string }) {
  const r = rng(seed);
  let body: ReactNode;
  switch (kind) {
    case 'dome':
      body = (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={i} cx="100" cy="170" rx={20 + i * 14} ry="110" opacity={0.5 - i * 0.05} />
          ))}
          {[40, 75, 110, 145].map((y) => <path key={y} d={`M15 ${y + 20} Q100 ${y - 20} 185 ${y + 20}`} opacity=".35" />)}
          <circle cx="150" cy="60" r="9" fill="currentColor" stroke="none" opacity=".95" />
          <path d="M0 200 H200" strokeWidth="1.5" opacity=".7" />
          <path d="M100 200 v-22 M94 186 l6 -8 6 8" strokeWidth="2.5" />
        </>
      );
      break;
    case 'gears':
      body = (
        <>
          <circle cx="78" cy="105" r="46" strokeWidth="14" strokeDasharray="11 9" />
          <circle cx="78" cy="105" r="22" strokeWidth="3" />
          <circle cx="140" cy="160" r="32" strokeWidth="11" strokeDasharray="8 7" opacity=".85" />
          <circle cx="140" cy="160" r="12" strokeWidth="3" opacity=".85" />
          <circle cx="62" cy="190" r="20" strokeWidth="8" strokeDasharray="6 6" opacity=".6" />
        </>
      );
      break;
    case 'candle':
      body = (
        <>
          <defs>
            <radialGradient id={`g-${seed}`}><stop offset="0" stopColor="currentColor" stopOpacity=".7" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>
          </defs>
          <circle cx="100" cy="110" r="90" fill={`url(#g-${seed})`} stroke="none" />
          <path d="M100 60 C118 88 120 108 100 128 C80 108 82 88 100 60Z" fill="currentColor" stroke="none" />
          <path d="M100 128 V138" strokeWidth="2" opacity=".8" />
          <rect x="88" y="138" width="24" height="70" rx="2" fill="currentColor" stroke="none" opacity=".35" />
        </>
      );
      break;
    case 'wave':
      body = (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M-10 ${70 + i * 20} C 40 ${40 + i * 20}, 70 ${110 + i * 20}, 110 ${70 + i * 20} S 180 ${40 + i * 20}, 215 ${70 + i * 20}`} strokeWidth={6 - i * 0.6} opacity={1 - i * 0.12} />
          ))}
        </>
      );
      break;
    case 'code':
      body = (
        <>
          {Array.from({ length: 14 }, (_, c) => (
            <g key={c} opacity={0.3 + r() * 0.7}>
              {Array.from({ length: 12 }, (_, k) => (r() > 0.35 ? <path key={k} d={`M${8 + c * 14} ${10 + k * 17} v${6 + r() * 8}`} strokeWidth="3" /> : null))}
            </g>
          ))}
        </>
      );
      break;
    case 'nodes': {
      const pts = Array.from({ length: 16 }, () => [20 + r() * 160, 30 + r() * 170]);
      body = (
        <>
          {pts.map(([x, y], i) => pts.slice(i + 1).map(([x2, y2], j) => (Math.hypot(x - x2, y - y2) < 62 ? <path key={`${i}-${j}`} d={`M${x} ${y} L${x2} ${y2}`} strokeWidth="1" opacity=".55" /> : null)))}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 7 : 3.5} fill="currentColor" stroke="none" />)}
        </>
      );
      break;
    }
    case 'table':
      body = (
        <>
          <ellipse cx="100" cy="120" rx="62" ry="26" strokeWidth="3" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={100 + Math.cos(a) * 82} cy={120 + Math.sin(a) * 42} r="8" fill="currentColor" stroke="none" opacity={i === 0 ? 1 : 0.45} />;
          })}
          <path d="M100 30 V70" strokeWidth="2" opacity=".6" />
          <path d="M70 40 L100 30 L130 40" strokeWidth="2" opacity=".6" />
        </>
      );
      break;
    case 'sun':
      body = (
        <>
          <circle cx="100" cy="140" r="34" fill="currentColor" stroke="none" opacity=".9" />
          {Array.from({ length: 18 }, (_, i) => {
            const a = Math.PI + (i / 17) * Math.PI;
            return <path key={i} d={`M${100 + Math.cos(a) * 46} ${140 + Math.sin(a) * 46} L${100 + Math.cos(a) * 92} ${140 + Math.sin(a) * 92}`} strokeWidth="3" opacity=".75" />;
          })}
          <path d="M0 140 H200" strokeWidth="2" opacity=".5" />
          <path d="M20 170 H180 M40 190 H160" strokeWidth="1.5" opacity=".3" />
        </>
      );
      break;
    default:
      body = <circle cx="100" cy="110" r="60" strokeWidth="3" />;
  }
  return (
    <svg className="art-motif" viewBox="0 0 200 300" preserveAspectRatio="xMidYMin slice" fill="none" stroke="currentColor" aria-hidden="true">
      {body}
    </svg>
  );
}

export function TitleArt({ title, art, imageUrl, variant = 'poster', showText = true, className = '', seed }: Props) {
  const style = { '--c1': art.c1, '--c2': art.c2, '--accent': art.accent } as CSSProperties;
  const cls = ['art', variant === 'wide' && 'art--wide', variant === 'fill' && 'art--fill', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style} role="img" aria-label={title}>
      {imageUrl ? (
        // Imagem autorizada cadastrada pelo admin
        // eslint-disable-next-line @next/next/no-img-element
        <img className="art-photo" src={imageUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <Motif kind={art.motif} seed={seed || title} />
      )}
      {showText && !imageUrl && (
        <>
          <span className="art-brand" aria-hidden="true">C</span>
          <div className="art-text" aria-hidden="true">
            {art.kicker && <span className="art-kicker">{art.kicker}</span>}
            <span className="art-title">{title}</span>
          </div>
        </>
      )}
    </div>
  );
}
