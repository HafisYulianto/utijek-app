-- ============================================================
-- UTIJEK DATABASE SCHEMA
-- Supabase PostgreSQL Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE service_type AS ENUM ('utijek', 'utikan', 'utitip', 'utibasing');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'picking_up', 'on_trip', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- ============================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: driver_profiles
-- ============================================================
CREATE TABLE driver_profiles (
  id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type  TEXT NOT NULL DEFAULT 'Motor',
  vehicle_plate TEXT NOT NULL,
  vehicle_color TEXT,
  is_online     BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat   FLOAT8,
  current_lng   FLOAT8,
  last_seen     TIMESTAMPTZ,
  rating        NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_trips   INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE: pricing_config
-- ============================================================
CREATE TABLE pricing_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type    service_type NOT NULL UNIQUE,
  price_per_km    NUMERIC(10,2) NOT NULL DEFAULT 3000,
  price_per_meter NUMERIC(10,4) NOT NULL DEFAULT 3,
  base_fare       NUMERIC(10,2) NOT NULL DEFAULT 5000,
  updated_by      UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default pricing for all service types
INSERT INTO pricing_config (service_type, price_per_km, price_per_meter, base_fare)
VALUES
  ('utijek',   3000, 3,    5000),
  ('utikan',   3500, 3.5,  6000),
  ('utitip',   3000, 3,    5000),
  ('utibasing',3000, 3,    5000);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES profiles(id),
  driver_id        UUID REFERENCES profiles(id),
  service_type     service_type NOT NULL,
  status           order_status NOT NULL DEFAULT 'pending',
  pickup_lat       FLOAT8 NOT NULL,
  pickup_lng       FLOAT8 NOT NULL,
  pickup_address   TEXT NOT NULL,
  dropoff_lat      FLOAT8,
  dropoff_lng      FLOAT8,
  dropoff_address  TEXT,
  distance_meters  INTEGER,
  estimated_price  NUMERIC(10,2),
  final_price      NUMERIC(10,2),
  order_notes      TEXT,
  item_details     JSONB,
  payment_method   payment_method,
  payment_status   payment_status DEFAULT 'pending',
  rated_by_customer BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for realtime subscription performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- TABLE: order_tracking
-- ============================================================
CREATE TABLE order_tracking (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_lat  FLOAT8 NOT NULL,
  driver_lng  FLOAT8 NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_order_id ON order_tracking(order_id);

-- ============================================================
-- TABLE: chat_messages (for UTIBASING live chat)
-- ============================================================
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_order_id ON chat_messages(order_id);

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  customer_id    UUID NOT NULL REFERENCES profiles(id),
  driver_id      UUID REFERENCES profiles(id),
  amount         NUMERIC(10,2) NOT NULL,
  payment_method payment_method,
  status         payment_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'driver' THEN 'driver'::user_role
      ELSE 'customer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(split_part(NEW.email, '@', 1), 'User'), 'customer'::user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PROFILES ───────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin' OR auth.uid() = id);

CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  USING (get_user_role() = 'admin');

-- ─── DRIVER_PROFILES ────────────────────────────────────────
CREATE POLICY "driver_profiles_select" ON driver_profiles FOR SELECT
  USING (
    id = auth.uid() OR
    get_user_role() = 'admin' OR
    get_user_role() = 'customer'  -- customers see online drivers for map
  );

CREATE POLICY "driver_profiles_update" ON driver_profiles FOR UPDATE
  USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "driver_profiles_insert" ON driver_profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin' OR id = auth.uid());

CREATE POLICY "driver_profiles_delete_admin" ON driver_profiles FOR DELETE
  USING (get_user_role() = 'admin');

-- ─── PRICING_CONFIG ─────────────────────────────────────────
CREATE POLICY "pricing_select_all" ON pricing_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "pricing_modify_admin" ON pricing_config FOR ALL
  USING (get_user_role() = 'admin');

-- ─── ORDERS ─────────────────────────────────────────────────
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (
    customer_id = auth.uid() OR
    driver_id = auth.uid() OR
    get_user_role() = 'admin' OR
    (get_user_role() = 'driver' AND status = 'pending')
  );

CREATE POLICY "orders_insert_customer" ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() AND get_user_role() = 'customer');

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    driver_id = auth.uid() OR
    get_user_role() = 'admin'
  );

-- ─── ORDER_TRACKING ─────────────────────────────────────────
CREATE POLICY "tracking_select" ON order_tracking FOR SELECT
  USING (
    get_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id
      AND (customer_id = auth.uid() OR driver_id = auth.uid())
    )
  );

CREATE POLICY "tracking_insert_driver" ON order_tracking FOR INSERT
  WITH CHECK (
    get_user_role() = 'driver' AND
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND driver_id = auth.uid())
  );

-- ─── CHAT_MESSAGES ──────────────────────────────────────────
CREATE POLICY "chat_select" ON chat_messages FOR SELECT
  USING (
    get_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id
      AND (customer_id = auth.uid() OR driver_id = auth.uid())
    )
  );

CREATE POLICY "chat_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id
      AND (customer_id = auth.uid() OR driver_id = auth.uid())
    )
  );

-- ─── TRANSACTIONS ────────────────────────────────────────────
CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (
    customer_id = auth.uid() OR
    driver_id = auth.uid() OR
    get_user_role() = 'admin'
  );

CREATE POLICY "transactions_insert" ON transactions FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin' OR
    driver_id = auth.uid()
  );

-- ============================================================
-- ENABLE REALTIME on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE order_tracking;
