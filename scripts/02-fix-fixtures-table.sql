-- Fix fixtures table structure
-- This script ensures the fixtures table exists with the correct structure

-- First, check if the fixtures table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fixtures') THEN
        -- Create the fixtures table if it doesn't exist
        CREATE TABLE public.fixtures (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            tournament_id uuid NOT NULL,
            matchday integer NOT NULL,
            home_player_id uuid NOT NULL,
            away_player_id uuid NOT NULL,
            home_score integer,
            away_score integer,
            status text NOT NULL DEFAULT 'SCHEDULED',
            scheduled_date timestamp with time zone,
            forfeit_winner_id uuid,
            notes text,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT fixtures_pkey PRIMARY KEY (id),
            CONSTRAINT fixtures_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE,
            CONSTRAINT fixtures_home_player_id_fkey FOREIGN KEY (home_player_id) REFERENCES public.players(id) ON DELETE CASCADE,
            CONSTRAINT fixtures_away_player_id_fkey FOREIGN KEY (away_player_id) REFERENCES public.players(id) ON DELETE CASCADE,
            CONSTRAINT fixtures_forfeit_winner_id_fkey FOREIGN KEY (forfeit_winner_id) REFERENCES public.players(id) ON DELETE SET NULL
        );
        
        -- Create indexes for better performance
        CREATE INDEX fixtures_tournament_id_idx ON public.fixtures(tournament_id);
        CREATE INDEX fixtures_matchday_idx ON public.fixtures(matchday);
        CREATE INDEX fixtures_status_idx ON public.fixtures(status);
        CREATE INDEX fixtures_home_player_id_idx ON public.fixtures(home_player_id);
        CREATE INDEX fixtures_away_player_id_idx ON public.fixtures(away_player_id);
        
        RAISE NOTICE 'Created fixtures table';
    ELSE
        RAISE NOTICE 'Fixtures table already exists';
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add forfeit_winner_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'forfeit_winner_id') THEN
        ALTER TABLE public.fixtures ADD COLUMN forfeit_winner_id uuid;
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_forfeit_winner_id_fkey FOREIGN KEY (forfeit_winner_id) REFERENCES public.players(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added forfeit_winner_id column';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'notes') THEN
        ALTER TABLE public.fixtures ADD COLUMN notes text;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'created_at') THEN
        ALTER TABLE public.fixtures ADD COLUMN created_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixtures' AND column_name = 'updated_at') THEN
        ALTER TABLE public.fixtures ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Ensure id column is uuid with proper default
ALTER TABLE public.fixtures 
    ALTER COLUMN id SET DATA TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN id SET NOT NULL;

-- Ensure tournament_id is uuid
ALTER TABLE public.fixtures 
    ALTER COLUMN tournament_id SET DATA TYPE uuid USING tournament_id::uuid,
    ALTER COLUMN tournament_id SET NOT NULL;

-- Ensure home_player_id is uuid
ALTER TABLE public.fixtures 
    ALTER COLUMN home_player_id SET DATA TYPE uuid USING home_player_id::uuid,
    ALTER COLUMN home_player_id SET NOT NULL;

-- Ensure away_player_id is uuid
ALTER TABLE public.fixtures 
    ALTER COLUMN away_player_id SET DATA TYPE uuid USING away_player_id::uuid,
    ALTER COLUMN away_player_id SET NOT NULL;

-- Ensure matchday is integer
ALTER TABLE public.fixtures 
    ALTER COLUMN matchday SET DATA TYPE integer USING matchday::integer,
    ALTER COLUMN matchday SET NOT NULL;

-- Ensure status has default value
ALTER TABLE public.fixtures 
    ALTER COLUMN status SET DEFAULT 'SCHEDULED';

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add tournament_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_tournament_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
    END IF;
    
    -- Add home_player_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_home_player_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_home_player_id_fkey FOREIGN KEY (home_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
    
    -- Add away_player_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_away_player_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_away_player_id_fkey FOREIGN KEY (away_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'fixtures_tournament_id_idx') THEN
        CREATE INDEX fixtures_tournament_id_idx ON public.fixtures(tournament_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'fixtures_matchday_idx') THEN
        CREATE INDEX fixtures_matchday_idx ON public.fixtures(matchday);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'fixtures_status_idx') THEN
        CREATE INDEX fixtures_status_idx ON public.fixtures(status);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'fixtures_home_player_id_idx') THEN
        CREATE INDEX fixtures_home_player_id_idx ON public.fixtures(home_player_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'fixtures_away_player_id_idx') THEN
        CREATE INDEX fixtures_away_player_id_idx ON public.fixtures(away_player_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Fixtures are viewable by everyone" ON public.fixtures;
CREATE POLICY "Fixtures are viewable by everyone" ON public.fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Fixtures are insertable by authenticated users" ON public.fixtures;
CREATE POLICY "Fixtures are insertable by authenticated users" ON public.fixtures FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Fixtures are updatable by authenticated users" ON public.fixtures;
CREATE POLICY "Fixtures are updatable by authenticated users" ON public.fixtures FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Fixtures are deletable by authenticated users" ON public.fixtures;
CREATE POLICY "Fixtures are deletable by authenticated users" ON public.fixtures FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'fixtures' 
ORDER BY ordinal_position;
