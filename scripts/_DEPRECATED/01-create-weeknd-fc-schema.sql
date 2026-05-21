-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  console TEXT CHECK (console IN ('PlayStation', 'Xbox', 'PC')),
  location TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Weeknd FC League',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_team TEXT NOT NULL,
  assigned_team TEXT,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixtures table
CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  matchday INTEGER NOT NULL,
  home_reg_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  away_reg_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'played', 'forfeit')),
  weekend_label TEXT,
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  goals JSONB DEFAULT '[]',
  assists JSONB DEFAULT '[]',
  cards JSONB DEFAULT '[]',
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stats table
CREATE TABLE IF NOT EXISTS public.stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellows INTEGER DEFAULT 0,
  reds INTEGER DEFAULT 0,
  points INTEGER GENERATED ALWAYS AS (wins * 3 + draws) STORED,
  goal_difference INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tournaments (public read, admin write)
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for registrations
CREATE POLICY "Users can view their own registrations" ON public.registrations FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own registrations" ON public.registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage registrations" ON public.registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for fixtures (public read for participants)
CREATE POLICY "Participants can view fixtures" ON public.fixtures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage fixtures" ON public.fixtures FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for reports
CREATE POLICY "Users can view reports for their fixtures" ON public.reports FOR SELECT USING (
  reported_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (
    SELECT 1 FROM public.fixtures f 
    JOIN public.registrations hr ON f.home_reg_id = hr.id 
    JOIN public.registrations ar ON f.away_reg_id = ar.id 
    WHERE f.id = fixture_id AND (hr.user_id = auth.uid() OR ar.user_id = auth.uid())
  )
);
CREATE POLICY "Users can insert reports for their fixtures" ON public.reports FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fixtures f 
    JOIN public.registrations hr ON f.home_reg_id = hr.id 
    JOIN public.registrations ar ON f.away_reg_id = ar.id 
    WHERE f.id = fixture_id AND (hr.user_id = auth.uid() OR ar.user_id = auth.uid())
  )
);
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for stats (public read)
CREATE POLICY "Anyone can view stats" ON public.stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stats" ON public.stats FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create standings view
CREATE OR REPLACE VIEW public.v_standings AS
SELECT 
  s.*,
  u.name,
  r.assigned_team,
  ROW_NUMBER() OVER (ORDER BY s.points DESC, s.goal_difference DESC, s.goals DESC) as position
FROM public.stats s
JOIN public.users u ON s.user_id = u.id
JOIN public.registrations r ON r.user_id = u.id
WHERE u.status = 'approved'
ORDER BY s.points DESC, s.goal_difference DESC, s.goals DESC;

-- Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default tournament
INSERT INTO public.tournaments (name, status) 
VALUES ('Weeknd FC League Season 1', 'active')
ON CONFLICT DO NOTHING;
