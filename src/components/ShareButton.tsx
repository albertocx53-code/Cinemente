'use client';

import { useState } from 'react';
import { IconCheck, IconShare } from './icons';

/** Compartilha o link da ficha do conteúdo (Web Share API ou copia o link). */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — CineMente`, text: `Ficha pedagógica de ${title} no CineMente`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* usuário cancelou o compartilhamento */
    }
  };

  return (
    <button type="button" className="btn btn--glass" onClick={onClick} aria-live="polite">
      {copied ? <IconCheck /> : <IconShare />}
      {copied ? 'Link copiado' : 'Compartilhar ficha'}
    </button>
  );
}
