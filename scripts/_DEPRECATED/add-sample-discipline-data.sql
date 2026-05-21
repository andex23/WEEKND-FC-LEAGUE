-- Add sample discipline data to test the discipline tab
-- This will add some yellow and red cards to the stats table

-- First, let's make sure we have some stats entries for players
INSERT INTO stats (tournament_id, user_id, matches_played, wins, draws, losses, goals, assists, yellows, reds)
SELECT 
    t.id as tournament_id,
    p.id as user_id,
    5 as matches_played,
    3 as wins,
    1 as draws,
    1 as losses,
    FLOOR(RANDOM() * 5)::INTEGER as goals,
    FLOOR(RANDOM() * 3)::INTEGER as assists,
    FLOOR(RANDOM() * 3)::INTEGER as yellows,  -- 0-2 yellow cards
    CASE WHEN RANDOM() < 0.2 THEN 1 ELSE 0 END as reds  -- 20% chance of red card
FROM players p
CROSS JOIN tournaments t
WHERE p.assigned_team IS NOT NULL 
  AND p.status = 'approved'
  AND t.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM stats s 
    WHERE s.user_id = p.id AND s.tournament_id = t.id
  )
ON CONFLICT (tournament_id, user_id) DO UPDATE SET
  yellows = EXCLUDED.yellows,
  reds = EXCLUDED.reds;

-- Let's also add some specific discipline data for testing
UPDATE stats 
SET yellows = 2, reds = 0
WHERE user_id IN (
  SELECT id FROM players 
  WHERE status = 'approved' 
  ORDER BY RANDOM() 
  LIMIT 3
);

UPDATE stats 
SET yellows = 1, reds = 1
WHERE user_id IN (
  SELECT id FROM players 
  WHERE status = 'approved' 
  ORDER BY RANDOM() 
  LIMIT 1
);
