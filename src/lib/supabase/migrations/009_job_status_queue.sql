-- ============================================================
-- 009_job_status_queue.sql
-- Adds queue/hold states to job_status and supporting columns so
-- the shop can track jobs that are waiting for parts, insurance
-- approval, or any other reason — with an expected resume date
-- and a customer-facing reason.
-- ============================================================

-- Extend the enum. Postgres can't drop or reorder enum values, so we
-- only ADD. Order shown is the *display* order we use in code.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                 WHERE t.typname = 'job_status' AND e.enumlabel = 'ready_to_repair') THEN
    ALTER TYPE job_status ADD VALUE 'ready_to_repair' AFTER 'quoted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                 WHERE t.typname = 'job_status' AND e.enumlabel = 'waiting_parts') THEN
    ALTER TYPE job_status ADD VALUE 'waiting_parts' AFTER 'in_progress';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                 WHERE t.typname = 'job_status' AND e.enumlabel = 'waiting_insurance') THEN
    ALTER TYPE job_status ADD VALUE 'waiting_insurance' AFTER 'waiting_parts';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                 WHERE t.typname = 'job_status' AND e.enumlabel = 'on_hold') THEN
    ALTER TYPE job_status ADD VALUE 'on_hold' AFTER 'waiting_insurance';
  END IF;
END$$;

-- Hold metadata on jobs.
-- - hold_reason: human-readable reason shown to customer
-- - hold_until: expected date the job resumes (parts ETA, insurance
--   approval target, etc). Customer track page displays this.
-- - status_before_hold: so we know what to flip back to on resume
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS hold_until DATE,
  ADD COLUMN IF NOT EXISTS status_before_hold job_status;

-- job_timeline notes column was 'notes' in older migrations and 'note'
-- in newer ones (see line 188 in database.sql vs uses elsewhere).
-- We don't try to fix that here — handled in code.

-- Helpful partial index for "currently held" queries.
CREATE INDEX IF NOT EXISTS idx_jobs_hold_until
  ON jobs(tenant_id, hold_until)
  WHERE status IN ('waiting_parts', 'waiting_insurance', 'on_hold');
