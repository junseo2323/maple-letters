import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-shot owner password reset gated by RESET_TOKEN env var.
// Remove this file after use.
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-reset-token");
  const expected = process.env.RESET_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body?.password;
  if (!password || password.length < 4) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  // Ensure settings row exists
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows.length === 0) {
    await db
      .insert(settings)
      .values({ id: 1, paperName: "Maple Letters", ownerPasswordHash: hashPassword(password) });
  } else {
    await db
      .update(settings)
      .set({ ownerPasswordHash: hashPassword(password) })
      .where(eq(settings.id, 1));
  }

  return NextResponse.json({ ok: true });
}
