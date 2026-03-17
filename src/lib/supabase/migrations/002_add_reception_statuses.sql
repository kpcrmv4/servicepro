-- ============================================================
-- Migration: Add reception-phase statuses to job_status enum
-- ============================================================
-- Adds 'diagnosing' and 'quoted' statuses to support the
-- reception flow: pending → diagnosing → quoted → in_progress

ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'diagnosing' AFTER 'pending';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'quoted' AFTER 'diagnosing';
