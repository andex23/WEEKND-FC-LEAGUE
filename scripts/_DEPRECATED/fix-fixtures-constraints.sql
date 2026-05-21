-- Fix fixtures table constraints to work with players directly
-- Run this in your Supabase SQL editor

-- 1. Drop foreign key constraints on registration columns
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_home_reg_id_fkey;
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_away_reg_id_fkey;

-- 2. Make registration columns nullable
ALTER TABLE public.fixtures ALTER COLUMN home_reg_id DROP NOT NULL;
ALTER TABLE public.fixtures ALTER COLUMN away_reg_id DROP NOT NULL;

-- 3. Ensure player columns are properly constrained
ALTER TABLE public.fixtures ALTER COLUMN home_player_id SET NOT NULL;
ALTER TABLE public.fixtures ALTER COLUMN away_player_id SET NOT NULL;

-- 4. Add proper foreign key constraints to players table
ALTER TABLE public.fixtures 
ADD CONSTRAINT fixtures_home_player_id_fkey 
FOREIGN KEY (home_player_id) REFERENCES public.players(id) ON DELETE CASCADE;

ALTER TABLE public.fixtures 
ADD CONSTRAINT fixtures_away_player_id_fkey 
FOREIGN KEY (away_player_id) REFERENCES public.players(id) ON DELETE CASCADE;

-- 5. Verify the changes
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'fixtures' 
  AND table_schema = 'public'
  AND column_name IN ('home_reg_id', 'away_reg_id', 'home_player_id', 'away_player_id')
ORDER BY column_name;
