import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql, assertDb } from "@/lib/db";

// POST /api/leads — público, salva lead e opcionalmente envia e-mail
// body: { name, email, phone, message, ref_code?, source? }
export async function POST(req: NextRequest) {
  try {
    assertDb();
    const body = await req.json();
    const { name, email, phone, message, ref_code, source } = body;

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Mensagem muito curta (mín 10)" }, { status: 400 });
    }

    const ref = ref_code || `ALTIOR-V01-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const src = source || "vault-checkout";

    await sql`
      INSERT INTO leads (name, email, phone, message, ref_code, source)
      VALUES (${name}, ${email}, ${phone}, ${message}, ${ref}, ${src})
    `;

    // E-mail: tenta Resend se tiver RESEND_API_KEY, senão só grava no banco
    // Diferença: FormSubmit = frontend direto, cai no spam; Resend = backend, entrega garantida
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "ALTIOR <noreply@altior.com>",
          to: process.env.OWNER_EMAIL || "henriqueu635@gmail.com",
          subject: `ALTIOR — Novo lead: ${name} (${email}) — ${ref}`,
          html: `<p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Tel:</strong> ${phone}</p><p><strong>Mensagem:</strong> ${message}</p><p>Ref: ${ref} — ${src}</p>`,
          replyTo: email,
        });
      } catch (e) {
        console.warn("Resend failed, lead já salvo:", e);
      }
    }

    return NextResponse.json({ ok: true, ref_code: ref }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/leads — só admin vê todos
export async function GET() {
  try {
    assertDb();
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (!userId || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
    }
    const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
