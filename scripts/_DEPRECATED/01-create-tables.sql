-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
CREATE TYPE console_type AS ENUM ('PS5', 'XBOX', 'PC');
CREATE TYPE league_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETE');
CREATE TYPE fixture_status AS ENUM ('SCHEDULED', 'PLAYED', 'CANCELLED');
CREATE TYPE player_role AS ENUM ('PLAYER', 'ADMIN');
CREATE TYPE player_status AS ENUM ('pending', 'approved');

-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT,
    name TEXT NOT NULL,
    psn_name TEXT,
    location TEXT,
    console console_type NOT NULL,
    preferred_club TEXT NOT NULL,
    assigned_club TEXT,
    role player_role DEFAULT 'PLAYER',
    status player_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create league_settings table
CREATE TABLE league_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status league_status DEFAULT 'DRAFT',
    start_date DATE,
    end_date DATE,
    teams_locked BOOLEAN DEFAULT FALSE,
    rounds INTEGER DEFAULT 2,
    matchdays_per_weekend INTEGER DEFAULT 3,
    active_tournament_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixtures table
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    away_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    home_club VARCHAR(100) NOT NULL,
    away_club VARCHAR(100) NOT NULL,
    matchday INTEGER NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status fixture_status DEFAULT 'SCHEDULED',
    home_confirmed BOOLEAN DEFAULT FALSE,
    away_confirmed BOOLEAN DEFAULT FALSE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create standings table (calculated view)
CREATE VIEW standings AS
SELECT 
    p.id,
    p.name,
    p.assigned_club as team,
    p.console,
    COUNT(f.id) as played,
    SUM(CASE 
        WHEN (f.home_player_id = p.id AND f.home_score > f.away_score) OR 
             (f.away_player_id = p.id AND f.away_score > f.home_score) 
        THEN 1 ELSE 0 END) as won,
    SUM(CASE 
        WHEN f.home_score = f.away_score AND f.status = 'PLAYED'
        THEN 1 ELSE 0 END) as drawn,
    SUM(CASE 
        WHEN (f.home_player_id = p.id AND f.home_score < f.away_score) OR 
             (f.away_player_id = p.id AND f.away_score < f.home_score) 
        THEN 1 ELSE 0 END) as lost,
    SUM(CASE 
        WHEN f.home_player_id = p.id THEN COALESCE(f.home_score, 0)
        WHEN f.away_player_id = p.id THEN COALESCE(f.away_score, 0)
        ELSE 0 END) as goals_for,
    SUM(CASE 
        WHEN f.home_player_id = p.id THEN COALESCE(f.away_score, 0)
        WHEN f.away_player_id = p.id THEN COALESCE(f.home_score, 0)
        ELSE 0 END) as goals_against,
    (SUM(CASE 
        WHEN f.home_player_id = p.id THEN COALESCE(f.home_score, 0)
        WHEN f.away_player_id = p.id THEN COALESCE(f.away_score, 0)
        ELSE 0 END) - 
     SUM(CASE 
        WHEN f.home_player_id = p.id THEN COALESCE(f.away_score, 0)
        WHEN f.away_player_id = p.id THEN COALESCE(f.home_score, 0)
        ELSE 0 END)) as goal_difference,
    (SUM(CASE 
        WHEN (f.home_player_id = p.id AND f.home_score > f.away_score) OR 
             (f.away_player_id = p.id AND f.away_score > f.home_score) 
        THEN 3
        WHEN f.home_score = f.away_score AND f.status = 'PLAYED'
        THEN 1 
        ELSE 0 END)) as points
FROM players p
LEFT JOIN fixtures f ON (f.home_player_id = p.id OR f.away_player_id = p.id) 
    AND f.status = 'PLAYED'
WHERE p.assigned_club IS NOT NULL
GROUP BY p.id, p.name, p.assigned_club, p.console
ORDER BY points DESC, goal_difference DESC, goals_for DESC;

-- Create tournaments table
CREATE TYPE tournament_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETE');
CREATE TYPE tournament_type AS ENUM ('SINGLE', 'DOUBLE');
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status tournament_status DEFAULT 'DRAFT',
  season VARCHAR(50),
  type tournament_type DEFAULT 'DOUBLE',
  players INTEGER NOT NULL,
  rules TEXT,
  match_length INTEGER DEFAULT 6,
  matchdays JSONB DEFAULT '["Sat","Sun"]'::JSONB,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_role ON players(role);
CREATE INDEX idx_fixtures_home_player ON fixtures(home_player_id);
CREATE INDEX idx_fixtures_away_player ON fixtures(away_player_id);
CREATE INDEX idx_fixtures_matchday ON fixtures(matchday);
CREATE INDEX idx_fixtures_status ON fixtures(status);

-- Insert initial league settings
INSERT INTO league_settings (status, rounds, matchdays_per_weekend) 
VALUES ('DRAFT', 2, 3);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Players can read all players but only update their own
CREATE POLICY "Players can view all players" ON players FOR SELECT USING (true);
CREATE POLICY "Players can insert their own record" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update their own record" ON players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any player" ON players FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- Fixtures can be read by all, but only updated by involved players or admins
CREATE POLICY "Anyone can view fixtures" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Admins can manage fixtures" ON fixtures FOR ALL USING (
    EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Players can update their own fixture results" ON fixtures FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND (id = home_player_id OR id = away_player_id))
);

-- League settings can be read by all, but only updated by admins
CREATE POLICY "Anyone can view league settings" ON league_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update league settings" ON league_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND role = 'ADMIN')
);
