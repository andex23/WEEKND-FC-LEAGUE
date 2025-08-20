-- Function to automatically assign teams
CREATE OR REPLACE FUNCTION assign_teams_automatically()
RETURNS void AS $$
DECLARE
    available_clubs TEXT[] := ARRAY[
        'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
        'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
        'Leicester City', 'Liverpool', 'Man City', 'Man United', 'Newcastle',
        'Nottingham Forest', 'Southampton', 'Spurs', 'West Ham', 'Wolves'
    ];
    player_record RECORD;
    assigned_clubs TEXT[] := '{}';
    club_to_assign TEXT;
BEGIN
    -- Get all players without assigned clubs
    FOR player_record IN 
        SELECT id, preferred_club 
        FROM players 
        WHERE assigned_club IS NULL 
        ORDER BY created_at ASC
    LOOP
        -- Try to assign preferred club first
        IF player_record.preferred_club = ANY(available_clubs) 
           AND NOT (player_record.preferred_club = ANY(assigned_clubs)) THEN
            club_to_assign := player_record.preferred_club;
        ELSE
            -- Find first available club
            SELECT club INTO club_to_assign
            FROM unnest(available_clubs) AS club
            WHERE NOT (club = ANY(assigned_clubs))
            LIMIT 1;
        END IF;
        
        -- Assign the club
        IF club_to_assign IS NOT NULL THEN
            UPDATE players 
            SET assigned_club = club_to_assign 
            WHERE id = player_record.id;
            
            assigned_clubs := assigned_clubs || club_to_assign;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate round-robin fixtures
CREATE OR REPLACE FUNCTION generate_fixtures(rounds_param INTEGER DEFAULT 2)
RETURNS void AS $$
DECLARE
    player_ids UUID[];
    total_players INTEGER;
    round_num INTEGER;
    matchday INTEGER := 1;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Clear existing fixtures
    DELETE FROM fixtures;
    
    -- Get all players with assigned clubs
    SELECT array_agg(p.id ORDER BY p.created_at) INTO player_ids
    FROM players p
    WHERE p.assigned_club IS NOT NULL;
    
    total_players := array_length(player_ids, 1);
    
    IF total_players < 2 THEN
        RAISE EXCEPTION 'Need at least 2 players to generate fixtures';
    END IF;
    
    -- Generate fixtures for each round
    FOR round_num IN 1..rounds_param LOOP
        -- Generate all possible matchups
        FOR i IN 1..total_players LOOP
            FOR j IN (i+1)..total_players LOOP
                INSERT INTO fixtures (
                    home_player_id, 
                    away_player_id, 
                    home_club, 
                    away_club, 
                    matchday
                )
                SELECT 
                    CASE WHEN round_num = 1 THEN player_ids[i] ELSE player_ids[j] END,
                    CASE WHEN round_num = 1 THEN player_ids[j] ELSE player_ids[i] END,
                    CASE WHEN round_num = 1 THEN p1.assigned_club ELSE p2.assigned_club END,
                    CASE WHEN round_num = 1 THEN p2.assigned_club ELSE p1.assigned_club END,
                    matchday
                FROM players p1, players p2
                WHERE p1.id = player_ids[i] AND p2.id = player_ids[j];
                
                matchday := matchday + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update standings (trigger function)
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_players_timestamp 
    BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_fixtures_timestamp 
    BEFORE UPDATE ON fixtures 
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_league_settings_timestamp 
    BEFORE UPDATE ON league_settings 
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();
