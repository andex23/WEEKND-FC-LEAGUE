-- ============================================================================
-- WEEKND FC LEAGUE — combined migration bundle
-- ----------------------------------------------------------------------------
-- One-time convenience bundle: migrations 0001-0005 concatenated in order.
-- Paste the whole file into the Supabase Dashboard -> SQL Editor and Run.
-- Every statement is idempotent, so re-running it is safe.
-- The canonical, individually-versioned files live in supabase/migrations/.
-- ============================================================================

-- ############################################################################
-- ## 0001_core_schema.sql
-- ############################################################################

-- 0001_core_schema.sql
-- Canonical core schema for Weekend FC League.
-- Idempotent: safe to run on a fresh database or on top of an existing one.
-- Run order: 0001 -> 0002 -> 0003 -> 0004 -> 0005 (see supabase/README.md).

-- ---------------------------------------------------------------------------
-- league_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.league_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name           text DEFAULT 'Season 1',
  status                text DEFAULT 'DRAFT',
  start_date            date,
  end_date              date,
  registration_open     boolean DEFAULT true,
  teams_locked          boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS season_name text DEFAULT 'Season 1';
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS status text DEFAULT 'DRAFT';
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS registration_open boolean DEFAULT true;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS teams_locked boolean DEFAULT false;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- tournaments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournaments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Tournament',
  status        text NOT NULL DEFAULT 'DRAFT',
  config        jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active     boolean DEFAULT false,
  season        text,
  start_at      timestamptz,
  end_at        timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS season text;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_at timestamptz;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS end_at timestamptz;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- players  (id == auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE,
  email           text,
  name            text NOT NULL,
  psn_id          text,
  location        text,
  console         text CHECK (console IN ('PS5', 'XBOX', 'PC')),
  preferred_club  text,
  assigned_club   text,
  role            text DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'ADMIN')),
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  available       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS psn_id text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS assigned_club text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS role text DEFAULT 'PLAYER';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_username_key'
  ) THEN
    BEGIN
      ALTER TABLE public.players ADD CONSTRAINT players_username_key UNIQUE (username);
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- fixtures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fixtures (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id           uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  matchday                integer NOT NULL,
  home_player_id          uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  away_player_id          uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  home_club               text,
  away_club               text,
  home_score              integer,
  away_score              integer,
  home_goals              integer DEFAULT 0,
  away_goals              integer DEFAULT 0,
  home_assists            integer DEFAULT 0,
  away_assists            integer DEFAULT 0,
  home_cards              integer DEFAULT 0,
  away_cards              integer DEFAULT 0,
  status                  text DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PLAYED', 'FORFEIT', 'CANCELLED')),
  home_confirmed          boolean DEFAULT false,
  away_confirmed          boolean DEFAULT false,
  scheduled_date          timestamptz,
  played_at               timestamptz,
  reported_home_score     integer,
  reported_away_score     integer,
  reported_by_player_id   uuid REFERENCES public.players(id) ON DELETE SET NULL,
  report_evidence_url     text,
  report_notes            text,
  report_status           text,
  forfeit_winner_id       uuid REFERENCES public.players(id) ON DELETE SET NULL,
  notes                   text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS tournament_id uuid;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS home_club text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS away_club text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS home_goals integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS away_goals integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS home_assists integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS away_assists integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS home_cards integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS away_cards integer DEFAULT 0;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS home_confirmed boolean DEFAULT false;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS away_confirmed boolean DEFAULT false;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS scheduled_date timestamptz;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS played_at timestamptz;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS reported_home_score integer;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS reported_away_score integer;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS reported_by_player_id uuid;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS report_evidence_url text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS report_notes text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS report_status text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS forfeit_winner_id uuid;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS fixtures_tournament_id_idx ON public.fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS fixtures_matchday_idx ON public.fixtures(matchday);
CREATE INDEX IF NOT EXISTS fixtures_status_idx ON public.fixtures(status);
CREATE INDEX IF NOT EXISTS fixtures_home_player_id_idx ON public.fixtures(home_player_id);
CREATE INDEX IF NOT EXISTS fixtures_away_player_id_idx ON public.fixtures(away_player_id);

-- Seed a single league_settings row if none exists.
INSERT INTO public.league_settings (season_name, status)
SELECT 'Weekend FC League Season 1', 'DRAFT'
WHERE NOT EXISTS (SELECT 1 FROM public.league_settings);

-- ############################################################################
-- ## 0002_views.sql
-- ############################################################################

-- 0002_views.sql
-- League standings view. Depends on 0001_core_schema.sql.
-- Aggregates played fixtures into a per-player table row.

CREATE OR REPLACE VIEW public.v_standings AS
SELECT
  p.id,
  p.username,
  p.name,
  COALESCE(p.assigned_club, p.preferred_club) AS team,
  p.console,
  COALESCE(stats.played, 0)                                            AS played,
  COALESCE(stats.wins, 0)                                              AS wins,
  COALESCE(stats.draws, 0)                                             AS draws,
  COALESCE(stats.losses, 0)                                            AS losses,
  COALESCE(stats.goals_for, 0)                                         AS goals_for,
  COALESCE(stats.goals_against, 0)                                     AS goals_against,
  COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0)       AS goal_difference,
  COALESCE(stats.wins, 0) * 3 + COALESCE(stats.draws, 0)               AS points,
  COALESCE(stats.goals, 0)                                             AS goals,
  COALESCE(stats.assists, 0)                                           AS assists,
  COALESCE(stats.cards, 0)                                             AS cards
