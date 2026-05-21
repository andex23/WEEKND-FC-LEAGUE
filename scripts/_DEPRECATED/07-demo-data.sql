-- Demo Data for Weeknd FC League
-- This script creates sample players, fixtures, and results for demonstration

-- Insert demo players with varied stats and clubs
INSERT INTO players (username, name, psn_name, location, console, preferred_club, assigned_team, role, available) VALUES
('cr7fan', 'Alex Rodriguez', 'CR7_Alex99', 'London, UK', 'PS5', 'Man United', 'Man United', 'PLAYER', true),
('messiking', 'Jordan Smith', 'MessiKing10', 'Manchester, UK', 'XBOX', 'Man City', 'Man City', 'PLAYER', true),
('chelseablue', 'Sam Wilson', 'BluesSam', 'Birmingham, UK', 'PS5', 'Chelsea', 'Chelsea', 'PLAYER', true),
('gunner4life', 'Ryan Taylor', 'ArsenalRyan', 'London, UK', 'PC', 'Arsenal', 'Arsenal', 'PLAYER', true),
('ynwa_red', 'Mike Johnson', 'LFC_Mike', 'Liverpool, UK', 'PS5', 'Liverpool', 'Liverpool', 'PLAYER', true),
('spursfan', 'Tom Brown', 'SpursTom', 'London, UK', 'XBOX', 'Spurs', 'Spurs', 'PLAYER', true),
('hammers', 'Jake Davis', 'WHU_Jake', 'London, UK', 'PS5', 'West Ham', 'West Ham', 'PLAYER', true),
('villafan', 'Chris Evans', 'Villa_Chris', 'Birmingham, UK', 'PC', 'Aston Villa', 'Aston Villa', 'PLAYER', true),
('newcastle', 'Ben Clark', 'NUFC_Ben', 'Newcastle, UK', 'XBOX', 'Newcastle', 'Newcastle', 'PLAYER', true),
('brighton_fan', 'Luke White', 'Seagulls_Luke', 'Brighton, UK', 'PS5', 'Brighton', 'Brighton', 'PLAYER', true),
('admin_user', 'League Admin', 'WFC_Admin', 'London, UK', 'PS5', 'Arsenal', 'Arsenal', 'ADMIN', true);

-- Update league settings to ACTIVE status
UPDATE league_settings SET 
  status = 'ACTIVE',
  start_date = CURRENT_DATE - INTERVAL '2 weeks',
  end_date = CURRENT_DATE + INTERVAL '6 weeks',
  updated_at = NOW()
WHERE id = 1;

-- Generate sample fixtures (simplified round-robin for demo)
INSERT INTO fixtures (matchday, home_player_id, away_player_id, status, scheduled_date) VALUES
-- Matchday 1
(1, 1, 2, 'PLAYED', CURRENT_DATE - INTERVAL '10 days'),
(1, 3, 4, 'PLAYED', CURRENT_DATE - INTERVAL '10 days'),
(1, 5, 6, 'PLAYED', CURRENT_DATE - INTERVAL '10 days'),
(1, 7, 8, 'PLAYED', CURRENT_DATE - INTERVAL '10 days'),
(1, 9, 10, 'PLAYED', CURRENT_DATE - INTERVAL '10 days'),

-- Matchday 2
(2, 2, 3, 'PLAYED', CURRENT_DATE - INTERVAL '7 days'),
(2, 4, 5, 'PLAYED', CURRENT_DATE - INTERVAL '7 days'),
(2, 6, 7, 'PLAYED', CURRENT_DATE - INTERVAL '7 days'),
(2, 8, 9, 'PLAYED', CURRENT_DATE - INTERVAL '7 days'),
(2, 10, 1, 'PLAYED', CURRENT_DATE - INTERVAL '7 days'),

-- Matchday 3 (upcoming)
(3, 1, 3, 'SCHEDULED', CURRENT_DATE + INTERVAL '3 days'),
(3, 2, 4, 'SCHEDULED', CURRENT_DATE + INTERVAL '3 days'),
(3, 5, 7, 'SCHEDULED', CURRENT_DATE + INTERVAL '3 days'),
(3, 6, 8, 'SCHEDULED', CURRENT_DATE + INTERVAL '3 days'),
(3, 9, 1, 'SCHEDULED', CURRENT_DATE + INTERVAL '3 days'),

-- Matchday 4 (upcoming)
(4, 3, 5, 'SCHEDULED', CURRENT_DATE + INTERVAL '10 days'),
(4, 4, 6, 'SCHEDULED', CURRENT_DATE + INTERVAL '10 days'),
(4, 7, 9, 'SCHEDULED', CURRENT_DATE + INTERVAL '10 days'),
(4, 8, 10, 'SCHEDULED', CURRENT_DATE + INTERVAL '10 days'),
(4, 1, 5, 'SCHEDULED', CURRENT_DATE + INTERVAL '10 days');

-- Insert sample results for played matches
INSERT INTO results (fixture_id, home_score, away_score, home_goals, home_assists, home_yellow_cards, home_red_cards, away_goals, away_assists, away_yellow_cards, away_red_cards) VALUES
-- Matchday 1 Results
(1, 3, 1, 3, 2, 1, 0, 1, 1, 0, 0), -- Alex beats Jordan 3-1
(2, 2, 2, 2, 1, 0, 0, 2, 2, 1, 0), -- Sam draws with Ryan 2-2
(3, 1, 0, 1, 0, 0, 0, 0, 0, 2, 1), -- Mike beats Tom 1-0
(4, 4, 2, 4, 3, 0, 0, 2, 1, 1, 0), -- Jake beats Chris 4-2
(5, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0), -- Luke beats Ben 1-0

-- Matchday 2 Results
(6, 2, 3, 2, 1, 1, 0, 3, 2, 0, 0), -- Ryan beats Jordan 3-2
(7, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0), -- Mike draws with Tom 1-1
(8, 3, 0, 3, 2, 0, 0, 0, 0, 0, 1), -- Jake beats Chris 3-0
(9, 2, 1, 2, 1, 1, 0, 1, 0, 2, 0), -- Ben beats Luke 2-1
(10, 1, 2, 1, 1, 0, 0, 2, 1, 0, 0); -- Alex beats Luke 2-1

-- Add some additional stats variety
UPDATE results SET 
  home_goals = 2, home_assists = 1, away_goals = 1, away_assists = 0
WHERE fixture_id = 1;

UPDATE results SET 
  home_goals = 1, home_assists = 1, away_goals = 2, away_assists = 1
WHERE fixture_id = 2;

-- Refresh the standings view to show current league table
REFRESH MATERIALIZED VIEW v_standings;
