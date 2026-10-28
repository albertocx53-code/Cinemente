-- =====================================================================
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

-- ===== migração 0001_schema.sql =====
-- =====================================================================
-- CINEMENTE — Esquema principal (PostgreSQL 15+ / Supabase)
-- Executado por: npm run db:migrate
-- =====================================================================

-- ---------------------------------------------------------------------
-- Planos, contas, sessões
-- ---------------------------------------------------------------------
create table plans (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  max_profiles    int  not null default 3 check (max_profiles between 1 and 20),
  max_activations int  not null default 1 check (max_activations between 1 and 50),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  name           text not null,
  password_hash  text not null,
  role           text not null default 'teacher' check (role in ('teacher','admin')),
  status         text not null default 'active'  check (status in ('active','blocked')),
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);
create unique index users_email_lower_idx on users (lower(email));

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz
);
create index sessions_user_idx on sessions (user_id);

-- Recuperação de acesso (token de uso único, armazenado como hash)
create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

-- ---------------------------------------------------------------------
-- Compras, webhooks, códigos de ativação e licenças
-- ---------------------------------------------------------------------
create table purchases (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null,                       -- ex.: hotmart, kiwify, mercadopago
  provider_order_id  text not null,
  buyer_email        text not null,
  buyer_name         text,
  plan_id            uuid references plans(id),
  amount_cents       int,
  currency           text not null default 'BRL',
  status             text not null default 'pending'
                     check (status in ('pending','approved','refused','refunded','canceled','chargeback')),
  raw                jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create table webhook_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,
  event_type    text,
  payload       jsonb not null,
  status        text not null default 'received' check (status in ('received','processed','ignored','failed')),
  error         text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  unique (provider, event_id)            -- impede processamento duplicado
);

create table activation_codes (
  id                    uuid primary key default gen_random_uuid(),
  code_hash             text not null unique,             -- HMAC-SHA256(CODE_PEPPER, código normalizado)
  code_hint             text not null,                    -- últimos 4 caracteres, só para suporte
  status                text not null default 'available'
                        check (status in ('available','activated','revoked','suspended')),
  plan_id               uuid references plans(id),
  purchase_id           uuid references purchases(id),
  buyer_email           text,
  max_activations       int not null default 1 check (max_activations >= 1),
  activations_count     int not null default 0 check (activations_count >= 0),
  max_profiles          int not null default 3 check (max_profiles between 1 and 20),
  notes                 text,
  created_by            uuid references users(id),
  created_at            timestamptz not null default now(),
  activated_at          timestamptz,
  activated_by_user_id  uuid references users(id),
  revoked_at            timestamptz,
  check (activations_count <= max_activations)
);
create index activation_codes_status_idx on activation_codes (status);

create table licenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  code_id       uuid references activation_codes(id),
  plan_id       uuid references plans(id),
  status        text not null default 'active' check (status in ('active','suspended','revoked')),
  max_profiles  int not null default 3 check (max_profiles between 1 and 20),
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (user_id, code_id)
);
create index licenses_user_idx on licenses (user_id) where status = 'active';

