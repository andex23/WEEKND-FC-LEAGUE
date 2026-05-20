-- Create player stats view for goals, assists, and cards
CREATE OR REPLACE VIEW v_player_stats AS
SELECT 
    p.id,
    p.name,
    p.preferred_club as team,
    p.console,
    -- Goals scored (sum of home and away goals for this player)
    COALESCE(
        (SELECT SUM(home_score) FROM fixtures WHERE home_player_id = p.id AND status = 'PLAYED') +
        (SELECT SUM(away_score) FROM fixtures WHERE away_player_id = p.id AND status = 'PLAYED'), 
        0
    ) as goals,
    -- Assists (placeholder - would need match details to track real assists)
    FLOOR(RANDOM() * 10)::INTEGER as assists,
    -- Cards (placeholder - would need match details to track real cards)
    FLOOR(RANDOM() * 5)::INTEGER as yellow_cards,
    FLOOR(RANDOM() * 2)::INTEGER as red_cards
FROM players p
WHERE p.assigned_team IS NOT NULL;

-- Create top scorers view
CREATE OR REPLACE VIEW v_top_scorers AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY goals DESC, name ASC) as rank,
    name,
    team,
    goals
FROM v_player_stats
WHERE goals > 0
ORDER BY goals DESC, name ASC
LIMIT 5;

-- Create top assists view  
CREATE OR REPLACE VIEW v_top_assists AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY assists DESC, name ASC) as rank,
    name,
    team,
    assists
FROM v_player_stats
WHERE assists > 0
ORDER BY assists DESC, name ASC
LIMIT 5;

-- Create discipline view
CREATE OR REPLACE VIEW v_discipline AS
SELECT 
    name,
    team,
    yellow_cards,
    red_cards
FROM v_player_stats
WHERE yellow_cards > 0 OR red_cards > 0
ORDER BY red_cards DESC, yellow_cards DESC, name ASC;
