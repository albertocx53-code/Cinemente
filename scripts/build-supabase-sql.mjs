// npm run db:supabase-sql — gera db/supabase_setup.sql (migrações + catálogo em um único arquivo)
// para colar no SQL Editor do Supabase, sem precisar de terminal.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const list = (dir) => readdirSync(resolve(root, dir)).filter((f) => f.endsWith('.sql')).sort();
const migrations = list('db/migrations');
const seeds = list('db/seed');

let out = `-- =====================================================================
-- CINEMENTE — instalação completa do banco (gerado por scripts/build-supabase-sql.mjs)
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run.
-- Executar uma única vez em um projeto novo. Se algo falhar, nada é gravado.
-- =====================================================================
begin;

do $$ begin
  if to_regclass('public.titles') is not null then
    raise exception 'O banco do CineMente já está instalado neste projeto. Para atualizar, use npm run db:migrate.';
  end if;
end $$;

create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now());
`;
for (const f of migrations) {
  out += `\n-- ===== migração ${f} =====\n${readFileSync(resolve(root, 'db/migrations', f), 'utf8')}\n`;
  out += `insert into schema_migrations (name) values ('${f}');\n`;
}
for (const f of seeds) out += `\n-- ===== catálogo ${f} =====\n${readFileSync(resolve(root, 'db/seed', f), 'utf8')}\n`;
out += `\ncommit;\n\n-- Pronto. Gere os códigos de acesso com: npm run codes -- gerar --quantidade 10\n`;

writeFileSync(resolve(root, 'db/supabase_setup.sql'), out);
console.log(`db/supabase_setup.sql gerado (${migrations.length} migrações, ${seeds.length} arquivos de catálogo).`);
