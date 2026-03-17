-- ============================================================
-- KPServicePro - Full Database Schema for Supabase
-- ============================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'admin', 'manager', 'technician', 'receptionist', 'viewer');
CREATE TYPE job_status AS ENUM ('pending', 'diagnosing', 'quoted', 'in_progress', 'quality_check', 'waiting_pickup', 'completed', 'cancelled');
CREATE TYPE job_priority AS ENUM ('urgent', 'normal', 'low');
CREATE TYPE job_type AS ENUM ('repair', 'maintenance', 'inspection', 'insurance', 'warranty', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'credit_card', 'promptpay');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE insurance_claim_status AS ENUM ('submitted', 'pending_approval', 'approved', 'rejected', 'paid');
CREATE TYPE inspection_condition AS ENUM ('good', 'fair', 'poor');
CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');
CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'return');
CREATE TYPE job_item_type AS ENUM ('part', 'labor', 'other');
CREATE TYPE points_transaction_type AS ENUM ('earn', 'redeem', 'expire');
CREATE TYPE customer_type AS ENUM ('individual', 'company');
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'past_due', 'cancelled');
CREATE TYPE purchase_order_status AS ENUM ('draft', 'sent', 'partial', 'received', 'cancelled');
CREATE TYPE warranty_status AS ENUM ('active', 'expired', 'claimed', 'voided');
CREATE TYPE warranty_claim_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'cancelled');
CREATE TYPE additional_work_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE time_clock_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');
CREATE TYPE line_message_type AS ENUM ('job_status', 'quotation', 'invoice', 'reminder', 'dvi_report', 'booking_confirm', 'welcome', 'custom');
CREATE TYPE line_message_status AS ENUM ('pending', 'sent', 'failed', 'delivered', 'read');

-- ============================================================
-- TENANT & USER TABLES
-- ============================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  tax_id TEXT,
  settings JSONB DEFAULT '{}',
  plan TEXT NOT NULL DEFAULT 'free',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- CUSTOMER & VEHICLE TABLES
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type customer_type NOT NULL DEFAULT 'individual',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  line_id TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  membership_tier membership_tier,
  total_spending NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_name ON customers(tenant_id, name);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  vin TEXT,
  current_mileage INTEGER,
  insurance_company TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  registration_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(tenant_id, license_plate);

-- ============================================================
-- JOB MANAGEMENT TABLES
-- ============================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_number TEXT NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quotation_id UUID,
  type job_type NOT NULL DEFAULT 'repair',
  status job_status NOT NULL DEFAULT 'pending',
  priority job_priority NOT NULL DEFAULT 'normal',
  description TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  bay_number TEXT,
  notes TEXT,
  total_parts_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_jobs_job_number ON jobs(tenant_id, job_number);
CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_jobs_status ON jobs(tenant_id, status);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX idx_jobs_created_at ON jobs(tenant_id, created_at DESC);

CREATE TABLE job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type job_item_type NOT NULL,
  part_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  warranty_months INTEGER,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_items_job_id ON job_items(job_id);

CREATE TABLE job_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status job_status NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_timeline_job_id ON job_timeline(job_id);

-- ============================================================
-- QUOTATION, INVOICE & RECEIPT TABLES
-- ============================================================

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status quotation_status NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_quotations_number ON quotations(tenant_id, quotation_number);
CREATE INDEX idx_quotations_tenant_id ON quotations(tenant_id);
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);

ALTER TABLE jobs ADD CONSTRAINT fk_jobs_quotation_id FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invoices_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_receipts_number ON receipts(tenant_id, receipt_number);
CREATE INDEX idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX idx_receipts_invoice_id ON receipts(invoice_id);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX idx_expenses_date ON expenses(tenant_id, date DESC);

-- ============================================================
-- RECURRING EXPENSES TABLE
-- ============================================================

CREATE TYPE recurring_expense_type AS ENUM ('fixed', 'variable');

CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type recurring_expense_type NOT NULL DEFAULT 'fixed',
  amount NUMERIC(12,2),  -- NULL for variable type
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_month TEXT,  -- YYYY-MM format of last generated expense
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_expenses_tenant_id ON recurring_expenses(tenant_id);
CREATE INDEX idx_recurring_expenses_active ON recurring_expenses(tenant_id, is_active) WHERE is_active = true;

