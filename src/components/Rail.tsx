'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';

/** Fileira horizontal com setas laterais (desktop) e rolagem por toque (celular). */
export function Rail({ title, children, href, id }: { title: string; children: ReactNode; href?: string; id?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setPrev] = useState(false);
  const [canNext, setNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setPrev(el.scrollLeft > 4);
    setNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section className="rail" aria-labelledby={headingId}>
      <div className="rail-head">
        <h2 id={headingId}>{title}</h2>
        {href && <a href={href}>Ver tudo ›</a>}
      </div>
      <button type="button" className="rail-arrow rail-arrow--prev" onClick={() => page(-1)} hidden={!canPrev} aria-label={`Anteriores em ${title}`}>
        <IconChevronLeft />
      </button>
      <div className="rail-track" ref={track}>
        {children}
      </div>
      <button type="button" className="rail-arrow rail-arrow--next" onClick={() => page(1)} hidden={!canNext} aria-label={`Próximos em ${title}`}>
        <IconChevronRight />
      </button>
    </section>
  );
}
