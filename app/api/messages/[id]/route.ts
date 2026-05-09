import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, settings } from "@/lib/schema";
import { verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Owner gate — must be unlocked
    const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const current = rows[0];
    const ownerHeader = req.headers.get("x-owner-password");
    const isOwner =
      !!current?.ownerPasswordHash && verifyPassword(ownerHeader, current.ownerPasswordHash);

    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning({ id: messages.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