-- ============================================================
-- PARTS & INVENTORY TABLES
-- ============================================================

CREATE TABLE part_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES part_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_part_categories_tenant_id ON part_categories(tenant_id);

CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  category_id UUID REFERENCES part_categories(id) ON DELETE SET NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'piece',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_stock NUMERIC(10,2),
  reorder_point NUMERIC(10,2) NOT NULL DEFAULT 0,
  location TEXT,
  barcode TEXT,
  image_url TEXT,
  compatible_vehicles JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_parts_part_number ON parts(tenant_id, part_number);
CREATE INDEX idx_parts_tenant_id ON parts(tenant_id);
CREATE INDEX idx_parts_category_id ON parts(category_id);
CREATE INDEX idx_parts_name ON parts(tenant_id, name);
CREATE INDEX idx_parts_barcode ON parts(tenant_id, barcode);

ALTER TABLE job_items ADD CONSTRAINT fk_job_items_part_id FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL;

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_delivery DATE,
  notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_purchase_orders_number ON purchase_orders(tenant_id, po_number);
CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  type stock_movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_tenant_id ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_part_id ON stock_movements(part_id);
CREATE INDEX idx_stock_movements_job_id ON stock_movements(job_id);

-- Stock Batches: tracks each incoming lot for FEFO and weighted average cost
CREATE TABLE stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  quantity_received NUMERIC(10,2) NOT NULL,
  quantity_remaining NUMERIC(10,2) NOT NULL,
  cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  batch_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_batches_part_id ON stock_batches(part_id);
CREATE INDEX idx_stock_batches_expiry ON stock_batches(part_id, expiry_date ASC NULLS LAST) WHERE quantity_remaining > 0;

-- POS Sales table
CREATE TABLE pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_pos_sales_number ON pos_sales(tenant_id, sale_number);
CREATE INDEX idx_pos_sales_tenant_id ON pos_sales(tenant_id);

-- ============================================================
-- INSURANCE TABLES
-- ============================================================

CREATE TABLE insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  contract_terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_companies_tenant_id ON insurance_companies(tenant_id);

CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE RESTRICT,
  policy_number TEXT NOT NULL,
  claim_status insurance_claim_status NOT NULL DEFAULT 'submitted',
  estimated_amount NUMERIC(12,2),
  approved_amount NUMERIC(12,2),
  customer_copay NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_claims_tenant_id ON insurance_claims(tenant_id);
CREATE INDEX idx_insurance_claims_job_id ON insurance_claims(job_id);

-- ============================================================
-- INSPECTION / DVI TABLES
-- ============================================================

CREATE TABLE vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  inspected_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  mileage_at_inspection INTEGER,
  overall_score NUMERIC(3,1),
  status TEXT NOT NULL DEFAULT 'draft',
  customer_viewed_at TIMESTAMPTZ,
  sent_to_customer_at TIMESTAMPTZ,
  share_token TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_inspections_tenant_id ON vehicle_inspections(tenant_id);
CREATE INDEX idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_share_token ON vehicle_inspections(share_token);

CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  condition inspection_condition NOT NULL DEFAULT 'good',
  notes TEXT,
  photo_url TEXT,
  estimated_cost NUMERIC(12,2),
  customer_approved BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_items_inspection_id ON inspection_items(inspection_id);

-- ============================================================
-- WARRANTY TABLES
-- ============================================================

CREATE TABLE warranty_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER NOT NULL,
  coverage_type TEXT NOT NULL,
  terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warranty_policies_tenant_id ON warranty_policies(tenant_id);

