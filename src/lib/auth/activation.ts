import { transaction } from '@/lib/db';
import { hashCode, hashPassword, normalizeCode } from '@/lib/security/core.mjs';
import { env } from '@/lib/env';

export type ActivationInput = {
  code: string;
  ip: string;
  /** Usuário já logado (ativa o código na conta dele) */
  existingUserId?: string | null;
  /** Dados para criar conta nova */
  name?: string;
  email?: string;
  password?: string;
};

export type ActivationResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'formato' | 'invalido' | 'usado' | 'bloqueado' | 'email_existente' | 'ja_licenciado' };

/**
 * Ativa um código individual. Tudo acontece em UMA transação com bloqueio
 * da linha do código (SELECT ... FOR UPDATE), então duas ativações
 * simultâneas do mesmo código nunca passam ao mesmo tempo.
 */
export async function activateCode(input: ActivationInput): Promise<ActivationResult> {
  const canonical = normalizeCode(input.code);
  if (!canonical) return { ok: false, reason: 'formato' };
  const codeHash = hashCode(canonical, env.codePepper);
  // Hash da senha calculado fora da transação (é propositalmente lento)
  const passwordHash = input.existingUserId ? null : await hashPassword(input.password!);

  return transaction(async (t) => {
    const code = (
      await t.query<{ id: string; status: string; max_activations: number; activations_count: number; max_profiles: number; plan_id: string | null }>(
        `select id, status, max_activations, activations_count, max_profiles, plan_id
         from activation_codes where code_hash = $1 for update`,
        [codeHash],
      )
    ).rows[0];

    if (!code) return { ok: false, reason: 'invalido' } as const;
    if (code.status === 'revoked' || code.status === 'suspended') return { ok: false, reason: 'bloqueado' } as const;
    if (code.status !== 'available' || code.activations_count >= code.max_activations) return { ok: false, reason: 'usado' } as const;

    let userId = input.existingUserId ?? null;
    if (userId) {
      const has = await t.query(`select 1 from licenses where user_id = $1 and status = 'active' limit 1`, [userId]);
      if (has.rows.length) return { ok: false, reason: 'ja_licenciado' } as const;
    } else {
      const email = input.email!.trim().toLowerCase();
      const exists = await t.query(`select 1 from users where lower(email) = $1`, [email]);
      if (exists.rows.length) return { ok: false, reason: 'email_existente' } as const;
      userId = (
        await t.query<{ id: string }>(
          `insert into users (email, name, password_hash) values ($1, $2, $3) returning id`,
          [email, input.name!.trim(), passwordHash],
        )
      ).rows[0].id;
    }

    await t.query(
      `insert into licenses (user_id, code_id, plan_id, max_profiles) values ($1, $2, $3, $4)`,
      [userId, code.id, code.plan_id, code.max_profiles],
    );
    const newCount = code.activations_count + 1;
    await t.query(
      `update activation_codes
         set activations_count = $2,
             status = case when $2 >= max_activations then 'activated' else status end,
             activated_at = coalesce(activated_at, now()),
             activated_by_user_id = coalesce(activated_by_user_id, $3)
       where id = $1`,
      [code.id, newCount, userId],
    );
    await t.query(`insert into code_events (code_id, event, user_id, ip) values ($1, 'activated', $2, $3)`, [code.id, userId, input.ip]);
    await t.query(`insert into security_events (user_id, type, ip) values ($1, 'code_activated', $2)`, [userId, input.ip]);
    return { ok: true, userId: userId! } as const;
  });
}
