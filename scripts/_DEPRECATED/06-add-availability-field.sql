-- Add availability field to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS available_this_weekend BOOLEAN DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_players_availability ON players(available_this_weekend);
