-- Fix remaining constraints - only what's needed
-- Run this in your Supabase SQL editor

-- 1. Drop foreign key constraints on registration columns (ignore if they don't exist)
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_home_reg_id_fkey;
ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_away_reg_id_fkey;

-- 2. Make registration columns nullable (ignore if already nullable)
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.fixtures ALTER COLUMN home_reg_id DROP NOT NULL;
  EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if already nullable
  END;
  
  BEGIN
    ALTER TABLE public.fixtures ALTER COLUMN away_reg_id DROP NOT NULL;
  EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if already nullable
  END;
END $$;
