// npm run admin:create -- --email voce@exemplo.com --nome "Seu nome" --senha "senha-forte-aqui"
// Cria (ou promove) uma conta de administrador. O painel administrativo chega na Etapa 4.
import { connect, arg } from './_db.mjs';
import { hashPassword } from '../src/lib/security/core.mjs';

const email = String(arg('email', '')).trim().toLowerCase();
const name = String(arg('nome', 'Administrador'));
const password = String(arg('senha', ''));
if (!email.includes('@') || password.length < 12) {
  console.error('Informe --email e --senha (mínimo 12 caracteres).');
  process.exit(1);
}

const db = await connect();
try {
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `insert into users (email, name, password_hash, role) values ($1, $2, $3, 'admin')
     on conflict ((lower(email))) do update set role = 'admin', password_hash = excluded.password_hash
     returning id`,
    [email, name, hash],
  );
  await db.query(`insert into security_events (user_id, type, details) values ($1, 'admin_created', '{"via":"cli"}')`, [rows[0].id]);
  console.log(`Administrador pronto: ${email}`);
} finally {
  await db.close();
}
