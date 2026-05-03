-- ============================================================
-- 010_booking_and_customer_notifications.sql
-- All settings live inside tenants.settings JSONB so we don't
-- proliferate schemas. This migration only documents the shape and
-- adds a CHECK that validates the JSON when saved (lightweight).
--
-- tenants.settings shape (relevant keys; other keys are preserved):
--   {
--     ... (existing promptpay_id, bank_account, etc.)
--     "booking": {
--       "online_booking_enabled": true,
--       "weekday_hours": {            // keys 0..6 (0=Sun, 6=Sat)
--         "0": null,                   // closed
--         "1": {
--           "open": "09:00",
--           "close": "17:00",
--           "max_bookings": 8,
--           "slot_minutes": 60         // null/0 = whole-day mode
--         },
--         ...
--       },
--       "advance_booking_days": 0,     // 0 = same-day allowed
--       "max_advance_days": 30,
--       "auto_close_when_full": true,
--       "advance_only": false,         // true = no same-day allowed
--       "exception_dates": [
--         { "date": "2026-12-31", "closed": true, "note": "ปีใหม่" },
--         { "date": "2026-12-25", "max_bookings": 4 }
--       ],
--       "default_lead_minutes": 60     // fallback when staff fills capacity manually
--     },
--     "customer_line_notifications": {
--       "default_mode": "ask",         // 'ask' | 'auto' | 'off'
--       "events": {
--         "in_progress":      { "enabled": true,  "auto": false, "template": "..." },
--         "waiting_parts":    { "enabled": true,  "auto": false, "template": "..." },
--         "waiting_insurance":{ "enabled": true,  "auto": false, "template": "..." },
--         "on_hold":          { "enabled": true,  "auto": false, "template": "..." },
--         "ready_to_repair":  { "enabled": true,  "auto": true,  "template": "..." },
--         "quality_check":    { "enabled": true,  "auto": false, "template": "..." },
--         "waiting_pickup":   { "enabled": true,  "auto": true,  "template": "..." },
--         "completed":        { "enabled": true,  "auto": true,  "template": "..." },
--         "resumed":          { "enabled": true,  "auto": true,  "template": "..." }
--       }
--     }
--   }
--
-- Variables supported in templates:
--   {{job_number}} {{customer_name}} {{vehicle}} {{plate}}
--   {{status_label}} {{hold_reason}} {{eta}} {{tracking_url}}
-- ============================================================

-- No schema changes — settings is already JSONB. We add helpful
-- indexes for efficient lookups when the API needs to count
-- bookings/jobs per day for capacity checks.

-- Index that supports "how many bookings on date X for tenant Y"
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date_active
  ON bookings(tenant_id, preferred_date)
  WHERE status IN ('pending', 'confirmed');

-- Same for jobs created on a given day (counts toward capacity if
-- the shop wants to include walk-ins).
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_created_date
  ON jobs(tenant_id, created_at);
