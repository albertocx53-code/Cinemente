// Recebe o aviso de compra do checkout (Hotmart, Kiwify ou qualquer outro).
//
// URL para cadastrar na plataforma de vendas:
//   https://SEU-SITE/api/webhooks/compra?token=SEU_WEBHOOK_SECRET
//   (opcional: &provedor=hotmart | kiwify | generico)
//
// Também aceita, sem token na URL:
//   - Hotmart: cabeçalho X-HOTMART-HOTTOK igual ao WEBHOOK_SECRET
//   - Kiwify: ?signature= (HMAC-SHA1 do corpo usando o WEBHOOK_SECRET)
//
// O acesso NUNCA é liberado pela página de obrigado: só por este aviso validado.
import { NextResponse, type NextRequest } from 'next/server';
import { hmacHex, safeEqual } from '@/lib/security/core.mjs';
import { env } from '@/lib/env';
import { markEmail, normalizeEvent, processPurchaseEvent } from '@/lib/purchases';
import { sendAccessCodeEmail } from '@/lib/email';
import { logSecurityEvent } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest, rawBody: string) {
  const secret = env.webhookSecret;
  const p = req.nextUrl.searchParams;
  if (safeEqual(p.get('token'), secret)) return true;
  if (safeEqual(req.headers.get('x-hotmart-hottok'), secret)) return true;
  const sig = p.get('signature');
  if (sig && safeEqual(sig.toLowerCase(), hmacHex('sha1', secret, rawBody))) return true;
  return false;
}

function parseBody(raw: string, contentType: string): unknown {
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return JSON.parse(raw);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 256_000) return NextResponse.json({ ok: false, erro: 'corpo grande demais' }, { status: 413 });

  if (!authorized(req, raw)) {
    await logSecurityEvent('webhook_unauthorized', { ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null });
    return NextResponse.json({ ok: false, erro: 'não autorizado' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = parseBody(raw, req.headers.get('content-type') ?? '');
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 });
  }

  const event = normalizeEvent(payload, req.nextUrl.searchParams.get('provedor'));
  if (!event) {
    // Respondemos 200 para a plataforma não ficar reenviando um aviso que não usamos
    return NextResponse.json({ ok: true, resultado: 'ignorado', motivo: 'sem número do pedido ou e-mail' });
  }

  try {
    const result = await processPurchaseEvent(event, payload);
    if (result.result === 'codigo_criado') {
      const sent = await sendAccessCodeEmail({ to: result.email, name: result.name, code: result.code });
      await markEmail(result.deliveryId, sent.ok ? null : sent.error);
    }
    return NextResponse.json({ ok: true, resultado: result.result });
  } catch (e) {
    console.error('Falha ao processar compra', event.provider, event.orderId, e);
    // 500 faz a plataforma tentar de novo mais tarde
    return NextResponse.json({ ok: false, erro: 'falha ao processar' }, { status: 500 });
  }
}
