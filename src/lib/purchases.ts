// Compras: recebe o aviso do checkout, gera o código e controla estornos.
// Funciona com Hotmart, Kiwify e um formato genérico (qualquer outra plataforma ou Zapier/Make).
import { query, queryOne, transaction } from '@/lib/db';
import { decryptText, encryptText, generateCode, hashCode } from '@/lib/security/core.mjs';
import { env } from '@/lib/env';

export type PurchaseStatus = 'approved' | 'pending' | 'refused' | 'refunded' | 'canceled' | 'chargeback';

export type NormalizedEvent = {
  provider: string;
  eventId: string;
  eventType: string;
  orderId: string;
  status: PurchaseStatus | 'ignored';
  email: string;
  name: string | null;
  amountCents: number | null;
};

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim();
const cents = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

function mapStatus(raw: string): PurchaseStatus | 'ignored' {
  const s = raw.toLowerCase();
  if (/(approved|complete|paid|aprovad|pago|confirmed)/.test(s)) return 'approved';
  if (/(refund|reembols|devolv)/.test(s)) return 'refunded';
  if (/(chargeback|charged_?back|protest|contestad|dispute)/.test(s)) return 'chargeback';
  if (/(cancel|expired|expirad)/.test(s)) return 'canceled';
  if (/(refused|recusad|declined|negad)/.test(s)) return 'refused';
  if (/(waiting|pending|aguardando|billet_printed|pix_created|em_analise|delayed)/.test(s)) return 'pending';
  return 'ignored';
}

/** Converte o aviso de cada plataforma para um formato único. */
export function normalizeEvent(payload: any, hint?: string | null): NormalizedEvent | null {
  if (!payload || typeof payload !== 'object') return null;

  // Hotmart (webhook versão 2.0)
  if (hint === 'hotmart' || (payload.event && payload.data?.purchase)) {
    const d = payload.data ?? {};
    const orderId = str(d.purchase?.transaction);
    const email = str(d.buyer?.email).toLowerCase();
    if (!orderId || !email) return null;
    const eventType = str(payload.event);
    return {
      provider: 'hotmart',
      eventId: str(payload.id) || `${orderId}:${eventType}`,
      eventType,
      orderId,
      status: mapStatus(eventType.replace(/^PURCHASE_/, '') || str(d.purchase?.status)),
      email,
      name: str(d.buyer?.name) || null,
      amountCents: cents(d.purchase?.price?.value),
    };
  }

  // Kiwify
  if (hint === 'kiwify' || (payload.order_id && (payload.Customer || payload.order_status))) {
    const orderId = str(payload.order_id);
    const email = str(payload.Customer?.email).toLowerCase();
    if (!orderId || !email) return null;
    const statusRaw = str(payload.order_status) || str(payload.webhook_event_type);
    return {
      provider: 'kiwify',
      eventId: `${orderId}:${statusRaw}`,
      eventType: str(payload.webhook_event_type) || statusRaw,
      orderId,
      status: mapStatus(statusRaw),
      email,
      name: str(payload.Customer?.full_name) || null,
      amountCents: null,
    };
  }

  // Formato genérico: { pedido, email, nome, status, valor }
  const orderId = str(payload.pedido ?? payload.order_id ?? payload.transaction ?? payload.id);
  const email = str(payload.email ?? payload.buyer_email ?? payload.customer?.email).toLowerCase();
  if (!orderId || !email) return null;
  const statusRaw = str(payload.status ?? 'approved');
  return {
    provider: str(hint) || 'generico',
    eventId: str(payload.evento_id ?? payload.event_id) || `${orderId}:${statusRaw}`,
    eventType: statusRaw,
    orderId,
    status: mapStatus(statusRaw),
    email,
    name: str(payload.nome ?? payload.name ?? payload.customer?.name) || null,
    amountCents: cents(payload.valor ?? payload.amount),
  };
}

export type ProcessResult =
  | { result: 'duplicado' }
  | { result: 'ignorado'; motivo: string }
  | { result: 'codigo_criado'; purchaseId: string; deliveryId: string; code: string; email: string; name: string | null }
  | { result: 'ja_entregue'; purchaseId: string }
  | { result: 'revogado'; purchaseId: string; codigos: number }
  | { result: 'atualizado'; purchaseId: string; status: string };

/**
 * Processa um aviso de compra em UMA transação.
 * - Aviso repetido (mesmo provedor + id do evento) não faz nada.
 * - Aprovado: cria a compra, gera UM código por pedido e guarda a cópia criptografada.
 * - Estorno, chargeback ou cancelamento: revoga o código e a licença do professor.
 */
