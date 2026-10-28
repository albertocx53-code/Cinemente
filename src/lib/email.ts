// Envio de e-mail pelo Resend (https://resend.com) usando a API HTTP, sem bibliotecas extras.
// Plano gratuito: 3.000 e-mails/mês e 100/dia. Sem RESEND_API_KEY, o envio é pulado
// e o comprador continua vendo o código na página de compra concluída.
import { env } from '@/lib/env';

export type SendResult = { ok: true } | { ok: false; error: string };

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

async function send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, error: 'RESEND_API_KEY ou EMAIL_FROM não configurados' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text, reply_to: env.supportEmail || undefined }),
    });
    if (!r.ok) return { ok: false, error: `Resend ${r.status}: ${(await r.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendAccessCodeEmail(opts: { to: string; name: string | null; code: string }): Promise<SendResult> {
  const first = opts.name?.split(' ')[0] ?? '';
  const url = `${env.appUrl}/ativar?codigo=${encodeURIComponent(opts.code)}`;
  const support = env.supportEmail;
  const subject = 'Seu código de acesso ao CineMente';
  const text = [
    `Olá${first ? `, ${first}` : ''}!`,
    '',
    'Sua compra do CineMente foi confirmada. Este é o seu código individual de acesso:',
    '',
    `    ${opts.code}`,
    '',
    `Para ativar, acesse: ${url}`,
    'Você cria sua conta uma única vez. Depois, é só entrar com e-mail e senha.',
    '',
    'O código é pessoal e só pode ser ativado uma vez. Não compartilhe.',
    support ? `Dúvidas: ${support}` : '',
    '',
    'CineMente — O cinema transforma. O conhecimento permanece.',
  ].join('\n');

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#f5f5f1">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a">
<tr><td style="padding:28px 32px 8px;font-size:30px;font-weight:bold;letter-spacing:2px;color:#e50914">CINEMENTE</td></tr>
<tr><td style="padding:8px 32px 0;font-size:20px;font-weight:bold;color:#fff">Olá${first ? `, ${esc(first)}` : ''}! Sua compra foi confirmada.</td></tr>
<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#cfcfcf">Este é o seu código individual de acesso:</td></tr>
<tr><td style="padding:16px 32px"><div style="background:#000;border:1px dashed #e50914;border-radius:8px;padding:18px;text-align:center;font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:3px;color:#fff">${esc(opts.code)}</div></td></tr>
<tr><td style="padding:4px 32px 8px" align="center"><a href="${esc(url)}" style="display:inline-block;background:#e50914;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:6px">Ativar meu acesso</a></td></tr>
<tr><td style="padding:16px 32px 0;font-size:14px;line-height:1.6;color:#a8a8a8">Você cria sua conta uma única vez. Depois, é só entrar com e-mail e senha em qualquer dispositivo.<br><br>O código é pessoal e só pode ser ativado uma vez. Não compartilhe.${support ? `<br>Dúvidas: ${esc(support)}` : ''}</td></tr>
<tr><td style="padding:24px 32px 28px;font-size:12px;color:#6f6f6f">CineMente · O cinema transforma. O conhecimento permanece.</td></tr>
</table></td></tr></table></body></html>`;

  return send(opts.to, subject, html, text);
}
