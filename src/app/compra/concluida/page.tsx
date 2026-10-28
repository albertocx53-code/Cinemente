// Página de "compra concluída": mostra o código de acesso para quem acabou de comprar.
// Configure esta URL como "página de obrigado" na plataforma de vendas:
//   https://SEU-SITE/compra/concluida
// Se a plataforma enviar o número do pedido e o e-mail na URL, o código aparece direto.
// Senão, o comprador digita o e-mail e o número do pedido (que está no recibo da compra).
import Link from 'next/link';
import type { Metadata } from 'next';
import { getShowcase } from '@/lib/catalog';
import { lookupDelivery, type DeliveryLookup } from '@/lib/purchases';
import { isRateLimited, recordAttempt } from '@/lib/security/rate-limit';
import { getRequestInfo } from '@/lib/security/request';
import { Logo } from '@/components/brand';
import { Mosaic } from '@/components/Mosaic';
import { AutoRefresh, CopyCode } from '@/components/PurchaseWidgets';
import { IconChevronRight } from '@/components/icons';

export const metadata: Metadata = { title: 'Compra concluída', robots: { index: false } };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;
const first = (sp: SP, keys: string[]) => keys.map((k) => sp[k]).find((v) => v && v.trim())?.trim().slice(0, 120) ?? '';

export default async function PurchaseDonePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const pedido = first(sp, ['pedido', 'transaction', 'order_id', 'order', 'transacao']);
  const email = first(sp, ['email', 'buyer_email', 'e-mail']).toLowerCase();
  const showcase = await getShowcase(10);

  let found: DeliveryLookup | null = null;
  let limited = false;
  if (pedido && email) {
    const { ip } = await getRequestInfo();
    limited = await isRateLimited('compra-consulta', ip, 15, 15);
    if (!limited) {
      found = await lookupDelivery(pedido, email);
      if (found.estado === 'nao_encontrado') await recordAttempt('compra-consulta', ip, false);
    }
  }

  return (
    <div className="auth-page">
      <Mosaic items={showcase} />
      <div className="auth-top"><Logo href="/" /></div>
      <main id="conteudo" className="auth-card" style={{ width: 'min(540px, calc(100% - 32px))' }}>
        {found?.estado === 'pronto' ? (
          <>
            <p className="eyebrow" style={{ justifySelf: 'start' }}>Compra confirmada</p>
            <h1>{found.nome ? `Bem-vindo, ${found.nome.split(' ')[0]}!` : 'Bem-vindo ao CineMente!'}</h1>
            {found.ativado ? (
              <>
                <p className="lead">Este código já foi ativado. Entre com o e-mail e a senha que você cadastrou.</p>
                <div className="code-box" id="codigo-comprado">{found.codigo}</div>
                <Link href="/entrar" className="btn btn--red btn--block btn--lg">Entrar na plataforma</Link>
              </>
            ) : (
              <>
                <p className="lead">Este é o seu código individual de acesso. Ele também foi enviado para <strong>{found.email}</strong>.</p>
                <div className="code-box" id="codigo-comprado">{found.codigo}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href={`/ativar?codigo=${encodeURIComponent(found.codigo)}`} className="btn btn--red btn--lg" style={{ flex: '1 1 220px' }}>
                    Ativar meu acesso agora <IconChevronRight />
                  </Link>
                  <CopyCode code={found.codigo} />
                </div>
                <p className="auth-alt">Guarde este código. Ele é pessoal e só pode ser ativado uma vez.</p>
              </>
            )}
          </>
        ) : found?.estado === 'aguardando' ? (
          <>
            <p className="eyebrow" style={{ justifySelf: 'start' }}>Pagamento em confirmação</p>
            <h1>Quase lá!</h1>
            <p className="lead">Recebemos seu pedido e estamos aguardando a confirmação do pagamento. Assim que for aprovado, o código aparece aqui e chega no seu e-mail.</p>
            <div className="code-box code-box--wait" aria-hidden="true">CINE-····-····-····</div>
            <AutoRefresh />
          </>
        ) : found?.estado === 'cancelado' ? (
          <>
            <h1>Pedido não aprovado</h1>
            <p className="lead">Este pedido foi cancelado, recusado ou estornado, por isso não há código de acesso disponível. Se acredita que é um engano, fale com o suporte.</p>
            <Link href="/ajuda" className="btn btn--white btn--block">Central de ajuda</Link>
          </>
        ) : (
          <>
            <p className="eyebrow" style={{ justifySelf: 'start' }}>Obrigado pela compra</p>
            <h1>Pegue seu código de acesso</h1>
            {limited ? (
              <div className="form-error" role="alert">Muitas tentativas. Aguarde 15 minutos e tente de novo, ou confira o código no seu e-mail.</div>
            ) : found?.estado === 'nao_encontrado' ? (
              <div className="form-error" role="alert">
                Ainda não encontramos uma compra com esses dados. Se acabou de pagar, aguarde alguns segundos e tente de novo. Confira se o e-mail é o mesmo usado na compra.
              </div>
            ) : (
              <p className="lead">Informe o e-mail usado na compra e o número do pedido, que está no recibo enviado pela plataforma de pagamento.</p>
            )}
            <form method="get" style={{ display: 'grid', gap: 14 }}>
              <div className="field">
                <label htmlFor="email">E-mail da compra</label>
                <input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={email} />
              </div>
              <div className="field">
                <label htmlFor="pedido">Número do pedido</label>
                <input id="pedido" name="pedido" className="input" required autoComplete="off" defaultValue={pedido} placeholder="Ex.: HP1234567890" />
              </div>
              <button className="btn btn--red btn--block btn--lg">Mostrar meu código</button>
            </form>
            {found?.estado === 'nao_encontrado' && <AutoRefresh seconds={8} maxTries={8} />}
            <p className="auth-alt">O código também chega por e-mail em alguns minutos. Já tem conta? <Link href="/entrar">Entrar</Link></p>
          </>
        )}
      </main>
    </div>
  );
}
