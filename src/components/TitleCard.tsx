import Link from 'next/link';
import type { TitleCard as T } from '@/lib/format';
import { formatDuration, TYPE_LABEL } from '@/lib/format';
import { TitleArt } from './TitleArt';
import { FavoriteButton } from './FavoriteButton';
import { IconChevronDown, IconPlay } from './icons';

export function TitleCard({ item, rank, wide }: { item: T; rank?: number; wide?: boolean }) {
  const href = `/titulo/${item.slug}`;
  const art = (
    <TitleArt title={item.title} art={item.art} seed={item.slug} imageUrl={wide ? item.backdrop_url : item.poster_url} variant={wide ? 'wide' : 'poster'} />
  );
  return (
    <article className={`card${wide ? ' card--wide' : ''}${rank ? ' card--ranked' : ''}`}>
      {rank ? <span className="rank" aria-hidden="true">{rank}</span> : null}
      <Link href={href} aria-label={`${item.title}${item.year ? ` (${item.year})` : ''}`}>
        {art}
        {item.has_guide && !rank && <span className="card-flag" aria-hidden="true">Plano<br />de aula</span>}
        {typeof item.progress === 'number' && (
          <span className="card-progress" aria-label={`${item.progress}% assistido`}><span style={{ width: `${item.progress}%` }} /></span>
        )}
      </Link>
      <div className="card-pop">
        <div className="card-pop-actions">
          {item.can_stream ? (
            <Link href={href} className="icon-btn icon-btn--sm icon-btn--on" aria-label={`Assistir ${item.title}`}><IconPlay /></Link>
          ) : null}
          <FavoriteButton titleId={item.id} initial={item.in_list} variant="icon-sm" title={item.title} />
          <Link href={href} className="icon-btn icon-btn--sm push" aria-label={`Detalhes de ${item.title}`}><IconChevronDown /></Link>
        </div>
        <strong>{item.title}</strong>
        <div className="meta">
          {item.year && <span>{item.year}</span>}
          {item.duration_min && <span>{formatDuration(item.duration_min)}</span>}
          <span className="badge">{TYPE_LABEL[item.type]}</span>
          {item.has_guide && <span className="badge badge--gold">Ficha</span>}
        </div>
      </div>
    </article>
  );
}
