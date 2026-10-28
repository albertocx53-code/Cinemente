// Consultas do catálogo. Todas as vitrines vêm do banco.
import { query, queryOne } from '@/lib/db';
import type { TitleCard } from '@/lib/format';
export type { TitleArt, TitleCard } from '@/lib/format';
export { TYPE_LABEL, formatDuration } from '@/lib/format';

export type Rail = { slug: string; name: string; ranked: boolean; items: TitleCard[] };

/** Publicado, ou agendado com data já alcançada. */
const PUBLISHED = `(t.status = 'published' or (t.status = 'scheduled' and t.publish_at <= now()))`;

/** Licença válida hoje + vídeo pronto = pode reproduzir. */
const CAN_STREAM = `(
  exists (select 1 from content_licenses cl where cl.title_id = t.id and cl.can_stream
          and (cl.valid_from is null or cl.valid_from <= current_date)
          and (cl.valid_until is null or cl.valid_until >= current_date))
  and exists (select 1 from videos v where v.title_id = t.id and v.kind in ('principal','videoaula') and v.status = 'ready')
)`;

/** Colunas do card. $1 = id do perfil (ou null). */
const CARD_COLUMNS = `
  t.id, t.slug, t.type, t.title, t.tagline, t.synopsis, t.year, t.duration_min, t.disciplines, t.genres,
  t.art, t.poster_url, t.backdrop_url, t.age_rating, t.age_rating_verified,
  exists (select 1 from pedagogical_guides g where g.title_id = t.id) as has_guide,
  exists (select 1 from favorites f where f.title_id = t.id and f.profile_id = $1::uuid) as in_list,
  ${CAN_STREAM} as can_stream`;

/** Remove acentos para a busca funcionar com "etica" ou "ética". */
const fold = (expr: string) =>
  `translate(lower(${expr}), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')`;

export async function getFeatured(profileId: string | null): Promise<TitleCard[]> {
  return query<TitleCard>(
    `select ${CARD_COLUMNS} from titles t where ${PUBLISHED} and t.featured order by t.featured_order nulls last, t.popularity desc limit 6`,
    [profileId],
  );
}

/** Títulos públicos para a vitrine da página de entrada (sem dados de perfil). */
export async function getShowcase(limit = 10): Promise<TitleCard[]> {
  return query<TitleCard>(
    `select ${CARD_COLUMNS} from titles t where ${PUBLISHED} order by t.popularity desc limit $2`,
    [null, limit],
  );
}

async function railItems(source: string, value: string | null, profileId: string | null): Promise<TitleCard[]> {
  const base = `select ${CARD_COLUMNS} from titles t where ${PUBLISHED}`;
  switch (source) {
    case 'destaque':
      return query(`${base} and t.featured order by t.featured_order nulls last limit 20`, [profileId]);
    case 'em_alta':
      return query(`${base} order by t.popularity desc limit 10`, [profileId]);
    case 'recentes':
      return query(`${base} order by t.created_at desc limit 20`, [profileId]);
    case 'disciplina':
      return query(`${base} and $2 = any(t.disciplines) order by t.popularity desc limit 30`, [profileId, value]);
    case 'tipo':
      return query(`${base} and t.type = $2 order by t.popularity desc limit 30`, [profileId, value]);
    case 'categoria':
      return query(
        `${base} and exists (select 1 from title_categories tc join categories c on c.id = tc.category_id
                             where tc.title_id = t.id and c.slug = $2)
         order by t.popularity desc limit 30`,
        [profileId, value],
      );
    case 'com_guia':
      return query(`${base} and exists (select 1 from pedagogical_guides g where g.title_id = t.id) order by t.popularity desc limit 30`, [profileId]);
    case 'manual':
      return query(
        `select ${CARD_COLUMNS} from rail_items ri join titles t on t.id = ri.title_id
         where ri.rail_id = (select id from rails where slug = $2) and ${PUBLISHED} order by ri.position`,
        [profileId, value],
      );
    case 'minha_lista':
      if (!profileId) return [];
      return query(
        `select ${CARD_COLUMNS} from favorites f join titles t on t.id = f.title_id
         where f.profile_id = $1 and ${PUBLISHED} order by f.created_at desc limit 40`,
        [profileId],
      );
    case 'continuar':
      if (!profileId) return [];
      return query(
        `select ${CARD_COLUMNS},
                round(100.0 * pp.position_sec / nullif(pp.duration_sec, 0)) as progress
         from (select distinct on (title_id) * from playback_progress
               where profile_id = $1 and not completed and position_sec > 30 and title_id is not null
               order by title_id, updated_at desc) pp
         join titles t on t.id = pp.title_id
         where ${PUBLISHED} order by pp.updated_at desc limit 20`,
        [profileId],
      );
    case 'recomendados':
      return getRecommendations(profileId);
    default:
      return [];
  }
}

