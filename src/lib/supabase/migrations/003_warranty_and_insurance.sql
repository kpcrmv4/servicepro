-- ============================================================
-- Migration: Warranty System + Insurance Claims
-- ============================================================
-- สร้างตาราง warranty_policies, warranty_records, warranty_claims
-- และ insurance_claims สำหรับระบบรับประกันและเคลมประกัน
--
-- หมายเหตุ: ใช้ DO $$ block เพื่อ handle กรณีตารางมีอยู่แล้ว

-- ============================================================
-- 1. Warranty Policies (นโยบายรับประกัน)
-- ============================================================

CREATE TABLE IF NOT EXISTS warranty_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER NOT NULL DEFAULT 12,
  coverage_type TEXT NOT NULL DEFAULT 'full'
    CHECK (coverage_type IN ('parts', 'labor', 'full', 'limited')),
  terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warranty_policies_tenant
  ON warranty_policies(tenant_id);

ALTER TABLE warranty_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "warranty_policies_tenant_isolation" ON warranty_policies
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Warranty Records (บันทึกการรับประกัน)
-- ============================================================

CREATE TABLE IF NOT EXISTS warranty_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  warranty_policy_id UUID NOT NULL REFERENCES warranty_policies(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'claimed', 'voided')),
  coverage_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warranty_records_tenant
  ON warranty_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranty_records_job
  ON warranty_records(job_id);
CREATE INDEX IF NOT EXISTS idx_warranty_records_status
  ON warranty_records(tenant_id, status);

ALTER TABLE warranty_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "warranty_records_tenant_isolation" ON warranty_records
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Warranty Claims (เคลมรับประกัน)
-- ============================================================

CREATE TABLE IF NOT EXISTS warranty_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warranty_record_id UUID NOT NULL REFERENCES warranty_records(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  claim_number TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_tenant
  ON warranty_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_record
  ON warranty_claims(warranty_record_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status
  ON warranty_claims(tenant_id, status);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "warranty_claims_tenant_isolation" ON warranty_claims
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. Insurance Claims (เคลมประกันภัย)
-- ============================================================
-- กรณีตารางมีอยู่แล้ว: เพิ่ม column ที่ขาดด้วย ALTER TABLE

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  claim_number TEXT,
  insurance_company TEXT,
  policy_number TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- เพิ่ม columns ที่อาจขาด (กรณีตารางมีอยู่แล้ว)
DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS claim_number TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS insurance_company TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS policy_number TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
EXCEPTION WHEN others THEN NULL;
END $$;

-- สร้าง index เฉพาะ columns ที่มีอยู่
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_insurance_claims_tenant
    ON insurance_claims(tenant_id);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_insurance_claims_status
    ON insurance_claims(tenant_id, status);
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "insurance_claims_tenant_isolation" ON insurance_claims
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. Updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_warranty_policies_updated_at') THEN
    CREATE TRIGGER set_warranty_policies_updated_at
      BEFORE UPDATE ON warranty_policies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_warranty_records_updated_at') THEN
    CREATE TRIGGER set_warranty_records_updated_at
      BEFORE UPDATE ON warranty_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_warranty_claims_updated_at') THEN
    CREATE TRIGGER set_warranty_claims_updated_at
      BEFORE UPDATE ON warranty_claims
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_insurance_claims_updated_at') THEN
    CREATE TRIGGER set_insurance_claims_updated_at
      BEFORE UPDATE ON insurance_claims
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
