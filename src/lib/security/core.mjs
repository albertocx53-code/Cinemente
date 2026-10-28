// Núcleo criptográfico do CineMente.
// Arquivo .mjs puro para ser usado tanto pelo app (Next.js) quanto pelos
// scripts de linha de comando (gerar códigos, criar admin), sem compilação.
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

// Sem 0/O e 1/I para evitar confusão na digitação. 32 símbolos = 5 bits cada.
export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 12; // 60 bits de entropia

/** Gera um código no formato CINE-XXXX-XXXX-XXXX. */
export function generateCode() {
  const bytes = randomBytes(CODE_LENGTH);
  let raw = '';
  for (const b of bytes) raw += CODE_ALPHABET[b & 31]; // 256 é múltiplo de 32: sem viés
  return `CINE-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/**
 * Normaliza o que o usuário digitou. Aceita minúsculas, espaços, sem hífens
 * e com ou sem o prefixo CINE. Retorna null se o formato for inválido.
 */
export function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === CODE_LENGTH + 4 && s.startsWith('CINE')) s = s.slice(4);
  if (s.length !== CODE_LENGTH) return null;
  for (const ch of s) if (!CODE_ALPHABET.includes(ch)) return null;
  return `CINE-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

/** O código nunca é salvo em texto puro: guardamos HMAC-SHA256 com um segredo do servidor. */
export function hashCode(canonicalCode, pepper) {
  if (!pepper || pepper.length < 32) throw new Error('CODE_PEPPER ausente ou curto demais (mínimo 32 caracteres).');
  return createHmac('sha256', pepper).update(canonicalCode).digest('hex');
}

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${Buffer.from(key).toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return expected.length === key.length && timingSafeEqual(expected, Buffer.from(key));
}

/** Token aleatório para sessão / recuperação. Só o hash vai para o banco. */
export function randomToken() {
  return randomBytes(32).toString('base64url');
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
