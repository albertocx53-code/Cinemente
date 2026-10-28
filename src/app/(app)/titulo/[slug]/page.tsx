import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatDuration, getRelated, getTitle, recordView, TYPE_LABEL } from '@/lib/catalog';
import { requireProfile } from '@/lib/auth/session';
import { TitleArt } from '@/components/TitleArt';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ShareButton } from '@/components/ShareButton';
import { Rail } from '@/components/Rail';
import { TitleCard } from '@/components/TitleCard';
import { IconBook, IconCheck, IconExternal, IconFilm, IconPlay } from '@/components/icons';

const DISC: Record<string, string> = { filosofia: 'Filosofia', sociologia: 'Sociologia' };
const ROLE: Record<string, string> = { direcao: 'Direção', elenco: 'Elenco', participacao: 'Participação', roteiro: 'Roteiro', producao: 'Produção' };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTitle(slug, null);
  return t ? { title: t.title, description: t.synopsis.slice(0, 160) } : { title: 'Título não encontrado' };
}

export default async function TitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const { profile } = await requireProfile();
  const t = await getTitle(slug, profile.id);
  if (!t) notFound();
  const [related] = await Promise.all([getRelated(t.id, profile.id), recordView(profile.id, t.id)]);

  const byRole = (role: string) => t.credits.filter((c) => c.role === role).map((c) => c.name);
  const thinkers = t.categories.filter((c) => c.kind === 'pensador');
  const themes = t.categories.filter((c) => c.kind === 'tema' || c.kind === 'conceito');
  const g = t.guide;

  return (
    <>
      <section className="title-hero">
        <div className="hero-bg">
          <TitleArt title={t.title} art={t.art} seed={t.slug} imageUrl={t.backdrop_url} variant="fill" showText={false} />
        </div>
        <div className="hero-shade" />
        <div className="title-hero-inner">
          <TitleArt title={t.title} art={t.art} seed={t.slug} imageUrl={t.poster_url} />
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="meta">
              <span className="badge badge--red">{TYPE_LABEL[t.type]}</span>
              {t.year && <span>{t.year}</span>}
              {t.duration_min && <span className="dot-sep">{formatDuration(t.duration_min)}</span>}
              {t.country && <span className="dot-sep">{t.country}</span>}
              {t.age_rating_verified && t.age_rating && <span className="badge">{t.age_rating}</span>}
            </div>
            <div>
              <h1>{t.title}</h1>
              {t.original_title && t.original_title !== t.title && <p className="orig">Título original: {t.original_title}</p>}
            </div>
            <p className="lead">{t.synopsis}</p>
            <div className="hero-actions">
              {t.can_stream ? (
                <span className="badge badge--gold" style={{ padding: '8px 12px' }}><IconPlay width={14} height={14} />&nbsp;Exibição licenciada · player na Etapa 2</span>
              ) : t.sources.length > 0 ? (
                <a href="#onde-assistir" className="btn btn--white btn--lg"><IconExternal /> Onde assistir</a>
              ) : null}
              {g && <a href="#sala-de-aula" className="btn btn--red btn--lg"><IconBook /> Explore em sala de aula</a>}
              <FavoriteButton titleId={t.id} initial={t.in_list} variant="button" title={t.title} />
              <ShareButton title={t.title} path={`/titulo/${t.slug}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="page">
        <dl className="facts">
          {byRole('direcao').length > 0 && <div className="fact"><dt>{ROLE.direcao}</dt><dd>{byRole('direcao').join(', ')}</dd></div>}
          {byRole('elenco').length > 0 && <div className="fact"><dt>{ROLE.elenco}</dt><dd>{byRole('elenco').join(', ')}</dd></div>}
          {byRole('participacao').length > 0 && <div className="fact"><dt>{ROLE.participacao}</dt><dd>{byRole('participacao').join(', ')}</dd></div>}
          {t.genres.length > 0 && <div className="fact"><dt>Gênero</dt><dd>{t.genres.join(', ')}</dd></div>}
          {t.languages.length > 0 && <div className="fact"><dt>Idioma original</dt><dd>{t.languages.join(', ')}</dd></div>}
          {t.subtitles.length > 0 && <div className="fact"><dt>Legendas</dt><dd>{t.subtitles.join(', ')}</dd></div>}
          <div className="fact"><dt>Disciplinas</dt><dd>{t.disciplines.map((d) => DISC[d] ?? d).join(' e ')}</dd></div>
          {t.school_levels.length > 0 && <div className="fact"><dt>Faixa escolar recomendada</dt><dd>{t.school_levels.join(', ')}</dd></div>}
          <div className="fact">
            <dt>Classificação indicativa</dt>
            <dd>{t.age_rating_verified && t.age_rating ? t.age_rating : 'Confira no site oficial do ClassInd antes de exibir'}</dd>
          </div>
        </dl>

        <div className="availability" id="onde-assistir">
          <IconFilm />
          {t.can_stream ? (
            <p><strong>Disponível no CineMente.</strong> Licença: {t.license?.authorization_type} — {t.license?.rights_holder}{t.license?.valid_until ? `, válida até ${new Date(t.license.valid_until).toLocaleDateString('pt-BR')}` : ''}.</p>
          ) : (
            <p><strong>Este título não é exibido no CineMente</strong> porque não temos licença de reprodução. Consulte os serviços legais onde ele está disponível no momento.</p>
          )}
          {!t.can_stream && t.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn--ghost"><IconExternal /> {s.label}</a>
          ))}
        </div>

        {g && (
          <section className="classroom" id="sala-de-aula" aria-labelledby="sala-titulo">
            <div className="classroom-head">
              <p className="eyebrow" style={{ justifySelf: 'start' }}>Biblioteca pedagógica</p>
              <h2 id="sala-titulo">Explore este filme em sala de aula</h2>
              <p>{g.why_use}</p>
              <nav className="toc" aria-label="Seções da ficha">
                <a href="#objetivos">Objetivos</a>
                <a href="#conceitos">Conceitos e pensadores</a>
                <a href="#debate">Perguntas para debate</a>
                <a href="#plano">Plano de aula</a>
                {g.analysis_script.length > 0 && <a href="#roteiro">Roteiro de análise</a>}
                {g.activities.length > 0 && <a href="#atividades">Atividades</a>}
                {g.references_list.length > 0 && <a href="#referencias">Referências</a>}
              </nav>
            </div>

            <div className="two-col">
              <div className="block" id="objetivos">
                <h3>Objetivos de aprendizagem</h3>
                <ul className="checklist">
                  {g.objectives.map((o) => <li key={o}><IconCheck />{o}</li>)}
                </ul>
              </div>
              <div className="block" id="conceitos">
                <h3>Conceitos e pensadores</h3>
                <div className="chips" style={{ marginBottom: 14 }}>
                  {g.concepts.map((c) => <Link key={c} href={`/buscar?q=${encodeURIComponent(c)}`} className="chip">{c}</Link>)}
                </div>
                <div className="chips">
                  {(thinkers.length ? thinkers.map((c) => c.name) : g.thinkers).map((name) => (
                    <Link key={name} href={`/buscar?q=${encodeURIComponent(name)}`} className="chip chip--gold">{name}</Link>
                  ))}
                </div>
                {themes.length > 0 && (
                  <p className="note">Temas no catálogo: {themes.map((c) => c.name).join(' · ')}</p>
                )}
              </div>
            </div>

            <div className="block" id="debate">
              <h3>Perguntas para debate</h3>
              <div className="questions">
                {g.debate_questions.map((q) => <div key={q} className="question">{q}</div>)}
              </div>
            </div>

            <div className="block" id="plano">
              <h3>Plano de aula</h3>
              <ol className="timeline">
                {g.lesson_plan.map((s) => (
                  <li key={s.etapa}>
                    <span className="when">{s.tempo}</span>
                    <div className="what"><strong>{s.etapa}</strong><p>{s.descricao}</p></div>
                  </li>
                ))}
              </ol>
            </div>

            {g.analysis_script.length > 0 && (
              <div className="block" id="roteiro">
                <h3>Roteiro de análise cinematográfica</h3>
                <div className="cards-2">
                  {g.analysis_script.map((a) => (
                    <div key={a.momento} className="panel"><h4>{a.momento}</h4><p>{a.observar}</p></div>
                  ))}
                </div>
              </div>
            )}

            {g.activities.length > 0 && (
              <div className="block" id="atividades">
                <h3>Atividades</h3>
                <div className="cards-2">
                  {g.activities.map((a) => (
                    <div key={a.nome} className="panel"><h4>{a.nome}</h4><p>{a.descricao}</p></div>
                  ))}
                </div>
              </div>
            )}

            <div className="two-col">
              {g.approach_tips.length > 0 && (
                <div className="block">
                  <h3>Sugestões de abordagem</h3>
                  <ul className="checklist">{g.approach_tips.map((tip) => <li key={tip}><IconCheck />{tip}</li>)}</ul>
                </div>
              )}
              {g.references_list.length > 0 && (
                <div className="block" id="referencias">
                  <h3>Referências</h3>
                  <ul className="refs">{g.references_list.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              )}
            </div>
            <p className="note">Ficha elaborada por {g.author}. Arquivos para download (PDF, DOCX e slides) serão disponibilizados nesta seção à medida que forem publicados.</p>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <div className="rails rails--flat" style={{ marginTop: 56 }}>
          <Rail id="relacionados" title="Para continuar a conversa">
            {related.map((item) => <TitleCard key={item.id} item={item} />)}
          </Rail>
        </div>
      )}
    </>
  );
}
