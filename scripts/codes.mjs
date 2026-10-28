// Gerenciamento de códigos de acesso pela linha de comando.
import { pathToFileURL } from 'node:url';
//
//   npm run codes -- gerar --quantidade 10 [--perfis 3] [--email comprador@x.com] [--obs "Lote outubro"]
//   npm run codes -- listar
//   npm run codes -- revogar --codigo CINE-XXXX-XXXX-XXXX
//
// Os códigos aparecem UMA ÚNICA VEZ na tela. No banco fica apenas o hash.
import { connect, arg } from './_db.mjs';
import { generateCode, hashCode, normalizeCode } from '../src/lib/security/core.mjs';

export async function generateCodes(db, { count = 1, profiles = 3, email = null, notes = null } = {}) {
  const pepper = process.env.CODE_PEPPER;
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  const db = await connect();
  try {
    if (cmd === 'gerar') {
      const codes = await generateCodes(db, {
        count: Math.min(Number(arg('quantidade', 1)) || 1, 1000),
        profiles: Number(arg('perfis', 3)) || 3,
        email: arg('email', null) || null,
        notes: arg('obs', null) || null,
      });
      console.log('\nCódigos gerados (guarde agora — não serão exibidos de novo):\n');
      for (const c of codes) console.log('  ' + c);
      console.log('');
    } else if (cmd === 'listar') {
      const { rows } = await db.query(
        `select '…' || code_hint as final, status, buyer_email, max_profiles, created_at::date as criado, activated_at::date as ativado
         from activation_codes order by created_at desc limit 50`,
      );
      console.table(rows);
    } else if (cmd === 'revogar') {
      const canonical = normalizeCode(String(arg('codigo', '')));
      if (!canonical) throw new Error('Informe --codigo no formato CINE-XXXX-XXXX-XXXX');
      const h = hashCode(canonical, process.env.CODE_PEPPER);
      await db.tx(async (t) => {
        const { rows } = await t.query(`update activation_codes set status = 'revoked', revoked_at = now() where code_hash = $1 returning id`, [h]);
        if (!rows[0]) throw new Error('Código não encontrado.');
        await t.query(`update licenses set status = 'revoked', revoked_at = now() where code_id = $1`, [rows[0].id]);
        await t.query(`insert into code_events (code_id, event, details) values ($1, 'revoked', '{"via":"cli"}')`, [rows[0].id]);
      });
      console.log('Código revogado. Licenças vinculadas também foram revogadas.');
    } else {
      console.log('Uso: npm run codes -- gerar --quantidade 5 | listar | revogar --codigo CINE-XXXX-XXXX-XXXX');
    }
  } finally {
    await db.close();
  }
}
