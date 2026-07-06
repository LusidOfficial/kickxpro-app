-- ============================================================
-- KickXPro Marketplace — Database Migration
-- Created: 2025-07-01
-- Description: Wallet, transactions, products catalog & orders
-- ============================================================

-- =========================
-- 1. kickx_wallet
-- =========================
CREATE TABLE IF NOT EXISTS kickx_wallet (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  balance     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 2. kickx_transactions
-- =========================
CREATE TABLE IF NOT EXISTS kickx_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('topup','spend','reward','refund','gift_sent','gift_received')),
  amount        INTEGER NOT NULL,
  description   TEXT,
  reference_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 3. marketplace_products
-- =========================
CREATE TABLE IF NOT EXISTS marketplace_products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID REFERENCES auth.users(id),
  title          TEXT NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL CHECK (category IN ('coins','digital','physical','service','subscription')),
  price_kxc      INTEGER NOT NULL DEFAULT 0,
  price_inr      NUMERIC(10,2),
  thumbnail_url  TEXT,
  file_url       TEXT,
  stock          INTEGER,
  is_active      BOOLEAN DEFAULT TRUE,
  featured       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 4. marketplace_orders
-- =========================
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID REFERENCES auth.users(id) NOT NULL,
  product_id        UUID REFERENCES marketplace_products(id) NOT NULL,
  quantity          INTEGER DEFAULT 1,
  total_kxc         INTEGER,
  total_inr         NUMERIC(10,2),
  status            TEXT NOT NULL CHECK (status IN ('pending','completed','failed','refunded')) DEFAULT 'pending',
  razorpay_order_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wallet_user        ON kickx_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_user           ON kickx_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_created        ON kickx_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category  ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_products_active    ON marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer       ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product     ON marketplace_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON marketplace_orders(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- kickx_wallet ----
ALTER TABLE kickx_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
  ON kickx_wallet FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on wallet"
  ON kickx_wallet FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ---- kickx_transactions ----
ALTER TABLE kickx_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON kickx_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on transactions"
  ON kickx_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ---- marketplace_products ----
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON marketplace_products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role full access on products"
  ON marketplace_products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ---- marketplace_orders ----
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Service role full access on orders"
  ON marketplace_orders FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- SEED DATA — KickX Coin Top-Up Packs
-- ============================================================
INSERT INTO marketplace_products (title, description, category, price_kxc, price_inr, is_active, featured)
VALUES
  (
    'Starter Pack',
    '100 KickX Coins — perfect for trying out the marketplace.',
    'coins', 100, 99.00, TRUE, FALSE
  ),
  (
    'Mid Pack',
    '525 KickX Coins (500 + 25 bonus) — great value for regular players.',
    'coins', 525, 499.00, TRUE, FALSE
  ),
  (
    'Pro Pack',
    '1100 KickX Coins (1000 + 100 bonus) — for serious athletes.',
    'coins', 1100, 999.00, TRUE, TRUE
  ),
  (
    'Elite Pack',
    '2850 KickX Coins (2500 + 350 bonus) — elite level commitment.',
    'coins', 2850, 2499.00, TRUE, TRUE
  ),
  (
    'Champion Pack',
    '6000 KickX Coins (5000 + 1000 bonus) — maximum value, champion tier.',
    'coins', 6000, 4999.00, TRUE, TRUE
  );

-- ============================================================
-- SEED DATA — Digital Products
-- ============================================================
INSERT INTO marketplace_products (title, description, category, price_kxc, is_active, featured)
VALUES
  (
    '7-Day Speed & Agility Plan',
    'A structured 7-day training programme focusing on speed drills, ladder work, and agility exercises designed for footballers.',
    'digital', 150, TRUE, FALSE
  ),
  (
    'Nutrition Guide for Young Athletes',
    'Complete nutrition playbook covering match-day meals, recovery shakes, hydration strategies, and macro tracking for youth players.',
    'digital', 200, TRUE, FALSE
  ),
  (
    'AI Match Analysis Report',
    'Get a detailed AI-generated breakdown of your match performance — passing accuracy, heatmap, sprint data, and tactical insights.',
    'digital', 100, TRUE, TRUE
  ),
  (
    'Position Mastery Playbook',
    'In-depth guide covering positioning, movement patterns, and drills tailored to your playing position (CB, CM, ST, GK, etc.).',
    'digital', 250, TRUE, FALSE
  ),
  (
    'Mental Toughness Guide',
    'Sport psychology workbook with visualisation exercises, pre-match routines, and confidence-building techniques for competitive athletes.',
    'digital', 175, TRUE, FALSE
  );
