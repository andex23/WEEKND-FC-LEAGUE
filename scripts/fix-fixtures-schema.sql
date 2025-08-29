-- Fix fixtures table schema to work with players table directly
-- Run this in your Supabase SQL editor

-- Drop foreign key constraints if they exist
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_home_reg_id_fkey;
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_away_reg_id_fkey;

-- Make registration columns nullable
ALTER TABLE public.fixtures ALTER COLUMN home_reg_id DROP NOT NULL;
ALTER TABLE public.fixtures ALTER COLUMN away_reg_id DROP NOT NULL;

-- Ensure player columns exist and are properly constrained
ALTER TABLE public.fixtures ALTER COLUMN home_player_id SET NOT NULL;
ALTER TABLE public.fixtures ALTER COLUMN away_player_id SET NOT NULL;

-- Add foreign key constraints to players table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fixtures_home_player_id_fkey') THEN
        ALTER TABLE public.fixtures 
        ADD CONSTRAINT fixtures_home_player_id_fkey 
        FOREIGN KEY (home_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fixtures_away_player_id_fkey') THEN
        ALTER TABLE public.fixtures 
        ADD CONSTRAINT fixtures_away_player_id_fkey 
        FOREIGN KEY (away_player_id) REFERENCES public.players(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'fixtures' 
AND column_name IN ('home_reg_id', 'away_reg_id', 'home_player_id', 'away_player_id')
ORDER BY column_name;
