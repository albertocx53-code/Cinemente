// npm run setup — prepara tudo para rodar localmente:
// 1) cria .env.local com segredos aleatórios (se não existir)
// 2) aplica migrações  3) carrega o catálogo  4) gera 3 códigos de teste
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { connect } from './_db.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { generateCodes } from './codes.mjs';

if (!existsSync('.env.local')) {
  const example = readFileSync('.env.example', 'utf8');
  const env = example
    .replace(/^CODE_PEPPER=.*$/m, `CODE_PEPPER=${randomBytes(32).toString('hex')}`)
    .replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${randomBytes(32).toString('hex')}`);
  writeFileSync('.env.local', env);
  console.log('✓ .env.local criado com segredos aleatórios');
}

const db = await connect();
try {
  console.log(`Banco: ${db.kind === 'pglite' ? 'PGlite local (.data/pglite)' : 'PostgreSQL (DATABASE_URL)'}`);
  await migrate(db);
  await seed(db);
  const existing = (await db.query(`select count(*)::int as n from activation_codes`)).rows[0].n;
  if (existing === 0) {
    const codes = await generateCodes(db, { count: 3, notes: 'Códigos de teste do setup' });
    console.log('\nCódigos de teste para ativar o acesso (aparecem só agora):\n');
    for (const c of codes) console.log('  ' + c);
  }
  console.log('\nPronto! Rode: npm run dev  →  http://localhost:3000\n');
} finally {
  await db.close();
}
