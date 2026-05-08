import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, updateSettingsSchema } from "@/lib/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOrCreateSettings() {
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db
    .insert(settings)
    .values({ id: 1, paperName: "Maple Letters", ownerPasswordHash: null })
    .returning();
  return created;
}

export async function GET() {
  try {
    const s = await getOrCreateSettings();
    return NextResponse.json({
      paperName: s.paperName,
      hasPassword: !!s.ownerPasswordHash,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const current = await getOrCreateSettings();
    const ownerHeader = req.headers.get("x-owner-password");
    const isOwner =
      !current.ownerPasswordHash ||
      verifyPassword(ownerHeader, current.ownerPasswordHash) ||
      verifyPassword(parsed.data.currentPassword, current.ownerPasswordHash);

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: Partial<typeof settings.$inferInsert> = {};
    if (parsed.data.paperName !== undefined) updates.paperName = parsed.data.paperName;
    if (parsed.data.newPassword) updates.ownerPasswordHash = hashPassword(parsed.data.newPassword);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, paperName: current.paperName });
    }

    const [updated] = await db.update(settings).set(updates).where(eq(settings.id, 1)).returning();
    return NextResponse.json({
      ok: true,
      paperName: updated.paperName,
      hasPassword: !!updated.ownerPasswordHash,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
