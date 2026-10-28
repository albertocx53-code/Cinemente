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
