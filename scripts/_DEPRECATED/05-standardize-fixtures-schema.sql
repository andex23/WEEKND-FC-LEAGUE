-- Standardize fixtures schema across environments
-- Safe, idempotent migration to align with application expectations
-- Run in Supabase SQL editor or psql

-- 1) Ensure fixtures table exists with baseline columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fixtures'
  ) THEN
    CREATE TABLE public.fixtures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tournament_id uuid NOT NULL,
      matchday integer NOT NULL,
      home_player_id uuid NOT NULL,
      away_player_id uuid NOT NULL,
      home_score integer,
      away_score integer,
      status text NOT NULL DEFAULT 'SCHEDULED',
      scheduled_date timestamp with time zone,
      played_at timestamp with time zone,
      forfeit_winner_id uuid,
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;

-- 2) Rename legacy columns if present (home_reg_id/away_reg_id -> home_player_id/away_player_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'home_reg_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'home_player_id'
  ) THEN
    ALTER TABLE public.fixtures RENAME COLUMN home_reg_id TO home_player_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'away_reg_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'away_player_id'
  ) THEN
    ALTER TABLE public.fixtures RENAME COLUMN away_reg_id TO away_player_id;
  END IF;
END $$;

-- 3) Ensure required columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='scheduled_date') THEN
    ALTER TABLE public.fixtures ADD COLUMN scheduled_date timestamp with time zone;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='played_at') THEN
    ALTER TABLE public.fixtures ADD COLUMN played_at timestamp with time zone;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='forfeit_winner_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN forfeit_winner_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='notes') THEN
    ALTER TABLE public.fixtures ADD COLUMN notes text;
  END IF;
END $$;

-- 4) Ensure report-related fields exist (used by result reporting flows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='reported_home_score') THEN
    ALTER TABLE public.fixtures ADD COLUMN reported_home_score integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='reported_away_score') THEN
    ALTER TABLE public.fixtures ADD COLUMN reported_away_score integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='reported_by_player_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN reported_by_player_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='report_evidence_url') THEN
    ALTER TABLE public.fixtures ADD COLUMN report_evidence_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='report_notes') THEN
    ALTER TABLE public.fixtures ADD COLUMN report_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fixtures' AND column_name='report_status') THEN
    ALTER TABLE public.fixtures ADD COLUMN report_status text;
  END IF;
END $$;

-- 5) Make sure id/tournament_id/home/away/matchday types and nullability are correct
ALTER TABLE public.fixtures 
  ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN tournament_id SET DATA TYPE uuid USING tournament_id::uuid,
  ALTER COLUMN tournament_id SET NOT NULL,
  ALTER COLUMN home_player_id SET DATA TYPE uuid USING home_player_id::uuid,
  ALTER COLUMN home_player_id SET NOT NULL,
  ALTER COLUMN away_player_id SET DATA TYPE uuid USING away_player_id::uuid,
  ALTER COLUMN away_player_id SET NOT NULL,
  ALTER COLUMN matchday SET DATA TYPE integer USING matchday::integer,
  ALTER COLUMN matchday SET NOT NULL;

-- 6) Ensure status is TEXT and normalize constraint to accept uppercase set
DO $$
DECLARE con RECORD;
BEGIN
  -- Force status to TEXT (covers older ENUMs)
  BEGIN
    ALTER TABLE public.fixtures ALTER COLUMN status TYPE text USING status::text;
  EXCEPTION WHEN others THEN
    -- no-op if already text
    NULL;
  END;

  -- Drop any existing CHECKs on status
  FOR con IN 
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND r.relname = 'fixtures' AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.fixtures DROP CONSTRAINT %I', con.conname);
  END LOOP;

  -- Re-add a tolerant CHECK (accepts uppercase set), plus default
  ALTER TABLE public.fixtures ALTER COLUMN status SET DEFAULT 'SCHEDULED';
  ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_status_check CHECK (UPPER(status) IN ('SCHEDULED','PLAYED','FORFEIT','CANCELLED'));
END $$;

-- 7) Foreign keys (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='fixtures' AND constraint_name='fixtures_tournament_id_fkey') THEN
    ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='fixtures' AND constraint_name='fixtures_home_player_id_fkey') THEN
    ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_home_player_id_fkey FOREIGN KEY (home_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='fixtures' AND constraint_name='fixtures_away_player_id_fkey') THEN
    ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_away_player_id_fkey FOREIGN KEY (away_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='fixtures' AND constraint_name='fixtures_forfeit_winner_id_fkey') THEN
    ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_forfeit_winner_id_fkey FOREIGN KEY (forfeit_winner_id) REFERENCES public.players(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8) Indexes (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='fixtures_tournament_id_idx') THEN
    CREATE INDEX fixtures_tournament_id_idx ON public.fixtures(tournament_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='fixtures_matchday_idx') THEN
    CREATE INDEX fixtures_matchday_idx ON public.fixtures(matchday);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='fixtures_status_idx') THEN
    CREATE INDEX fixtures_status_idx ON public.fixtures(UPPER(status));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='fixtures_home_player_id_idx') THEN
    CREATE INDEX fixtures_home_player_id_idx ON public.fixtures(home_player_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='fixtures_away_player_id_idx') THEN
    CREATE INDEX fixtures_away_player_id_idx ON public.fixtures(away_player_id);
  END IF;
END $$;

-- 9) Enable RLS + simple policies (reads open; writes handled via service role)
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fixtures' AND policyname='Fixtures are viewable by everyone') THEN
    DROP POLICY "Fixtures are viewable by everyone" ON public.fixtures;
  END IF;
  CREATE POLICY "Fixtures are viewable by everyone" ON public.fixtures FOR SELECT USING (true);
END $$;

-- 10) Quick sanity: uppercase existing statuses if needed
UPDATE public.fixtures SET status = UPPER(status) WHERE status IS NOT NULL AND status <> UPPER(status);

-- Done

