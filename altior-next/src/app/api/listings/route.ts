import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql, assertDb } from "@/lib/db";

// GET /api/listings?status=approved  — público (só approved)
// GET /api/listings?status=pending   — admin (precisa role)
// GET /api/listings?status=all       — admin
export async function GET(req: NextRequest) {
  try {
    assertDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "approved";

    if (status === "approved") {
      const rows = await sql`SELECT * FROM listings WHERE status='approved' ORDER BY lot_number ASC`;
      return NextResponse.json(rows);
    }

    // pending / all → exige admin
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
    }
    if (status === "pending") {
      const rows = await sql`SELECT * FROM listings WHERE status='pending' ORDER BY created_at DESC`;
      return NextResponse.json(rows);
    }
    // all
    const rows = await sql`SELECT * FROM listings ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/listings — cria com status 'pending' (só admin)
export async function POST(req: NextRequest) {
  try {
    assertDb();
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
    }
    const body = await req.json();
    const { id, name, location, category, price, specs, image_url, lot_number, tag } = body;
    if (!name || !location || !price || !specs) {
      return NextResponse.json({ error: "Campos obrigatórios: name, location, price, specs" }, { status: 400 });
    }
    const slug = (id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)) as string;
    const img = image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop";
    const lot = lot_number || "Lot --";
    const cat = category || "ocean";
    const t = tag || "Vault Only";

    await sql`
      INSERT INTO listings (id, name, location, category, price, specs, image_url, lot_number, tag, status)
      VALUES (${slug}, ${name}, ${location}, ${cat}, ${Number(price)}, ${specs}, ${img}, ${lot}, ${t}, 'pending')
    `;
    return NextResponse.json({ ok: true, id: slug }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // duplicate id
    if (msg.includes("duplicate") || msg.includes("already exists")) {
      return NextResponse.json({ error: "Já existe um imóvel com esse id. Mude o nome." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
