'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { activateCode } from '@/lib/auth/activation';
import { createSession, destroySession, getCurrentUser } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/security/core.mjs';
import { isRateLimited, logSecurityEvent, recordAttempt } from '@/lib/security/rate-limit';
import { getRequestInfo } from '@/lib/security/request';

export type FormState = { error?: string; fields?: Record<string, string> } | null;

// Hash fictício para gastar o mesmo tempo quando o e-mail não existe (evita descobrir contas pelo tempo de resposta)
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==';

function safeRedirectPath(v: unknown) {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') ? s : '/perfis';
}

// ---------------------------------------------------------------------
// Entrar
// ---------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(200),
  password: z.string().min(1, 'Informe sua senha.').max(200),
});

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  const fields = { email: String(form.get('email') ?? '') };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };

  const { ip } = await getRequestInfo();
  const { email, password } = parsed.data;
  if ((await isRateLimited('login-ip', ip, 20, 15)) || (await isRateLimited('login-email', email, 8, 15))) {
    await logSecurityEvent('login_rate_limited', { ip, details: { email } });
    return { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.', fields };
  }

  const user = await queryOne<{ id: string; password_hash: string; status: string }>(
    `select id, password_hash, status from users where lower(email) = $1`,
    [email],
  );
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid || user.status !== 'active') {
    await recordAttempt('login-ip', ip, false);
    await recordAttempt('login-email', email, false);
    await logSecurityEvent('login_failed', { userId: user?.id, ip });
    return { error: 'E-mail ou senha incorretos.', fields };
  }

  await recordAttempt('login-email', email, true);
  await createSession(user.id);
  await logSecurityEvent('login_ok', { userId: user.id, ip });
  redirect(safeRedirectPath(form.get('volta')));
}

// ---------------------------------------------------------------------
// Ativar código
// ---------------------------------------------------------------------
const newAccountSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(80),
    email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(200),
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(200),
    confirm: z.string(),
    terms: z.literal('on', { errorMap: () => ({ message: 'Aceite os termos de uso para continuar.' }) }),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem.' });

const REASONS: Record<string, string> = {
  formato: 'Código em formato inválido. Ele tem o formato CINE-XXXX-XXXX-XXXX.',
  invalido: 'Código não encontrado. Confira se digitou corretamente.',
  usado: 'Este código já foi ativado. Entre com o e-mail e a senha cadastrados.',
  bloqueado: 'Este código não está disponível. Fale com o suporte.',
  email_existente: 'Já existe uma conta com este e-mail. Entre primeiro e depois ative o código.',
  ja_licenciado: 'Sua conta já tem um acesso ativo.',
};

export async function activateAction(_: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get('code') ?? '').slice(0, 40);
  const fields = { code, name: String(form.get('name') ?? ''), email: String(form.get('email') ?? '') };
  const { ip } = await getRequestInfo();

  if (await isRateLimited('activation', ip, 10, 15)) {
    await logSecurityEvent('activation_rate_limited', { ip });
    return { error: 'Muitas tentativas de ativação. Aguarde 15 minutos.', fields };
  }

  const current = await getCurrentUser();
  let result;
  if (current) {
    result = await activateCode({ code, ip, existingUserId: current.id });
  } else {
    const parsed = newAccountSchema.safeParse({
      name: form.get('name'), email: form.get('email'), password: form.get('password'),
      confirm: form.get('confirm'), terms: form.get('terms'),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
    result = await activateCode({ code, ip, ...parsed.data });
  }

  if (!result.ok) {
    // e-mail já cadastrado não conta como tentativa de adivinhar código
    if (result.reason !== 'email_existente') await recordAttempt('activation', ip, false);
    await logSecurityEvent('activation_failed', { userId: current?.id, ip, details: { reason: result.reason } });
    return { error: REASONS[result.reason], fields };
  }

  await recordAttempt('activation', ip, true);
  if (!current) await createSession(result.userId);
  redirect('/perfis?bemvindo=1');
}

// ---------------------------------------------------------------------
// Sair de todos os dispositivos
// ---------------------------------------------------------------------
export async function logoutEverywhereAction() {
  const user = await getCurrentUser();
  if (user) {
    await query(`update sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [user.id]);
    await logSecurityEvent('logout_all', { userId: user.id });
  }
  await destroySession();
  redirect('/entrar?saiu=1');
}
