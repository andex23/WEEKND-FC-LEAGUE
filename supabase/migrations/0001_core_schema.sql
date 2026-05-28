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
