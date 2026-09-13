-- Design Quixo Supabase Database Schema
-- Run this in your Supabase SQL Editor if you need to create any missing tables or enable public access:

-- 1. Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  title text NOT NULL,
  price numeric DEFAULT 399,
  sla text DEFAULT '30-45 mins',
  category text DEFAULT 'custom',
  description text,
  image text,
  icon text DEFAULT 'sparkles',
  ratio text DEFAULT 'Square (1:1)'
);

-- 2. Portfolio Table
CREATE TABLE IF NOT EXISTS public.portfolio (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text DEFAULT 'thumbnail',
  deliveryTime text DEFAULT '30m Delivery',
  image text,
  description text,
  client text,
  city text
);

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id text PRIMARY KEY,
  service text,
  project text,
  price numeric DEFAULT 399,
  brief text,
  phone text,
  whatsapp text,
  ratio text,
  referenceImage text,
  status text DEFAULT 'Pending',
  acceptedBy jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  completedAt text,
  createdAt text,
  time text
);

-- 4. Designers Table
CREATE TABLE IF NOT EXISTS public.designers (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  identifier text,
  password text,
  portfolio text,
  skills text,
  status text DEFAULT 'Pending',
  date text,
  createdAt text
);

-- 5. City Addresses Table (Optional for Multi-City Hubs)
CREATE TABLE IF NOT EXISTS public.city_addresses (
  key text PRIMARY KEY,
  city text,
  address text,
  phone text,
  updatedAt text
);

-- 6. Login History Table (Supabase Authentication & Access Audit)
CREATE TABLE IF NOT EXISTS public.login_history (
  id text PRIMARY KEY,
  phone text,
  name text,
  role text,
  status text,
  timestamp text,
  created_at timestamptz DEFAULT now()
);

-- 7. Platform Settings Table (For Google Reviews and other global variables)
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Enable RLS and create public policies for seamless web app communication
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public all on services" ON public.services FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on portfolio" ON public.portfolio FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on designers" ON public.designers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on city_addresses" ON public.city_addresses FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on login_history" ON public.login_history FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
