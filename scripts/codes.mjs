// Gerenciamento de códigos de acesso pela linha de comando.
//
//   npm run codes -- gerar --quantidade 10 [--perfis 3] [--email comprador@x.com] [--obs "Lote outubro"]
//   npm run codes -- listar [--arquivo]
//   npm run codes -- revogar --codigo CINE-XXXX-XXXX-XXXX
//
// "gerar" mostra os códigos na tela E salva uma planilha em codigos/ (abre no Excel ou Google Planilhas).
// Essa planilha é a ÚNICA cópia dos códigos completos: no banco fica apenas o hash.
// A pasta codigos/ está no .gitignore e nunca vai para o GitHub.
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect, arg } from './_db.mjs';
import { generateCode, hashCode, normalizeCode } from '../src/lib/security/core.mjs';

function requirePepper() {
  const pepper = process.env.CODE_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error('CODE_PEPPER ausente ou curto no .env.local. Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return pepper;
}

export async function generateCodes(db, { count = 1, profiles = 3, email = null, notes = null } = {}) {
  const pepper = requirePepper();
  const plan = (await db.query(`select id from plans where slug = 'vitalicio'`)).rows[0];
  const codes = [];
  await db.tx(async (t) => {
    for (let i = 0; i < count; i++) {
      const code = generateCode();
      const { rows } = await t.query(
        `insert into activation_codes (code_hash, code_hint, plan_id, buyer_email, max_profiles, notes)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [hashCode(code, pepper), code.slice(-4), plan?.id ?? null, email, profiles, notes],
      );
      await t.query(`insert into code_events (code_id, event, details) values ($1, 'created', $2)`, [rows[0].id, JSON.stringify({ via: 'cli' })]);
      codes.push(code);
    }
  });
  return codes;
}

// ---------------------------------------------------------------------
// Planilha CSV no padrão brasileiro (separador ";" e BOM para o Excel ler acentos)
// ---------------------------------------------------------------------
const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function writeCsv(prefix, header, rows) {
  const dir = resolve(process.cwd(), 'codigos');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(/[: ]/g, '-').slice(0, 16);
  const file = resolve(dir, `${prefix}-${stamp}.csv`);
  const body = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  writeFileSync(file, '﻿' + body + '\r\n', 'utf8');
  return file;
}

const STATUS = { available: 'Disponível', activated: 'Ativado', revoked: 'Revogado', suspended: 'Suspenso' };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '');

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  const db = await connect();
  try {
    if (cmd === 'gerar') {
      const profiles = Number(arg('perfis', 3)) || 3;
      const email = arg('email', null) || null;
      const notes = arg('obs', null) || null;
      const codes = await generateCodes(db, { count: Math.min(Number(arg('quantidade', 1)) || 1, 1000), profiles, email, notes });
      const today = fmt(new Date());
      const file = writeCsv(
        'lote',
        ['Nº', 'Código', 'Perfis', 'Comprador (e-mail)', 'Observação', 'Gerado em', 'Entregue para', 'Data de entrega'],
        codes.map((c, i) => [i + 1, c, profiles, email, notes, today, '', '']),
      );
      console.log('\nCódigos gerados:\n');
      codes.forEach((c, i) => console.log(`  ${String(i + 1).padStart(3)}  ${c}`));
      console.log(`\nPlanilha salva em: ${file}`);
      console.log('Guarde essa planilha em lugar seguro: é a única cópia dos códigos completos.\n');
    } else if (cmd === 'listar') {
      const { rows } = await db.query(
        `select c.code_hint, c.status, c.buyer_email, c.max_profiles, c.notes, c.created_at, c.activated_at, u.email as ativado_por
         from activation_codes c left join users u on u.id = c.activated_by_user_id
         order by c.created_at desc limit 1000`,
      );
      const table = rows.map((r) => ({
        final: '…' + r.code_hint,
        status: STATUS[r.status] ?? r.status,
        perfis: r.max_profiles,
        comprador: r.buyer_email ?? '',
        'ativado por': r.ativado_por ?? '',
        criado: fmt(r.created_at),
        ativado: fmt(r.activated_at),
      }));
      console.table(table.slice(0, 50));
      const resumo = rows.reduce((acc, r) => ((acc[STATUS[r.status] ?? r.status] = (acc[STATUS[r.status] ?? r.status] || 0) + 1), acc), {});
      console.log('Resumo:', Object.entries(resumo).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'nenhum código');
      if (arg('arquivo', false)) {
        const file = writeCsv(
          'situacao',
          ['Final do código', 'Status', 'Perfis', 'Comprador (e-mail)', 'Ativado por', 'Observação', 'Gerado em', 'Ativado em'],
          rows.map((r) => ['…' + r.code_hint, STATUS[r.status] ?? r.status, r.max_profiles, r.buyer_email, r.ativado_por, r.notes, fmt(r.created_at), fmt(r.activated_at)]),
        );
        console.log(`Planilha salva em: ${file}`);
      }
    } else if (cmd === 'revogar') {
      const canonical = normalizeCode(String(arg('codigo', '')));
      if (!canonical) throw new Error('Informe --codigo no formato CINE-XXXX-XXXX-XXXX');
      const h = hashCode(canonical, requirePepper());
      await db.tx(async (t) => {
        const { rows } = await t.query(`update activation_codes set status = 'revoked', revoked_at = now() where code_hash = $1 returning id`, [h]);
        if (!rows[0]) throw new Error('Código não encontrado.');
        await t.query(`update licenses set status = 'revoked', revoked_at = now() where code_id = $1`, [rows[0].id]);
        await t.query(`insert into code_events (code_id, event, details) values ($1, 'revoked', '{"via":"cli"}')`, [rows[0].id]);
      });
      console.log('Código revogado. Licenças vinculadas também foram revogadas.');
    } else {
      console.log('Uso:\n  npm run codes -- gerar --quantidade 10\n  npm run codes -- listar [--arquivo]\n  npm run codes -- revogar --codigo CINE-XXXX-XXXX-XXXX');
    }
  } catch (e) {
    console.error('\n✗ ' + e.message + '\n');
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