FROM public.players p
LEFT JOIN (
  SELECT
    player_id,
    COUNT(*)                                          AS played,
    SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END)     AS wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END)     AS draws,
    SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END)     AS losses,
    SUM(goals_for)                                    AS goals_for,
    SUM(goals_against)                                AS goals_against,
    SUM(goals)                                        AS goals,
    SUM(assists)                                      AS assists,
    SUM(cards)                                        AS cards
  FROM (
    SELECT
      home_player_id AS player_id,
      CASE
        WHEN COALESCE(home_score, 0) > COALESCE(away_score, 0) THEN 'W'
        WHEN COALESCE(home_score, 0) = COALESCE(away_score, 0) THEN 'D'
        ELSE 'L'
      END AS result,
      COALESCE(home_score, 0)   AS goals_for,
      COALESCE(away_score, 0)   AS goals_against,
      COALESCE(home_goals, 0)   AS goals,
      COALESCE(home_assists, 0) AS assists,
      COALESCE(home_cards, 0)   AS cards
    FROM public.fixtures
    WHERE status IN ('PLAYED', 'FORFEIT')

    UNION ALL

    SELECT
      away_player_id AS player_id,
      CASE
        WHEN COALESCE(away_score, 0) > COALESCE(home_score, 0) THEN 'W'
        WHEN COALESCE(away_score, 0) = COALESCE(home_score, 0) THEN 'D'
        ELSE 'L'
      END AS result,
      COALESCE(away_score, 0)   AS goals_for,
      COALESCE(home_score, 0)   AS goals_against,
      COALESCE(away_goals, 0)   AS goals,
      COALESCE(away_assists, 0) AS assists,
      COALESCE(away_cards, 0)   AS cards
    FROM public.fixtures
    WHERE status IN ('PLAYED', 'FORFEIT')
  ) per_player
  GROUP BY player_id
) stats ON p.id = stats.player_id
WHERE p.status = 'approved';

-- ############################################################################
-- ## 0003_events.sql
-- ############################################################################

-- 0003_events.sql
-- Match events (for real goal/assist/card stats), notifications and messages.
-- Depends on 0001_core_schema.sql.

-- ---------------------------------------------------------------------------
-- match_events  -- one row per goal / assist / card, attributed to a player
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id    uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('goal', 'assist', 'yellow', 'red', 'own_goal')),
  minute        integer,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_events_fixture_id_idx ON public.match_events(fixture_id);
CREATE INDEX IF NOT EXISTS match_events_player_id_idx ON public.match_events(player_id);
CREATE INDEX IF NOT EXISTS match_events_type_idx ON public.match_events(type);

-- ---------------------------------------------------------------------------
-- notifications  -- user_id NULL == broadcast to everyone
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.players(id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text,
  read_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- ---------------------------------------------------------------------------
-- messages  -- admin -> player(s) messaging; recipient_id NULL == broadcast
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid REFERENCES public.players(id) ON DELETE SET NULL,
  recipient_id  uuid REFERENCES public.players(id) ON DELETE CASCADE,
  subject       text,
  body          text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);

-- ############################################################################
-- ## 0004_functions_rls.sql
-- ############################################################################

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

-- ############################################################################
-- ## 0005_seed.sql
-- ############################################################################

-- 0005_seed.sql
-- OPTIONAL development seed. Safe to skip in production.
--
-- NOTE: players.id references auth.users(id), so player rows cannot be seeded
-- with plain INSERTs -- create players through the app's registration flow
-- (/register) instead. This file only seeds rows that have no auth dependency.

-- A draft tournament to start configuring against.
INSERT INTO public.tournaments (name, status, config, is_active)
SELECT 'Weekend FC League — Season 1', 'DRAFT', '{}'::jsonb, false
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments);
