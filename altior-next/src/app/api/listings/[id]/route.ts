import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql, assertDb } from "@/lib/db";

// DELETE /api/listings/:id — admin remove
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDb();
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await sql`DELETE FROM listings WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/listings/:id — admin edita
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertDb();
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const fields = ["name", "location", "category", "price", "specs", "image_url", "lot_number", "tag"] as const;
    const updates: string[] = [];
    const values: unknown[] = [];
    for (const f of fields) if (body[f] !== undefined) { updates.push(f); values.push(body[f]); }
    if (updates.length === 0) return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    // update dinâmico simples — reconstrói
    // Para manter simples, faz um UPDATE por campo (poucos campos, sem performance crítica)
    for (const f of updates) {
      await sql.unsafe(`UPDATE listings SET ${f} = $1 WHERE id = $2`, [body[f], id]);
    }
    const rows = await sql`SELECT * FROM listings WHERE id=${id}`;
    return NextResponse.json(rows[0]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
