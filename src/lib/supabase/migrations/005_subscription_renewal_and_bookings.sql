-- ============================================================
-- 005_subscription_renewal_and_bookings.sql
-- Adds subscription renewal billing flow connected to LINE OA,
-- a dedicated table for tenant owner LINE links (so renewal
-- notifications go to the owner, not customers), and a bookings
-- table to back the customer portal booking form.
-- ============================================================

-- --- TENANT OWNER LINE LINKS ----------------------------------
-- Lets the shop owner link their personal LINE account so they
-- receive subscription renewal notifications via the platform's
-- LINE OA (channel managed by KPServicePro itself, not the tenant).

CREATE TABLE IF NOT EXISTS tenant_owner_line_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  display_name TEXT,
  picture_url TEXT,
  link_token TEXT,
  link_token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlinked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_owner_line_links_tenant_user
  ON tenant_owner_line_links(tenant_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_owner_line_links_line_user
  ON tenant_owner_line_links(line_user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tenant_owner_line_links_token
  ON tenant_owner_line_links(link_token) WHERE link_token IS NOT NULL;

ALTER TABLE tenant_owner_line_links ENABLE ROW LEVEL SECURITY;

-- --- SUBSCRIPTION INVOICES ------------------------------------
-- One row per renewal cycle. Created by the renewal scanner when
-- a tenant is approaching trial_ends_at or current_period_end.
-- Marked paid by super-admin (manual confirmation) or future
-- payment-gateway webhook.

CREATE TYPE subscription_invoice_status AS ENUM (
  'pending',     -- created, awaiting payment
  'sent',        -- LINE/email notification sent to owner
  'paid',        -- payment confirmed
  'cancelled',   -- voided
  'overdue'      -- past due date
);

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'yearly',  -- 'monthly' | 'yearly'
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status subscription_invoice_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,            -- 'transfer' | 'promptpay' | 'credit_card'
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  notes TEXT,
  notified_via_line_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_invoices_number
  ON subscription_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_tenant_id
  ON subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status
  ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_due_date
  ON subscription_invoices(due_date) WHERE status IN ('pending', 'sent', 'overdue');

ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- --- TENANT subscription period columns -----------------------
-- Add explicit period tracking so the renewal scanner doesn't
-- need to reverse-engineer renewal dates from history.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS current_period_start DATE,
  ADD COLUMN IF NOT EXISTS current_period_end DATE,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'yearly',
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;

-- --- BOOKINGS TABLE -------------------------------------------
-- Backs the customer portal booking form. Public submissions
-- (no customer account required) are also allowed; if the phone
-- matches an existing customer, customer_id is filled in by the
-- server action.

CREATE TYPE booking_status AS ENUM (
  'pending',     -- customer submitted, shop has not yet confirmed
  'confirmed',   -- shop confirmed time slot
  'arrived',     -- customer showed up, became a job
  'cancelled',
  'no_show'
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  license_plate TEXT,
  service_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  cancelled_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date
  ON bookings(tenant_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(tenant_id, customer_phone);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- --- updated_at triggers --------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscription_invoices
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --- RLS POLICIES ---------------------------------------------

-- subscription_invoices: tenant members can read their own invoices,
-- super_admin can do everything.
DROP POLICY IF EXISTS sub_inv_tenant_read ON subscription_invoices;
CREATE POLICY sub_inv_tenant_read ON subscription_invoices
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS sub_inv_super_admin_write ON subscription_invoices;
CREATE POLICY sub_inv_super_admin_write ON subscription_invoices
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

-- tenant_owner_line_links: each user manages their own link.
DROP POLICY IF EXISTS owner_line_self ON tenant_owner_line_links;
CREATE POLICY owner_line_self ON tenant_owner_line_links
  FOR ALL USING (
    user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

-- bookings: tenant scoped
DROP POLICY IF EXISTS bookings_tenant ON bookings;
CREATE POLICY bookings_tenant ON bookings
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

-- --- ENV-DRIVEN PLATFORM LINE OA SETTINGS ---------------------
-- Renewal notifications use a *platform-wide* LINE OA channel
-- (configured via env vars, not per tenant), since the audience
-- is the shop owner subscribing to KPServicePro itself.
-- See src/lib/line/platform-line.ts for the runtime config loader.

COMMENT ON TABLE tenant_owner_line_links IS
  'Links the shop owner''s personal LINE userId to their tenant. The platform LINE OA (env-driven) sends subscription renewal notifications to this userId.';
COMMENT ON TABLE subscription_invoices IS
  'Renewal billing for KPServicePro itself (one row per period). Created by scanRenewals() and sent via the platform LINE OA.';
