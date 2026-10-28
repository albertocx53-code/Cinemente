// Campo de código da página de entrada: envia para /ativar (a validação acontece lá, no servidor).
import { IconChevronRight } from './icons';

export function CodeForm({ id }: { id: string }) {
  return (
    <form action="/ativar" method="get" className="lp-code">
      <label htmlFor={id} className="sr-only">Código de acesso</label>
      <input id={id} name="codigo" className="input input--code" placeholder="CINE-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} maxLength={24} />
      <button type="submit" className="btn btn--red btn--lg">Ativar meu acesso <IconChevronRight /></button>
    </form>
  );
}
