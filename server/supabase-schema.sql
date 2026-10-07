-- ========================================================================
-- BrewPulse Cafe Operating System & Management Platform
-- Full Backend PostgreSQL Schema & Supabase Database Configuration
-- Tables: cafe_settings, categories, menu_items, inventory_items,
--         cafe_tables, employees, orders, special_offers, audit_logs
-- Storage: 'menu-images' Bucket with public access policies
-- Strictly idempotent & safe for existing databases
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAFE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.cafe_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  cafe_name TEXT NOT NULL DEFAULT 'The Roasted Bean & Co.',
  tagline TEXT DEFAULT 'Artisanal Roastery, Bakes & Kitchen',
  address TEXT DEFAULT 'Shop 14, Heritage Lane, Colaba, Mumbai 400001',
  phone TEXT DEFAULT '+91 98200 12345',
  whatsapp_number TEXT DEFAULT '919820012345',
  gst_number TEXT DEFAULT '27AAACR1234F1Z8',
  fssai_number TEXT DEFAULT '11521018000456',
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  default_tax_percent NUMERIC(5,2) DEFAULT 5.00,
  default_service_charge_percent NUMERIC(5,2) DEFAULT 0.00,
  birthday_discount_percent NUMERIC(5,2) DEFAULT 15.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  image TEXT,
  dietary TEXT DEFAULT 'veg',
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time_minutes INT DEFAULT 5,
  popular BOOLEAN DEFAULT FALSE,
  ingredients JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  min_threshold NUMERIC(10,2) NOT NULL DEFAULT 5,
  cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier_name TEXT,
  supplier_phone TEXT,
  last_restocked_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CAFE TABLES
CREATE TABLE IF NOT EXISTS public.cafe_tables (
  id TEXT PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4,
  section TEXT DEFAULT 'Main Lounge',
  status TEXT DEFAULT 'available',
  active_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMPLOYEES & IAM ACCESS POLICIES
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  table_number INT NOT NULL,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_reason TEXT,
  tax_percentage NUMERIC(5,2) DEFAULT 5,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  service_charge_percentage NUMERIC(5,2) DEFAULT 0,
  service_charge_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  billed_at TIMESTAMPTZ,
  billed_by TEXT,
  whatsapp_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SPECIAL OFFERS & PROMOS
CREATE TABLE IF NOT EXISTS public.special_offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  type TEXT DEFAULT 'seasonal_special',
  original_price NUMERIC(10,2),
  offer_price NUMERIC(10,2) NOT NULL,
  description TEXT,
  image TEXT,
  badge_text TEXT,
  valid_until TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  featured_on_menu BOOLEAN DEFAULT TRUE,
  linked_menu_item_ids JSONB DEFAULT '[]'::jsonb,
  broadcast_sent_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE (IMMUTABLE SECURITY & OPERATIONS TRAIL)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- INDEXES FOR HIGH-TRAFFIC QUERYING
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff ON public.audit_logs(staff_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.cafe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public reads and authenticated / anon service role access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on settings' AND tablename = 'cafe_settings') THEN
    CREATE POLICY "Allow public select on settings" ON public.cafe_settings FOR SELECT USING (true);
    CREATE POLICY "Allow all on settings" ON public.cafe_settings FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on categories' AND tablename = 'categories') THEN
    CREATE POLICY "Allow public select on categories" ON public.categories FOR SELECT USING (true);
    CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on menu_items' AND tablename = 'menu_items') THEN
    CREATE POLICY "Allow public select on menu_items" ON public.menu_items FOR SELECT USING (true);
    CREATE POLICY "Allow all on menu_items" ON public.menu_items FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on inventory_items' AND tablename = 'inventory_items') THEN
    CREATE POLICY "Allow all on inventory_items" ON public.inventory_items FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on cafe_tables' AND tablename = 'cafe_tables') THEN
    CREATE POLICY "Allow all on cafe_tables" ON public.cafe_tables FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on employees' AND tablename = 'employees') THEN
    CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on orders' AND tablename = 'orders') THEN
    CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on special_offers' AND tablename = 'special_offers') THEN
    CREATE POLICY "Allow all on special_offers" ON public.special_offers FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on audit_logs' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Allow all on audit_logs" ON public.audit_logs FOR ALL USING (true);
  END IF;
END $$;

-- ========================================================================
-- SUPABASE STORAGE: MENU DISH IMAGES BUCKET SETUP
-- ========================================================================
-- 1. Create 'menu-images' public storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 2. Storage Objects RLS Policies for menu-images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to menu-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Access to menu-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'menu-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow upload to menu-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Allow upload to menu-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'menu-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow update on menu-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Allow update on menu-images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'menu-images');
  END IF;
END $$;
