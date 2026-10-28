// /api/saude — diagnóstico da configuração, sem revelar segredos.
// Mostra se as variáveis existem e se o banco responde. Nunca mostra senhas ou chaves.
import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

function dbHost() {
  try {
    const u = new URL(process.env.DATABASE_URL || '');
    return { host: u.hostname, porta: u.port || '5432', senha_preenchida: !!u.password && !/YOUR-PASSWORD/i.test(u.password) };
  } catch {
    return null;
  }
}

export async function GET() {
  const config = {
    DATABASE_URL: process.env.DATABASE_URL ? 'definido' : 'FALTANDO',
    DATABASE_SSL: process.env.DATABASE_SSL ?? 'FALTANDO',
    CODE_PEPPER: process.env.CODE_PEPPER ? (process.env.CODE_PEPPER.length >= 32 ? 'definido' : 'CURTO DEMAIS') : 'FALTANDO',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'FALTANDO',
  };
  let banco: Record<string, unknown>;
  try {
    const r = await queryOne<{ titulos: number; codigos: number }>(
      `select (select count(*)::int from titles) as titulos, (select count(*)::int from activation_codes) as codigos`,
    );
    banco = { status: 'conectado', ...r };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    banco = {
      status: 'ERRO',
      codigo: err.code ?? null,
      mensagem: (err.message ?? '').replace(/postgres(ql)?:\/\/[^\s]+/gi, '[endereço oculto]').slice(0, 200),
    };
  }
  const ok = banco.status === 'conectado' && config.CODE_PEPPER === 'definido';
  return NextResponse.json({ ok, config, servidor_do_banco: dbHost(), banco }, { status: ok ? 200 : 500, headers: { 'Cache-Control': 'no-store' } });
}