CREATE TABLE warranty_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  warranty_policy_id UUID NOT NULL REFERENCES warranty_policies(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status warranty_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warranty_records_tenant_id ON warranty_records(tenant_id);
CREATE INDEX idx_warranty_records_job_id ON warranty_records(job_id);

CREATE TABLE warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warranty_record_id UUID NOT NULL REFERENCES warranty_records(id) ON DELETE RESTRICT,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  status warranty_claim_status NOT NULL DEFAULT 'pending',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warranty_claims_tenant_id ON warranty_claims(tenant_id);

-- ============================================================
-- ADDITIONAL WORK REQUESTS
-- ============================================================

CREATE TABLE additional_work_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  status additional_work_status NOT NULL DEFAULT 'pending',
  customer_notified_at TIMESTAMPTZ,
  customer_responded_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_additional_work_requests_tenant_id ON additional_work_requests(tenant_id);
CREATE INDEX idx_additional_work_requests_job_id ON additional_work_requests(job_id);

-- ============================================================
-- SERVICE REMINDERS & DECLINED SERVICES
-- ============================================================

CREATE TABLE service_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  trigger_date DATE NOT NULL,
  trigger_mileage INTEGER,
  message_template TEXT,
  status reminder_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  sent_via TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_reminders_tenant_id ON service_reminders(tenant_id);
CREATE INDEX idx_service_reminders_trigger_date ON service_reminders(tenant_id, trigger_date);
CREATE INDEX idx_service_reminders_status ON service_reminders(tenant_id, status);

CREATE TABLE declined_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_cost NUMERIC(12,2),
  reason TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_declined_services_tenant_id ON declined_services(tenant_id);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  comment TEXT,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_reviews_tenant_id ON service_reviews(tenant_id);
CREATE INDEX idx_service_reviews_job_id ON service_reviews(job_id);

-- ============================================================
-- CUSTOMER PORTAL & LOYALTY
-- ============================================================

CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier membership_tier NOT NULL,
  min_spending NUMERIC(12,2) NOT NULL DEFAULT 0,
  points_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  benefits JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_membership_tiers_tenant_id ON membership_tiers(tenant_id);

CREATE TABLE customer_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tier membership_tier NOT NULL DEFAULT 'bronze',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_memberships_tenant_id ON customer_memberships(tenant_id);
CREATE INDEX idx_customer_memberships_customer_id ON customer_memberships(customer_id);

CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type points_transaction_type NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_transactions_tenant_id ON points_transactions(tenant_id);
CREATE INDEX idx_points_transactions_customer_id ON points_transactions(customer_id);

CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_referral_codes_code ON referral_codes(tenant_id, code);
CREATE INDEX idx_referral_codes_tenant_id ON referral_codes(tenant_id);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referred_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_tenant_id ON referrals(tenant_id);

CREATE TABLE customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  line_user_id TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_accounts_tenant_id ON customer_accounts(tenant_id);
CREATE INDEX idx_customer_accounts_customer_id ON customer_accounts(customer_id);
CREATE INDEX idx_customer_accounts_line_user_id ON customer_accounts(tenant_id, line_user_id);

CREATE TABLE customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_account_id UUID NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_sessions_token ON customer_sessions(token);

CREATE TABLE customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_account_id UUID NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_notifications_tenant_id ON customer_notifications(tenant_id);
CREATE INDEX idx_customer_notifications_account_id ON customer_notifications(customer_account_id);

-- ============================================================
-- KNOWLEDGE BASE
-- ============================================================

CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_articles_tenant_id ON knowledge_articles(tenant_id);

-- ============================================================
-- EMPLOYEE, COMMISSION & TIME CLOCK TABLES
-- ============================================================

CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  certified BOOLEAN NOT NULL DEFAULT false,
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_skills_tenant_id ON employee_skills(tenant_id);
CREATE INDEX idx_employee_skills_user_id ON employee_skills(user_id);

CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  min_threshold NUMERIC(12,2),
  max_threshold NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_rules_tenant_id ON commission_rules(tenant_id);

CREATE TABLE commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  commission_rule_id UUID REFERENCES commission_rules(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_records_tenant_id ON commission_records(tenant_id);
CREATE INDEX idx_commission_records_user_id ON commission_records(user_id);

-- Technician Time Clock
CREATE TABLE time_clock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_type time_clock_type NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_clock_entries_tenant_id ON time_clock_entries(tenant_id);
CREATE INDEX idx_time_clock_entries_user_id ON time_clock_entries(user_id);
CREATE INDEX idx_time_clock_entries_timestamp ON time_clock_entries(tenant_id, timestamp DESC);
CREATE INDEX idx_time_clock_entries_job_id ON time_clock_entries(job_id);

-- Daily summary for time clock
CREATE TABLE time_clock_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  break_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  productive_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  jobs_completed INTEGER NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_time_clock_summaries_unique ON time_clock_summaries(tenant_id, user_id, date);
CREATE INDEX idx_time_clock_summaries_tenant_id ON time_clock_summaries(tenant_id);
CREATE INDEX idx_time_clock_summaries_user_id ON time_clock_summaries(user_id);

-- ============================================================
-- SERVICE PACKAGES
-- ============================================================

CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  compatible_brands TEXT[],
  compatible_models TEXT[],
  estimated_duration_minutes INTEGER,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_packages_tenant_id ON service_packages(tenant_id);
CREATE INDEX idx_service_packages_category ON service_packages(tenant_id, category);

CREATE TABLE service_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  type job_item_type NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_package_items_package_id ON service_package_items(package_id);

-- ============================================================
-- LINE OA INTEGRATION TABLES (Multi-Tenant)
-- ============================================================

CREATE TABLE line_oa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  channel_id TEXT NOT NULL,
  channel_secret TEXT NOT NULL,
  channel_access_token TEXT NOT NULL,
  liff_id TEXT,
  rich_menu_id TEXT,
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_settings JSONB DEFAULT '{"job_status": true, "quotation": true, "invoice": true, "reminder": true, "dvi_report": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_oa_configs_tenant_id ON line_oa_configs(tenant_id);
CREATE INDEX idx_line_oa_configs_channel_id ON line_oa_configs(channel_id);

-- LINE followers linked to customers
CREATE TABLE line_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  display_name TEXT,
  picture_url TEXT,
  status_message TEXT,
  is_following BOOLEAN NOT NULL DEFAULT true,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unfollowed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_line_followers_unique ON line_followers(tenant_id, line_user_id);
CREATE INDEX idx_line_followers_tenant_id ON line_followers(tenant_id);
CREATE INDEX idx_line_followers_customer_id ON line_followers(customer_id);
CREATE INDEX idx_line_followers_line_user_id ON line_followers(line_user_id);

-- LINE message log
CREATE TABLE line_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outgoing',
  message_type line_message_type NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  reference_type TEXT,
  reference_id UUID,
  status line_message_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_messages_tenant_id ON line_messages(tenant_id);
CREATE INDEX idx_line_messages_line_user_id ON line_messages(tenant_id, line_user_id);
CREATE INDEX idx_line_messages_status ON line_messages(tenant_id, status);
CREATE INDEX idx_line_messages_created_at ON line_messages(tenant_id, created_at DESC);

-- LINE message templates per tenant
CREATE TABLE line_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type line_message_type NOT NULL,
  template JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_message_templates_tenant_id ON line_message_templates(tenant_id);
CREATE UNIQUE INDEX idx_line_message_templates_unique ON line_message_templates(tenant_id, name);

-- ============================================================
-- MULTI-TENANT DOMAIN & LANDING PAGES
-- ============================================================

CREATE TABLE tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_landing_pages_slug ON landing_pages(tenant_id, slug);
CREATE INDEX idx_landing_pages_tenant_id ON landing_pages(tenant_id);

CREATE TABLE landing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_sections_page_id ON landing_sections(landing_page_id);

-- ============================================================
-- SHOP / E-COMMERCE TABLES
-- ============================================================

CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'THB',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 7,
  shipping_enabled BOOLEAN NOT NULL DEFAULT false,
  min_order_amount NUMERIC(12,2),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_settings_tenant_id ON shop_settings(tenant_id);

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_product_categories_slug ON product_categories(tenant_id, slug);
CREATE INDEX idx_product_categories_tenant_id ON product_categories(tenant_id);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC(12,2) NOT NULL,
  compare_at_price NUMERIC(12,2),
  cost_price NUMERIC(12,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  images TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  options JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_tenant_id ON product_reviews(tenant_id);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  payment_method payment_method,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  coupon_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_orders_number ON orders(tenant_id, order_number);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(12,2) NOT NULL,
  min_order_amount NUMERIC(12,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(tenant_id, code);
CREATE INDEX idx_coupons_tenant_id ON coupons(tenant_id);

ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon_id FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_wishlists_unique ON wishlists(customer_id, product_id);
CREATE INDEX idx_wishlists_tenant_id ON wishlists(tenant_id);

CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_weight NUMERIC(10,2),
  max_weight NUMERIC(10,2),
  min_order_amount NUMERIC(12,2),
  rate NUMERIC(12,2) NOT NULL,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipping_rates_tenant_id ON shipping_rates(tenant_id);

-- ============================================================
-- SYSTEM TABLES
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(tenant_id, table_name);

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_notification_settings_unique ON notification_settings(user_id, channel, event_type);
CREATE INDEX idx_notification_settings_tenant_id ON notification_settings(tenant_id);

CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status subscription_status NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_history_tenant_id ON subscription_history(tenant_id);

-- ============================================================
-- TRIAL REGISTRATIONS (Public form submissions before account creation)
-- ============================================================

CREATE TYPE trial_status AS ENUM ('pending', 'approved', 'rejected', 'converted', 'expired');

CREATE TABLE trial_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  shop_address TEXT,
  shop_type TEXT DEFAULT 'general',
  employee_count TEXT DEFAULT '1-5',
  how_did_you_find TEXT,
  message TEXT,
  status trial_status NOT NULL DEFAULT 'pending',
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trial_registrations_status ON trial_registrations(status);
CREATE INDEX idx_trial_registrations_email ON trial_registrations(email);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_work_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE declined_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clock_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_oa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - Tenant Isolation + Super Admin Bypass
-- ============================================================

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Tenants: users can see their own tenant, super_admin can see all
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Owners can update own tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id() OR is_super_admin())
  WITH CHECK (id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Super admin can insert tenants"
  ON tenants FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can delete tenants"
  ON tenants FOR DELETE
  USING (is_super_admin());

-- Users: tenant isolation + super_admin bypass
CREATE POLICY "Users can view tenant members"
  ON users FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin() OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid() OR is_super_admin())
  WITH CHECK (id = auth.uid() OR is_super_admin());

CREATE POLICY "Super admin or owner can insert users"
  ON users FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_user_tenant_id());

CREATE POLICY "Super admin can delete users"
  ON users FOR DELETE
  USING (is_super_admin());

-- Generic tenant isolation policies with super_admin bypass
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'customers', 'vehicles', 'jobs', 'quotations', 'invoices', 'receipts',
      'expenses', 'part_categories', 'parts', 'suppliers', 'purchase_orders',
      'stock_movements', 'insurance_companies', 'insurance_claims',
      'vehicle_inspections', 'warranty_policies', 'warranty_records',
      'warranty_claims', 'additional_work_requests', 'service_reminders',
      'declined_services', 'service_reviews', 'membership_tiers',
      'customer_memberships', 'points_transactions', 'referral_codes',
      'referrals', 'customer_accounts', 'customer_notifications',
      'knowledge_articles', 'employee_skills', 'commission_rules',
      'commission_records', 'tenant_domains', 'landing_pages',
      'shop_settings', 'product_categories', 'products', 'product_reviews',
      'orders', 'coupons', 'wishlists', 'shipping_rates',
      'notification_settings', 'subscription_history',
      'time_clock_entries', 'time_clock_summaries',
      'service_packages', 'line_oa_configs', 'line_followers',
      'line_messages', 'line_message_templates'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Tenant isolation select on %I" ON %I FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation insert on %I" ON %I FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() OR is_super_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation update on %I" ON %I FOR UPDATE USING (tenant_id = get_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = get_user_tenant_id() OR is_super_admin())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "Tenant isolation delete on %I" ON %I FOR DELETE USING (tenant_id = get_user_tenant_id() OR is_super_admin())',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Audit logs: super_admin can see all, tenant users see own
CREATE POLICY "Tenant isolation select on audit_logs"
  ON audit_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Tenant isolation insert on audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_super_admin());

-- Policies for tables without tenant_id (joined through parent)
CREATE POLICY "Tenant isolation select on job_items"
  ON job_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on job_items"
  ON job_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation update on job_items"
  ON job_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on job_items"
  ON job_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on job_timeline"
  ON job_timeline FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_timeline.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on job_timeline"
  ON job_timeline FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_timeline.job_id AND (jobs.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on inspection_items"
  ON inspection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM vehicle_inspections WHERE vehicle_inspections.id = inspection_items.inspection_id AND (vehicle_inspections.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on inspection_items"
  ON inspection_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM vehicle_inspections WHERE vehicle_inspections.id = inspection_items.inspection_id AND (vehicle_inspections.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation update on inspection_items"
  ON inspection_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM vehicle_inspections WHERE vehicle_inspections.id = inspection_items.inspection_id AND (vehicle_inspections.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on inspection_items"
  ON inspection_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM vehicle_inspections WHERE vehicle_inspections.id = inspection_items.inspection_id AND (vehicle_inspections.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on service_package_items"
  ON service_package_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM service_packages WHERE service_packages.id = service_package_items.package_id AND (service_packages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on service_package_items"
  ON service_package_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM service_packages WHERE service_packages.id = service_package_items.package_id AND (service_packages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation update on service_package_items"
  ON service_package_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM service_packages WHERE service_packages.id = service_package_items.package_id AND (service_packages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on service_package_items"
  ON service_package_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM service_packages WHERE service_packages.id = service_package_items.package_id AND (service_packages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on landing_sections"
  ON landing_sections FOR SELECT
  USING (EXISTS (SELECT 1 FROM landing_pages WHERE landing_pages.id = landing_sections.landing_page_id AND (landing_pages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on landing_sections"
  ON landing_sections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM landing_pages WHERE landing_pages.id = landing_sections.landing_page_id AND (landing_pages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation update on landing_sections"
  ON landing_sections FOR UPDATE
  USING (EXISTS (SELECT 1 FROM landing_pages WHERE landing_pages.id = landing_sections.landing_page_id AND (landing_pages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on landing_sections"
  ON landing_sections FOR DELETE
  USING (EXISTS (SELECT 1 FROM landing_pages WHERE landing_pages.id = landing_sections.landing_page_id AND (landing_pages.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on product_variants"
  ON product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND (products.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on product_variants"
  ON product_variants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND (products.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation update on product_variants"
  ON product_variants FOR UPDATE
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND (products.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on product_variants"
  ON product_variants FOR DELETE
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND (products.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on order_items"
  ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on order_items"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation select on customer_sessions"
  ON customer_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM customer_accounts WHERE customer_accounts.id = customer_sessions.customer_account_id AND (customer_accounts.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation insert on customer_sessions"
  ON customer_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM customer_accounts WHERE customer_accounts.id = customer_sessions.customer_account_id AND (customer_accounts.tenant_id = get_user_tenant_id() OR is_super_admin())));

CREATE POLICY "Tenant isolation delete on customer_sessions"
  ON customer_sessions FOR DELETE
  USING (EXISTS (SELECT 1 FROM customer_accounts WHERE customer_accounts.id = customer_sessions.customer_account_id AND (customer_accounts.tenant_id = get_user_tenant_id() OR is_super_admin())));

-- Public access for DVI share links (no auth required)
CREATE POLICY "Public can view shared inspections"
  ON vehicle_inspections FOR SELECT
  USING (share_token IS NOT NULL AND status = 'sent');

CREATE POLICY "Public can view shared inspection items"
  ON inspection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM vehicle_inspections WHERE vehicle_inspections.id = inspection_items.inspection_id AND vehicle_inspections.share_token IS NOT NULL AND vehicle_inspections.status = 'sent'));

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON shop_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON line_oa_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON line_message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Auto-create user profile after signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Auto-generate share token for DVI
-- ============================================================

CREATE OR REPLACE FUNCTION generate_inspection_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_token IS NULL THEN
    NEW.share_token = encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inspection_share_token
  BEFORE INSERT ON vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION generate_inspection_share_token();

-- ============================================================
-- FUNCTION: Auto-calculate inspection overall score
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_inspection_score()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  good_items INTEGER;
  fair_items INTEGER;
  score NUMERIC(3,1);
BEGIN
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE condition = 'good'),
         COUNT(*) FILTER (WHERE condition = 'fair')
  INTO total_items, good_items, fair_items
  FROM inspection_items
  WHERE inspection_id = COALESCE(NEW.inspection_id, OLD.inspection_id);

  IF total_items > 0 THEN
    score = ((good_items * 10.0 + fair_items * 5.0) / (total_items * 10.0)) * 10;
    UPDATE vehicle_inspections 
    SET overall_score = score 
    WHERE id = COALESCE(NEW.inspection_id, OLD.inspection_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspection_score
  AFTER INSERT OR UPDATE OR DELETE ON inspection_items
  FOR EACH ROW EXECUTE FUNCTION calculate_inspection_score();
