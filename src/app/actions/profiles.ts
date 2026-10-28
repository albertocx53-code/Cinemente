'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { query, queryOne, transaction } from '@/lib/db';
import { requireUser, setProfileCookie } from '@/lib/auth/session';
import { AVATAR_KEYS } from '@/lib/profiles';
import type { FormState } from './auth';

const schema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao perfil.').max(30, 'Use até 30 caracteres.'),
  avatar: z.enum(AVATAR_KEYS as [string, ...string[]]),
  disciplinas: z.array(z.enum(['filosofia', 'sociologia'])).max(2),
});

function parse(form: FormData) {
  return schema.safeParse({ name: form.get('name'), avatar: form.get('avatar') || 'a1', disciplinas: form.getAll('disciplinas') });
}

export async function selectProfileAction(form: FormData) {
  const user = await requireUser();
  const id = String(form.get('id') ?? '');
  const p = await queryOne(`select id from profiles where id = $1 and user_id = $2`, [id, user.id]).catch(() => null);
  if (!p) redirect('/perfis');
  await setProfileCookie(id);
  redirect('/navegar');
}

export async function createProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: { name: String(form.get('name') ?? '') } };
  const limit = user.license?.maxProfiles ?? 5;

  const created = await transaction(async (t) => {
    // trava a conta para impedir ultrapassar o limite com cliques simultâneos
    await t.query(`select id from users where id = $1 for update`, [user.id]);
    const { rows } = await t.query<{ n: number }>(`select count(*)::int as n from profiles where user_id = $1`, [user.id]);
    if (rows[0].n >= limit) return null;
    const ins = await t.query<{ id: string }>(
      `insert into profiles (user_id, name, avatar_key, preferences) values ($1, $2, $3, $4) returning id`,
      [user.id, parsed.data.name, parsed.data.avatar, JSON.stringify({ disciplinas: parsed.data.disciplinas })],
    );
    return ins.rows[0].id;
  });
  if (!created) return { error: `Sua licença permite até ${limit} perfis.` };
  await setProfileCookie(created);
  redirect('/navegar');
}

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = String(form.get('id') ?? '');
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const rows = await query(
    `update profiles set name = $3, avatar_key = $4, preferences = jsonb_set(preferences, '{disciplinas}', $5::jsonb)
     where id = $1 and user_id = $2 returning id`,
    [id, user.id, parsed.data.name, parsed.data.avatar, JSON.stringify(parsed.data.disciplinas)],
  );
  if (!rows.length) return { error: 'Perfil não encontrado.' };
  redirect('/perfis?gerenciar=1');
}

export async function deleteProfileAction(form: FormData) {
  const user = await requireUser();
  const id = String(form.get('id') ?? '');
  await query(`delete from profiles where id = $1 and user_id = $2`, [id, user.id]);
  redirect('/perfis?gerenciar=1');
}
