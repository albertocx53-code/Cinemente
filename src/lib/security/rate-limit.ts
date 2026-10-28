import { query, queryOne } from '@/lib/db';

/**
 * Limite de tentativas com janela deslizante, guardado no banco
 * (funciona mesmo com vários servidores).
 */
export async function isRateLimited(bucket: string, key: string, max: number, windowMinutes: number): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `select count(*)::int as n from rate_limit_hits
     where bucket = $1 and key = $2 and success = false
       and created_at > now() - make_interval(mins => $3)`,
    [bucket, key, windowMinutes],
  );
  return (row?.n ?? 0) >= max;
}

export async function recordAttempt(bucket: string, key: string, success: boolean) {
  await query(`insert into rate_limit_hits (bucket, key, success) values ($1, $2, $3)`, [bucket, key, success]);
  // limpeza oportunista de registros antigos
  if (Math.random() < 0.02) await query(`delete from rate_limit_hits where created_at < now() - interval '2 days'`);
}

export async function logSecurityEvent(type: string, opts: { userId?: string | null; ip?: string | null; details?: unknown } = {}) {
  await query(`insert into security_events (user_id, type, ip, details) values ($1, $2, $3, $4)`, [
    opts.userId ?? null,
    type,
    opts.ip ?? null,
    opts.details ? JSON.stringify(opts.details) : null,
  ]);
}
