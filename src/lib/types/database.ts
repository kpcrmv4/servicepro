// ============================================================
// Core Enum Types
// ============================================================

export type UserRole = 'owner' | 'admin' | 'manager' | 'technician' | 'receptionist' | 'viewer'
export type JobStatus = 'pending' | 'diagnosing' | 'quoted' | 'in_progress' | 'quality_check' | 'waiting_pickup' | 'completed' | 'cancelled'
export type JobPriority = 'urgent' | 'normal' | 'low'
export type JobType = 'repair' | 'maintenance' | 'inspection' | 'insurance' | 'warranty' | 'other'
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card' | 'promptpay'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type InsuranceClaimStatus = 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'paid'
export type InspectionCondition = 'good' | 'fair' | 'poor'
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return'
export type JobItemType = 'part' | 'labor' | 'other'
export type PointsTransactionType = 'earn' | 'redeem' | 'expire'
export type CustomerType = 'individual' | 'company'
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled'
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'voided'
export type WarrantyClaimStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type ReminderStatus = 'pending' | 'sent' | 'cancelled'
export type AdditionalWorkStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

// ============================================================
// Tenant & User Tables
// ============================================================

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  tax_id: string | null
  settings: Record<string, unknown> | null
  plan: string
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Customer & Vehicle Tables
// ============================================================

export interface Customer {
  id: string
  tenant_id: string
  type: CustomerType
  name: string
  phone: string | null
  email: string | null
  line_id: string | null
  address: string | null
  tax_id: string | null
  notes: string | null
  loyalty_points: number
  membership_tier: MembershipTier | null
  total_spending: number
  total_visits: number
  created_at: string
}

export interface Vehicle {
  id: string
  tenant_id: string
  customer_id: string
  license_plate: string
  brand: string
  model: string
  year: number | null
  color: string | null
  vin: string | null
  current_mileage: number | null
  insurance_company: string | null
  insurance_policy: string | null
  insurance_expiry: string | null
  registration_expiry: string | null
  notes: string | null
  created_at: string
}

// ============================================================
// Job Management Tables
// ============================================================

