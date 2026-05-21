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
