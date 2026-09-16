import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql, assertDb } from "@/lib/db";

// POST /api/listings/:id/approve — admin aprova pending -> approved
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDb();
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
    }
    const { id } = await params;
    const rows = await sql`UPDATE listings SET status='approved' WHERE id=${id} RETURNING *`;
    if (rows.length === 0) return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
