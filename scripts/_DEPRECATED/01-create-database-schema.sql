-- Create players table with proper RLS
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  psn_id TEXT NOT NULL,
  location TEXT NOT NULL,
  console TEXT NOT NULL CHECK (console IN ('PS5', 'XBOX', 'PC')),
  preferred_club TEXT NOT NULL,
  assigned_club TEXT,
  role TEXT DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'ADMIN')),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixtures table
CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  away_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  matchday INTEGER NOT NULL,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PLAYED', 'CANCELLED')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  home_goals INTEGER DEFAULT 0,
  away_goals INTEGER DEFAULT 0,
  home_assists INTEGER DEFAULT 0,
  away_assists INTEGER DEFAULT 0,
  home_cards INTEGER DEFAULT 0,
  away_cards INTEGER DEFAULT 0,
  home_confirmed BOOLEAN DEFAULT false,
  away_confirmed BOOLEAN DEFAULT false,
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create league settings table
CREATE TABLE IF NOT EXISTS public.league_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT DEFAULT 'Season 1',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETE')),
  start_date DATE,
  end_date DATE,
  registration_open BOOLEAN DEFAULT true,
  teams_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players table
CREATE POLICY "Players can view all players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players can update their own profile" ON public.players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all players" ON public.players FOR ALL USING (
  EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND role = 'ADMIN')
);

-- RLS Policies for fixtures table
CREATE POLICY "Players can view all fixtures" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Players can update fixtures they're involved in" ON public.fixtures FOR UPDATE USING (
  auth.uid() = home_player_id OR auth.uid() = away_player_id OR
  EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can manage all fixtures" ON public.fixtures FOR ALL USING (
  EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND role = 'ADMIN')
);

-- RLS Policies for league settings
CREATE POLICY "Everyone can view league settings" ON public.league_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify league settings" ON public.league_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Create standings view
CREATE OR REPLACE VIEW public.v_standings AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.assigned_club,
  p.console,
  COALESCE(stats.played, 0) as played,
  COALESCE(stats.wins, 0) as wins,
  COALESCE(stats.draws, 0) as draws,
  COALESCE(stats.losses, 0) as losses,
  COALESCE(stats.goals_for, 0) as goals_for,
  COALESCE(stats.goals_against, 0) as goals_against,
  COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0) as goal_difference,
  COALESCE(stats.wins, 0) * 3 + COALESCE(stats.draws, 0) as points,
  COALESCE(stats.goals, 0) as goals,
  COALESCE(stats.assists, 0) as assists,
  COALESCE(stats.cards, 0) as cards
FROM public.players p
LEFT JOIN (
  SELECT 
    player_id,
    COUNT(*) as played,
    SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END) as losses,
    SUM(goals_for) as goals_for,
    SUM(goals_against) as goals_against,
    SUM(goals) as goals,
    SUM(assists) as assists,
    SUM(cards) as cards
  FROM (
    SELECT 
      home_player_id as player_id,
      CASE 
        WHEN home_score > away_score THEN 'W'
        WHEN home_score = away_score THEN 'D'
        ELSE 'L'
      END as result,
      home_score as goals_for,
      away_score as goals_against,
      home_goals as goals,
      home_assists as assists,
      home_cards as cards
    FROM public.fixtures 
    WHERE status = 'PLAYED'
    
    UNION ALL
    
    SELECT 
      away_player_id as player_id,
      CASE 
        WHEN away_score > home_score THEN 'W'
        WHEN away_score = home_score THEN 'D'
        ELSE 'L'
      END as result,
      away_score as goals_for,
      home_score as goals_against,
      away_goals as goals,
      away_assists as assists,
      away_cards as cards
    FROM public.fixtures 
    WHERE status = 'PLAYED'
  ) player_stats
  GROUP BY player_id
) stats ON p.id = stats.player_id
ORDER BY points DESC, goal_difference DESC, goals_for DESC;

-- Insert initial league settings
INSERT INTO public.league_settings (season_name, status) 
VALUES ('Weeknd FC League Season 1', 'DRAFT')
ON CONFLICT DO NOTHING;
