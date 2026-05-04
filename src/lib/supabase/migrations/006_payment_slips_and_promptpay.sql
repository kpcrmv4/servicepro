-- ============================================================
-- 006_payment_slips_and_promptpay.sql
-- Adds slip-image support to subscription_invoices and customer-
-- facing receipts. Stores per-tenant PromptPay/bank info under
-- tenants.settings (JSONB) — no schema change needed for that.
--
-- Convention for tenants.settings JSON:
--   {
--     "promptpay_id": "0812345678" | "1234567890123",
--     "bank_account": {
--       "bank_name": "SCB",
--       "account_number": "123-4-56789-0",
--       "account_name": "ABC Auto Service Ltd."
--     },
--     "accept_credit_card": true
--   }
-- ============================================================

-- Slip image columns
ALTER TABLE subscription_invoices
  ADD COLUMN IF NOT EXISTS payment_slip_url TEXT;

ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS payment_slip_url TEXT;

-- Receipts payment_reference is currently `reference` — keep it as-is.

-- Storage buckets used by the app:
--   - inspection-photos    (existing)
--   - job-photos           (used by uploadGenericPhoto for ad-hoc job/reception photos)
--   - payment-slips        (NEW — bank/PromptPay/credit-card slip images)
--
-- Buckets must be created via the Supabase Studio UI or `supabase storage`
-- CLI. Suggested settings for `payment-slips`:
--   public: false (only authenticated users + service role read)
--   allowed mime: image/jpeg, image/png, image/webp, image/heic
--   max size: 5MB
--
-- For simplicity in v1, the app uses public URLs returned from
-- Supabase Storage. Move to signed URLs in a follow-up if PII concerns arise.
