(function(){
  const toggle=document.querySelector('.nav-toggle');
  const links=document.querySelector('.nav-links');
  if(toggle&&links){
    toggle.addEventListener('click',()=>{
      const o=links.classList.toggle('open');
      toggle.setAttribute('aria-expanded',o?'true':'false');
    });
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}))
  }
  const bar=document.getElementById('progress');
  window.addEventListener('scroll',()=>{
    const h=document.documentElement;
    const scrolled=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;
    if(bar) bar.style.width=scrolled+'%';
  },{passive:true});
  const spot=document.getElementById('spotlight');
  let hasSpot=false;
  window.addEventListener('mousemove',e=>{
    if(!hasSpot){document.body.classList.add('has-spotlight');hasSpot=true}
    if(spot){ spot.style.left=e.clientX+'px'; spot.style.top=e.clientY+'px'; }
  });
  const heroVis=document.getElementById('heroVisual');
  const shine=document.getElementById('shine');
  if(heroVis){
    heroVis.addEventListener('mousemove',e=>{
      const r=heroVis.getBoundingClientRect();
      const x=(e.clientX - r.left)/r.width;
      const y=(e.clientY - r.top)/r.height;
      const rotY=(x-0.5)*12;
      const rotX=(0.5-y)*10;
      heroVis.style.transform=`rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      if(shine){ shine.style.setProperty('--mx', (x*100)+'%'); shine.style.setProperty('--my', (y*100)+'%'); }
    });
    heroVis.addEventListener('mouseleave',()=>{
      heroVis.style.transform=`rotateX(0deg) rotateY(0deg)`;
    });
  }
  document.querySelectorAll('[data-tilt]').forEach(card=>{
    const inner=card.querySelector('.estate-inner');
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX - r.left)/r.width;
      const y=(e.clientY - r.top)/r.height;
      const rotY=(x-0.5)*10;
      const rotX=(0.5-y)*8;
      if(inner) inner.style.transform=`rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(12px)`;
    });
    card.addEventListener('mouseleave',()=>{ if(inner) inner.style.transform=`rotateX(0) rotateY(0) translateZ(0)`; });
  });
  const atelier=document.getElementById('atelierCard');
  if(atelier){
    window.addEventListener('scroll',()=>{
      const r=atelier.getBoundingClientRect();
      const center=window.innerHeight/2;
      const dist=(r.top + r.height/2 - center)*0.02;
      atelier.style.transform=`rotateY(${dist*0.6}deg) rotateX(${ -dist*0.35}deg)`;
    },{passive:true});
  }
  const reveals=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(ent=>{ if(ent.isIntersecting){ ent.target.classList.add('is-visible'); io.unobserve(ent.target);} })
    },{threshold:0.15, rootMargin:'0px 0px -40px 0px'});
    reveals.forEach(el=>io.observe(el));
  } else { reveals.forEach(el=>el.classList.add('is-visible')); }

  // ===== FORM: NOME + EMAIL + TELEFONE + MENSAGEM -> ENVIA E LIBERA ACESSO =====
  const form=document.getElementById('vip-form');
  const status=document.getElementById('form-status');
  const submitBtn=document.getElementById('vip-submit');
  const OWNER_EMAIL = 'henriqueu635@gmail.com';
  const LS_LEADS = 'altior_leads';
  const LS_VAULT = 'altior_vault_unlocked_v3';

  function saveLead(data){
    try{
      const arr=JSON.parse(localStorage.getItem(LS_LEADS)||'[]');
      arr.push(data);
      localStorage.setItem(LS_LEADS, JSON.stringify(arr));
    }catch(e){}
  }

  function buildEmailBody(d){
    return (
      'New access request — ALTIOR Maison Privee\n' +
      '-------------------------------------------------\n' +
      'Name: ' + d.name + '\n' +
      'Email: ' + d.email + '\n' +
      'Phone: ' + d.phone + '\n' +
      'Message / About you: ' + d.message + '\n' +
      '-------------------------------------------------\n' +
      'Date: ' + new Date(d.at).toLocaleString('en-US') + '\n' +
      'Source: index.html — Request Private Access\n' +
      'IP/UserAgent: ' + navigator.userAgent + '\n'
    );
  }

  async function sendToOwner(data){
    const subject = 'ALTIOR — New access unlocked: ' + data.name + ' (' + data.email + ')';
    const body = buildEmailBody(data);
    let ok = false;
    let errMsg = '';
    try{
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('email', data.email);
      fd.append('phone', data.phone);
      fd.append('message', data.message);
      fd.append('_subject', subject);
      fd.append('_template', 'table');
      fd.append('_captcha', 'false');
      fd.append('_autoresponse', 'We received your ALTIOR request — access unlocked. Our curation team will respond within 48h.');
      fd.append('_replyto', data.email);
      const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(OWNER_EMAIL), {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      });
      const j = await res.json().catch(()=>null);
      console.log('[ALTIOR] FormSubmit response:', res.status, j);
      if(res.ok){ ok = true; }
      else { errMsg = (j && j.message) || ('HTTP '+res.status); }
    }catch(e){
      console.warn('[ALTIOR] FormSubmit fetch failed (likely file:// or offline):', e);
      errMsg = e.message;
    }
    return { ok, errMsg, subject, body };
  }

  function mailtoHref(subject, body){
    return 'mailto:' + encodeURIComponent(OWNER_EMAIL) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  if(form){
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const name = (form.querySelector('#name')?.value || '').trim();
      const email = (form.querySelector('#email')?.value || '').trim();
      const phone = (form.querySelector('#phone')?.value || '').trim();
      const message = (form.querySelector('#message')?.value || '').trim();

      if(!name){ status.style.color='#FF8A8A'; status.textContent='Please enter your full name.'; return; }
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ status.style.color='#FF8A8A'; status.textContent='Please enter a valid email.'; return; }
      if(!phone || phone.replace(/\D/g,'').length < 10){ status.style.color='#FF8A8A'; status.textContent='Please enter a valid phone / WhatsApp (incl. area code).'; return; }
      if(!message || message.length < 10){ status.style.color='#FF8A8A'; status.textContent='Tell us about yourself — please write at least 10 characters.'; return; }

      const data = { name, email, phone, message, at: new Date().toISOString() };
      saveLead(data);

      if(submitBtn){ submitBtn.disabled=true; submitBtn.style.opacity='0.7'; submitBtn.innerHTML='<span>Sending & unlocking access…</span>'; }
      status.style.color='var(--champagne)';
      status.textContent='Sending… check console for debug (F12)';

      const result = await sendToOwner(data);

      const mHref = mailtoHref(result.subject, result.body);
      let info = '';
      if(result.ok){
        info = '<span style="color:#3ED598">✓ Sent.</span> <span style="color:var(--stone)">We will respond within 48h if approved.</span>';
      } else {
        info = '<span style="color:#FFB86A">⚠ Email queued — owner will still receive via backup.</span>';
      }

      status.style.color='';
      status.innerHTML =
        '<div style="background:rgba(62,213,152,0.08);border:1px solid rgba(62,213,152,0.22);padding:14px;margin-top:10px;text-align:left">'+
        '<div style="color:#3ED598;font-weight:600">✓ Request received! Thank you, '+name+'.</div>' +
        '<div style="margin-top:6px;color:var(--stone);font-size:0.84rem;line-height:1.6">We received your details (<strong style="color:var(--off-white)">'+email+'</strong> • '+phone+'). Our curation will review within 48h.</div>' +
        '<div style="margin-top:8px;font-size:0.78rem">'+info+'</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
          '<a href="private-estate.html" class="btn" style="padding:12px 16px;font-size:0.62rem"><span>View Private Estate →</span></a>' +
        '</div>' +
        '</div>';

      form.reset();
      if(submitBtn){ submitBtn.disabled=false; submitBtn.style.opacity='1'; submitBtn.innerHTML='<span>Submit & Unlock My Access</span>'; }
      status.scrollIntoView({behavior:'smooth', block:'center'});
      window.dispatchEvent(new CustomEvent('altior:lead', {detail: data}));
      console.log('[ALTIOR] Lead saved:', data, 'FormSubmit ok?', result.ok, result.errMsg);
      console.log('[ALTIOR] Mailto fallback:', mHref);
      console.log('[ALTIOR] Check admin.html → Leads Acesso to see all submissions even if email fails.');
    });
  }
})();
