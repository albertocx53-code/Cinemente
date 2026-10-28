import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';

export const metadata: Metadata = { title: 'Política de privacidade' };

export default function PrivacyPage() {
  return (
    <PublicShell>
      <h1>Política de privacidade</h1>
      <p className="callout">Modelo inicial alinhado à LGPD. Revise com um profissional do Direito e complete com os dados do controlador antes de publicar.</p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li>Conta: nome, e-mail e senha (guardada apenas em formato criptográfico irreversível).</li>
        <li>Licença: código de ativação (guardado como hash), data de ativação e dados da compra recebidos do checkout.</li>
        <li>Uso: perfis, lista salva, títulos visitados e progresso de reprodução, para personalizar recomendações.</li>
        <li>Segurança: endereço IP e navegador nas tentativas de login e ativação, para prevenir fraudes.</li>
      </ul>

      <h2>Para que usamos</h2>
      <p>Para liberar e manter seu acesso, personalizar o catálogo, prevenir abusos e cumprir obrigações legais. Não vendemos seus dados.</p>

      <h2>Cookies</h2>
      <p>Usamos apenas cookies essenciais: um para manter sua sessão e outro para lembrar o perfil escolhido. Não usamos cookies de publicidade.</p>

      <h2>Seus direitos</h2>
      <p>Você pode pedir acesso, correção ou exclusão dos seus dados pelo canal de suporte.</p>
    </PublicShell>
  );
}
