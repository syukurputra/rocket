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
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        code: err?.code ?? null,
        message:
          err?.message?.slice?.(0, 200) ?? "db connection failed",
      },
      { status: 503 }
    );
  }
}
