-- ============================================================
-- 012_brand_and_custom_domain.sql
-- Per-tenant white-label branding + paid custom domain add-on.
--
-- Branding is stored in tenants.settings.brand:
--   {
--     "primary_color": "#FF6B6B",
--     "logo_url": "https://...",
--     "display_name": "AutoFix"
--   }
-- (No schema change needed; just a documented JSON shape.)
--
-- Custom domain support adds dedicated columns + a generic addons
-- table so we can charge for it (and easily add more paid addons
-- later — extra storage, SMS quota, etc).
-- ============================================================

-- --- Custom domain columns on tenants --------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'custom_domain'
  ) THEN
    ALTER TABLE tenants
      ADD COLUMN custom_domain TEXT UNIQUE,
      ADD COLUMN custom_domain_status TEXT,           -- 'pending' | 'verifying' | 'active' | 'failed'
      ADD COLUMN custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN custom_domain_added_at TIMESTAMPTZ,
      ADD COLUMN custom_domain_verified_at TIMESTAMPTZ;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain
  ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- --- Generic addons table -------------------------------------
-- One row per active subscription of an addon. Tenants can have
-- multiple addons (custom_domain, sms_pack, etc).

CREATE TYPE tenant_addon_type AS ENUM (
  'custom_domain',
  'sms_pack',
  'extra_storage'
);

CREATE TYPE tenant_addon_status AS ENUM (
  'pending',     -- requested but not yet paid (in next renewal cycle)
  'active',      -- paid + within service period
  'expired',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS tenant_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  addon_type tenant_addon_type NOT NULL,
  status tenant_addon_status NOT NULL DEFAULT 'pending',
  price NUMERIC(12,2) NOT NULL,                 -- THB per cycle
  billing_cycle TEXT NOT NULL DEFAULT 'yearly', -- 'monthly' | 'yearly'
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant_id ON tenant_addons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_addons_active
  ON tenant_addons(tenant_id, addon_type)
  WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_addons_one_active
  ON tenant_addons(tenant_id, addon_type)
  WHERE status IN ('pending', 'active');

ALTER TABLE tenant_addons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenant_addons
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS tenant_addons_member_read ON tenant_addons;
CREATE POLICY tenant_addons_member_read ON tenant_addons
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS tenant_addons_super_admin_write ON tenant_addons;
CREATE POLICY tenant_addons_super_admin_write ON tenant_addons
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

-- --- Reference custom domain in addon metadata ----------------
-- When the tenant subscribes the custom_domain addon, we store the
-- domain in metadata.domain for super_admin visibility.

COMMENT ON TABLE tenant_addons IS
  'Per-tenant paid add-ons. custom_domain addon is required before tenant can configure custom_domain on tenants table.';
