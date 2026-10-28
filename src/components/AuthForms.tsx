'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { activateAction, loginAction, type FormState } from '@/app/actions/auth';

export function LoginForm({ volta }: { volta?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} noValidate>
      {state?.error && <div className="form-error" role="alert">{state.error}</div>}
      <input type="hidden" name="volta" value={volta ?? '/perfis'} />
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required defaultValue={state?.fields?.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <button className="btn btn--red btn--block btn--lg" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      <Link href="/ajuda#acesso" className="auth-alt" style={{ textAlign: 'center' }}>Esqueceu a senha?</Link>
    </form>
  );
}

export function ActivateForm({ initialCode, loggedIn }: { initialCode?: string; loggedIn: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(activateAction, null);
  return (
    <form action={action} noValidate>
      {state?.error && <div className="form-error" role="alert">{state.error}</div>}
      <div className="field">
        <label htmlFor="code">Código de acesso</label>
        <input
          id="code" name="code" className="input input--code" placeholder="CINE-XXXX-XXXX-XXXX" required
          autoComplete="off" spellCheck={false} maxLength={24} defaultValue={state?.fields?.code ?? initialCode}
        />
      </div>
      {!loggedIn && (
        <>
          <div className="divider">crie sua conta</div>
          <div className="field">
            <label htmlFor="name">Seu nome</label>
            <input id="name" name="name" className="input" autoComplete="name" required maxLength={80} defaultValue={state?.fields?.name} />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" required defaultValue={state?.fields?.email} />
          </div>
          <div className="field">
            <label htmlFor="password">Crie uma senha</label>
            <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="field">
            <label htmlFor="confirm">Repita a senha</label>
            <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" minLength={8} required />
          </div>
          <label className="check">
            <input type="checkbox" name="terms" required />
            <span>Li e aceito os <Link href="/termos" target="_blank">Termos de uso</Link> e a <Link href="/privacidade" target="_blank">Política de privacidade</Link>.</span>
          </label>
        </>
      )}
      <button className="btn btn--red btn--block btn--lg" disabled={pending}>{pending ? 'Validando código…' : 'Ativar meu acesso'}</button>
    </form>
  );
}
