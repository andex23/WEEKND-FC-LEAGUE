-- Apply only after reviewing production grants and approving this security change.
-- No account states are rewritten: existing verified/approved players keep access.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_league_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.players p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid() AND p.status = 'approved'
      AND u.email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION private.has_league_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_league_access() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.has_league_access() AND EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Public identities are limited to approved players; an owner can read their
-- own pending status so server-side access checks distinguish pending/missing.
DROP POLICY IF EXISTS players_select ON public.players;
CREATE POLICY players_select ON public.players FOR SELECT
  USING (status = 'approved' OR id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS players_update_own ON public.players;
CREATE POLICY players_update_own ON public.players FOR UPDATE TO authenticated
  USING (id = auth.uid() AND private.has_league_access())
  WITH CHECK (id = auth.uid() AND private.has_league_access());

-- Keep full profile data and privileged columns behind server routes. Reapply
-- this intentionally: historical production may not have run migration 0009.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.players FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, username, name, preferred_club, assigned_club, console, avatar_url, status)
  ON public.players TO anon, authenticated;
GRANT UPDATE (avatar_url, available) ON public.players TO authenticated;

-- Config JSON may contain admin integrations and invite state. Public routes
-- project safe branding/schedule fields server-side; direct clients cannot read it.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.tournaments FROM PUBLIC, anon, authenticated;
REVOKE SELECT (config) ON public.tournaments FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, name, status, is_active, season, start_at, end_at, created_at, updated_at)
  ON public.tournaments TO anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.league_settings FROM PUBLIC, anon, authenticated;
REVOKE SELECT (tournament, branding, socials, integrations, general)
  ON public.league_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, season_name, status, start_date, end_date, registration_open, teams_locked, created_at, updated_at)
  ON public.league_settings TO anon, authenticated;

-- Scores and schedules are public. Submitted evidence, reports and reminder
-- metadata are not; result submission reads those through its guarded server.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.fixtures FROM PUBLIC, anon, authenticated;
REVOKE SELECT (reported_home_score, reported_away_score, reported_by_player_id,
  report_evidence_url, report_notes, report_status, reminder_sent_at)
  ON public.fixtures FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, tournament_id, matchday, home_player_id, away_player_id,
  home_club, away_club, home_score, away_score, home_goals, away_goals,
  home_assists, away_assists, home_cards, away_cards, status, scheduled_date,
  played_at, forfeit_winner_id, notes, created_at, updated_at)
  ON public.fixtures TO anon, authenticated;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
REVOKE SELECT ON public.notifications FROM PUBLIC, anon;
GRANT SELECT ON public.notifications TO authenticated;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
  USING (private.has_league_access() AND (user_id IS NULL OR user_id = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (private.has_league_access() AND user_id = auth.uid())
  WITH CHECK (private.has_league_access() AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

DROP POLICY IF EXISTS messages_select ON public.messages;
REVOKE SELECT ON public.messages FROM PUBLIC, anon;
GRANT SELECT ON public.messages TO authenticated;
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
  USING (private.has_league_access() AND (recipient_id IS NULL OR recipient_id = auth.uid() OR public.is_admin()));

-- Restrictive gates also constrain any older permissive policies that remain.
DROP POLICY IF EXISTS notifications_access_gate ON public.notifications;
CREATE POLICY notifications_access_gate ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated
  USING (private.has_league_access()) WITH CHECK (private.has_league_access());
DROP POLICY IF EXISTS messages_access_gate ON public.messages;
CREATE POLICY messages_access_gate ON public.messages AS RESTRICTIVE FOR ALL TO authenticated
  USING (private.has_league_access()) WITH CHECK (private.has_league_access());
DROP POLICY IF EXISTS players_write_access_gate ON public.players;
CREATE POLICY players_write_access_gate ON public.players AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (private.has_league_access()) WITH CHECK (private.has_league_access());

DROP POLICY IF EXISTS tournament_entries_select ON public.tournament_entries;
CREATE POLICY tournament_entries_select ON public.tournament_entries FOR SELECT TO authenticated
  USING (private.has_league_access() AND (player_id = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS tournament_entries_player_update ON public.tournament_entries;
-- Responses are written by the guarded server route, not directly by clients.
REVOKE INSERT, UPDATE, DELETE ON public.tournament_entries FROM anon, authenticated;
REVOKE SELECT ON public.tournament_entries FROM PUBLIC, anon;
GRANT SELECT ON public.tournament_entries TO authenticated;
DROP POLICY IF EXISTS tournament_entries_access_gate ON public.tournament_entries;
CREATE POLICY tournament_entries_access_gate ON public.tournament_entries AS RESTRICTIVE FOR ALL TO authenticated
  USING (private.has_league_access()) WITH CHECK (private.has_league_access());

DROP POLICY IF EXISTS "player-avatars: owner insert" ON storage.objects;
CREATE POLICY "player-avatars: owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'player-avatars' AND private.has_league_access()
    AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "player-avatars: owner update" ON storage.objects;
CREATE POLICY "player-avatars: owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'player-avatars' AND private.has_league_access()
    AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'player-avatars' AND private.has_league_access()
    AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "player-avatars: owner delete" ON storage.objects;
CREATE POLICY "player-avatars: owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'player-avatars' AND private.has_league_access()
    AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only hashes are retained; no raw IP/email/credential values. Calls use an
-- atomic row update, so the limit is shared across concurrent Vercel instances.
CREATE TABLE IF NOT EXISTS private.request_rate_limits (
  key text PRIMARY KEY CHECK (key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL
);
ALTER TABLE private.request_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS request_rate_limits_expiry_idx
  ON private.request_rate_limits (window_started_at);
REVOKE ALL ON private.request_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_request_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
)
RETURNS TABLE (allowed boolean, retry_after integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  bucket private.request_rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR p_key !~ '^[a-f0-9]{64}$'
     OR p_limit IS NULL OR p_limit < 1 OR p_limit > 1000
     OR p_window_seconds IS NULL OR p_window_seconds < 60 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;
  DELETE FROM private.request_rate_limits
    WHERE window_started_at < v_now - interval '2 days';
  INSERT INTO private.request_rate_limits AS existing (key, window_started_at, request_count)
    VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE SET
    window_started_at = CASE WHEN existing.window_started_at + make_interval(secs => p_window_seconds) <= v_now
      THEN v_now ELSE existing.window_started_at END,
    request_count = CASE WHEN existing.window_started_at + make_interval(secs => p_window_seconds) <= v_now
      THEN 1 ELSE LEAST(existing.request_count + 1, 1000000) END
  RETURNING * INTO bucket;
  RETURN QUERY SELECT bucket.request_count <= p_limit,
    CASE WHEN bucket.request_count <= p_limit THEN 0 ELSE
      GREATEST(1, ceil(extract(epoch FROM
        bucket.window_started_at + make_interval(secs => p_window_seconds) - v_now))::integer) END;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_request_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_rate_limit(text, integer, integer) TO service_role;

COMMIT;
