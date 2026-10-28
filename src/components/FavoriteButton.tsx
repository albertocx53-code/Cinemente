'use client';

import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/app/actions/library';
import { IconCheck, IconPlus } from './icons';

type Props = { titleId: string; initial: boolean; variant?: 'icon' | 'icon-sm' | 'button'; title?: string };

export function FavoriteButton({ titleId, initial, variant = 'icon', title }: Props) {
  const [inList, setInList] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  const onClick = () => {
    const previous = inList;
    setInList(!previous); // otimista
    setError(false);
    start(async () => {
      try {
        const r = await toggleFavorite(titleId);
        setInList(r.inList);
      } catch {
        setInList(previous);
        setError(true);
      }
    });
  };

  const label = inList ? `Remover ${title ?? 'título'} da Minha lista` : `Adicionar ${title ?? 'título'} à Minha lista`;

  if (variant === 'button') {
    return (
      <button type="button" className="btn btn--glass" onClick={onClick} disabled={pending} aria-pressed={inList} aria-label={label}>
        {inList ? <IconCheck /> : <IconPlus />}
        {error ? 'Tente de novo' : inList ? 'Na minha lista' : 'Minha lista'}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`icon-btn${variant === 'icon-sm' ? ' icon-btn--sm' : ''}`}
      onClick={onClick}
      disabled={pending}
      aria-pressed={inList}
      aria-label={label}
      title={error ? 'Não foi possível salvar. Tente de novo.' : inList ? 'Na minha lista' : 'Minha lista'}
    >
      {inList ? <IconCheck /> : <IconPlus />}
    </button>
  );
}
