// npm run db:check — confere o DATABASE_URL do .env.local e testa a conexão com o banco.
// Nunca mostra a senha: só o tamanho e se há algo suspeito nela.
import { connect, loadEnv } from './_db.mjs';

loadEnv();
const raw = process.env.DATABASE_URL || '';
if (!raw) {
  console.log('DATABASE_URL está vazio no .env.local. O projeto vai usar o banco local de teste (PGlite).');
  process.exit(0);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.log('O DATABASE_URL não é um endereço válido. Ele deve começar com postgresql://');
  process.exit(1);
}

const pass = decodeURIComponent(url.password);
const problems = [];
if (raw.trim() !== raw) problems.push('Há espaço no começo ou no fim da linha.');
if (/YOUR-PASSWORD/i.test(raw)) problems.push('Ainda está escrito [YOUR-PASSWORD]. Troque pela senha do banco.');
if (pass.startsWith('[') || pass.endsWith(']')) problems.push('A senha está entre colchetes [ ]. Tire os colchetes.');
if (/\s/.test(pass)) problems.push('A senha tem espaço no meio.');
if (/[@#/?%]/.test(pass)) problems.push('A senha tem caractere especial (@ # / ? %). Gere uma senha só com letras e números.');
if (url.hostname.includes('pooler.supabase.com') && !url.username.includes('.')) problems.push('No pooler, o usuário precisa ser postgres.SEU_PROJECT_ID (com ponto).');
if (process.env.DATABASE_SSL !== 'true' && url.hostname.includes('supabase')) problems.push('Falta a linha DATABASE_SSL=true.');

console.log(`Usuário:  ${url.username}`);
console.log(`Servidor: ${url.hostname}:${url.port || '5432'}`);
console.log(`Senha:    ${'•'.repeat(Math.min(pass.length, 24))} (${pass.length} caracteres)`);
if (problems.length) {
  console.log('\nProblemas encontrados:');
  for (const p of problems) console.log('  ✗ ' + p);
}

try {
  const db = await connect();
  const { rows } = await db.query(`select (select count(*)::int from titles) as titulos, (select count(*)::int from activation_codes) as codigos`);
  console.log(`\n✓ Conectado! ${rows[0].titulos} títulos e ${rows[0].codigos} códigos no banco.`);
  await db.close();
} catch (e) {
  console.log(`\n✗ Não conectou: ${e.message}`);
  if (/password authentication failed/i.test(e.message)) {
    console.log('  A senha não confere. Faça o "Reset database password" no Supabase, copie a nova senha e cole no .env.local.');
  }
  process.exit(1);
}
