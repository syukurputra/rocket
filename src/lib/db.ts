// src/lib/db.ts
import postgres, { Sql } from "postgres";

declare global {
  // biar tidak duplikat saat hot-reload
  // eslint-disable-next-line no-var
  var _sql: Sql<any> | undefined;
}

// Prefer DATABASE_URL kalau ada, fallback ke variabel terpisah
function createClient(): Sql<any> {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, {
      ssl:
        process.env.DATABASE_URL.includes("sslmode=require") ||
        process.env.DATABASE_SSL === "require"
          ? "require"
          : undefined,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30), // detik
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 30), // detik
      prepare: false, // aman untuk serverless/hot-reload
    });
  }

  return postgres({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.DATABASE_SSL === "require" ? "require" : undefined,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30),
    connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 30),
    prepare: false,
  });
}

// Reuse client di dev supaya tidak buat koneksi baru setiap HMR
export const sql: Sql<any> = globalThis._sql ?? (globalThis._sql = createClient());

export type { Sql } from "postgres";

// Util sederhana untuk tes koneksi
export async function pingNow() {
  const rows = await sql/*sql*/`SELECT NOW() AS now`;
  return rows[0]?.now as Date | undefined;
}
