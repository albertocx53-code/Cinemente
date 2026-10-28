import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSection, SECTIONS, type SectionKey } from '@/lib/catalog';
import { requireProfile } from '@/lib/auth/session';
import { Rail } from '@/components/Rail';
import { TitleCard } from '@/components/TitleCard';
import { IconClapper, IconList } from '@/components/icons';

const INTRO: Partial<Record<SectionKey, string>> = {
  filmes: 'Longas-metragens selecionados para discutir grandes questões em sala.',
  series: 'Coleções em episódios para aulas sequenciais.',
  documentarios: 'Documentários para conectar teoria e realidade.',
  curtas: 'Obras curtas que cabem em uma aula de 50 minutos.',
  videoaulas: 'Aulas em vídeo produzidas pela equipe CineMente.',
  filosofia: 'Do mito da caverna à ética contemporânea.',
  sociologia: 'Trabalho, cultura, poder e vida em sociedade.',
  materiais: 'Títulos com ficha pedagógica completa: plano de aula, debate e atividades.',
  'minha-lista': 'O que você salvou para usar nas próximas aulas.',
};

export async function generateMetadata({ params }: { params: Promise<{ secao: string }> }): Promise<Metadata> {
  const { secao } = await params;
  return { title: SECTIONS[secao as SectionKey]?.label ?? 'Catálogo' };
}

export default async function SectionPage({ params }: { params: Promise<{ secao: string }> }) {
  const { secao } = await params;
  if (!Object.hasOwn(SECTIONS, secao)) notFound();
  const key = secao as SectionKey;
  const { profile } = await requireProfile();
  const data = await getSection(key, profile.id);

  return (
    <>
      <div className="section-head">
        <h1>{data.label}</h1>
        <p>{INTRO[key]}</p>
      </div>
      {data.items.length === 0 ? (
        <div className="empty">
          {key === 'minha-lista' ? <IconList /> : <IconClapper />}
          <h2>{key === 'minha-lista' ? 'Sua lista está vazia' : 'Em preparação'}</h2>
          <p>
            {key === 'minha-lista'
              ? 'Use o botão + em qualquer título para guardar aqui.'
              : 'Ainda não há títulos publicados nesta seção. Assim que forem cadastrados no painel, aparecem aqui automaticamente.'}
          </p>
          <Link href="/navegar" className="btn btn--white">Voltar ao início</Link>
        </div>
      ) : (
        <>
          <div className="grid" style={{ paddingBottom: 40 }}>
            {data.items.map((item) => <TitleCard key={item.id} item={item} />)}
          </div>
          {key !== 'minha-lista' && data.rails.length > 1 && (
            <div className="rails rails--flat">
              {data.rails.map((r) => (
                <Rail key={r.slug} id={`${key}-${r.slug}`} title={r.name}>
                  {r.items.map((item) => <TitleCard key={item.id} item={item} />)}
                </Rail>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
