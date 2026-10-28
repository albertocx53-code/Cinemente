import type { Metadata } from 'next';
import { getFeatured, getHomeRails } from '@/lib/catalog';
import { requireProfile } from '@/lib/auth/session';
import { HeroBanner } from '@/components/HeroBanner';
import { Rail } from '@/components/Rail';
import { TitleCard } from '@/components/TitleCard';

export const metadata: Metadata = { title: 'Início' };

const SEE_ALL: Record<string, string> = {
  filosofia: '/navegar/filosofia', sociologia: '/navegar/sociologia', documentarios: '/navegar/documentarios',
  curtas: '/navegar/curtas', videoaulas: '/navegar/videoaulas', 'com-guia': '/navegar/materiais', 'minha-lista': '/navegar/minha-lista',
};

export default async function HomePage() {
  const { profile } = await requireProfile();
  const [featured, rails] = await Promise.all([getFeatured(profile.id), getHomeRails(profile.id)]);

  return (
    <>
      <HeroBanner items={featured} />
      <div className={`rails${featured.length ? '' : ' rails--flat'}`} style={featured.length ? undefined : { paddingTop: 'calc(var(--header-h) + 30px)' }}>
        {rails.map((r) => (
          <Rail key={r.slug} id={r.slug} title={r.name} href={SEE_ALL[r.slug]}>
            {r.items.map((item, i) => (
              <TitleCard key={item.id} item={item} rank={r.ranked ? i + 1 : undefined} wide={r.slug === 'continuar'} />
            ))}
          </Rail>
        ))}
      </div>
    </>
  );
}
