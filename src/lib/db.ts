// Acesso ao banco — SOMENTE no servidor.
// Produção: PostgreSQL/Supabase via DATABASE_URL.
// Desenvolvimento sem DATABASE_URL: PGlite (Postgres embutido) em .data/pglite.
import path from 'node:path';

type Row = Record<string, any>;
export interface Queryable {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
interface Db extends Queryable {
  tx<T>(fn: (c: Queryable) => Promise<T>): Promise<T>;
}

const g = globalThis as unknown as { __cinementeDb?: Promise<Db> };

async function create(): Promise<Db> {
  if (typeof window !== 'undefined') throw new Error('db.ts não pode ser usado no navegador');
  const url = process.env.DATABASE_URL;

  if (url) {
    const pg = (await import('pg')).default;
    const pool = new pg.Pool({
      connectionString: url,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
    });
    return {
      query: (sql, params) => pool.query(sql, params as any[]) as any,
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query('begin');
          const out = await fn({ query: (s, p) => client.query(s, p as any[]) as any });
          await client.query('commit');
          return out;
        } catch (e) {
          await client.query('rollback');
          throw e;
        } finally {
          client.release();
        }
      },
    };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL é obrigatório em produção.');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.resolve(process.cwd(), process.env.PGLITE_DIR || '.data/pglite');
  const db = new PGlite(dir);
  await db.waitReady;
  return {
    query: (sql, params) => db.query(sql, params as any[]) as any,
    tx: (fn) => db.transaction((t) => fn({ query: (s, p) => t.query(s, p as any[]) as any })),
  };
}

function getDb(): Promise<Db> {
  if (!g.__cinementeDb) g.__cinementeDb = create();
  return g.__cinementeDb;
}

export async function query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return (await db.query<T>(sql, params)).rows;
}

export async function queryOne<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

export async function transaction<T>(fn: (c: Queryable) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.tx(fn);
}
