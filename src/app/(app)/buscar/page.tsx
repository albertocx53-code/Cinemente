import type { Metadata } from 'next';
import { searchTitles, type SearchFilters } from '@/lib/catalog';
import { requireProfile } from '@/lib/auth/session';
import { TitleCard } from '@/components/TitleCard';
import { IconSearch } from '@/components/icons';

export const metadata: Metadata = { title: 'Pesquisa' };

type SP = { q?: string; tipo?: string; disciplina?: string; duracao?: string; ordem?: string; guia?: string };

const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) => (allowed.includes(v as T) ? (v as T) : undefined);

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { profile } = await requireProfile();
  const filters: SearchFilters = {
    q: (sp.q ?? '').slice(0, 80),
    tipo: pick(sp.tipo, ['filme', 'documentario', 'curta', 'serie', 'videoaula'] as const),
    disciplina: pick(sp.disciplina, ['filosofia', 'sociologia'] as const),
    duracao: pick(sp.duracao, ['curta', 'media', 'longa'] as const),
    ordem: pick(sp.ordem, ['relevancia', 'recentes', 'populares'] as const) ?? 'relevancia',
    guia: sp.guia === '1',
  };
  const hasFilters = !!(filters.q || filters.tipo || filters.disciplina || filters.duracao || filters.guia);
  const results = await searchTitles(filters, profile.id);

  return (
    <>
      <div className="section-head">
        <h1>Pesquisa</h1>
        <p>Busque por título, diretor, filósofo, sociólogo, conceito ou tema.</p>
      </div>
      <form className="filters" method="get" role="search">
        <input className="input" name="q" defaultValue={filters.q} placeholder="Ex.: Platão, alienação, Peter Weir" aria-label="Termo de busca" />
        <select className="select" name="tipo" defaultValue={filters.tipo ?? ''} aria-label="Tipo de conteúdo">
          <option value="">Todos os tipos</option>
          <option value="filme">Filmes</option>
          <option value="documentario">Documentários</option>
          <option value="curta">Curtas</option>
          <option value="serie">Séries</option>
          <option value="videoaula">Videoaulas</option>
        </select>
        <select className="select" name="disciplina" defaultValue={filters.disciplina ?? ''} aria-label="Disciplina">
          <option value="">Filosofia e Sociologia</option>
          <option value="filosofia">Filosofia</option>
          <option value="sociologia">Sociologia</option>
        </select>
        <select className="select" name="duracao" defaultValue={filters.duracao ?? ''} aria-label="Duração">
          <option value="">Qualquer duração</option>
          <option value="curta">Até 40 min</option>
          <option value="media">41 a 100 min</option>
          <option value="longa">Mais de 100 min</option>
        </select>
        <select className="select" name="ordem" defaultValue={filters.ordem} aria-label="Ordenar por">
          <option value="relevancia">Mais relevantes</option>
          <option value="populares">Mais populares</option>
          <option value="recentes">Mais recentes</option>
        </select>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label className="check"><input type="checkbox" name="guia" value="1" defaultChecked={filters.guia} /> Com plano de aula</label>
          <button className="btn btn--red" type="submit"><IconSearch /> Buscar</button>
        </div>
      </form>

      {results.length === 0 ? (
        <div className="empty">
          <IconSearch />
          <h2>Nada encontrado</h2>
          <p>Tente outro termo ou remova alguns filtros.</p>
        </div>
      ) : (
        <>
          <p style={{ padding: '0 var(--gutter)', color: 'var(--muted)', margin: '0 0 14px' }}>
            {hasFilters ? `${results.length} resultado${results.length > 1 ? 's' : ''}` : 'Todo o catálogo'}
          </p>
          <div className="grid" style={{ paddingBottom: 60 }}>
            {results.map((item) => <TitleCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </>
  );
}
