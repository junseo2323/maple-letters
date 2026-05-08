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
      customSubtitle: s.customSubtitle ?? null,
      customCta: s.customCta ?? null,
      customWriteTitle: s.customWriteTitle ?? null,
      customWriteDesc: s.customWriteDesc ?? null,
      customLockedMsg: s.customLockedMsg ?? null,
      customShareText: s.customShareText ?? null,
      defaultLang: s.defaultLang ?? "en",
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
    const d = parsed.data;
    if (d.paperName !== undefined) updates.paperName = d.paperName;
    if (d.newPassword) updates.ownerPasswordHash = hashPassword(d.newPassword);
    if (d.customSubtitle !== undefined) updates.customSubtitle = d.customSubtitle || null;
    if (d.customCta !== undefined) updates.customCta = d.customCta || null;
    if (d.customWriteTitle !== undefined) updates.customWriteTitle = d.customWriteTitle || null;
    if (d.customWriteDesc !== undefined) updates.customWriteDesc = d.customWriteDesc || null;
    if (d.customLockedMsg !== undefined) updates.customLockedMsg = d.customLockedMsg || null;
    if (d.customShareText !== undefined) updates.customShareText = d.customShareText || null;
    if (d.defaultLang !== undefined) updates.defaultLang = d.defaultLang;

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
