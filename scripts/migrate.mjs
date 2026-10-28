// npm run db:migrate — aplica as migrações de db/migrations em ordem, uma única vez cada.
import { pathToFileURL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from './_db.mjs';

export async function migrate(db) {
  await db.exec(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query('select name from schema_migrations')).rows.map((r) => r.name));
  const dir = resolve(process.cwd(), 'db/migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(resolve(dir, file), 'utf8');
    await db.tx(async (t) => {
      await t.exec(sql);
      await t.query('insert into schema_migrations (name) values ($1)', [file]);
    });
    console.log(`  ✓ ${file}`);
    applied++;
  }
  console.log(applied ? `Migrações aplicadas: ${applied}` : 'Banco já está atualizado.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = await connect();
  console.log(`Banco: ${db.kind}`);
  try { await migrate(db); } finally { await db.close(); }
}
