"use client";
import { useEffect, useState } from "react";

type Listing = {
  id: string;
  name: string;
  location: string;
  category: string;
  price: number;
  specs: string;
  image_url: string;
  lot_number: string;
  tag: string;
  status: string;
};

export default function VendasPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [cart, setCart] = useState<Map<string, Listing>>(new Map());
  const [filter, setFilter] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/listings?status=approved")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setListings(d))
      .catch(() => setListings([]));
  }, []);

  const filtered = listings.filter((l) => filter === "all" || l.category === filter);
  const total = Array.from(cart.values()).reduce((s, v) => s + Number(v.price), 0);
  const fmt = (n: number) => "$" + (n / 1000000).toFixed(1) + "M";

  function toggleCart(l: Listing) {
    const m = new Map(cart);
    if (m.has(l.id)) m.delete(l.id); else m.set(l.id, l);
    setCart(m);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name) return setError("Informe seu nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Email inválido");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Telefone inválido");
    if (form.message.length < 10) return setError("Conte um pouco sobre você (mín 10)");

    const ref = `ALTIOR-V01-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ref_code: ref, source: "vault-checkout" }),
    });
    const j = await res.json();
    if (!res.ok) return setError(j.error || "Erro ao enviar");
    setSuccess(ref);
    setCart(new Map());
    setShowCheckout(false);
  }

  return (
    <div style={{ background: "#070709", color: "#ECE7DD", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400&family=JetBrains+Mono:wght@300&display=swap');
        :root{--gold:#C9B07A;--off:#ECE7DD;--stone:#9A9590;--line:rgba(255,255,255,0.06);--panel:#0E0E11}
        .wrap{max-width:1440px;margin:0 auto;padding:0 clamp(20px,4vw,72px)}
        header{position:sticky;top:0;z-index:20;height:64px;display:flex;align-items:center;border-bottom:1px solid var(--line);background:rgba(7,7,9,0.72);backdrop-filter:blur(20px)}
        .hero{padding:40px 0}
        .hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(2.8rem,6vw,5rem);font-weight:300;line-height:0.9}
        .hero-title em{font-style:italic;color:var(--gold)}
        .lot{position:relative;display:grid;grid-template-columns:1.15fr 0.85fr;gap:0;background:var(--panel);border:1px solid var(--line);margin-bottom:2px}
        .lot-media{aspect-ratio:1.35/1;overflow:hidden;background:#050507;position:relative}
        .lot-media img{width:100%;height:100%;object-fit:cover}
        .lot-info{padding:28px;display:flex;flex-direction:column;gap:10px}
        .btn{flex:1;padding:14px;border:1px solid var(--gold);background:transparent;color:var(--gold);font-family:'JetBrains Mono',monospace;font-size:0.66rem;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer}
        .btn.in{background:var(--off);color:#070709;border-color:var(--off)}
        .tray{position:sticky;bottom:16px;display:flex;justify-content:space-between;align-items:center;padding:16px;background:rgba(14,14,17,0.92);border:1px solid rgba(201,176,122,0.14)}
        @media(max-width:860px){.lot{grid-template-columns:1fr}}
      `}</style>

      <header>
        <div className="wrap" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img src="/assets/img/altior-wordmark-gold.jpg" alt="ALTIOR" style={{ height: 18 }} />
          <a href="/" style={{ fontFamily: "JetBrains Mono", fontSize: "0.62rem", letterSpacing: "0.16em", color: "var(--stone)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 14px" }}>← Maison</a>
        </div>
      </header>

      <section className="wrap hero">
        <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", letterSpacing: "0.24em", color: "var(--gold)" }}>Vault 01 — Malibu to Aspen • Confidential</p>
        <h1 className="hero-title">The vault is <em>not a store.</em> It’s a selection.</h1>
        <p style={{ color: "var(--stone)", maxWidth: "42ch", marginTop: 12 }}>Off-market. Nunca listado. Cada lote é um dossiê confidencial — adicione ao vault e inicie a aquisição sob NDA.</p>
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          {["all", "ocean", "city", "mountain"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", padding: "8px 14px", border: "1px solid var(--line)", background: filter === f ? "#ECE7DD" : "transparent", color: filter === f ? "#070709" : "var(--stone)" }}>{f}</button>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", border: "1px dashed var(--line)", color: "var(--stone)", fontFamily: "JetBrains Mono" }}>Nenhum imóvel aprovado ainda — peça ao admin para aprovar em /admin</div>
        ) : (
          filtered.map((h) => (
            <div key={h.id} className="lot">
              <div className="lot-media">
                <img src={h.image_url} alt={h.name} />
                <span style={{ position: "absolute", top: 16, left: 16, background: "rgba(7,7,9,0.72)", padding: "6px 10px", fontFamily: "JetBrains Mono", fontSize: "0.60rem" }}>{h.lot_number}</span>
                <span style={{ position: "absolute", top: 16, right: 16, background: "var(--gold)", color: "#070709", padding: "6px 10px", fontFamily: "JetBrains Mono", fontSize: "0.58rem" }}>{h.tag} • {h.location}</span>
              </div>
              <div className="lot-info">
                <p style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", color: "var(--gold)", letterSpacing: "0.16em" }}>{h.location}</p>
                <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: "2rem", fontWeight: 300 }}>{h.name}</h3>
                <p style={{ color: "var(--stone)", fontSize: "0.84rem" }}>{h.specs}</p>
                <div><strong style={{ fontFamily: "Cormorant Garamond", fontSize: "1.8rem" }}>{fmt(Number(h.price))}</strong> <span style={{ fontFamily: "JetBrains Mono", fontSize: "0.62rem", color: "#6B6763" }}>Price upon request</span></div>
                <button className={`btn ${cart.has(h.id) ? "in" : ""}`} onClick={() => toggleCart(h)}>{cart.has(h.id) ? "In Vault ✓" : "Add to Vault"}</button>
              </div>
            </div>
          ))
        )}

        <div className="tray">
          <div><strong style={{ fontFamily: "JetBrains Mono", fontSize: "0.68rem" }}>{cart.size} lots selected</strong> <span style={{ color: "var(--gold)", fontFamily: "JetBrains Mono", fontSize: "0.60rem" }}>{Array.from(cart.keys()).join(" • ").toUpperCase()}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "Cormorant Garamond", fontSize: "1.3rem" }}>{cart.size ? fmt(total) : "—"}</span>
            <button disabled={cart.size === 0} onClick={() => setShowCheckout(true)} style={{ padding: "12px 22px", background: "var(--gold)", color: "#070709", border: "1px solid var(--gold)", fontFamily: "JetBrains Mono", fontSize: "0.66rem", opacity: cart.size === 0 ? 0.3 : 1, cursor: cart.size === 0 ? "not-allowed" : "pointer" }}>Initiate Acquisition →</button>
          </div>
        </div>
      </section>

      {showCheckout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,9,0.86)", backdropFilter: "blur(18px)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <div style={{ width: "100%", maxWidth: 560, background: "#0A0A0C", border: "1px solid rgba(255,255,255,0.06)", padding: 28 }}>
            <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: "1.6rem", fontWeight: 300 }}>Confidential <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Acquisition</em></h3>
            <form onSubmit={submit} style={{ marginTop: 16 }}>
              <label style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", color: "var(--stone)" }}>Full name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "#ECE7DD", marginBottom: 12 }} />
              <label style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", color: "var(--stone)" }}>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "#ECE7DD", marginBottom: 12 }} />
              <label style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", color: "var(--stone)" }}>Phone / WhatsApp *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "#ECE7DD", marginBottom: 12 }} />
              <label style={{ fontFamily: "JetBrains Mono", fontSize: "0.60rem", color: "var(--stone)" }}>Tell us about yourself *</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="What you do, what you're looking for..." style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "#ECE7DD", marginBottom: 12 }} />
              {error && <p style={{ color: "#FF8A8A", fontSize: "0.78rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: 14, background: "transparent", color: "#ECE7DD", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "JetBrains Mono", fontSize: "0.68rem" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 14, background: "var(--gold)", color: "#070709", border: "1px solid var(--gold)", fontFamily: "JetBrains Mono", fontSize: "0.68rem", fontWeight: 600 }}>Confirm & Send →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,9,0.88)", display: "grid", placeItems: "center", padding: 24, zIndex: 60 }}>
          <div style={{ maxWidth: 480, background: "#0A0A0C", border: "1px solid rgba(201,176,122,0.14)", padding: 32, textAlign: "center" }}>
            <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: "1.6rem" }}>Acquisition <em style={{ color: "var(--gold)" }}>sealed.</em></h3>
            <p style={{ color: "var(--stone)", marginTop: 10 }}>Ref: <span style={{ color: "var(--gold)", fontFamily: "JetBrains Mono" }}>{success}</span> — Private Office will contact you within 48h.</p>
            <button onClick={() => setSuccess("")} style={{ marginTop: 18, width: "100%", padding: 14, background: "var(--gold)", color: "#070709", fontFamily: "JetBrains Mono", fontSize: "0.68rem" }}>Return to Vault</button>
          </div>
        </div>
      )}
    </div>
  );
}
