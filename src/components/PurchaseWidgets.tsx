'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconCheck } from './icons';

/** Botão que copia o código de acesso. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const el = document.getElementById('codigo-comprado');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };
  return (
    <button type="button" className="btn btn--ghost" onClick={copy} aria-live="polite">
      {copied ? <><IconCheck /> Código copiado</> : 'Copiar código'}
    </button>
  );
}

/** Recarrega a página a cada poucos segundos enquanto o pagamento é confirmado. */
export function AutoRefresh({ seconds = 5, maxTries = 36 }: { seconds?: number; maxTries?: number }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= maxTries) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      router.refresh();
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [tries, seconds, maxTries, router]);
  if (tries >= maxTries) {
    return <p className="auth-alt">Ainda não recebemos a confirmação. Se pagou por boleto ou Pix, pode levar mais tempo: o código também chega no seu e-mail.</p>;
  }
  return <p className="auth-alt" aria-live="polite">Verificando automaticamente a cada {seconds} segundos…</p>;
}
