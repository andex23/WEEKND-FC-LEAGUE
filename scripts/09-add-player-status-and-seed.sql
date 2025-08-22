-- Add a status to players (pending/approved) for real approval flow
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_status') THEN
    CREATE TYPE player_status AS ENUM ('pending','approved');
  END IF;
END $$;

ALTER TABLE IF EXISTS players
  ADD COLUMN IF NOT EXISTS status player_status DEFAULT 'pending';

-- Basic RLS policy to let admins update status (adjust to your auth model)
-- Assumes an ADMIN player exists mapped to auth.uid()
DROP POLICY IF EXISTS "Admins can update any player" ON players;
CREATE POLICY "Admins can update any player" ON players FOR UPDATE USING (
  EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- Seed 8 PENDING players (edit names/clubs as needed)
INSERT INTO players (name, location, console, preferred_club, assigned_club, role, status)
VALUES
 ('Alex Rodriguez','London, UK','PS5','Man United',NULL,'PLAYER','pending'),
 ('Jordan Smith','Manchester, UK','XBOX','Man City',NULL,'PLAYER','pending'),
 ('Sam Wilson','Birmingham, UK','PS5','Chelsea',NULL,'PLAYER','pending'),
 ('Ryan Taylor','London, UK','PC','Arsenal',NULL,'PLAYER','pending'),
 ('Mike Johnson','Liverpool, UK','PS5','Liverpool',NULL,'PLAYER','pending'),
 ('Tom Brown','London, UK','XBOX','Spurs',NULL,'PLAYER','pending'),
 ('Jake Davis','London, UK','PS5','West Ham',NULL,'PLAYER','pending'),
 ('Chris Evans','Birmingham, UK','PC','Aston Villa',NULL,'PLAYER','pending');

-- Verify
-- SELECT name, console, preferred_club, status FROM players ORDER BY created_at DESC LIMIT 10;
