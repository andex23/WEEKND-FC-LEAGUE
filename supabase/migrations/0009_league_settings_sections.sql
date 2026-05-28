-- 0009_league_settings_sections.sql
-- JSON sections for admin-managed league settings, branding, socials, and integrations.

ALTER TABLE public.league_settings
  ADD COLUMN IF NOT EXISTS tournament jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integrations jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS general jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.league_settings
SET
  tournament = jsonb_build_object(
    'name', COALESCE(season_name, 'Weekend FC League'),
    'status', COALESCE(status, 'DRAFT'),
    'matchdays', jsonb_build_array('Sat', 'Sun'),
    'match_length', 8
  ) || tournament,
  branding = jsonb_build_object(
    'league_name', COALESCE(season_name, 'Weekend FC League'),
    'logo_url', '/logo.png',
    'accent_color', '#10b981',
    'dark_mode', true,
    'rules_url', '/rules'
  ) || branding,
  socials = jsonb_build_object(
    'telegram_group_url', '',
    'whatsapp_group_url', '',
    'instagram_url', '',
    'tiktok_url', '',
    'youtube_url', '',
    'x_url', ''
  ) || socials,
  integrations = jsonb_build_object(
    'email_from_name', 'Weekend FC League'
  ) || integrations
WHERE true;
