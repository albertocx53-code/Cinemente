import Link from 'next/link';
import { getShowcase } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth/session';
import { Logo, SLOGAN, SiteFooter } from '@/components/brand';
import { Mosaic } from '@/components/Mosaic';
import { CodeForm } from '@/components/CodeForm';
import { TitleArt } from '@/components/TitleArt';
import { IconBook, IconChat, IconInfinity, IconShield } from '@/components/icons';

export const dynamic = 'force-dynamic';

const FAQ = [
  {
    q: 'O que é o CineMente?',
    a: [
      'O CineMente é uma plataforma no estilo streaming feita para professores de Filosofia e Sociologia. Cada filme ou documentário do catálogo vem acompanhado de uma ficha pedagógica original: objetivos, conceitos, pensadores, perguntas para debate, plano de aula, roteiro de análise e atividades.',
    ],
  },
  {
    q: 'Quanto custa? Tem mensalidade?',
    a: ['Não tem mensalidade. O acesso é por pagamento único, com acesso vitalício conforme os termos de compra. O valor atualizado é informado na página de compra.'],
  },
  {
    q: 'Os filmes podem ser assistidos dentro da plataforma?',
    a: [
      'Somente quando o CineMente tem licença para exibir a obra — nesses casos aparece o botão "Assistir". Quando não há licença, mostramos a ficha pedagógica completa e indicamos onde assistir de forma legal. Nunca exibimos filmes sem autorização.',
    ],
  },
  {
    q: 'Como ativo meu código?',
    a: [
      'Depois da compra você recebe um código individual no formato CINE-XXXX-XXXX-XXXX. Digite o código no campo desta página, crie sua conta com e-mail e senha, e pronto: nas próximas vezes basta entrar com e-mail e senha.',
    ],
  },
  {
    q: 'Posso usar em mais de um dispositivo?',
    a: ['Sim. Você entra com sua conta no computador, no celular ou no tablet. Cada licença permite criar perfis separados, cada um com sua lista e seu histórico.'],
  },
  {
    q: 'Os materiais servem para quais turmas?',
    a: ['As fichas indicam a faixa escolar recomendada para cada título, com foco no Ensino Médio. Sempre confira a classificação indicativa oficial antes de exibir uma obra em sala.'],
  },
];

export default async function LandingPage() {
  const [user, showcase] = await Promise.all([getCurrentUser(), getShowcase(10)]);
  const top = showcase.slice(0, 10);

  return (
    <>
      <header className="lp-header">
        <Logo size="md" />
        <nav aria-label="Acesso">
          <Link href="/ajuda" className="btn btn--ghost">Ajuda</Link>
          {user ? (
            <Link href="/perfis" className="btn btn--red">Acessar plataforma</Link>
          ) : (
            <Link href="/entrar" className="btn btn--red">Entrar</Link>
          )}
        </nav>
      </header>

      <main id="conteudo">
        <section className="lp-hero">
          <Mosaic items={showcase} />
          <div className="lp-hero-content">
            <p className="eyebrow">Para professores de Filosofia e Sociologia</p>
            <h1>Filmes que viram <em>aulas</em>.<br />Aulas que viram <em>debate</em>.</h1>
            <p className="lp-sub">
              Catálogo curado, fichas pedagógicas, planos de aula e perguntas prontas para a sua turma.{' '}
              <strong>Pagamento único. Acesso vitalício.</strong>
            </p>
            <p className="lp-hint">Já comprou? Digite seu código individual para ativar o acesso.</p>
            <CodeForm id="codigo-topo" />
            <p className="lp-login">
              Já ativou? <Link href="/entrar">Acessar plataforma</Link>
            </p>
          </div>
        </section>

        <div className="lp-curve" aria-hidden="true" />

        {top.length > 0 && (
          <section className="lp-section" aria-labelledby="em-alta">
            <h2 id="em-alta">Em alta nas salas de aula</h2>
            <div className="top10">
              {top.map((t, i) => (
                <Link key={t.id} href={`/titulo/${t.slug}`} className="top10-item" aria-label={`${i + 1}º ${t.title}`}>
                  <span className="top10-num" aria-hidden="true">{i + 1}</span>
                  <TitleArt title={t.title} art={t.art} seed={t.slug} imageUrl={t.poster_url} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="lp-section" aria-labelledby="motivos">
          <h2 id="motivos">Mais motivos para usar o <span>CineMente</span></h2>
          <div className="reasons">
            <article className="reason">
              <h3>A aula já vem pronta</h3>
              <p>Cada título traz objetivos, conceitos, pensadores, plano de aula com tempos e roteiro de análise cena a cena.</p>
              <IconBook />
            </article>
            <article className="reason">
              <h3>Debates que funcionam</h3>
              <p>Perguntas pensadas para provocar a turma e ligar o filme a Platão, Marx, Arendt, Kant, Bauman e muitos outros.</p>
              <IconChat />
            </article>
            <article className="reason">
              <h3>Tudo dentro da lei</h3>
              <p>Só exibimos o que tem licença. Para os demais títulos, indicamos onde assistir legalmente — sem pirataria.</p>
              <IconShield />
            </article>
            <article className="reason">
              <h3>Pague uma vez, use sempre</h3>
              <p>Sem mensalidade. Seu código individual libera o acesso vitalício, com perfis separados e sua própria lista.</p>
              <IconInfinity />
            </article>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="como">
          <h2 id="como">Como funciona</h2>
          <div className="steps">
            <div className="step"><h3>Faça a compra</h3><p>Pagamento único na página oficial de vendas do CineMente.</p></div>
            <div className="step"><h3>Receba seu código</h3><p>Um código individual, só seu, chega no seu e-mail após a confirmação do pagamento.</p></div>
            <div className="step"><h3>Ative e dê a aula</h3><p>Ative o código, crie seu perfil e leve o cinema para a sala de aula.</p></div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="faq">
          <h2 id="faq">Perguntas frequentes</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div>{f.a.map((p) => <p key={p}>{p}</p>)}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-section lp-cta">
          <p className="slogan" style={{ fontSize: 30 }}>{SLOGAN}</p>
          <p>Recebeu seu código? Ative agora e comece a usar.</p>
          <CodeForm id="codigo-rodape" />
          {process.env.NEXT_PUBLIC_CHECKOUT_URL && (
            <a href={process.env.NEXT_PUBLIC_CHECKOUT_URL} className="btn btn--ghost" rel="noopener">Ainda não tenho acesso — quero comprar</a>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