export interface Job {
  id: string
  tenant_id: string
  job_number: string
  vehicle_id: string
  customer_id: string
  quotation_id: string | null
  type: JobType
  status: JobStatus
  priority: JobPriority
  description: string | null
  assigned_to: string | null
  estimated_completion: string | null
  actual_completion: string | null
  bay_number: string | null
  notes: string | null
  total_parts_cost: number
  total_labor_cost: number
  total_amount: number
  discount: number
  vat: number
  grand_total: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface JobItem {
  id: string
  job_id: string
  type: JobItemType
  part_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  warranty_months: number | null
  technician_id: string | null
  status: string
  notes: string | null
  created_at: string
}

export interface JobTimeline {
  id: string
  job_id: string
  status: JobStatus
  notes: string | null
  photo_url: string | null
  created_by: string
  created_at: string
}

// ============================================================
// Quotation, Invoice & Receipt Tables
// ============================================================

export interface Quotation {
  id: string
  tenant_id: string
  quotation_number: string
  job_id: string | null
  customer_id: string
  vehicle_id: string | null
  status: QuotationStatus
  items: Record<string, unknown>[]
  subtotal: number
  discount: number
  vat: number
  total: number
  valid_until: string | null
  approved_at: string | null
  approved_by: string | null
  version: number
  notes: string | null
  created_by: string
  created_at: string
}

export interface Invoice {
  id: string
  tenant_id: string
  invoice_number: string
  job_id: string
  customer_id: string
  items: Record<string, unknown>[]
  subtotal: number
  discount: number
  vat: number
  total: number
  payment_status: PaymentStatus
  due_date: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface Receipt {
  id: string
  tenant_id: string
  receipt_number: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  reference: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface Expense {
  id: string
  tenant_id: string
  category: string
  description: string
  amount: number
  date: string
  receipt_url: string | null
  approved_by: string | null
  created_by: string
  created_at: string
}

// ============================================================
// Parts & Inventory Tables
// ============================================================

export interface Part {
  id: string
  tenant_id: string
  part_number: string
  sku: string | null
  name: string
  brand: string | null
  category_id: string | null
  description: string | null
  unit: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  max_stock: number | null
  reorder_point: number
  location: string | null
  barcode: string | null
  image_url: string | null
  compatible_vehicles: Record<string, unknown>[] | null
  is_active: boolean
  created_at: string
}

export interface PartCategory {
  id: string
  tenant_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Supplier {
  id: string
  tenant_id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface PurchaseOrder {
  id: string
  tenant_id: string
  po_number: string
  supplier_id: string
  status: PurchaseOrderStatus
  items: Record<string, unknown>[]
  subtotal: number
  vat: number
  total: number
  expected_delivery: string | null
  notes: string | null
  approved_by: string | null
  created_by: string
  created_at: string
}

export interface StockMovement {
  id: string
  tenant_id: string
  part_id: string
  job_id: string | null
  po_id: string | null
  type: StockMovementType
  quantity: number
  reference: string | null
  notes: string | null
  created_by: string
  created_at: string
}

// ============================================================
// Insurance Tables
// ============================================================

export interface InsuranceCompany {
  id: string
  tenant_id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  contract_terms: string | null
  is_active: boolean
  created_at: string
}

export interface InsuranceClaim {
  id: string
  tenant_id: string
  job_id: string
  insurance_company_id: string
  policy_number: string
  claim_status: InsuranceClaimStatus
  estimated_amount: number | null
  approved_amount: number | null
  customer_copay: number | null
  notes: string | null
  created_at: string
}

// ============================================================
// Inspection Tables
// ============================================================

export interface VehicleInspection {
  id: string
  tenant_id: string
  vehicle_id: string
  job_id: string | null
  inspected_by: string
  overall_score: number | null
  status: string
  sent_to_customer_at: string | null
  created_at: string
}

export interface InspectionItem {
  id: string
  inspection_id: string
  category: string
  item_name: string
  condition: InspectionCondition
  notes: string | null
  photo_url: string | null
  estimated_cost: number | null
  customer_approved: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// Warranty Tables
// ============================================================

export interface WarrantyPolicy {
  id: string
  tenant_id: string
  name: string
  description: string | null
  duration_months: number
  coverage_type: string
  terms: string | null
  is_active: boolean
  created_at: string
}

export interface WarrantyRecord {
  id: string
  tenant_id: string
  job_id: string
  part_id: string | null
  warranty_policy_id: string
  start_date: string
  end_date: string
  status: WarrantyStatus
  created_at: string
}

export interface WarrantyClaim {
  id: string
  tenant_id: string
  warranty_record_id: string
  job_id: string
  description: string
  status: WarrantyClaimStatus
  resolution: string | null
  resolved_at: string | null
  created_by: string
  created_at: string
}

// ============================================================
// Service Reminders & Declined Services
// ============================================================

export interface ServiceReminder {
  id: string
  tenant_id: string
  vehicle_id: string
  customer_id: string
  reminder_type: string
  trigger_date: string
  message_template: string | null
  status: ReminderStatus
  sent_at: string | null
  created_at: string
}

export interface DeclinedService {
  id: string
  tenant_id: string
  job_id: string
  vehicle_id: string
  customer_id: string
  description: string
  estimated_cost: number | null
  reason: string | null
  follow_up_date: string | null
  created_at: string
}

// ============================================================
// Additional Work Requests
// ============================================================

export interface AdditionalWorkRequest {
  id: string
  tenant_id: string
  job_id: string
  description: string
  estimated_cost: number
  photo_url: string | null
  status: AdditionalWorkStatus
  customer_notified_at: string | null
  customer_responded_at: string | null
  approved_by: string | null
  created_by: string
  created_at: string
}

// ============================================================
// Reviews
// ============================================================

export interface ServiceReview {
  id: string
  tenant_id: string
  job_id: string
  customer_id: string
  overall_rating: number
  quality_rating: number | null
  speed_rating: number | null
  price_rating: number | null
  service_rating: number | null
  comment: string | null
  technician_id: string | null
  created_at: string
}

// ============================================================
// Customer Portal & Loyalty
// ============================================================

export interface CustomerAccount {
  id: string
  customer_id: string
  tenant_id: string
  phone: string | null
  email: string | null
  line_user_id: string | null
  is_verified: boolean
  last_login: string | null
  created_at: string
}

export interface CustomerSession {
  id: string
  customer_account_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface CustomerNotification {
  id: string
  customer_account_id: string
  tenant_id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

export interface MembershipTierConfig {
  id: string
  tenant_id: string
  tier: MembershipTier
  min_spending: number
  points_multiplier: number
  discount_percent: number
  benefits: Record<string, unknown> | null
  created_at: string
}

export interface CustomerMembership {
  id: string
  customer_id: string
  tenant_id: string
  tier: MembershipTier
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface PointsTransaction {
  id: string
  customer_id: string
  tenant_id: string
  points: number
  type: PointsTransactionType
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_at: string
}

export interface ReferralCode {
  id: string
  tenant_id: string
  customer_id: string
  code: string
  reward_points: number
  is_active: boolean
  created_at: string
}

export interface Referral {
  id: string
  tenant_id: string
  referral_code_id: string
  referred_customer_id: string
  reward_granted: boolean
  created_at: string
}

// ============================================================
// Knowledge Base
// ============================================================

export interface KnowledgeArticle {
  id: string
  tenant_id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  author_id: string
  is_published: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Employee & Commission Tables
// ============================================================

export interface EmployeeSkill {
  id: string
  tenant_id: string
  user_id: string
  skill_name: string
  proficiency_level: number
  certified: boolean
  certified_at: string | null
  created_at: string
}

export interface CommissionRule {
  id: string
  tenant_id: string
  name: string
  type: string
  rate: number
  min_threshold: number | null
  max_threshold: number | null
  is_active: boolean
  created_at: string
}

export interface CommissionRecord {
  id: string
  tenant_id: string
  user_id: string
  job_id: string | null
  commission_rule_id: string | null
  amount: number
  period: string
  status: string
  paid_at: string | null
  created_at: string
}

// ============================================================
// Multi-tenant Domain & Landing Pages
// ============================================================

export interface TenantDomain {
  id: string
  tenant_id: string
  domain: string
  is_primary: boolean
  is_verified: boolean
  created_at: string
}

export interface LandingPage {
  id: string
  tenant_id: string
  slug: string
  title: string
  meta_description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LandingSection {
  id: string
  landing_page_id: string
  type: string
  content: Record<string, unknown>
  sort_order: number
  is_visible: boolean
  created_at: string
}

// ============================================================
// Shop / E-commerce Tables
// ============================================================

export interface ShopSettings {
  id: string
  tenant_id: string
  is_enabled: boolean
  currency: string
  tax_rate: number
  shipping_enabled: boolean
  min_order_amount: number | null
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  tenant_id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  sku: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  images: string[] | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  stock_quantity: number
  options: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export interface ProductReview {
  id: string
  product_id: string
  customer_id: string
  tenant_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
}

export interface Order {
  id: string
  tenant_id: string
  customer_id: string
  order_number: string
  status: OrderStatus
  items: Record<string, unknown>[]
  subtotal: number
  discount: number
  shipping_cost: number
  tax: number
  total: number
  shipping_address: Record<string, unknown> | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  notes: string | null
  coupon_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface Coupon {
  id: string
  tenant_id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

export interface Wishlist {
  id: string
  customer_id: string
  tenant_id: string
  product_id: string
  created_at: string
}

export interface ShippingRate {
  id: string
  tenant_id: string
  name: string
  min_weight: number | null
  max_weight: number | null
  min_order_amount: number | null
  rate: number
  estimated_days: string | null
  is_active: boolean
  created_at: string
}

// ============================================================
// System Tables
// ============================================================

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface NotificationSetting {
  id: string
  tenant_id: string
  user_id: string
  channel: string
  event_type: string
  is_enabled: boolean
  created_at: string
}

export interface SubscriptionHistory {
  id: string
  tenant_id: string
  plan: string
  status: SubscriptionStatus
  started_at: string
  ended_at: string | null
  amount: number
  payment_reference: string | null
  created_at: string
}

// ============================================================
// LINE OA Integration Tables
// ============================================================

export type ClockType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end'

export interface LineOAConfig {
  id: string
  tenant_id: string
  channel_id: string
  channel_secret: string
  channel_access_token: string
  welcome_message: string | null
  auto_reply_enabled: boolean
  notify_job_status: boolean
  notify_job_complete: boolean
  notify_quotation: boolean
  notify_inspection: boolean
  notify_reminder: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LineFollower {
  id: string
  tenant_id: string
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  customer_id: string | null
  is_following: boolean
  followed_at: string
  unfollowed_at: string | null
  created_at: string
}

export interface LineMessageLog {
  id: string
  tenant_id: string
  line_user_id: string
  direction: 'incoming' | 'outgoing'
  message_type: string
  content: Record<string, unknown> | null
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

// ============================================================
// Service Packages Tables
// ============================================================

export interface ServicePackage {
  id: string
  tenant_id: string
  name: string
  description: string | null
  category: string | null
  base_price: number
  estimated_duration_minutes: number | null
  is_popular: boolean
  is_active: boolean
  compatible_brands: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ServicePackageItem {
  id: string
  package_id: string
  type: JobItemType
  part_id: string | null
  description: string
  quantity: number
  unit_price: number
  created_at: string
}

// ============================================================
// Technician Time Clock Tables
// ============================================================

export interface TimeClockEntry {
  id: string
  tenant_id: string
  user_id: string
  clock_type: ClockType
  timestamp: string
  notes: string | null
  created_at: string
}

export interface TimeClockSummary {
  id: string
  tenant_id: string
  user_id: string
  date: string
  total_hours: number
  productive_hours: number
  break_hours: number
  overtime_hours: number
  jobs_completed: number
  created_at: string
}
