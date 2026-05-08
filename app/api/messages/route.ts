import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, settings, insertMessageSchema, type PublicMessage } from "@/lib/schema";
import { verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isOwner(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("x-owner-password");
  if (!header) return false;
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return verifyPassword(header, rows[0]?.ownerPasswordHash);
}

export async function GET(req: NextRequest) {
  try {
    const owner = await isOwner(req);
    const all = await db.select().from(messages);

    if (owner) {
      return NextResponse.json(all);
    }

    const stripped: PublicMessage[] = all.map((m) => {
      const { content, ...rest } = m;
      return { ...rest, hasContent: !!content };
    });
    return NextResponse.json(stripped);
  } catch {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = insertMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.cell, parsed.data.cell))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "cell_taken" }, { status: 409 });
    }

    const [created] = await db.insert(messages).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // Postgres unique violation race
    if ((e as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "cell_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
