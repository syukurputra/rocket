// app/api/health/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic"; // hindari caching di edge

export async function GET() {
  try {
    const rows = await sql/*sql*/`SELECT 1 as ok`;
    const ok = rows?.[0]?.ok === 1;
    return NextResponse.json({ ok, db: "up" }, { status: 200 });
  } catch (err: any) {
    // JANGAN throw — balas 503 saja
    return NextResponse.json({
      DATABASE_HOST: process.env.DATABASE_HOST ?? null,
      DATABASE_PORT: process.env.DATABASE_PORT ?? null,
      DATABASE_SSL: process.env.DATABASE_SSL ?? null,
    });
  }
}