/**
 * Recomendação por regras (sem IA):
 *  +3 por categoria em comum com títulos salvos/visitados pelo perfil
 *  +2 se a disciplina bate com a preferência do perfil
 *  + popularidade como desempate (funciona para perfis novos, sem histórico)
 */
export async function getRecommendations(profileId: string | null): Promise<TitleCard[]> {
  return query<TitleCard>(
    `with seeds as (
        select title_id from favorites where profile_id = $1::uuid and title_id is not null
        union
        select title_id from playback_history where profile_id = $1::uuid and title_id is not null
     ),
     prefs as (
        select coalesce(array(select jsonb_array_elements_text(p.preferences -> 'disciplinas')
                              from profiles p where p.id = $1::uuid), '{}'::text[]) as d
     )
     select ${CARD_COLUMNS},
       ( 3 * (select count(*) from title_categories a join title_categories b on b.category_id = a.category_id
              where a.title_id = t.id and b.title_id in (select title_id from seeds))
       + case when t.disciplines && (select d from prefs) then 2 else 0 end
       + t.popularity / 100.0 ) as score
     from titles t
     where ${PUBLISHED}
       and t.id not in (select title_id from favorites where profile_id = $1::uuid and title_id is not null)
     order by score desc limit 20`,
    [profileId],
  );
}

export async function getHomeRails(profileId: string | null): Promise<Rail[]> {
  const rails = await query<{ slug: string; name: string; source: string; source_value: string | null; ranked: boolean }>(
    `select slug, name, source, source_value, ranked from rails where active order by position`,
  );
  const filled = await Promise.all(
    rails.map(async (r) => ({ slug: r.slug, name: r.name, ranked: r.ranked, items: await railItems(r.source, r.source_value, profileId) })),
  );
  return filled.filter((r) => r.items.length > 0);
}

// ---------------------------------------------------------------------
// Seções do menu
// ---------------------------------------------------------------------
export const SECTIONS = {
  filmes:        { label: 'Filmes',               where: `t.type = 'filme'` },
  series:        { label: 'Séries educativas',    where: `t.type = 'serie'` },
  documentarios: { label: 'Documentários',        where: `t.type = 'documentario'` },
  curtas:        { label: 'Curtas',               where: `t.type = 'curta'` },
  videoaulas:    { label: 'Videoaulas',           where: `t.type = 'videoaula'` },
  filosofia:     { label: 'Filosofia',            where: `'filosofia' = any(t.disciplines)` },
  sociologia:    { label: 'Sociologia',           where: `'sociologia' = any(t.disciplines)` },
  materiais:     { label: 'Materiais pedagógicos', where: `exists (select 1 from pedagogical_guides g where g.title_id = t.id)` },
  'minha-lista': { label: 'Minha lista',          where: `exists (select 1 from favorites f where f.title_id = t.id and f.profile_id = $1::uuid)` },
} as const;
export type SectionKey = keyof typeof SECTIONS;

