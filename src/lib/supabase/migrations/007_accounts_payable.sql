-- ============================================================
-- 007_accounts_payable.sql
-- Tracks shop's payables to suppliers (parts, services, utilities).
-- Pairs with the existing receivables (invoices/receipts) for full
-- AP/AR coverage.
-- ============================================================

CREATE TYPE supplier_invoice_status AS ENUM (
  'pending',     -- received, not yet paid
  'partial',     -- partially paid
  'paid',
  'overdue',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,           -- supplier's invoice number (not ours)
  reference TEXT,                          -- our internal reference if any
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status supplier_invoice_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  document_url TEXT,                       -- scanned invoice / tax invoice photo
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_tenant_id ON supplier_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_due_date ON supplier_invoices(tenant_id, due_date);

ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'transfer',
  reference TEXT,                          -- bank slip ref / cheque no.
  payment_slip_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_tenant_id ON supplier_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice ON supplier_payments(supplier_invoice_id);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON supplier_invoices
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
DROP POLICY IF EXISTS sup_inv_tenant ON supplier_invoices;
CREATE POLICY sup_inv_tenant ON supplier_invoices
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS sup_pay_tenant ON supplier_payments;
CREATE POLICY sup_pay_tenant ON supplier_payments
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );
