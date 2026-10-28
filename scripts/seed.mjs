// npm run db:seed — carrega o catálogo demonstrativo (idempotente).
import { pathToFileURL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from './_db.mjs';

export async function seed(db) {
  const dir = resolve(process.cwd(), 'db/seed');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.tx((t) => t.exec(readFileSync(resolve(dir, file), 'utf8')));
    console.log(`  ✓ ${file}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = await connect();
  try { await seed(db); } finally { await db.close(); }
}