export async function getSection(key: SectionKey, profileId: string | null) {
  const s = SECTIONS[key];
  const items = await query<TitleCard>(
    `select ${CARD_COLUMNS} from titles t where ${PUBLISHED} and ${s.where} order by t.popularity desc`,
    [profileId],
  );
  // agrupa por tema para a seção parecer uma vitrine, não uma lista
  const themes = await query<{ slug: string; name: string }>(`select slug, name from categories where kind in ('tema','colecao') order by name`);
  const byTheme = await Promise.all(
    themes.map(async (c) => ({
      slug: c.slug,
      name: c.name,
      ranked: false,
      items: items.length
        ? await query<TitleCard>(
            `select ${CARD_COLUMNS} from titles t
             where ${PUBLISHED} and ${s.where}
               and exists (select 1 from title_categories tc join categories c on c.id = tc.category_id where tc.title_id = t.id and c.slug = $2)
             order by t.popularity desc`,
            [profileId, c.slug],
          )
        : [],
    })),
  );
  return { label: s.label, items, rails: byTheme.filter((r) => r.items.length > 0) };
}

// ---------------------------------------------------------------------
// Página do título
// ---------------------------------------------------------------------
export type TitleDetail = TitleCard & {
  original_title: string | null;
  country: string | null;
  languages: string[];
  subtitles: string[];
  school_levels: string[];
  credits: { name: string; role: string }[];
  categories: { slug: string; name: string; kind: string }[];
  sources: { label: string; url: string; kind: string }[];
  license: { rights_holder: string; authorization_type: string; valid_until: string | null; can_download: boolean } | null;
  guide: {
    why_use: string; concepts: string[]; thinkers: string[]; objectives: string[]; debate_questions: string[];
    lesson_plan: { etapa: string; tempo: string; descricao: string }[];
    activities: { nome: string; descricao: string }[];
    analysis_script: { momento: string; observar: string }[];
    approach_tips: string[]; references_list: string[]; author: string;
  } | null;
};

export async function getTitle(slug: string, profileId: string | null): Promise<TitleDetail | null> {
  const t = await queryOne<any>(
    `select ${CARD_COLUMNS}, t.original_title, t.country, t.languages, t.subtitles, t.school_levels
     from titles t where t.slug = $2 and ${PUBLISHED}`,
    [profileId, slug],
  );
  if (!t) return null;
  const [credits, categories, sources, license, guide] = await Promise.all([
    query(`select p.name, c.role from title_credits c join people p on p.id = c.person_id where c.title_id = $1 order by c.role, c.position`, [t.id]),
    query(`select c.slug, c.name, c.kind from title_categories tc join categories c on c.id = tc.category_id where tc.title_id = $1 order by c.kind, c.name`, [t.id]),
    query(`select label, url, kind from watch_sources where title_id = $1 order by position`, [t.id]),
    queryOne(
      `select rights_holder, authorization_type, valid_until::text, can_download from content_licenses
       where title_id = $1 and (valid_from is null or valid_from <= current_date) and (valid_until is null or valid_until >= current_date)
       order by can_stream desc limit 1`,
      [t.id],
    ),
    queryOne(`select * from pedagogical_guides where title_id = $1`, [t.id]),
  ]);
  return { ...t, credits, categories, sources, license, guide } as TitleDetail;
}

export async function getRelated(titleId: string, profileId: string | null): Promise<TitleCard[]> {
  return query<TitleCard>(
    `select ${CARD_COLUMNS},
       (select count(*) from title_categories a join title_categories b on b.category_id = a.category_id
        where a.title_id = t.id and b.title_id = $2) as shared
     from titles t where ${PUBLISHED} and t.id <> $2
     order by shared desc, t.popularity desc limit 12`,
    [profileId, titleId],
  );
}

export async function recordView(profileId: string, titleId: string) {
  await query(`insert into playback_history (profile_id, title_id, event) values ($1, $2, 'view_details')`, [profileId, titleId]);
}

