-- 0004_functions_rls.sql
-- Triggers, helper functions, league functions and row-level security.
-- Depends on 0001, 0002, 0003.

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS players_set_updated_at ON public.players;
CREATE TRIGGER players_set_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS fixtures_set_updated_at ON public.fixtures;
CREATE TRIGGER fixtures_set_updated_at BEFORE UPDATE ON public.fixtures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tournaments_set_updated_at ON public.tournaments;
CREATE TRIGGER tournaments_set_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS league_settings_set_updated_at ON public.league_settings;
CREATE TRIGGER league_settings_set_updated_at BEFORE UPDATE ON public.league_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- is_admin() -- SECURITY DEFINER so policies can call it without recursing
-- into the players RLS policy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- assign_teams_automatically()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_teams_automatically()
RETURNS void AS $$
DECLARE
  available_clubs text[] := ARRAY[
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
    'Leicester City', 'Liverpool', 'Man City', 'Man United', 'Newcastle',
    'Nottingham Forest', 'Southampton', 'Spurs', 'West Ham', 'Wolves'
  ];
  player_record RECORD;
  assigned_clubs text[] := '{}';
  club_to_assign text;
BEGIN
  FOR player_record IN
    SELECT id, preferred_club FROM public.players
    WHERE assigned_club IS NULL AND status = 'approved'
    ORDER BY created_at ASC
  LOOP
    IF player_record.preferred_club = ANY(available_clubs)
       AND NOT (player_record.preferred_club = ANY(assigned_clubs)) THEN
      club_to_assign := player_record.preferred_club;
    ELSE
      SELECT club INTO club_to_assign
      FROM unnest(available_clubs) AS club
      WHERE NOT (club = ANY(assigned_clubs))
      LIMIT 1;
    END IF;

    IF club_to_assign IS NOT NULL THEN
      UPDATE public.players SET assigned_club = club_to_assign WHERE id = player_record.id;
      assigned_clubs := assigned_clubs || club_to_assign;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- generate_fixtures() -- round-robin for all approved players in a tournament
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_fixtures(
  tournament_id_param uuid DEFAULT NULL,
  rounds_param integer DEFAULT 2
)
RETURNS void AS $$
DECLARE
  player_ids uuid[];
  total_players integer;
  round_num integer;
  md integer := 1;
  i integer;
  j integer;
BEGIN
  DELETE FROM public.fixtures
  WHERE tournament_id_param IS NULL OR tournament_id = tournament_id_param;

  SELECT array_agg(p.id ORDER BY p.created_at) INTO player_ids
  FROM public.players p
  WHERE p.assigned_club IS NOT NULL AND p.status = 'approved';

  total_players := COALESCE(array_length(player_ids, 1), 0);

  IF total_players < 2 THEN
    RAISE EXCEPTION 'Need at least 2 players with assigned clubs to generate fixtures';
  END IF;

  FOR round_num IN 1..rounds_param LOOP
    FOR i IN 1..total_players LOOP
      FOR j IN (i + 1)..total_players LOOP
        INSERT INTO public.fixtures (
          tournament_id, home_player_id, away_player_id, home_club, away_club, matchday
        )
        SELECT
          tournament_id_param,
          CASE WHEN round_num = 1 THEN player_ids[i] ELSE player_ids[j] END,
          CASE WHEN round_num = 1 THEN player_ids[j] ELSE player_ids[i] END,
          CASE WHEN round_num = 1 THEN p1.assigned_club ELSE p2.assigned_club END,
          CASE WHEN round_num = 1 THEN p2.assigned_club ELSE p1.assigned_club END,
          md
        FROM public.players p1, public.players p2
        WHERE p1.id = player_ids[i] AND p2.id = player_ids[j];
        md := md + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages        ENABLE ROW LEVEL SECURITY;

-- players
DROP POLICY IF EXISTS players_select ON public.players;
CREATE POLICY players_select ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS players_update_own ON public.players;
CREATE POLICY players_update_own ON public.players FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS players_admin_all ON public.players;
CREATE POLICY players_admin_all ON public.players FOR ALL USING (public.is_admin());

-- fixtures
DROP POLICY IF EXISTS fixtures_select ON public.fixtures;
CREATE POLICY fixtures_select ON public.fixtures FOR SELECT USING (true);
DROP POLICY IF EXISTS fixtures_update_own ON public.fixtures;
CREATE POLICY fixtures_update_own ON public.fixtures FOR UPDATE USING (
  auth.uid() = home_player_id OR auth.uid() = away_player_id OR public.is_admin()
);
DROP POLICY IF EXISTS fixtures_admin_all ON public.fixtures;
CREATE POLICY fixtures_admin_all ON public.fixtures FOR ALL USING (public.is_admin());

-- league_settings
DROP POLICY IF EXISTS league_settings_select ON public.league_settings;
CREATE POLICY league_settings_select ON public.league_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS league_settings_admin_all ON public.league_settings;
CREATE POLICY league_settings_admin_all ON public.league_settings FOR ALL USING (public.is_admin());

-- tournaments
DROP POLICY IF EXISTS tournaments_select ON public.tournaments;
CREATE POLICY tournaments_select ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS tournaments_admin_all ON public.tournaments;
CREATE POLICY tournaments_admin_all ON public.tournaments FOR ALL USING (public.is_admin());

-- match_events
DROP POLICY IF EXISTS match_events_select ON public.match_events;
CREATE POLICY match_events_select ON public.match_events FOR SELECT USING (true);
DROP POLICY IF EXISTS match_events_admin_all ON public.match_events;
CREATE POLICY match_events_admin_all ON public.match_events FOR ALL USING (public.is_admin());

-- notifications: a user sees their own + broadcasts
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS notifications_admin_all ON public.notifications;
CREATE POLICY notifications_admin_all ON public.notifications FOR ALL USING (public.is_admin());

-- messages: a user sees messages addressed to them + broadcasts
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  recipient_id IS NULL OR recipient_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS messages_admin_all ON public.messages;
CREATE POLICY messages_admin_all ON public.messages FOR ALL USING (public.is_admin());
