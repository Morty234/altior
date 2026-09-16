-- src/lib/schema.sql — cole isso no SQL Editor do Neon (https://console.neon.tech > SQL Editor > Run)
-- Cria as 2 tabelas pedidas: listings e leads

-- 1) Imóveis — status 'pending' (aguardando aprovação) ou 'approved' (aparece em /vendas)
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,                 -- ex: 'meridian' (slug)
  name TEXT NOT NULL,                  -- ex: 'Villa Meridian'
  location TEXT NOT NULL,              -- ex: 'Malibu, CA'
  category TEXT NOT NULL DEFAULT 'ocean', -- 'ocean' | 'city' | 'mountain'
  price INTEGER NOT NULL,              -- em USD, ex: 24500000
  specs TEXT NOT NULL,                 -- ex: '6 en-suite • 8,200 sq ft...'
  image_url TEXT NOT NULL,
  lot_number TEXT NOT NULL,            -- ex: 'Lot 01'
  tag TEXT NOT NULL DEFAULT 'Vault Only',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Leads — formulário de interesse (nome, email, telefone, mensagem)
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  ref_code TEXT NOT NULL,              -- ex: 'ALTIOR-V01-AB12-1234'
  source TEXT NOT NULL DEFAULT 'vault-checkout', -- 'vault-checkout' ou 'index-vip-form'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- 3) Seed — 4 imóveis demo já com status 'approved' (não apaga o que você já tinha)
-- Rode só uma vez. Se já rodou, o ON CONFLICT evita duplicar.
INSERT INTO listings (id, name, location, category, price, specs, image_url, lot_number, tag, status) VALUES
('meridian','Villa Meridian','Malibu, CA','ocean',24500000,'6 en-suite • 8,200 sq ft • 72ft infinity edge • Private beach','https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop','Lot 01','Vault Only','approved'),
('park','Park Avenue Penthouse','Manhattan, NY','city',18200000,'4 en-suite • 7,750 sq ft • 360° Park views • Private elevator','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1400&auto=format&fit=crop','Lot 02','Penthouse','approved'),
('hampton','Hampton House','Hamptons, NY','ocean',32000000,'5 en-suite • 9,400 sq ft • 2.1 acres • Guest pavilion','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop','Lot 03','Oceanfront','approved'),
('aspen','Aspen Retreat','Aspen, CO','mountain',14800000,'5 en-suite • 8,900 sq ft • Ski-in / Ski-out • Private spa','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop','Lot 04','Ski-in','approved')
ON CONFLICT (id) DO NOTHING;