// ---------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------
export type SearchFilters = {
  q?: string;
  tipo?: string;
  disciplina?: string;
  guia?: boolean;
  duracao?: 'curta' | 'media' | 'longa';
  ordem?: 'relevancia' | 'recentes' | 'populares';
};

const SEARCH_HAYSTACK = `(
  coalesce(t.title,'') || ' ' || coalesce(t.original_title,'') || ' ' || coalesce(t.synopsis,'') || ' ' ||
  array_to_string(t.genres, ' ') || ' ' || array_to_string(t.disciplines, ' ') || ' ' ||
  coalesce((select string_agg(c.name, ' ') from title_categories tc join categories c on c.id = tc.category_id where tc.title_id = t.id), '') || ' ' ||
  coalesce((select string_agg(p.name, ' ') from title_credits cr join people p on p.id = cr.person_id where cr.title_id = t.id), '') || ' ' ||
  coalesce((select array_to_string(g.concepts || g.thinkers, ' ') from pedagogical_guides g where g.title_id = t.id), '')
)`;

export async function searchTitles(f: SearchFilters, profileId: string | null): Promise<TitleCard[]> {
  const params: unknown[] = [profileId];
  const where: string[] = [PUBLISHED];
  let rank = 't.popularity';

  const q = (f.q || '').trim().slice(0, 80);
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const term of terms) {
      params.push(`%${term.replace(/[%_\\]/g, '\\$&')}%`);
      where.push(`${fold(SEARCH_HAYSTACK)} like ${fold(`$${params.length}`)}`);
    }
    params.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`);
    rank = `(case when ${fold('t.title')} like ${fold(`$${params.length}`)} then 1000 else 0 end + t.popularity)`;
  }
  if (f.tipo) { params.push(f.tipo); where.push(`t.type = $${params.length}`); }
  if (f.disciplina) { params.push(f.disciplina); where.push(`$${params.length} = any(t.disciplines)`); }
  if (f.guia) where.push(`exists (select 1 from pedagogical_guides g where g.title_id = t.id)`);
  if (f.duracao === 'curta') where.push(`t.duration_min <= 40`);
  if (f.duracao === 'media') where.push(`t.duration_min between 41 and 100`);
  if (f.duracao === 'longa') where.push(`t.duration_min > 100`);

  const order = f.ordem === 'recentes' ? 't.year desc nulls last' : f.ordem === 'populares' ? 't.popularity desc' : `${rank} desc`;
  return query<TitleCard>(`select ${CARD_COLUMNS} from titles t where ${where.join(' and ')} order by ${order} limit 60`, params);
}

export type Suggestion = { label: string; href: string; kind: 'titulo' | 'pensador' | 'conceito' | 'tema' };

export async function getSuggestions(q: string): Promise<Suggestion[]> {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return [];
  const like = `%${term.replace(/[%_\\]/g, '\\$&')}%`;
  const [titles, cats] = await Promise.all([
    query<{ title: string; slug: string }>(
      `select t.title, t.slug from titles t where ${PUBLISHED}
         and (${fold('t.title')} like ${fold('$1')} or ${fold("coalesce(t.original_title,'')")} like ${fold('$1')})
       order by t.popularity desc limit 5`,
      [like],
    ),
    query<{ name: string; kind: string }>(
      `select name, kind from categories where ${fold('name')} like ${fold('$1')} order by kind, name limit 5`,
      [like],
    ),
  ]);
  return [
    ...titles.map((t) => ({ label: t.title, href: `/titulo/${t.slug}`, kind: 'titulo' as const })),
    ...cats.map((c) => ({
      label: c.name,
      href: `/buscar?q=${encodeURIComponent(c.name)}`,
      kind: (c.kind === 'pensador' ? 'pensador' : c.kind === 'conceito' ? 'conceito' : 'tema') as Suggestion['kind'],
    })),
  ];
}

