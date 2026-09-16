"use client";
import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";

type Listing = { id: string; name: string; location: string; category: string; price: number; specs: string; image_url: string; lot_number: string; tag: string; status: string };
type Lead = { id: number; name: string; email: string; phone: string; message: string; ref_code: string; source: string; created_at: string };

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const [listings, setListings] = useState<Listing[]>([]);
  const [pending, setPending] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<"listings"|"pending"|"leads">("listings");
  const [form, setForm] = useState({ name: "", location: "", category: "ocean", price: "", tag: "Vault Only", specs: "", image_url: "", lot_number: "" });
  const [msg, setMsg] = useState("");

  async function refresh() {
    const all = await fetch("/api/listings?status=all").then(r=>r.json()).catch(()=>[]);
    const pend = await fetch("/api/listings?status=pending").then(r=>r.json()).catch(()=>[]);
    const lds = await fetch("/api/leads").then(r=>r.json()).catch(()=>[]);
    if (Array.isArray(all)) setListings(all);
    if (Array.isArray(pend)) setPending(pend);
    if (Array.isArray(lds)) setLeads(lds);
  }
  useEffect(()=>{ if(role==="admin") refresh(); }, [role]);

  if (!isLoaded) return <div style={{padding:40,background:"#050507",color:"#ECE7DD"}}>Carregando...</div>;
  if (role!=="admin") return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#050507",color:"#ECE7DD",padding:40,textAlign:"center"}}><div><h2 style={{fontFamily:"Cormorant Garamond",fontSize:"1.8rem"}}>Acesso negado — <em style={{color:"#C9B07A"}}>admin only</em></h2><p style={{color:"#9A9590",marginTop:8}}>Seu usuário: {user?.primaryEmailAddress?.emailAddress} — peça para um admin colocar <code>publicMetadata: {"role":"admin"}</code> no Clerk.</p><a href="/vendas" style={{display:"inline-block",marginTop:14,padding:"10px 14px",background:"#C9B07A",color:"#070709",fontFamily:"JetBrains Mono",fontSize:"0.62rem"}}>Ir para /vendas</a></div></div>;

  async function submit(e: React.FormEvent){
    e.preventDefault();
    setMsg("");
    if(!form.name || !form.location || !form.price || !form.specs) return setMsg("Preencha nome, localização, preço e specs");
    const res = await fetch("/api/listings", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, price: Number(form.price)})});
    const j = await res.json();
    if(!res.ok) return setMsg(j.error);
    setMsg("Criado como pending — clique Aprovar para liberar em /vendas");
    setForm({ name:"", location:"", category:"ocean", price:"", tag:"Vault Only", specs:"", image_url:"", lot_number:"" });
    refresh();
  }
  async function approve(id:string){
    await fetch(`/api/listings/${id}/approve`, {method:"POST"});
    refresh();
  }
  async function del(id:string){
    if(!confirm("Remover?")) return;
    await fetch(`/api/listings/${id}`, {method:"DELETE"});
    refresh();
  }

  return (
    <div style={{background:"#050507",color:"#ECE7DD",minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&family=Inter:wght@300&family=JetBrains+Mono:wght@300&display=swap'); :root{--gold:#C9B07A;--off:#ECE7DD;--stone:#9A9590;--line:rgba(255,255,255,0.06)} .wrap{max-width:1440px;margin:0 auto;padding:0 24px} .btn{padding:10px 14px;border:1px solid var(--gold);background:var(--gold);color:#050507;font-family:'JetBrains Mono',monospace;font-size:0.66rem;cursor:pointer} .btn-ghost{background:transparent;color:var(--off);border-color:rgba(255,255,255,0.12)}`}</style>
      <header style={{height:56,display:"flex",alignItems:"center",borderBottom:"1px solid var(--line)",background:"rgba(5,5,7,0.88)",position:"sticky",top:0}}>
        <div className="wrap" style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <img src="/assets/img/altior-wordmark-gold.jpg" alt="ALTIOR" style={{height:18}}/>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:"0.60rem",color:"var(--gold)",border:"1px solid rgba(201,176,122,0.18)",padding:"6px 12px"}}>ADMIN VAULT • {user?.primaryEmailAddress?.emailAddress}</span>
            <a href="/vendas" className="btn btn-ghost" style={{textDecoration:"none",fontSize:"0.60rem"}}>Ver /vendas →</a>
            <SignOutButton><button className="btn btn-ghost" style={{fontSize:"0.60rem"}}>Sair</button></SignOutButton>
          </div>
        </div>
      </header>

      <main className="wrap" style={{padding:"28px 0 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:2,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{background:"#0A0A0C",padding:24,border:"1px solid rgba(255,255,255,0.04)"}}>
            <h3 style={{fontFamily:"Cormorant Garamond",fontSize:"1.35rem"}}>Adicionar Imóvel — <em style={{color:"var(--gold)"}}>pending</em></h3>
            <p style={{fontSize:"0.78rem",color:"var(--stone)",marginTop:6}}>Vai para aprovação antes de aparecer em /vendas. Seed demo já está approved.</p>
            <form onSubmit={submit} style={{marginTop:18}}>
              <input placeholder="Nome ex: Villa Meridian" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:"100%",padding:12,marginBottom:10,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <input placeholder="Local ex: Malibu, CA" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={{padding:12,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{padding:12,background:"#0A0A0C",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}><option value="ocean">Litoral</option><option value="city">Urbano</option><option value="mountain">Montanha</option></select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                <input placeholder="Preço USD" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={{padding:12,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
                <input placeholder="Tag" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} style={{padding:12,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
              </div>
              <input placeholder="Specs ex: 6 suítes • 8,200 sq ft" value={form.specs} onChange={e=>setForm({...form,specs:e.target.value})} style={{width:"100%",padding:12,marginTop:10,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
              <input placeholder="URL imagem https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} style={{width:"100%",padding:12,marginTop:10,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
              <input placeholder="Lote ex: Lot 05" value={form.lot_number} onChange={e=>setForm({...form,lot_number:e.target.value})} style={{width:"100%",padding:12,marginTop:10,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.07)",color:"var(--off)"}}/>
              {msg && <p style={{color:"#FF8A8A",fontSize:"0.76rem",marginTop:10}}>{msg}</p>}
              <button type="submit" className="btn" style={{width:"100%",marginTop:14,padding:16}}>Adicionar como Pending</button>
            </form>
          </div>

          <div style={{background:"#0A0A0C",padding:24}}>
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              <button onClick={()=>setTab("listings")} style={{padding:"8px 14px",fontFamily:"JetBrains Mono",fontSize:"0.62rem",border:"1px solid rgba(255,255,255,0.08)",background:tab==="listings"?"#ECE7DD":"rgba(255,255,255,0.02)",color:tab==="listings"?"#050507":"#9A9590"}}>Todos ({listings.length})</button>
              <button onClick={()=>setTab("pending")} style={{padding:"8px 14px",fontFamily:"JetBrains Mono",fontSize:"0.62rem",border:"1px solid rgba(255,255,255,0.08)",background:tab==="pending"?"#ECE7DD":"rgba(255,255,255,0.02)",color:tab==="pending"?"#050507":"#9A9590"}}>Pending ({pending.length})</button>
              <button onClick={()=>setTab("leads")} style={{padding:"8px 14px",fontFamily:"JetBrains Mono",fontSize:"0.62rem",border:"1px solid rgba(255,255,255,0.08)",background:tab==="leads"?"#ECE7DD":"rgba(255,255,255,0.02)",color:tab==="leads"?"#050507":"#9A9590"}}>Leads ({leads.length})</button>
            </div>

            {tab==="pending" && (pending.length===0? <div style={{padding:40,textAlign:"center",border:"1px dashed rgba(255,255,255,0.06)",fontFamily:"JetBrains Mono",fontSize:"0.72rem",color:"#5A5752"}}>Nenhum pending — tudo aprovado</div> : pending.map(h=>(
              <div key={h.id} style={{display:"grid",gridTemplateColumns:"96px 1fr auto",gap:14,padding:12,background:"#0F0F11",border:"1px solid rgba(255,255,255,0.04)",marginBottom:8}}>
                <img src={h.image_url} alt="" style={{width:96,height:64,objectFit:"cover"}}/>
                <div><h4 style={{fontSize:"0.92rem"}}>{h.name} — <span style={{color:"var(--gold)",fontFamily:"JetBrains Mono",fontSize:"0.60rem"}}>{h.status}</span></h4><p style={{fontFamily:"JetBrains Mono",fontSize:"0.60rem",color:"var(--stone)"}}>{h.lot_number} • {h.location} • {h.tag}</p></div>
                <div style={{display:"flex",gap:6}}><button onClick={()=>approve(h.id)} className="btn" style={{fontSize:"0.60rem"}}>Aprovar</button><button onClick={()=>del(h.id)} className="btn btn-ghost" style={{fontSize:"0.60rem"}}>Excluir</button></div>
              </div>
            )))}

            {tab==="listings" && listings.map(h=>(
              <div key={h.id} style={{display:"grid",gridTemplateColumns:"96px 1fr auto",gap:14,padding:12,background:"#0F0F11",border:"1px solid rgba(255,255,255,0.04)",marginBottom:8}}>
                <img src={h.image_url} alt="" style={{width:96,height:64,objectFit:"cover"}}/>
                <div><h4>{h.name}</h4><p style={{fontFamily:"JetBrains Mono",fontSize:"0.60rem",color:"var(--stone)"}}>{h.lot_number} • {h.location} • {h.status}</p></div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>{h.status==="pending" && <button onClick={()=>approve(h.id)} className="btn" style={{fontSize:"0.60rem"}}>Aprovar</button>}<button onClick={()=>del(h.id)} className="btn btn-ghost" style={{fontSize:"0.60rem"}}>Delete</button></div>
              </div>
            ))}

            {tab==="leads" && (leads.length===0? <div style={{padding:40,textAlign:"center",border:"1px dashed rgba(255,255,255,0.06)",color:"#5A5752",fontFamily:"JetBrains Mono"}}>Nenhum lead ainda</div> : leads.map(l=>(
              <div key={l.id} style={{background:"#0F0F11",border:"1px solid rgba(255,255,255,0.04)",padding:14,marginBottom:8,borderLeft:"2px solid var(--gold)"}}>
                <strong>{l.name} • {l.email} • {l.phone}</strong><p style={{fontFamily:"JetBrains Mono",fontSize:"0.60rem",color:"var(--stone)"}}>{new Date(l.created_at).toLocaleString()} • {l.ref_code} • {l.source}</p><p style={{marginTop:8,background:"rgba(201,176,122,0.06)",padding:10,whiteSpace:"pre-wrap"}}>{l.message}</p>
              </div>
            )))}
          </div>
        </div>
      </main>
    </div>
  );
}
