// src/app/api/health/route.ts
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await sql/*sql*/`SELECT NOW() AS now`;

  return Response.json({ ok: true, now: rows[0]?.now });
}
