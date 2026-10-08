-- GENERATED FRESH-DATABASE SETUP ONLY. Do not run on an existing production database.
-- Source order: scripts/schema-files.mjs. Regenerate with node scripts/build-schema.mjs.
-- Optional demo seed 0005 is deliberately excluded. Review security policies before applying.

-- Source: 0001_core_schema.sql
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
  tournament            jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding              jsonb NOT NULL DEFAULT '{}'::jsonb,
  socials               jsonb NOT NULL DEFAULT '{}'::jsonb,
  integrations          jsonb NOT NULL DEFAULT '{}'::jsonb,
  general               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS season_name text DEFAULT 'Season 1';
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS status text DEFAULT 'DRAFT';
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS registration_open boolean DEFAULT true;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS teams_locked boolean DEFAULT false;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS tournament jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS integrations jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.league_settings ADD COLUMN IF NOT EXISTS general jsonb NOT NULL DEFAULT '{}'::jsonb;
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


-- Source: 0002_views.sql
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


-- Source: 0003_events.sql
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


-- Source: 0004_functions_rls.sql
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


-- Source: 0006_speed_test.sql
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


-- Source: 0007_match_reminders.sql
-- 0007_match_reminders.sql
-- Tracks whether a pre-match reminder email has been sent for a fixture, so the
-- daily reminder cron never emails the same fixture twice.
-- Idempotent: safe to re-run. Depends on 0001_core_schema.sql.

ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;


-- Source: 0008_tournament_entries.sql
-- 0008_tournament_entries.sql
-- Invite-only tournament participation. Players choose their own club per
-- tournament entry; admin no longer assigns teams for tournament setup.

CREATE TABLE IF NOT EXISTS public.tournament_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited',
  selected_club text,
  invited_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_entries_unique_player UNIQUE (tournament_id, player_id),
  CONSTRAINT tournament_entries_status_check CHECK (status IN ('invited', 'accepted', 'declined')),
  CONSTRAINT tournament_entries_selected_club_check CHECK (
    status <> 'accepted' OR NULLIF(btrim(selected_club), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS tournament_entries_tournament_id_idx
  ON public.tournament_entries(tournament_id);

CREATE INDEX IF NOT EXISTS tournament_entries_player_id_idx
  ON public.tournament_entries(player_id);

CREATE INDEX IF NOT EXISTS tournament_entries_status_idx
  ON public.tournament_entries(status);

DROP TRIGGER IF EXISTS tournament_entries_set_updated_at ON public.tournament_entries;
CREATE TRIGGER tournament_entries_set_updated_at
BEFORE UPDATE ON public.tournament_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_entries_select ON public.tournament_entries;
CREATE POLICY tournament_entries_select ON public.tournament_entries
FOR SELECT USING (
  player_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS tournament_entries_player_update ON public.tournament_entries;
CREATE POLICY tournament_entries_player_update ON public.tournament_entries
FOR UPDATE USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS tournament_entries_admin_all ON public.tournament_entries;
CREATE POLICY tournament_entries_admin_all ON public.tournament_entries
FOR ALL USING (public.is_admin())
WITH CHECK (public.is_admin());


-- Source: 0009_league_settings_sections.sql
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


-- Source: 0010_player_avatars.sql
-- 0010_player_avatars.sql
-- Player-uploaded profile pictures.
-- Idempotent: safe to re-run. Depends on 0001_core_schema.sql.

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url text;

-- Public bucket. Reads are public so standings/dashboards can render avatars
-- without signed URLs; writes are gated by the storage.objects RLS policies
-- below so each player can only manage objects in their own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-avatars',
  'player-avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Path convention: <auth.uid()>/<filename>. The first path segment is the
-- owner; storage.foldername(name)[1] returns it.
DROP POLICY IF EXISTS "player-avatars: public read" ON storage.objects;
CREATE POLICY "player-avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-avatars');

DROP POLICY IF EXISTS "player-avatars: owner insert" ON storage.objects;
CREATE POLICY "player-avatars: owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "player-avatars: owner update" ON storage.objects;
CREATE POLICY "player-avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "player-avatars: owner delete" ON storage.objects;
CREATE POLICY "player-avatars: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- Source: 0009_player_permissions.sql
-- Keep private player fields and privileged writes behind authenticated server routes.
-- Column grants complement RLS: owning a row must not allow changing role or status.
BEGIN;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.players FROM anon, authenticated;
GRANT SELECT (id, username, name, preferred_club, assigned_club, console, avatar_url, status) ON public.players TO anon, authenticated;
GRANT UPDATE (avatar_url, available) ON public.players TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fixtures FROM anon, authenticated;
-- Result submission now uses the server after checking the authenticated participant.
COMMIT;


-- Source: 0011_access_and_rate_limits.sql
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


-- Source: 0012_registration_verification.sql
-- Local review only. Apply after 0011 and before deploying the registration flow.
-- No passwords, verification tokens, addresses, or email bodies are persisted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.registration_email_deliveries (
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('verified_registration', 'approval')),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sending', 'sent', 'failed')),
  claim_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, kind)
);
ALTER TABLE public.registration_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_email_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_email_deliveries TO service_role;

-- Auth tables are intentionally not broadly granted to service_role. This
-- narrow predicate is private, not exposed through the Data API, and returns
-- only verified ownership. Anonymous/authenticated roles cannot execute it.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO service_role;
CREATE OR REPLACE FUNCTION private.registration_email_verified(player_id uuid, player_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE u.id = player_id AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(player_email)
  );
$$;
REVOKE ALL ON FUNCTION private.registration_email_verified(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.registration_email_verified(uuid, text) TO service_role;

-- The trigger runs as the caller (service role). Approval
-- and its durable delivery are committed together. Existing approved accounts
-- are left intact and are not backfilled into the email queue.
CREATE OR REPLACE FUNCTION public.queue_verified_player_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'approved' AND
    (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    IF NOT private.registration_email_verified(NEW.id, NEW.email) THEN
      RAISE EXCEPTION 'Player must verify their email before approval' USING ERRCODE = '23514';
    END IF;
    INSERT INTO public.registration_email_deliveries (player_id, kind)
      VALUES (NEW.id, 'approval') ON CONFLICT (player_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_verified_player_approval() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_verified_player_approval() TO service_role;
DROP TRIGGER IF EXISTS queue_verified_player_approval ON public.players;
CREATE TRIGGER queue_verified_player_approval
  AFTER INSERT OR UPDATE OF status ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.queue_verified_player_approval();

-- An approval is not ready for league access until its required email has been
-- accepted. Legacy approved accounts have no delivery row and remain eligible.
CREATE OR REPLACE FUNCTION private.has_league_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.players p JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid() AND p.status = 'approved' AND u.email_confirmed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.registration_email_deliveries d
        WHERE d.player_id = p.id AND d.kind = 'approval' AND d.state <> 'sent'
      )
  );
$$;
CREATE OR REPLACE FUNCTION public.player_access_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.has_league_access();
$$;
REVOKE ALL ON FUNCTION public.player_access_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.player_access_ready() TO authenticated, service_role;

COMMIT;
