-- =====================================================================
-- Row Level Security
--
-- O CineMente acessa o banco SOMENTE pelo servidor (Next.js), com a
-- connection string do Postgres. O navegador nunca fala direto com o banco.
--
-- Por isso: RLS ligado em todas as tabelas e NENHUMA política para os
-- papéis públicos do Supabase (anon / authenticated). Resultado: a API REST
-- pública do Supabase não lê nem grava nada, mesmo que alguém descubra a
-- "anon key". O papel dono das tabelas (usado pelo servidor) não é afetado.
-- =====================================================================

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;

-- FORCE faria o próprio dono obedecer ao RLS; o servidor usa o dono,
-- então criamos uma política explícita apenas para o papel atual (dono).
do $$
declare t record; owner_role text := current_user;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create policy server_full_access on public.%I for all to %I using (true) with check (true)', t.tablename, owner_role);
  end loop;
end $$;

-- No Supabase, retira privilégios dos papéis públicos (se existirem)
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema public from anon';
    execute 'revoke all on all sequences in schema public from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on all tables in schema public from authenticated';
    execute 'revoke all on all sequences in schema public from authenticated';
  end if;
  -- tabelas criadas no futuro também nascem sem acesso público
  if exists (select 1 from pg_roles where rolname = 'anon') and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'alter default privileges in schema public revoke all on tables from anon, authenticated';
    execute 'alter default privileges in schema public revoke all on sequences from anon, authenticated';
    execute 'alter default privileges in schema public revoke all on functions from anon, authenticated';
  end if;
end $$;
