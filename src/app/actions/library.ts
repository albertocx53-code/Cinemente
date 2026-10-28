'use server';

import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser, requireProfile } from '@/lib/auth/session';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adiciona ou remove um título da "Minha lista" do perfil atual. */
export async function toggleFavorite(titleId: string): Promise<{ inList: boolean }> {
  if (!UUID.test(titleId)) throw new Error('Título inválido');
  const { profile } = await requireProfile();
  const removed = await query(`delete from favorites where profile_id = $1 and title_id = $2 returning id`, [profile.id, titleId]);
  let inList = false;
  if (removed.length === 0) {
    const exists = await queryOne(`select 1 as ok from titles where id = $1`, [titleId]);
    if (!exists) throw new Error('Título não encontrado');
    await query(
      `insert into favorites (profile_id, title_id) values ($1, $2) on conflict (profile_id, title_id) where title_id is not null do nothing`,
      [profile.id, titleId],
    );
    inList = true;
  }
  revalidatePath('/navegar', 'layout');
  return { inList };
}

/** Marca todas as notificações visíveis como lidas. */
export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await query(
    `insert into notification_reads (notification_id, user_id)
     select n.id, $1 from notifications n where n.user_id is null or n.user_id = $1
     on conflict do nothing`,
    [user.id],
  );
}
