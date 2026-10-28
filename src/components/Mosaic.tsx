import type { TitleCard } from '@/lib/format';
import { TitleArt } from './TitleArt';

/** Parede inclinada de artes ao fundo (assinatura das telas de entrada). */
export function Mosaic({ items, count = 32 }: { items: TitleCard[]; count?: number }) {
  if (!items.length) return <div className="lp-mosaic" aria-hidden="true" />;
  const tiles = Array.from({ length: count }, (_, i) => items[(i * 3 + Math.floor(i / 8)) % items.length]);
  return (
    <div className="lp-mosaic" aria-hidden="true">
      {tiles.map((t, i) => (
        <TitleArt key={i} title={t.title} art={t.art} seed={t.slug} imageUrl={t.poster_url} />
      ))}
    </div>
  );
}
