-- Simple fixtures table fix
-- Run this in your Supabase SQL editor

-- First, let's see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'fixtures';

-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.fixtures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id uuid NOT NULL,
    matchday integer NOT NULL,
    home_reg_id uuid NOT NULL,
    away_reg_id uuid NOT NULL,
    home_score integer,
    away_score integer,
    status text DEFAULT 'SCHEDULED',
    scheduled_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_tournament_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_home_reg_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_home_reg_id_fkey FOREIGN KEY (home_reg_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fixtures_away_reg_id_fkey') THEN
        ALTER TABLE public.fixtures ADD CONSTRAINT fixtures_away_reg_id_fkey FOREIGN KEY (away_reg_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Fixtures are viewable by everyone" ON public.fixtures;
CREATE POLICY "Fixtures are viewable by everyone" ON public.fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Fixtures are insertable by authenticated users" ON public.fixtures;
CREATE POLICY "Fixtures are insertable by authenticated users" ON public.fixtures FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Test insert
INSERT INTO public.fixtures (
    tournament_id, 
    matchday, 
    home_reg_id, 
    away_reg_id, 
    status, 
    scheduled_date
) VALUES (
    '8a156f33-7ff4-4cca-ad49-5dcfd9f1a5fe',
    1,
    '91c1f1e4-79a6-4085-875e-48facd411eec',
    '48204b9a-000f-42c9-850f-0e9bbf292da0',
    'SCHEDULED',
    now()
);

-- Check if the test insert worked
SELECT COUNT(*) as fixture_count FROM public.fixtures;

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'fixtures' 
ORDER BY ordinal_position;
