import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const current = rows[0];
    if (!current?.ownerPasswordHash) {
      return NextResponse.json({ ok: false, reason: "no_password_set" });
    }
    const ok = verifyPassword(password, current.ownerPasswordHash);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
