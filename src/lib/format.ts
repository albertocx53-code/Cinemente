// Tipos e formatadores puros — seguros para componentes do navegador.

export type TitleArt = { motif?: string; c1?: string; c2?: string; accent?: string; kicker?: string };

export type TitleCard = {
  id: string;
  slug: string;
  type: 'filme' | 'documentario' | 'curta' | 'serie' | 'videoaula';
  title: string;
  tagline: string | null;
  synopsis: string;
  year: number | null;
  duration_min: number | null;
  disciplines: string[];
  genres: string[];
  art: TitleArt;
  poster_url: string | null;
  backdrop_url: string | null;
  age_rating: string | null;
  age_rating_verified: boolean;
  has_guide: boolean;
  in_list: boolean;
  can_stream: boolean;
  progress?: number | null;
};

export const TYPE_LABEL: Record<string, string> = {
  filme: 'Filme', documentario: 'Documentário', curta: 'Curta', serie: 'Série', videoaula: 'Videoaula',
};

export function formatDuration(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`;
}
