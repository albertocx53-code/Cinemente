'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { TitleCard } from '@/lib/format';
import { formatDuration, TYPE_LABEL } from '@/lib/format';
import { TitleArt } from './TitleArt';
import { FavoriteButton } from './FavoriteButton';
import { IconBook, IconInfo, IconPlay } from './icons';
import { Logo } from './brand';

const DISCIPLINE = { filosofia: 'Filosofia', sociologia: 'Sociologia' } as Record<string, string>;

export function HeroBanner({ items }: { items: TitleCard[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 9000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  if (!items.length) return null;

  return (
    <section className="hero" aria-roledescription="carrossel" aria-label="Destaques" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      {items.map((item, i) => {
        const active = i === index;
        return (
          <div key={item.id} className={`hero-slide${active ? ' is-active' : ''}`} aria-hidden={!active} inert={!active}>
            <div className="hero-bg">
              {active && <TitleArt title={item.title} art={item.art} seed={item.slug} imageUrl={item.backdrop_url} variant="fill" showText={false} />}
            </div>
            <div className="hero-shade" />
            <div className="hero-content">
              <div className="hero-kicker"><Logo size="sm" /> <span>{TYPE_LABEL[item.type]}</span></div>
              <h1 className="hero-title">{item.title}</h1>
              {item.tagline && <p className="hero-tagline">{item.tagline}</p>}
              <div className="meta">
                {item.year && <span>{item.year}</span>}
                {item.duration_min && <span className="dot-sep">{formatDuration(item.duration_min)}</span>}
                {item.age_rating_verified && item.age_rating ? <span className="badge">{item.age_rating}</span> : null}
                {item.disciplines.map((d) => <span key={d} className="badge badge--red">{DISCIPLINE[d] ?? d}</span>)}
                {item.genres.slice(0, 2).map((g) => <span key={g} className="dot-sep">{g}</span>)}
              </div>
              <p className="hero-synopsis">{item.synopsis}</p>
              <div className="hero-actions">
                {item.can_stream ? (
                  <Link href={`/titulo/${item.slug}`} className="btn btn--white btn--lg"><IconPlay /> Assistir</Link>
                ) : item.has_guide ? (
                  <Link href={`/titulo/${item.slug}#sala-de-aula`} className="btn btn--white btn--lg"><IconBook /> Levar para a aula</Link>
                ) : null}
                <Link href={`/titulo/${item.slug}`} className="btn btn--glass btn--lg"><IconInfo /> Mais informações</Link>
                <FavoriteButton titleId={item.id} initial={item.in_list} title={item.title} />
              </div>
            </div>
          </div>
        );
      })}
      {items.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Escolher destaque">
          {items.map((item, i) => (
            <button key={item.id} type="button" role="tab" aria-selected={i === index} aria-current={i === index} aria-label={item.title} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
