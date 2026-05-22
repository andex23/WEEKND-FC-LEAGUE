-- 0007_match_reminders.sql
-- Tracks whether a pre-match reminder email has been sent for a fixture, so the
-- daily reminder cron never emails the same fixture twice.
-- Idempotent: safe to re-run. Depends on 0001_core_schema.sql.

ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
