-- Add PSN name column to players table
ALTER TABLE players ADD COLUMN psn_name VARCHAR(30);

-- Update existing players to have a default PSN name (can be updated later)
UPDATE players SET psn_name = LOWER(REPLACE(name, ' ', '_')) WHERE psn_name IS NULL;

-- Make PSN name required for new registrations
ALTER TABLE players ALTER COLUMN psn_name SET NOT NULL;

-- Add unique constraint to prevent duplicate PSN names
ALTER TABLE players ADD CONSTRAINT unique_psn_name UNIQUE (psn_name);
