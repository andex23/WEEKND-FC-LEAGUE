-- Added SQL script to create and seed database tables
-- Create tables for EA FC League application

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    console VARCHAR(10) NOT NULL CHECK (console IN ('PS5', 'XBOX', 'PC')),
    preferred_club VARCHAR(50) NOT NULL,
    assigned_team VARCHAR(50),
    role VARCHAR(10) NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League table
CREATE TABLE IF NOT EXISTS league (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETE')),
    start_date DATE,
    end_date DATE,
    rounds INTEGER DEFAULT 2,
    matchdays_per_weekend INTEGER DEFAULT 2,
    teams_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES league(id),
    matchday INTEGER NOT NULL,
    home_player_id INTEGER REFERENCES players(id),
    away_player_id INTEGER REFERENCES players(id),
    home_team VARCHAR(50) NOT NULL,
    away_team VARCHAR(50) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PLAYED', 'CANCELLED')),
    scheduled_date TIMESTAMP,
    played_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample league
INSERT INTO league (name, status, start_date, end_date) 
VALUES ('Weekend Premier League - FIFA 25', 'DRAFT', '2024-01-15', '2024-03-15')
ON CONFLICT DO NOTHING;

-- Insert sample players
INSERT INTO players (name, location, console, preferred_club, assigned_team, role) VALUES
('John Doe', 'London, UK', 'PS5', 'Arsenal', 'Arsenal', 'PLAYER'),
('Jane Smith', 'Manchester, UK', 'XBOX', 'Man United', 'Man United', 'PLAYER'),
('Mike Johnson', 'Liverpool, UK', 'PC', 'Liverpool', 'Liverpool', 'ADMIN'),
('Sarah Wilson', 'Birmingham, UK', 'PS5', 'Man City', 'Man City', 'PLAYER'),
('Tom Brown', 'Newcastle, UK', 'XBOX', 'Newcastle', 'Newcastle', 'PLAYER'),
('Lisa Davis', 'London, UK', 'PC', 'Spurs', 'Spurs', 'PLAYER')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fixtures_matchday ON fixtures(matchday);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_players ON fixtures(home_player_id, away_player_id);
CREATE INDEX IF NOT EXISTS idx_players_console ON players(console);
