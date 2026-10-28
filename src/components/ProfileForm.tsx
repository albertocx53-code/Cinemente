'use client';

import { useActionState } from 'react';
import type { FormState } from '@/app/actions/auth';
import { Avatar } from './brand';
import { AVATAR_KEYS } from '@/lib/profiles';

type Props = {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  initial?: { id: string; name: string; avatarKey: string; disciplinas: string[] };
  submitLabel: string;
};

export function ProfileForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  return (
    <form action={formAction} style={{ display: 'grid', gap: 22, textAlign: 'left' }}>
      {state?.error && <div className="form-error" role="alert">{state.error}</div>}
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="field">
        <label htmlFor="name">Nome do perfil</label>
        <input id="name" name="name" className="input" maxLength={30} required defaultValue={state?.fields?.name ?? initial?.name} placeholder="Ex.: Prof. Marina" />
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>Escolha um avatar</legend>
        <div className="avatar-picker">
          {AVATAR_KEYS.map((k, i) => (
            <label key={k}>
              <input type="radio" name="avatar" value={k} defaultChecked={(initial?.avatarKey ?? 'a1') === k} aria-label={`Avatar ${i + 1}`} />
              <Avatar avatarKey={k} />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>Disciplinas que você leciona (melhora as recomendações)</legend>
        <div className="pill-group">
          {[['filosofia', 'Filosofia'], ['sociologia', 'Sociologia']].map(([v, l]) => (
            <label key={v}>
              <input type="checkbox" name="disciplinas" value={v} defaultChecked={initial?.disciplinas.includes(v)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="btn btn--red btn--lg" disabled={pending}>{pending ? 'Salvando…' : submitLabel}</button>
    </form>
  );
}
