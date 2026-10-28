import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';

export const metadata: Metadata = { title: 'Termos de uso' };

export default function TermsPage() {
  return (
    <PublicShell>
      <h1>Termos de uso</h1>
      <p className="callout">Modelo inicial. Revise este texto com um profissional do Direito antes de iniciar as vendas.</p>

      <h2>1. O serviço</h2>
      <p>O CineMente é uma plataforma digital de apoio pedagógico para professores, com catálogo audiovisual, fichas pedagógicas e materiais didáticos.</p>

      <h2>2. Acesso e licença</h2>
      <p>O acesso é liberado mediante código individual adquirido por pagamento único. A licença é pessoal e intransferível, vinculada à conta que ativou o código, com o número de perfis informado na compra. É proibido compartilhar, revender ou divulgar o código e a conta.</p>

      <h2>3. Conteúdos de terceiros</h2>
      <p>Filmes e documentários pertencem aos seus titulares. O CineMente só exibe obras com licença de exibição. Quando não há licença, a plataforma apresenta apenas a ficha pedagógica e indica onde a obra pode ser assistida legalmente. A exibição pública em sala de aula é de responsabilidade do professor e da instituição, que devem observar a legislação aplicável.</p>

      <h2>4. Materiais pedagógicos</h2>
      <p>Os materiais do CineMente podem ser usados pelo titular da licença em suas aulas. Não é permitido redistribuí-los publicamente ou comercializá-los.</p>

      <h2>5. Suspensão e revogação</h2>
      <p>O acesso pode ser suspenso ou revogado em caso de estorno, chargeback, fraude ou violação destes termos.</p>

      <h2>6. Acesso vitalício</h2>
      <p>“Vitalício” refere-se à duração da licença enquanto a plataforma estiver em operação, nos termos da oferta comercial vigente no momento da compra.</p>
    </PublicShell>
  );
}