export async function processPurchaseEvent(ev: NormalizedEvent, raw: unknown): Promise<ProcessResult> {
  const pepper = env.codePepper;
  const secret = env.sessionSecret;

  return transaction(async (t) => {
    const inserted = await t.query<{ id: string }>(
      `insert into webhook_events (provider, event_id, event_type, payload) values ($1, $2, $3, $4)
       on conflict (provider, event_id) do nothing returning id`,
      [ev.provider, ev.eventId, ev.eventType, JSON.stringify(raw ?? {})],
    );
    if (!inserted.rows[0]) return { result: 'duplicado' } as const;
    const eventRowId = inserted.rows[0].id;
    const done = (status: 'processed' | 'ignored', error?: string) =>
      t.query(`update webhook_events set status = $2, processed_at = now(), error = $3 where id = $1`, [eventRowId, status, error ?? null]);

    if (ev.status === 'ignored') {
      await done('ignored', `status desconhecido: ${ev.eventType}`);
      return { result: 'ignorado', motivo: ev.eventType } as const;
    }

    const plan = (await t.query<{ id: string; max_profiles: number }>(`select id, max_profiles from plans where slug = 'vitalicio'`)).rows[0];
    const purchase = (
      await t.query<{ id: string; status: string }>(
        `insert into purchases (provider, provider_order_id, buyer_email, buyer_name, plan_id, amount_cents, status, raw)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (provider, provider_order_id) do update set
           buyer_email = excluded.buyer_email,
           buyer_name = coalesce(excluded.buyer_name, purchases.buyer_name),
           amount_cents = coalesce(excluded.amount_cents, purchases.amount_cents),
           -- um pedido estornado não volta a ser aprovado por um aviso atrasado
           status = case when purchases.status in ('refunded','chargeback') then purchases.status else excluded.status end,
           raw = excluded.raw
         returning id, status`,
        [ev.provider, ev.orderId, ev.email, ev.name, plan?.id ?? null, ev.amountCents, ev.status, JSON.stringify(raw ?? {})],
      )
    ).rows[0];

    if (purchase.status === 'approved') {
      const existing = (await t.query(`select id from code_deliveries where purchase_id = $1`, [purchase.id])).rows[0];
      if (existing) {
        await done('processed');
        return { result: 'ja_entregue', purchaseId: purchase.id } as const;
      }
      const code = generateCode();
      const codeRow = (
        await t.query<{ id: string }>(
          `insert into activation_codes (code_hash, code_hint, plan_id, purchase_id, buyer_email, max_profiles, notes)
           values ($1, $2, $3, $4, $5, $6, $7) returning id`,
          [hashCode(code, pepper), code.slice(-4), plan?.id ?? null, purchase.id, ev.email, plan?.max_profiles ?? 3, `Compra ${ev.provider} ${ev.orderId}`],
        )
      ).rows[0];
      await t.query(`insert into code_events (code_id, event, details) values ($1, 'created', $2)`, [codeRow.id, JSON.stringify({ via: 'webhook', provider: ev.provider })]);
      const delivery = (
        await t.query<{ id: string }>(
          `insert into code_deliveries (purchase_id, code_id, code_ciphertext) values ($1, $2, $3) returning id`,
          [purchase.id, codeRow.id, encryptText(code, secret)],
        )
      ).rows[0];
      await done('processed');
      return { result: 'codigo_criado', purchaseId: purchase.id, deliveryId: delivery.id, code, email: ev.email, name: ev.name } as const;
    }

    if (['refunded', 'chargeback', 'canceled'].includes(purchase.status)) {
      const revoked = await t.query<{ id: string }>(
        `update activation_codes set status = 'revoked', revoked_at = now()
         where purchase_id = $1 and status <> 'revoked' returning id`,
        [purchase.id],
      );
      for (const c of revoked.rows) {
        await t.query(`update licenses set status = 'revoked', revoked_at = now() where code_id = $1 and status <> 'revoked'`, [c.id]);
        await t.query(`insert into code_events (code_id, event, details) values ($1, 'revoked', $2)`, [c.id, JSON.stringify({ via: 'webhook', motivo: purchase.status })]);
      }
      await done('processed');
      return { result: 'revogado', purchaseId: purchase.id, codigos: revoked.rows.length } as const;
    }

    await done('processed');
    return { result: 'atualizado', purchaseId: purchase.id, status: purchase.status } as const;
  });
}

export async function markEmail(deliveryId: string, error: string | null) {
  await query(
    `update code_deliveries set email_attempts = email_attempts + 1,
       email_sent_at = case when $2::text is null then now() else email_sent_at end,
       email_error = $2::text
     where id = $1`,
    [deliveryId, error],
  );
}

export type DeliveryLookup =
  | { estado: 'nao_encontrado' }
  | { estado: 'aguardando'; status: string }
  | { estado: 'cancelado'; status: string }
  | { estado: 'pronto'; codigo: string; ativado: boolean; nome: string | null; email: string };

/**
 * Busca o código de uma compra pelo número do pedido + e-mail do comprador.
 * As duas informações precisam bater; nenhuma sozinha revela o código.
 */
export async function lookupDelivery(orderId: string, email: string): Promise<DeliveryLookup> {
  const row = await queryOne<{
    status: string; buyer_name: string | null; buyer_email: string;
    delivery_id: string | null; code_ciphertext: string | null; code_status: string | null;
  }>(
    `select p.status, p.buyer_name, p.buyer_email, d.id as delivery_id, d.code_ciphertext, c.status as code_status
     from purchases p
     left join code_deliveries d on d.purchase_id = p.id
     left join activation_codes c on c.id = d.code_id
     where p.provider_order_id = $1 and lower(p.buyer_email) = lower($2)
     order by p.created_at desc limit 1`,
    [orderId.trim(), email.trim()],
  );
  if (!row) return { estado: 'nao_encontrado' };
  if (['refunded', 'chargeback', 'canceled', 'refused'].includes(row.status)) return { estado: 'cancelado', status: row.status };
  if (row.status !== 'approved' || !row.code_ciphertext || !row.delivery_id) return { estado: 'aguardando', status: row.status };
  await query(`update code_deliveries set view_count = view_count + 1, viewed_at = coalesce(viewed_at, now()) where id = $1`, [row.delivery_id]);
  return {
    estado: 'pronto',
    codigo: decryptText(row.code_ciphertext, env.sessionSecret),
    ativado: row.code_status === 'activated',
    nome: row.buyer_name,
    email: row.buyer_email,
  };
}
