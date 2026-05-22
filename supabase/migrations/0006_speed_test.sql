-- 0006_speed_test.sql
-- Connection speed captured during player registration.
-- Idempotent: safe to re-run. Depends on 0001_core_schema.sql.
-- Run order: 0001 -> 0002 -> 0003 -> 0004 -> 0005 -> 0006.

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS download_mbps numeric;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS upload_mbps numeric;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS speed_test_screenshot_url text;

-- Public bucket for the speed-test screenshots uploaded during registration.
-- Reads are public; writes happen server-side with the service-role key, so no
-- extra storage RLS policies are needed.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speed-tests',
  'speed-tests',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
