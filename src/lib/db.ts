import postgres, { Sql } from "postgres";

declare global {
  // biar tidak duplikat saat hot-reload
  // eslint-disable-next-line no-var
  var _sql: Sql<any> | undefined;
}

// Prefer DATABASE_URL kalau ada, fallback ke variabel terpisah
function createClient() {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, {
      ssl: process.env.DATABASE_URL.includes("sslmode=require") || process.env.DATABASE_SSL === "require" ? "require" : undefined,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30), // detik
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 30), // detik
      prepare: false, // aman untuk serverless
    });
  }

  return postgres({
    host: process.env.DATABASE_HOST,
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

export const sql: Sql = global._sql ?? createClient();
if (!global._sql) global._sql = sql;
