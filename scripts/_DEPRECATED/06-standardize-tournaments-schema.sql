-- Standardize tournaments schema to match application expectations
-- Safe, idempotent migration

-- 1) Ensure table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tournaments'
  ) THEN
    CREATE TABLE public.tournaments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      status text NOT NULL DEFAULT 'DRAFT',
      created_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;

-- 2) Add missing columns (no-ops if already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='season') THEN
    ALTER TABLE public.tournaments ADD COLUMN season text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='type') THEN
    ALTER TABLE public.tournaments ADD COLUMN type text DEFAULT 'DOUBLE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='players') THEN
    ALTER TABLE public.tournaments ADD COLUMN players integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='rules') THEN
    ALTER TABLE public.tournaments ADD COLUMN rules text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='match_length') THEN
    ALTER TABLE public.tournaments ADD COLUMN match_length integer DEFAULT 6;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='matchdays') THEN
    ALTER TABLE public.tournaments ADD COLUMN matchdays jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='start_at') THEN
    ALTER TABLE public.tournaments ADD COLUMN start_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='end_at') THEN
    ALTER TABLE public.tournaments ADD COLUMN end_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='updated_at') THEN
    ALTER TABLE public.tournaments ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tournaments' AND column_name='is_active') THEN
    ALTER TABLE public.tournaments ADD COLUMN is_active boolean DEFAULT false;
  END IF;
END $$;

-- 3) Normalize status casing and CHECK constraint
DO $$
DECLARE con RECORD;
BEGIN
  -- Ensure text type
  BEGIN
    ALTER TABLE public.tournaments ALTER COLUMN status TYPE text USING status::text;
  EXCEPTION WHEN others THEN NULL; END;

  -- Drop existing CHECKs on status
  FOR con IN 
    SELECT conname FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname='public' AND r.relname='tournaments' AND c.contype='c'
  LOOP
    EXECUTE format('ALTER TABLE public.tournaments DROP CONSTRAINT %I', con.conname);
  END LOOP;

  -- Apply default and tolerant CHECK
  ALTER TABLE public.tournaments ALTER COLUMN status SET DEFAULT 'DRAFT';
  UPDATE public.tournaments SET status = UPPER(status) WHERE status IS NOT NULL AND status <> UPPER(status);
  ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_status_check CHECK (UPPER(status) IN ('DRAFT','ACTIVE','COMPLETE'));
END $$;

-- 4) RLS: enable + simple policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournaments' AND policyname='Anyone can view tournaments') THEN
    DROP POLICY "Anyone can view tournaments" ON public.tournaments;
  END IF;
  CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
END $$;

-- Done

