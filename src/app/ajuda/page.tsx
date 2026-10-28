import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';

export const metadata: Metadata = { title: 'Central de ajuda' };

export default function HelpPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <PublicShell>
      <h1>Central de ajuda</h1>
      <p>Tudo o que você precisa para começar a usar o CineMente.</p>

      <h2 id="ativacao">Como ativar meu código</h2>
      <ol>
        <li>Após a confirmação do pagamento, você recebe um código individual no formato <strong>CINE-XXXX-XXXX-XXXX</strong>.</li>
        <li>Acesse <Link href="/ativar">a página de ativação</Link> e digite o código. Pode ser em letras minúsculas e sem hífens.</li>
        <li>Crie sua conta com nome, e-mail e senha. O código fica vinculado a essa conta.</li>
        <li>Nas próximas vezes, basta <Link href="/entrar">entrar com e-mail e senha</Link>. Não é preciso digitar o código de novo.</li>
      </ol>
      <p className="callout">Cada código é individual e só pode ser ativado uma vez. Se aparecer a mensagem de que o código já foi usado, entre com o e-mail cadastrado na primeira ativação.</p>

      <h2 id="acesso">Esqueci minha senha / perdi o acesso</h2>
      <p>
        A recuperação automática por e-mail será ativada junto com o serviço de envio de e-mails da plataforma.
        Enquanto isso, {support ? <>escreva para <a href={`mailto:${support}`}>{support}</a></> : 'fale com o suporte pelo canal informado na sua compra'} informando o e-mail da conta e os quatro últimos caracteres do seu código.
        Nossa equipe confirma seus dados e libera um novo acesso.
      </p>

      <h2>Os filmes passam dentro da plataforma?</h2>
      <p>Somente os títulos com licença de exibição. Para os demais, o CineMente oferece a ficha pedagógica completa e indica serviços legais onde o filme pode ser assistido.</p>

      <h2>Perfis</h2>
      <p>Sua licença permite criar alguns perfis (por exemplo, um para cada escola ou disciplina). Cada perfil tem sua própria lista e recomendações.</p>

      <h2>Instalar no celular</h2>
      <p>No Android (Chrome), toque no menu ⋮ e em “Instalar app” ou “Adicionar à tela inicial”. No iPhone (Safari), toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
    </PublicShell>
  );
}
