-- Add email column to players table for username-based auth
ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update existing players with generated emails if they don't have one
UPDATE players 
SET email = LOWER(name) || '@eafc-league.local' 
WHERE email IS NULL;

-- Make email required
ALTER TABLE players ALTER COLUMN email SET NOT NULL;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
