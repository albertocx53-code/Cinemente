// npm run compra:simular -- --email voce@exemplo.com [--nome "Seu Nome"] [--status aprovado|reembolsado] [--pedido TESTE-123] [--url https://seu-site.vercel.app]
//
// Envia ao site um aviso de compra igual ao que a plataforma de vendas mandaria.
// Serve para testar o fluxo inteiro: código gerado, página de compra concluída e e-mail.
// O site precisa estar rodando (npm run dev) ou publicado.
import { loadEnv, arg } from './_db.mjs';

loadEnv();
const secret = process.env.WEBHOOK_SECRET;
if (!secret) {
  console.error('\n✗ Falta WEBHOOK_SECRET no .env.local. Gere com:\n  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  process.exit(1);
}

const base = String(arg('url', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')).replace(/\/$/, '');
const email = String(arg('email', '')).trim().toLowerCase();
if (!email.includes('@')) {
  console.error('\n✗ Informe --email com o e-mail do comprador de teste.\n');
  process.exit(1);
}
const pedido = String(arg('pedido', `TESTE-${Date.now().toString(36).toUpperCase()}`));
const status = String(arg('status', 'aprovado'));
const nome = arg('nome', 'Professor Teste');

const res = await fetch(`${base}/api/webhooks/compra?token=${encodeURIComponent(secret)}&provedor=teste`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pedido, email, nome, status, valor: 97 }),
});
const body = await res.text();
console.log(`\nResposta do site (${res.status}): ${body}`);
if (res.ok) {
  console.log(`\nPágina que o comprador veria:\n  ${base}/compra/concluida?pedido=${encodeURIComponent(pedido)}&email=${encodeURIComponent(email)}\n`);
  if (status.startsWith('aprov')) console.log(`Para testar o estorno deste pedido:\n  npm run compra:simular -- --email ${email} --pedido ${pedido} --status reembolsado\n`);
}
