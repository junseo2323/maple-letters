import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [updated] = await db
      .update(messages)
      .set({ hearts: sql`${messages.hearts} + 1` })
      .where(eq(messages.id, id))
      .returning({ hearts: messages.hearts });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ hearts: updated.hearts });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
