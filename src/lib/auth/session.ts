import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/security/core.mjs';
import { getRequestInfo } from '@/lib/security/request';
import { env } from '@/lib/env';

export const SESSION_COOKIE = 'cm_session';
export const PROFILE_COOKIE = 'cm_profile';
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  license: { id: string; maxProfiles: number } | null;
};

export type CurrentProfile = {
  id: string;
  name: string;
  avatarKey: string;
  preferences: { disciplinas?: string[] };
};

function cookieOptions(maxAgeSeconds: number) {
  return { httpOnly: true, secure: env.isProd, sameSite: 'lax' as const, path: '/', maxAge: maxAgeSeconds };
}

/** Cria a sessão no banco e grava o cookie. Use apenas em Server Actions / Route Handlers. */
export async function createSession(userId: string) {
  const token = randomToken();
  const { ip, userAgent } = await getRequestInfo();
  await query(
    `insert into sessions (user_id, token_hash, ip, user_agent, expires_at)
     values ($1, $2, $3, $4, now() + make_interval(days => $5))`,
    [userId, sha256(token), ip, userAgent, SESSION_DAYS],
  );
  await query(`update users set last_login_at = now() where id = $1`, [userId]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 24 * 3600));
  jar.delete(PROFILE_COOKIE);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`update sessions set revoked_at = now() where token_hash = $1`, [sha256(token)]);
  jar.delete(SESSION_COOKIE);
  jar.delete(PROFILE_COOKIE);
}

/** Usuário da sessão atual (validado no banco a cada requisição). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = await queryOne<{
    id: string; email: string; name: string; role: 'teacher' | 'admin';
    license_id: string | null; max_profiles: number | null;
  }>(
    `select u.id, u.email, u.name, u.role, l.id as license_id, l.max_profiles
     from sessions s
     join users u on u.id = s.user_id and u.status = 'active'
     left join lateral (
       select id, max_profiles from licenses
       where user_id = u.id and status = 'active'
       order by max_profiles desc limit 1
     ) l on true
     where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    license: row.license_id ? { id: row.license_id, maxProfiles: row.max_profiles ?? 1 } : null,
  };
});

/** Exige conta logada com licença ativa (administradores passam sempre). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/entrar');
  if (!user.license && user.role !== 'admin') redirect('/ativar');
  return user;
}

/** Exige um perfil escolhido que pertença à conta logada. */
export const requireProfile = cache(async (): Promise<{ user: CurrentUser; profile: CurrentProfile }> => {
  const user = await requireUser();
  const profileId = (await cookies()).get(PROFILE_COOKIE)?.value;
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) redirect('/perfis');
  const p = await queryOne<{ id: string; name: string; avatar_key: string; preferences: any }>(
    `select id, name, avatar_key, preferences from profiles where id = $1 and user_id = $2`,
    [profileId, user.id],
  );
  if (!p) redirect('/perfis');
  return { user, profile: { id: p.id, name: p.name, avatarKey: p.avatar_key, preferences: p.preferences ?? {} } };
});

export async function setProfileCookie(profileId: string) {
  (await cookies()).set(PROFILE_COOKIE, profileId, cookieOptions(SESSION_DAYS * 24 * 3600));
}