create table code_events (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references activation_codes(id) on delete cascade,
  event       text not null,           -- created, activated, revoked, suspended, reactivated
  user_id     uuid references users(id),
  ip          text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- Limite de tentativas (ativação, login) — janela deslizante
create table rate_limit_hits (
  id          bigserial primary key,
  bucket      text not null,
  key         text not null,
  success     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index rate_limit_lookup_idx on rate_limit_hits (bucket, key, created_at desc);

create table security_events (
  id          bigserial primary key,
  user_id     uuid references users(id) on delete set null,
  type        text not null,
  ip          text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index security_events_created_idx on security_events (created_at desc);

create table admin_logs (
  id          bigserial primary key,
  admin_id    uuid references users(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 30),
  avatar_key   text not null default 'a1',
  preferences  jsonb not null default '{"disciplinas":[]}'::jsonb,
  created_at   timestamptz not null default now()
);
create index profiles_user_idx on profiles (user_id);

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table titles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  type                 text not null check (type in ('filme','documentario','curta','serie','videoaula')),
  title                text not null,
  original_title       text,
  tagline              text,
  synopsis             text not null,
  year                 int check (year between 1880 and 2100),
  duration_min         int check (duration_min > 0),
  country              text,
  languages            text[] not null default '{}',
  subtitles            text[] not null default '{}',
  genres               text[] not null default '{}',
  age_rating           text,                       -- null = não verificada
  age_rating_verified  boolean not null default false,
  disciplines          text[] not null default '{}' check (disciplines <@ array['filosofia','sociologia']::text[]),
  school_levels        text[] not null default '{}',
  poster_url           text,                       -- somente imagens com direito de uso
  backdrop_url         text,
  art                  jsonb not null default '{}'::jsonb,  -- arte tipográfica própria CineMente
  status               text not null default 'draft' check (status in ('draft','published','scheduled')),
  publish_at           timestamptz,
  featured             boolean not null default false,
  featured_order       int,
  popularity           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index titles_status_idx on titles (status, publish_at);
create index titles_type_idx on titles (type);
create index titles_disciplines_idx on titles using gin (disciplines);
create index titles_featured_idx on titles (featured_order) where featured;

create table categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  kind         text not null check (kind in ('tema','pensador','conceito','genero','colecao')),
  description  text
);

create table title_categories (
  title_id     uuid not null references titles(id) on delete cascade,
  category_id  uuid not null references categories(id) on delete cascade,
  primary key (title_id, category_id)
);
create index title_categories_cat_idx on title_categories (category_id);

create table people (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,
  name  text not null
);

create table title_credits (
  title_id   uuid not null references titles(id) on delete cascade,
  person_id  uuid not null references people(id) on delete cascade,
  role       text not null check (role in ('direcao','roteiro','elenco','participacao','producao')),
  position   int not null default 0,
  primary key (title_id, person_id, role)
);

-- Séries educativas
create table seasons (
  id        uuid primary key default gen_random_uuid(),
  title_id  uuid not null references titles(id) on delete cascade,
  number    int  not null check (number > 0),
  name      text,
  synopsis  text,
  unique (title_id, number)
);

create table videos (
  id            uuid primary key default gen_random_uuid(),
  title_id      uuid references titles(id) on delete cascade,
  kind          text not null check (kind in ('principal','trailer','episodio','videoaula')),
  provider      text not null check (provider in ('hls_proprio','mp4_proprio','youtube','vimeo')),
  source        text not null,                 -- caminho privado no storage ou ID do provedor
  duration_sec  int,
  status        text not null default 'ready' check (status in ('processing','ready','error','disabled')),
  created_at    timestamptz not null default now()
);

create table episodes (
  id            uuid primary key default gen_random_uuid(),
  season_id     uuid not null references seasons(id) on delete cascade,
  number        int  not null check (number > 0),
  name          text not null,
  synopsis      text,
  duration_min  int,
  video_id      uuid references videos(id) on delete set null,
  unique (season_id, number)
);

-- Direitos de exibição
create table content_licenses (
  id                  uuid primary key default gen_random_uuid(),
  title_id            uuid not null references titles(id) on delete cascade,
  rights_holder       text not null,
  authorization_type  text not null,     -- licença comercial, licença educativa, domínio público, conteúdo próprio...
  territory           text not null default 'BR',
  valid_from          date,
  valid_until         date,
  can_stream          boolean not null default false,
  can_download        boolean not null default false,
  can_embed           boolean not null default false,
  document_ref        text,
  notes               text,
  created_at          timestamptz not null default now()
);
create index content_licenses_title_idx on content_licenses (title_id);

-- Onde assistir legalmente quando o CineMente não tem licença
create table watch_sources (
  id        uuid primary key default gen_random_uuid(),
  title_id  uuid not null references titles(id) on delete cascade,
  label     text not null,
  url       text not null check (url ~ '^https://'),
  kind      text not null default 'agregador' check (kind in ('oficial','agregador')),
  position  int not null default 0
);

-- ---------------------------------------------------------------------
-- Biblioteca pedagógica
-- ---------------------------------------------------------------------
create table pedagogical_guides (
  id                uuid primary key default gen_random_uuid(),
  title_id          uuid not null unique references titles(id) on delete cascade,
  why_use           text not null,
  concepts          text[] not null default '{}',
  thinkers          text[] not null default '{}',
  objectives        text[] not null default '{}',
  debate_questions  text[] not null default '{}',
  lesson_plan       jsonb  not null default '[]'::jsonb,  -- [{etapa, tempo, descricao}]
  activities        jsonb  not null default '[]'::jsonb,  -- [{nome, descricao}]
  analysis_script   jsonb  not null default '[]'::jsonb,  -- [{momento, observar}]
  approach_tips     text[] not null default '{}',
  references_list   text[] not null default '{}',
  bncc              jsonb  not null default '[]'::jsonb,  -- somente códigos verificados
  author            text not null default 'Equipe CineMente',
  updated_at        timestamptz not null default now()
);

create table materials (
  id            uuid primary key default gen_random_uuid(),
  title_id      uuid references titles(id) on delete set null,
  kind          text not null check (kind in ('plano_aula','roteiro_analise','atividade','slides','avaliacao','sequencia_didatica','projeto','referencias')),
  name          text not null,
  description   text,
  storage_path  text not null,        -- bucket PRIVADO; download só por URL assinada temporária
  file_format   text not null check (file_format in ('pdf','docx','pptx')),
  size_bytes    bigint,
  status        text not null default 'draft' check (status in ('draft','published')),
  created_at    timestamptz not null default now()
);
create index materials_title_idx on materials (title_id);

create table slide_decks (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title_id           uuid references titles(id) on delete set null,
  name               text not null,
  discipline         text not null check (discipline in ('filosofia','sociologia')),
  theme              text,
  objectives         text[] not null default '{}',
  slides             jsonb not null default '[]'::jsonb,
  pdf_material_id    uuid references materials(id) on delete set null,
  pptx_material_id   uuid references materials(id) on delete set null,
  status             text not null default 'draft' check (status in ('draft','published')),
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Vitrine da home (carrosséis vêm do banco)
-- ---------------------------------------------------------------------
create table rails (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  source        text not null check (source in
                 ('destaque','continuar','recentes','disciplina','tipo','categoria','manual','com_guia','minha_lista','recomendados','em_alta')),
  source_value  text,
  position      int  not null default 0,
  ranked        boolean not null default false,    -- exibe numeração "Top 10"
  active        boolean not null default true
);

create table rail_items (
  rail_id   uuid not null references rails(id) on delete cascade,
  title_id  uuid not null references titles(id) on delete cascade,
  position  int  not null default 0,
  primary key (rail_id, title_id)
);

-- ---------------------------------------------------------------------
-- Personalização
-- ---------------------------------------------------------------------
create table favorites (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  title_id       uuid references titles(id) on delete cascade,
  slide_deck_id  uuid references slide_decks(id) on delete cascade,
  material_id    uuid references materials(id) on delete cascade,
  created_at     timestamptz not null default now(),
  check (num_nonnulls(title_id, slide_deck_id, material_id) = 1)
);
create unique index favorites_title_uq on favorites (profile_id, title_id) where title_id is not null;
create unique index favorites_deck_uq  on favorites (profile_id, slide_deck_id) where slide_deck_id is not null;
create unique index favorites_mat_uq   on favorites (profile_id, material_id) where material_id is not null;

create table playback_progress (
  profile_id    uuid not null references profiles(id) on delete cascade,
  video_id      uuid not null references videos(id) on delete cascade,
  title_id      uuid references titles(id) on delete cascade,
  episode_id    uuid references episodes(id) on delete cascade,
  position_sec  int not null default 0 check (position_sec >= 0),
  duration_sec  int,
  completed     boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (profile_id, video_id)
);
create index playback_progress_recent_idx on playback_progress (profile_id, updated_at desc);

create table playback_history (
  id          bigserial primary key,
  profile_id  uuid not null references profiles(id) on delete cascade,
  title_id    uuid references titles(id) on delete cascade,
  video_id    uuid references videos(id) on delete set null,
  event       text not null check (event in ('view_details','play','pause','complete')),
  created_at  timestamptz not null default now()
);
create index playback_history_profile_idx on playback_history (profile_id, created_at desc);

create table playback_errors (
  id          bigserial primary key,
  video_id    uuid references videos(id) on delete set null,
  profile_id  uuid references profiles(id) on delete set null,
  code        text,
  message     text,
  created_at  timestamptz not null default now()
);

create table recommendations (
  profile_id   uuid not null references profiles(id) on delete cascade,
  title_id     uuid not null references titles(id) on delete cascade,
  score        real not null,
  reason       text,
  computed_at  timestamptz not null default now(),
  primary key (profile_id, title_id)
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,   -- null = para todos
  title       text not null,
  body        text,
  link        text,
  created_at  timestamptz not null default now()
);

create table notification_reads (
  notification_id  uuid not null references notifications(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  read_at          timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- Atualiza updated_at automaticamente
create or replace function set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger titles_updated_at    before update on titles    for each row execute function set_updated_at();
create trigger purchases_updated_at before update on purchases for each row execute function set_updated_at();

insert into schema_migrations (name) values ('0001_schema.sql');

-- ===== migração 0002_rls.sql =====
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

insert into schema_migrations (name) values ('0002_rls.sql');

-- ===== migração 0003_entregas.sql =====
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

insert into schema_migrations (name) values ('0003_entregas.sql');

-- ===== catálogo 0001_catalogo.sql =====
-- =====================================================================
-- CINEMENTE — Catálogo demonstrativo
--
-- Regras seguidas:
--  * Nenhum filme abaixo tem licença de reprodução no CineMente.
--    Por isso NÃO há registros em content_licenses/videos para eles:
--    a plataforma mostra "Onde assistir" e a ficha pedagógica.
--  * Classificação indicativa fica NULL (não verificada) até o
--    administrador conferir no ClassInd e marcar age_rating_verified.
--  * Pôsteres oficiais NÃO são usados: cada título recebe uma arte
--    tipográfica própria do CineMente (coluna art). O admin pode subir
--    pôsteres autorizados depois em poster_url / backdrop_url.
--  * Fichas pedagógicas são texto original da equipe CineMente.
--    Nenhum código da BNCC foi incluído sem verificação.
-- Idempotente: pode ser executado mais de uma vez.
-- =====================================================================

insert into plans (slug, name, description, max_profiles, max_activations)
values ('vitalicio', 'CineMente Vitalício', 'Pagamento único, acesso vitalício ao catálogo e à biblioteca pedagógica.', 3, 1)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
insert into categories (slug, name, kind, description) values
  ('filosofia-politica',     'Filosofia política',      'tema', 'Poder, Estado, liberdade e autoridade.'),
  ('etica-e-moral',          'Ética e moral',           'tema', 'Valores, escolhas e responsabilidade.'),
  ('cultura-e-sociedade',    'Cultura e sociedade',     'tema', 'Mídia, consumo, identidade e vida social.'),
  ('trabalho-e-capitalismo', 'Trabalho e capitalismo',  'tema', 'Produção, alienação e tecnologia.'),
  ('direitos-humanos',       'Direitos humanos',        'tema', 'Dignidade, justiça e memória.'),
  ('teoria-do-conhecimento', 'Teoria do conhecimento',  'tema', 'Verdade, aparência e realidade.'),
  ('educacao',               'Educação e autonomia',    'tema', 'Escola, formação e pensamento livre.'),
  ('para-debate',            'Filmes para debates',     'colecao', 'Títulos que rendem discussão em sala.'),
  ('platao',                 'Platão',                  'pensador', null),
  ('descartes',              'René Descartes',          'pensador', null),
  ('kant',                   'Immanuel Kant',           'pensador', null),
  ('marx',                   'Karl Marx',               'pensador', null),
  ('arendt',                 'Hannah Arendt',           'pensador', null),
  ('foucault',               'Michel Foucault',         'pensador', null),
  ('debord',                 'Guy Debord',              'pensador', null),
  ('baudrillard',            'Jean Baudrillard',        'pensador', null),
  ('bauman',                 'Zygmunt Bauman',          'pensador', null),
  ('thoreau',                'Henry David Thoreau',     'pensador', null),
  ('zuboff',                 'Shoshana Zuboff',         'pensador', null),
  ('weber',                  'Max Weber',               'pensador', null),
  ('mito-da-caverna',        'Alegoria da caverna',     'conceito', null),
  ('alienacao',              'Alienação',               'conceito', null),
  ('totalitarismo',          'Totalitarismo',           'conceito', null),
  ('banalidade-do-mal',      'Banalidade do mal',       'conceito', null),
  ('vigilancia',             'Vigilância',              'conceito', null),
  ('duvida-metodica',        'Dúvida metódica',         'conceito', null),
  ('esclarecimento',         'Esclarecimento',          'conceito', null),
  ('justica',                'Justiça',                 'conceito', null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Títulos (dados factuais conferidos: ano, direção, duração, país)
-- ---------------------------------------------------------------------
insert into titles (slug, type, title, original_title, tagline, synopsis, year, duration_min, country, languages, genres, disciplines, school_levels, art, status, featured, featured_order, popularity, created_at) values
('o-show-de-truman', 'filme', 'O Show de Truman', 'The Truman Show',
 'E se toda a sua vida fosse um cenário?',
 'Truman Burbank leva uma vida comum em uma cidade perfeita, sem saber que tudo à sua volta é um gigantesco estúdio de televisão e que cada momento de sua existência é transmitido ao vivo para o mundo. Quando pequenas falhas começam a aparecer, ele passa a questionar a realidade que sempre conheceu.',
 1998, 103, 'Estados Unidos', '{inglês}', '{Drama,Comédia}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"dome","c1":"#0b1a3a","c2":"#050811","accent":"#e50914","kicker":"Filosofia · Sociologia"}', 'published', true, 1, 98, now() - interval '20 days'),

('tempos-modernos', 'filme', 'Tempos Modernos', 'Modern Times',
 'O homem contra a engrenagem.',
 'Um operário de fábrica é levado ao limite pelo ritmo das linhas de montagem. Entre prisões, empregos perdidos e o encontro com uma jovem órfã, ele atravessa a Grande Depressão tentando sobreviver em um mundo que trata pessoas como peças de máquina.',
 1936, 87, 'Estados Unidos', '{inglês}', '{Comédia,Drama}', '{sociologia,filosofia}', '{"Ensino Fundamental II","Ensino Médio"}',
 '{"motif":"gears","c1":"#2a2a2a","c2":"#0a0a0a","accent":"#d4a017","kicker":"Sociologia"}', 'published', true, 2, 91, now() - interval '18 days'),

('sociedade-dos-poetas-mortos', 'filme', 'Sociedade dos Poetas Mortos', 'Dead Poets Society',
 'Aproveite o dia.',
 'Em um rígido internato masculino dos anos 1950, um professor de literatura incentiva os alunos a pensar por conta própria, a ler poesia com paixão e a questionar o caminho que outros traçaram para eles. A liberdade recém-descoberta, porém, entra em choque com a tradição e a autoridade.',
 1989, 128, 'Estados Unidos', '{inglês}', '{Drama}', '{filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"candle","c1":"#3a1f0b","c2":"#0d0703","accent":"#e8b04b","kicker":"Filosofia"}', 'published', true, 3, 88, now() - interval '16 days'),

('a-onda', 'filme', 'A Onda', 'Die Welle',
 'A autocracia pode acontecer de novo?',
 'Durante uma semana de projetos sobre formas de governo, um professor alemão propõe um experimento prático sobre autocracia. Disciplina, uniforme e um nome comum transformam rapidamente a turma em um movimento coeso — e cada vez mais perigoso.',
 2008, 107, 'Alemanha', '{alemão}', '{Drama,Suspense}', '{sociologia,filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"wave","c1":"#3d0006","c2":"#0a0002","accent":"#ff2a2a","kicker":"Filosofia política"}', 'published', true, 4, 95, now() - interval '14 days'),

('matrix', 'filme', 'Matrix', 'The Matrix',
 'O que é real?',
 'O programador Thomas Anderson leva uma vida dupla como o hacker Neo, até ser contatado por um grupo que revela uma verdade perturbadora: o mundo que ele conhece é uma simulação criada para manter a humanidade sob controle.',
 1999, 136, 'Estados Unidos', '{inglês}', '{Ficção científica,Ação}', '{filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"code","c1":"#022012","c2":"#010805","accent":"#2bd46a","kicker":"Filosofia"}', 'published', false, null, 93, now() - interval '12 days'),

('o-dilema-das-redes', 'documentario', 'O Dilema das Redes', 'The Social Dilemma',
 'Quem está usando quem?',
 'Ex-funcionários de grandes empresas de tecnologia explicam como as redes sociais são projetadas para capturar atenção, coletar dados e influenciar comportamentos, e discutem os efeitos disso sobre a saúde mental, a política e a vida em sociedade.',
 2020, 94, 'Estados Unidos', '{inglês}', '{Documentário}', '{sociologia,filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"nodes","c1":"#14103a","c2":"#05040f","accent":"#ff3d5a","kicker":"Documentário · Sociologia"}', 'published', true, 5, 90, now() - interval '6 days'),

('12-homens-e-uma-sentenca', 'filme', '12 Homens e uma Sentença', '12 Angry Men',
 'Uma dúvida razoável muda tudo.',
 'Doze jurados se reúnem para decidir o destino de um jovem acusado de assassinato. A condenação parece certa, até que um deles se recusa a votar sem antes discutir o caso. Em uma sala abafada, argumentos, preconceitos e convicções são colocados à prova.',
 1957, 96, 'Estados Unidos', '{inglês}', '{Drama}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"table","c1":"#1c1c1c","c2":"#060606","accent":"#e50914","kicker":"Ética · Justiça"}', 'published', false, null, 86, now() - interval '4 days'),

('a-vida-e-bela', 'filme', 'A Vida é Bela', 'La vita è bella',
 'A imaginação como forma de resistência.',
 'Na Itália dos anos 1930, um livreiro judeu conquista a mulher que ama com humor e imaginação. Anos depois, quando ele e o filho são levados a um campo de concentração, ele transforma o horror em um jogo para proteger a criança.',
 1997, 116, 'Itália', '{italiano}', '{Drama,Comédia}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"sun","c1":"#3a0a10","c2":"#0c0204","accent":"#ffb547","kicker":"Direitos humanos"}', 'published', false, null, 84, now() - interval '2 days')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Créditos
-- ---------------------------------------------------------------------
insert into people (slug, name) values
  ('peter-weir','Peter Weir'), ('jim-carrey','Jim Carrey'), ('laura-linney','Laura Linney'), ('ed-harris','Ed Harris'),
  ('charles-chaplin','Charles Chaplin'), ('paulette-goddard','Paulette Goddard'),
  ('robin-williams','Robin Williams'), ('ethan-hawke','Ethan Hawke'),
  ('dennis-gansel','Dennis Gansel'), ('jurgen-vogel','Jürgen Vogel'),
  ('lana-wachowski','Lana Wachowski'), ('lilly-wachowski','Lilly Wachowski'), ('keanu-reeves','Keanu Reeves'), ('laurence-fishburne','Laurence Fishburne'), ('carrie-anne-moss','Carrie-Anne Moss'),
  ('jeff-orlowski','Jeff Orlowski'), ('tristan-harris','Tristan Harris'),
  ('sidney-lumet','Sidney Lumet'), ('henry-fonda','Henry Fonda'), ('lee-j-cobb','Lee J. Cobb'),
  ('roberto-benigni','Roberto Benigni'), ('nicoletta-braschi','Nicoletta Braschi')
on conflict (slug) do nothing;

insert into title_credits (title_id, person_id, role, position)
select t.id, p.id, c.role, c.pos
from (values
  ('o-show-de-truman','peter-weir','direcao',0), ('o-show-de-truman','jim-carrey','elenco',0), ('o-show-de-truman','laura-linney','elenco',1), ('o-show-de-truman','ed-harris','elenco',2),
  ('tempos-modernos','charles-chaplin','direcao',0), ('tempos-modernos','charles-chaplin','elenco',0), ('tempos-modernos','paulette-goddard','elenco',1),
  ('sociedade-dos-poetas-mortos','peter-weir','direcao',0), ('sociedade-dos-poetas-mortos','robin-williams','elenco',0), ('sociedade-dos-poetas-mortos','ethan-hawke','elenco',1),
  ('a-onda','dennis-gansel','direcao',0), ('a-onda','jurgen-vogel','elenco',0),
  ('matrix','lana-wachowski','direcao',0), ('matrix','lilly-wachowski','direcao',1), ('matrix','keanu-reeves','elenco',0), ('matrix','laurence-fishburne','elenco',1), ('matrix','carrie-anne-moss','elenco',2),
  ('o-dilema-das-redes','jeff-orlowski','direcao',0), ('o-dilema-das-redes','tristan-harris','participacao',0),
  ('12-homens-e-uma-sentenca','sidney-lumet','direcao',0), ('12-homens-e-uma-sentenca','henry-fonda','elenco',0), ('12-homens-e-uma-sentenca','lee-j-cobb','elenco',1),
  ('a-vida-e-bela','roberto-benigni','direcao',0), ('a-vida-e-bela','roberto-benigni','elenco',0), ('a-vida-e-bela','nicoletta-braschi','elenco',1)
) as c(tslug, pslug, role, pos)
join titles t on t.slug = c.tslug
join people p on p.slug = c.pslug
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Ligações título × categoria
-- ---------------------------------------------------------------------
insert into title_categories (title_id, category_id)
select t.id, c.id
from (values
  ('o-show-de-truman','cultura-e-sociedade'), ('o-show-de-truman','teoria-do-conhecimento'), ('o-show-de-truman','para-debate'),
  ('o-show-de-truman','platao'), ('o-show-de-truman','debord'), ('o-show-de-truman','foucault'), ('o-show-de-truman','mito-da-caverna'), ('o-show-de-truman','vigilancia'),
  ('tempos-modernos','trabalho-e-capitalismo'), ('tempos-modernos','para-debate'), ('tempos-modernos','marx'), ('tempos-modernos','weber'), ('tempos-modernos','alienacao'),
  ('sociedade-dos-poetas-mortos','educacao'), ('sociedade-dos-poetas-mortos','etica-e-moral'), ('sociedade-dos-poetas-mortos','kant'), ('sociedade-dos-poetas-mortos','thoreau'), ('sociedade-dos-poetas-mortos','esclarecimento'),
  ('a-onda','filosofia-politica'), ('a-onda','direitos-humanos'), ('a-onda','para-debate'), ('a-onda','arendt'), ('a-onda','totalitarismo'), ('a-onda','educacao'),
  ('matrix','teoria-do-conhecimento'), ('matrix','platao'), ('matrix','descartes'), ('matrix','baudrillard'), ('matrix','mito-da-caverna'), ('matrix','duvida-metodica'),
  ('o-dilema-das-redes','cultura-e-sociedade'), ('o-dilema-das-redes','trabalho-e-capitalismo'), ('o-dilema-das-redes','para-debate'), ('o-dilema-das-redes','zuboff'), ('o-dilema-das-redes','bauman'), ('o-dilema-das-redes','vigilancia'),
  ('12-homens-e-uma-sentenca','etica-e-moral'), ('12-homens-e-uma-sentenca','filosofia-politica'), ('12-homens-e-uma-sentenca','direitos-humanos'), ('12-homens-e-uma-sentenca','para-debate'), ('12-homens-e-uma-sentenca','justica'),
  ('a-vida-e-bela','direitos-humanos'), ('a-vida-e-bela','etica-e-moral'), ('a-vida-e-bela','arendt'), ('a-vida-e-bela','banalidade-do-mal')
) as x(tslug, cslug)
join titles t on t.slug = x.tslug
join categories c on c.slug = x.cslug
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Onde assistir: link de busca no JustWatch (agregador de serviços legais).
-- O admin deve trocar por link oficial quando houver.
-- ---------------------------------------------------------------------
insert into watch_sources (title_id, label, url, kind)
select t.id, 'Consultar serviços legais no JustWatch', 'https://www.justwatch.com/br/busca?q=' || replace(t.title, ' ', '%20'), 'agregador'
from titles t
where t.type in ('filme','documentario')
  and not exists (select 1 from watch_sources w where w.title_id = t.id);

-- ---------------------------------------------------------------------
-- Vitrine da home
-- ---------------------------------------------------------------------
insert into rails (slug, name, source, source_value, position, ranked) values
  ('em-alta',            'Em alta nas salas de aula',       'em_alta',      null,                     5,  true),
  ('continuar',          'Continue assistindo',             'continuar',    null,                     10, false),
  ('destaque',           'Em destaque no CineMente',        'destaque',     null,                     15, false),
  ('recomendados',       'Recomendados para você',          'recomendados', null,                     20, false),
  ('recentes',           'Adicionados recentemente',        'recentes',     null,                     30, false),
  ('filosofia',          'Filmes de Filosofia',             'disciplina',   'filosofia',              40, false),
  ('sociologia',         'Filmes de Sociologia',            'disciplina',   'sociologia',             50, false),
  ('documentarios',      'Documentários essenciais',        'tipo',         'documentario',           60, false),
  ('curtas',             'Curtas para trabalhar em sala',   'tipo',         'curta',                  70, false),
  ('filosofia-politica', 'Filosofia política',              'categoria',    'filosofia-politica',     80, false),
  ('etica-e-moral',      'Ética e moral',                   'categoria',    'etica-e-moral',          90, false),
  ('cultura-e-sociedade','Cultura e sociedade',             'categoria',    'cultura-e-sociedade',    100, false),
  ('trabalho',           'Trabalho e capitalismo',          'categoria',    'trabalho-e-capitalismo', 110, false),
  ('direitos-humanos',   'Direitos humanos',                'categoria',    'direitos-humanos',       120, false),
  ('videoaulas',         'Videoaulas recomendadas',         'tipo',         'videoaula',              130, false),
  ('com-guia',           'Conteúdos com plano de aula',     'com_guia',     null,                     140, false),
  ('debates',            'Filmes para debates',             'categoria',    'para-debate',            150, false),
  ('minha-lista',        'Minha lista',                     'minha_lista',  null,                     160, false)
on conflict (slug) do nothing;

insert into notifications (title, body, link)
select 'Bem-vindo ao CineMente', 'Explore as fichas pedagógicas de cada filme na seção "Explore este filme em sala de aula".', '/navegar'
where not exists (select 1 from notifications where title = 'Bem-vindo ao CineMente');


-- ===== catálogo 0002_fichas_pedagogicas.sql =====
-- =====================================================================
-- Fichas pedagógicas originais — Equipe CineMente
-- Referências citadas: apenas obras clássicas e amplamente conhecidas.
-- BNCC: deixado vazio de propósito até verificação por especialista.
-- =====================================================================

drop table if exists _fichas;
create temporary table _fichas (
  slug text, why_use text, concepts text[], thinkers text[], objectives text[],
  debate text[], plan jsonb, activities jsonb, analysis jsonb, tips text[], refs text[]
);

insert into _fichas values
-- O SHOW DE TRUMAN ------------------------------------------------------
('o-show-de-truman',
 $$Uma porta de entrada acessível para a alegoria da caverna e para a discussão sobre mídia, espetáculo e vigilância. Os alunos reconhecem o próprio cotidiano de câmeras e redes sociais na história de Truman.$$,
 '{Alegoria da caverna,Aparência e realidade,Sociedade do espetáculo,Vigilância,Liberdade}',
 '{Platão,Guy Debord,Michel Foucault}',
 '{"Relacionar a trajetória de Truman à alegoria da caverna de Platão","Identificar mecanismos de controle e vigilância representados no filme","Discutir o papel da mídia na construção da percepção da realidade"}',
 '{"Truman era feliz antes de descobrir a verdade? A felicidade baseada em uma ilusão tem valor?","Christof afirma proteger Truman do mundo real. Isso justifica a manipulação?","Quem é mais responsável: o criador do programa ou o público que assiste?","Em que aspectos a nossa vida nas redes sociais se parece com a de Truman?"}',
 '[{"etapa":"Sensibilização","tempo":"10 min","descricao":"Pergunte à turma: como saberíamos se tudo ao nosso redor fosse encenado? Registre as respostas no quadro."},{"etapa":"Exibição","tempo":"103 min (ou trechos)","descricao":"Exiba o filme completo ou a sequência inicial e o desfecho, se o tempo for curto."},{"etapa":"Leitura de apoio","tempo":"20 min","descricao":"Leitura comentada de trecho da alegoria da caverna (A República, livro VII)."},{"etapa":"Debate","tempo":"25 min","descricao":"Use as perguntas de debate em roda, relacionando cada etapa da saída da caverna a momentos do filme."},{"etapa":"Síntese","tempo":"10 min","descricao":"Cada aluno escreve, em três linhas, o que seria a sua caverna hoje."}]',
 '[{"nome":"Mapa da caverna","descricao":"Em grupos, os alunos montam um quadro comparando elementos da alegoria (sombras, correntes, saída, sol) com cenas do filme."},{"nome":"Diário de vigilância","descricao":"Durante um dia, cada aluno anota quantas vezes foi registrado por câmeras, aplicativos ou redes. Discussão na aula seguinte."}]',
 '[{"momento":"Primeiros minutos","observar":"Enquadramentos que imitam câmeras escondidas e o efeito disso sobre o espectador."},{"momento":"O refletor que cai do céu","observar":"A primeira fissura no cenário: o início da dúvida."},{"momento":"A travessia de barco","observar":"O medo como mecanismo de controle."},{"momento":"A porta no horizonte","observar":"A escolha final e o sentido da liberdade."}]',
 '{"Com turmas do 1º ano, foque na comparação com a caverna antes de introduzir Debord.","Com turmas mais avançadas, aprofunde a ideia de panoptismo em Foucault."}',
 '{"PLATÃO. A República, livro VII.","DEBORD, Guy. A sociedade do espetáculo.","FOUCAULT, Michel. Vigiar e punir."}'),

-- TEMPOS MODERNOS ---------------------------------------------------------
('tempos-modernos',
 $$Um clássico sem diálogos falados na maior parte do tempo, ideal para discutir trabalho industrial, alienação e desemprego com qualquer turma. O humor físico de Chaplin prende a atenção e abre espaço para análise crítica.$$,
 '{Alienação do trabalho,Taylorismo e fordismo,Divisão do trabalho,Desemprego,Racionalização}',
 '{Karl Marx,Max Weber}',
 '{"Compreender o conceito de alienação do trabalho em Marx","Identificar características da produção em série","Relacionar a crise retratada no filme a transformações atuais do mundo do trabalho"}',
 '{"Por que o operário continua apertando parafusos mesmo fora da fábrica?","O que a máquina de alimentação revela sobre a relação entre empresa e trabalhador?","A tecnologia liberta ou aprisiona quem trabalha?","Que semelhanças existem entre a linha de montagem e o trabalho por aplicativos?"}',
 '[{"etapa":"Problematização","tempo":"10 min","descricao":"Mostre a imagem de uma linha de montagem atual e pergunte: o que mudou desde o início do século XX?"},{"etapa":"Exibição","tempo":"87 min (ou trechos)","descricao":"Exiba o filme completo ou as sequências da fábrica e da máquina de alimentação."},{"etapa":"Conceito","tempo":"20 min","descricao":"Apresente as quatro dimensões da alienação: em relação ao produto, ao processo, a si mesmo e aos outros."},{"etapa":"Debate","tempo":"20 min","descricao":"Perguntas de debate em grupos, com registro em cartaz."}]',
 '[{"nome":"Ontem e hoje","descricao":"Os alunos entrevistam um familiar sobre sua rotina de trabalho e comparam com as cenas do filme."},{"nome":"Linha de montagem","descricao":"Dinâmica em sala: produção em série de dobraduras com tarefas fragmentadas, seguida de discussão sobre a experiência."}]',
 '[{"momento":"Abertura","observar":"A montagem que aproxima trabalhadores e um rebanho de ovelhas."},{"momento":"A linha de montagem","observar":"O ritmo imposto pela máquina sobre o corpo."},{"momento":"A máquina de alimentação","observar":"A tentativa de eliminar qualquer tempo improdutivo."},{"momento":"O final na estrada","observar":"A esperança possível fora da engrenagem."}]',
 '{"Por ser majoritariamente sem diálogos, o filme funciona bem com turmas que têm dificuldade com legendas.","Para o Ensino Médio, conecte com a discussão sobre plataformização do trabalho."}',
 '{"MARX, Karl. Manuscritos econômico-filosóficos.","WEBER, Max. A ética protestante e o espírito do capitalismo."}'),

-- SOCIEDADE DOS POETAS MORTOS -------------------------------------------
('sociedade-dos-poetas-mortos',
 $$Um filme sobre educação, autonomia e o preço de pensar diferente. Funciona para discutir o esclarecimento kantiano, a tensão entre tradição e liberdade e o próprio papel da escola.$$,
 '{Autonomia,Esclarecimento,Tradição e autoridade,Carpe diem,Desobediência}',
 '{Immanuel Kant,Henry David Thoreau,Horácio}',
 '{"Discutir o conceito de esclarecimento como saída da menoridade","Analisar a relação entre autoridade, tradição e liberdade individual","Refletir sobre os limites e responsabilidades da autonomia"}',
 '{"O professor Keating incentiva a autonomia ou impõe a sua própria visão aos alunos?","Pensar por conta própria é sempre seguro? Quem paga o preço?","Qual o papel da escola: transmitir tradição ou formar pensamento crítico?","O que significa, hoje, aproveitar o dia?"}',
 '[{"etapa":"Abertura","tempo":"10 min","descricao":"Pergunta disparadora: alguém já decidiu algo importante por você?"},{"etapa":"Exibição","tempo":"128 min (ou trechos)","descricao":"Exiba o filme ou as cenas da primeira aula, da caverna e do desfecho."},{"etapa":"Texto","tempo":"25 min","descricao":"Leitura do início de Resposta à pergunta: o que é o Esclarecimento?, de Kant."},{"etapa":"Debate","tempo":"25 min","descricao":"Debate guiado pelas perguntas, relacionando cada personagem à ideia de menoridade."}]',
 '[{"nome":"Carta a si mesmo","descricao":"Cada aluno escreve uma carta sobre uma escolha que gostaria de fazer com mais autonomia."},{"nome":"Júri dos personagens","descricao":"Grupos defendem ou acusam Keating, o diretor da escola e o pai de Neil."}]',
 '[{"momento":"A primeira aula","observar":"As fotografias dos antigos alunos e o convite ao carpe diem."},{"momento":"Subir na mesa","observar":"Mudar o ponto de vista como gesto filosófico."},{"momento":"A peça de teatro","observar":"O conflito entre desejo pessoal e expectativa familiar."},{"momento":"O desfecho","observar":"O gesto coletivo dos alunos e seu significado."}]',
 '{"O filme aborda suicídio. Prepare a turma, avise com antecedência e tenha à mão informações sobre o CVV (188).","Prefira exibir trechos com turmas mais jovens."}',
 '{"KANT, Immanuel. Resposta à pergunta: o que é o Esclarecimento?","THOREAU, Henry David. Walden."}'),

-- A ONDA ----------------------------------------------------------------
('a-onda',
 $$Mostra, em ritmo de suspense, como mecanismos autoritários podem surgir rapidamente em um grupo comum. Excelente para tratar de totalitarismo, conformidade e responsabilidade individual.$$,
 '{Autocracia,Totalitarismo,Conformidade social,Identidade de grupo,Responsabilidade}',
 '{Hannah Arendt,Max Weber}',
 '{"Compreender características de regimes autoritários","Identificar mecanismos de pressão de grupo e exclusão","Discutir a responsabilidade individual diante de movimentos coletivos"}',
 '{"Por que os alunos aderem tão rápido ao movimento?","Que símbolos e regras fortaleceram o grupo? Que preço tiveram?","Quem é responsável pelo desfecho: o professor, os alunos ou a escola?","Poderia acontecer algo parecido na nossa escola?"}',
 '[{"etapa":"Pergunta inicial","tempo":"10 min","descricao":"A turma responde anonimamente: uma ditadura poderia surgir hoje no Brasil?"},{"etapa":"Exibição","tempo":"107 min","descricao":"Exibição do filme."},{"etapa":"Conceito","tempo":"20 min","descricao":"Apresente traços do totalitarismo segundo Arendt: ideologia, terror, massa e isolamento."},{"etapa":"Debate","tempo":"25 min","descricao":"Retome as respostas anônimas iniciais e compare com o que o filme mostrou."}]',
 '[{"nome":"Linha do tempo da Onda","descricao":"Grupos reconstroem dia a dia a escalada do movimento, apontando o momento em que o experimento perdeu o controle."},{"nome":"Contra-argumentos","descricao":"Cada aluno escreve o que diria à turma no terceiro dia para interromper o movimento."}]',
 '[{"momento":"A escolha do tema","observar":"A crença inicial de que a autocracia é coisa do passado."},{"momento":"Uniforme e saudação","observar":"Símbolos que criam pertencimento e exclusão."},{"momento":"Os que recusam","observar":"Como o grupo trata quem não adere."},{"momento":"O discurso final","observar":"A virada e a reação dos alunos."}]',
 '{"O filme tem cenas de violência no desfecho; avalie a faixa etária da turma.","Evite reproduzir o experimento em sala: discuta-o."}',
 '{"ARENDT, Hannah. Origens do totalitarismo.","ARENDT, Hannah. Eichmann em Jerusalém."}'),

-- MATRIX ----------------------------------------------------------------
('matrix',
 $$Uma das formas mais eficazes de apresentar problemas clássicos da teoria do conhecimento: como sei que o mundo é real? Conecta Platão, Descartes e Baudrillard com uma linguagem que os alunos conhecem.$$,
 '{Aparência e realidade,Dúvida metódica,Simulacro,Livre-arbítrio,Conhecimento}',
 '{Platão,René Descartes,Jean Baudrillard}',
 '{"Relacionar a narrativa ao argumento do sonho e do gênio maligno de Descartes","Comparar a saída da Matrix com a saída da caverna","Introduzir o conceito de simulacro"}',
 '{"Se a experiência for idêntica, importa se o mundo é real?","Você tomaria a pílula vermelha ou a azul? Por quê?","Cypher prefere voltar à ilusão. Ele está errado?","Quais seriam as Matrix do nosso tempo?"}',
 '[{"etapa":"Experimento mental","tempo":"10 min","descricao":"Pergunte: como provar agora que você não está sonhando?"},{"etapa":"Exibição","tempo":"136 min (ou trechos)","descricao":"Exiba o filme ou as cenas da escolha das pílulas e do despertar."},{"etapa":"Texto","tempo":"20 min","descricao":"Leitura da Primeira Meditação de Descartes."},{"etapa":"Debate","tempo":"25 min","descricao":"Comparação entre Descartes, Platão e o filme em quadro de três colunas."}]',
 '[{"nome":"Três cavernas","descricao":"Os alunos montam um quadro comparativo entre a caverna de Platão, o gênio maligno de Descartes e a Matrix."},{"nome":"Pílula vermelha","descricao":"Texto argumentativo defendendo uma das escolhas com base em pelo menos um filósofo estudado."}]',
 '[{"momento":"O coelho branco","observar":"Referência a Alice e o convite a atravessar a aparência."},{"momento":"As pílulas","observar":"A escolha entre conforto e verdade."},{"momento":"O despertar","observar":"A dor da saída, como na caverna."},{"momento":"O jantar de Cypher","observar":"A defesa da ilusão como escolha consciente."}]',
 '{"Para turmas com menos tempo, a cena das pílulas sozinha já sustenta uma aula.","O filme tem muitas cenas de ação armada; selecione trechos conforme a turma."}',
 '{"PLATÃO. A República, livro VII.","DESCARTES, René. Meditações metafísicas.","BAUDRILLARD, Jean. Simulacros e simulação."}'),

-- O DILEMA DAS REDES ------------------------------------------------------
('o-dilema-das-redes',
 $$Documentário próximo da realidade dos alunos, que permite discutir economia da atenção, uso de dados e efeitos das redes na sociedade. Funciona como ponto de partida para pensamento crítico sobre tecnologia.$$,
 '{Economia da atenção,Capitalismo de vigilância,Algoritmos,Polarização,Modernidade líquida}',
 '{Shoshana Zuboff,Zygmunt Bauman}',
 '{"Compreender como plataformas digitais lucram com atenção e dados","Analisar efeitos sociais e políticos dos algoritmos","Desenvolver postura crítica em relação ao próprio uso das redes"}',
 '{"Se o serviço é gratuito, o que estamos pagando?","Os algoritmos apenas mostram o que queremos ou moldam o que queremos?","De quem é a responsabilidade: das empresas, dos governos ou dos usuários?","O documentário exagera em algum ponto? Que argumentos faltaram?"}',
 '[{"etapa":"Levantamento","tempo":"10 min","descricao":"Os alunos verificam o tempo de tela semanal no próprio celular (opcional e anônimo)."},{"etapa":"Exibição","tempo":"94 min","descricao":"Exibição do documentário."},{"etapa":"Conceito","tempo":"20 min","descricao":"Explique a ideia de capitalismo de vigilância e de economia da atenção."},{"etapa":"Debate crítico","tempo":"25 min","descricao":"Debate, incluindo a pergunta sobre o que o documentário deixou de fora."}]',
 '[{"nome":"Auditoria do feed","descricao":"Cada aluno analisa as 20 primeiras publicações do seu feed e classifica o que é anúncio, entretenimento, notícia e opinião."},{"nome":"Contrapontos","descricao":"Pesquisa de críticas ao documentário e produção de um parágrafo avaliando seus argumentos."}]',
 '[{"momento":"Entrevistas iniciais","observar":"Quem são os entrevistados e de onde falam."},{"momento":"A dramatização da família","observar":"O recurso ficcional como estratégia de convencimento."},{"momento":"Os algoritmos personificados","observar":"Como o filme torna visível o invisível."},{"momento":"Encerramento","observar":"As soluções propostas e seus limites."}]',
 '{"Trabalhe também a leitura crítica do próprio documentário: ele também quer convencer.","Evite tom moralista sobre o uso de celular; foque na estrutura econômica."}',
 '{"ZUBOFF, Shoshana. A era do capitalismo de vigilância.","BAUMAN, Zygmunt. Modernidade líquida."}'),

-- 12 HOMENS E UMA SENTENÇA -----------------------------------------------
('12-homens-e-uma-sentenca',
 $$Uma aula de argumentação em uma única sala. Permite trabalhar justiça, preconceito, dúvida razoável e a força do diálogo, além de lógica e falácias.$$,
 '{Justiça,Argumentação,Falácias,Preconceito,Dúvida razoável,Deliberação}',
 '{Sócrates,Platão,Hannah Arendt}',
 '{"Identificar argumentos, premissas e falácias nas falas dos jurados","Discutir a relação entre justiça, preconceito e opinião","Valorizar o diálogo racional como forma de decisão coletiva"}',
 '{"O jurado nº 8 sabe que o réu é inocente? O que ele realmente defende?","Que preconceitos influenciam o voto de cada jurado?","Unanimidade garante justiça?","Que semelhanças há entre o jurado nº 8 e Sócrates?"}',
 '[{"etapa":"Situação-problema","tempo":"10 min","descricao":"Apresente um caso simples e peça um veredito rápido da turma."},{"etapa":"Exibição","tempo":"96 min","descricao":"Exibição do filme."},{"etapa":"Análise","tempo":"25 min","descricao":"Grupos mapeiam argumentos e falácias de três jurados diferentes."},{"etapa":"Retomada","tempo":"15 min","descricao":"Volte ao caso inicial: a turma mudaria seu veredito com mais tempo de discussão?"}]',
 '[{"nome":"Caça às falácias","descricao":"Lista de falácias (ad hominem, apelo à emoção, generalização) para identificar nas falas do filme."},{"nome":"Júri simulado","descricao":"A turma delibera sobre um caso fictício seguindo regras de argumentação."}]',
 '[{"momento":"A primeira votação","observar":"A pressão da maioria e o voto isolado."},{"momento":"O canivete","observar":"A prova que parecia definitiva."},{"momento":"O discurso preconceituoso","observar":"A reação silenciosa dos outros jurados."},{"momento":"A última votação","observar":"O que realmente mudou na sala."}]',
 '{"O filme é em preto e branco e tem ritmo de teatro; contextualize antes da exibição.","Ótimo para avaliar argumentação escrita em seguida."}',
 '{"PLATÃO. Apologia de Sócrates.","ARENDT, Hannah. Verdade e política (em Entre o passado e o futuro)."}'),

-- A VIDA É BELA ---------------------------------------------------------
('a-vida-e-bela',
 $$Une humor e tragédia para tratar do Holocausto, da dignidade humana e da proteção da infância. Abre espaço para discutir memória histórica, direitos humanos e o sentido da vida diante do horror.$$,
 '{Dignidade humana,Holocausto,Memória,Banalidade do mal,Esperança}',
 '{Hannah Arendt,Primo Levi,Viktor Frankl}',
 '{"Contextualizar o Holocausto e a perseguição aos judeus na Segunda Guerra","Discutir a dignidade humana como fundamento dos direitos humanos","Refletir sobre os limites do humor diante da tragédia"}',
 '{"É legítimo usar humor para falar do Holocausto?","Guido mente para o filho. Essa mentira é moralmente justificável?","O que o filme nos diz sobre resistir quando não há saída?","Por que é importante preservar a memória desses acontecimentos?"}',
 '[{"etapa":"Contexto","tempo":"15 min","descricao":"Breve exposição sobre o fascismo italiano, as leis raciais e os campos de concentração."},{"etapa":"Exibição","tempo":"116 min","descricao":"Exibição do filme."},{"etapa":"Leitura","tempo":"20 min","descricao":"Leitura da Declaração Universal dos Direitos Humanos (artigos 1 a 5)."},{"etapa":"Debate","tempo":"25 min","descricao":"Debate com as perguntas propostas."}]',
 '[{"nome":"Carta de Giosuè","descricao":"Os alunos escrevem uma carta do filho, já adulto, sobre o que o pai fez por ele."},{"nome":"Memória viva","descricao":"Pesquisa sobre testemunhos de sobreviventes e museus do Holocausto."}]',
 '[{"momento":"Primeira parte","observar":"O tom de comédia romântica e os sinais do fascismo ao fundo."},{"momento":"O cavalo pintado","observar":"O antissemitismo entrando na vida privada."},{"momento":"A tradução das regras","observar":"O humor como escudo para a criança."},{"momento":"O desfecho","observar":"O sentido do título."}]',
 '{"Contextualize historicamente antes da exibição.","Esteja atento a alunos com histórias familiares ligadas a perseguições e guerras."}',
 '{"LEVI, Primo. É isto um homem?","FRANKL, Viktor. Em busca de sentido.","ARENDT, Hannah. Eichmann em Jerusalém.","ONU. Declaração Universal dos Direitos Humanos (1948)."}');

insert into pedagogical_guides (title_id, why_use, concepts, thinkers, objectives, debate_questions, lesson_plan, activities, analysis_script, approach_tips, references_list)
select t.id, f.why_use, f.concepts, f.thinkers, f.objectives, f.debate, f.plan, f.activities, f.analysis, f.tips, f.refs
from _fichas f join titles t on t.slug = f.slug
on conflict (title_id) do update set
  why_use = excluded.why_use, concepts = excluded.concepts, thinkers = excluded.thinkers,
  objectives = excluded.objectives, debate_questions = excluded.debate_questions,
  lesson_plan = excluded.lesson_plan, activities = excluded.activities,
  analysis_script = excluded.analysis_script, approach_tips = excluded.approach_tips,
  references_list = excluded.references_list, updated_at = now();

drop table if exists _fichas;


commit;

-- Pronto. Gere os códigos de acesso com: npm run codes -- gerar --quantidade 10
