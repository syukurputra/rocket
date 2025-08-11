// src/lib/db.ts
import postgres from 'postgres';

declare global {
  // Hindari duplikasi saat hot-reload di dev
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return postgres(url, {
      // Koyeb Postgres biasanya perlu SSL
      ssl: 'require',
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30),
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 30),
      prepare: false,
    });
  }

  return postgres({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === 'require' ? 'require' : undefined,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30),
    connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 30),
    prepare: false,
  });
}

export const sql = globalThis.__sql ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__sql = sql;
}

// Tipe aman tanpa impor dari package
export type Sql = ReturnType<typeof postgres>;
