-- =====================================================================
-- Entrega automática de códigos após a compra
--
-- O código completo precisa ser mostrado ao comprador (tela e e-mail),
-- então guardamos uma cópia CRIPTOGRAFADA (AES-256-GCM, chave derivada de
-- SESSION_SECRET). A validação continua usando apenas o hash.
-- =====================================================================

create table code_deliveries (
  id               uuid primary key default gen_random_uuid(),
  purchase_id      uuid not null unique references purchases(id) on delete cascade,
  code_id          uuid not null references activation_codes(id) on delete cascade,
  code_ciphertext  text not null,
  email_sent_at    timestamptz,
  email_attempts   int not null default 0,
  email_error      text,
  viewed_at        timestamptz,
  view_count       int not null default 0,
  created_at       timestamptz not null default now()
);

create index purchases_buyer_email_idx on purchases (lower(buyer_email));
create index activation_codes_purchase_idx on activation_codes (purchase_id);

-- Mesma proteção das demais tabelas
alter table code_deliveries enable row level security;
alter table code_deliveries force row level security;
do $$ begin
  execute format('create policy server_full_access on public.code_deliveries for all to %I using (true) with check (true)', current_user);
end $$;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.code_deliveries from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.code_deliveries from authenticated';
  end if;
end $$;
