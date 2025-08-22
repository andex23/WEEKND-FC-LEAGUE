-- Tournament stats/event pipeline schema (reference)
-- Part A: Events & Reports

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL,
  reported_by uuid,
  home_score integer,
  away_score integer,
  goals jsonb,
  assists jsonb,
  cards jsonb,
  screenshot_url text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  fixture_id uuid NOT NULL,
  registration_id uuid,
  type text CHECK (type IN ('goal','assist','yellow','red','own_goal')),
  minute integer,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Part B: Standings base view (example; adjust to your schema names)
CREATE OR REPLACE VIEW v_standings_base AS
SELECT
  r.id AS registration_id,
  r.name,
  r.assigned_club AS team,
  COALESCE(sum(CASE WHEN f.status IN ('PLAYED','FORFEIT') THEN 1 ELSE 0 END),0) AS played,
  COALESCE(sum(CASE WHEN f.home_player_id = r.id AND f.home_score > f.away_score THEN 1 WHEN f.away_player_id = r.id AND f.away_score > f.home_score THEN 1 ELSE 0 END),0) AS wins,
  COALESCE(sum(CASE WHEN f.status IN ('PLAYED','FORFEIT') AND f.home_score = f.away_score THEN 1 ELSE 0 END),0) AS draws,
  COALESCE(sum(CASE WHEN f.home_player_id = r.id AND f.home_score < f.away_score THEN 1 WHEN f.away_player_id = r.id AND f.away_score < f.home_score THEN 1 ELSE 0 END),0) AS losses,
  COALESCE(sum(CASE WHEN f.home_player_id = r.id THEN f.home_score WHEN f.away_player_id = r.id THEN f.away_score ELSE 0 END),0) AS goals_for,
  COALESCE(sum(CASE WHEN f.home_player_id = r.id THEN f.away_score WHEN f.away_player_id = r.id THEN f.home_score ELSE 0 END),0) AS goals_against,
  COALESCE(sum(CASE WHEN f.home_player_id = r.id THEN f.home_score - f.away_score WHEN f.away_player_id = r.id THEN f.away_score - f.home_score ELSE 0 END),0) AS goal_difference,
  -- Default points 3/1/0; adjust if you persist config elsewhere
  COALESCE(sum(CASE WHEN (f.home_player_id = r.id AND f.home_score > f.away_score) OR (f.away_player_id = r.id AND f.away_score > f.home_score) THEN 3 WHEN f.home_score = f.away_score AND f.status IN ('PLAYED','FORFEIT') THEN 1 ELSE 0 END),0) AS points
FROM players r
LEFT JOIN fixtures f ON (f.home_player_id = r.id OR f.away_player_id = r.id) AND f.status IN ('PLAYED','FORFEIT')
GROUP BY r.id, r.name, r.assigned_club;

-- Part C: Leaderboards from events (base)
CREATE OR REPLACE VIEW v_leader_goals_base AS
SELECT registration_id, count(*) AS goals
FROM match_events WHERE type = 'goal'
GROUP BY registration_id;

CREATE OR REPLACE VIEW v_leader_assists_base AS
SELECT registration_id, count(*) AS assists
FROM match_events WHERE type = 'assist'
GROUP BY registration_id;

CREATE OR REPLACE VIEW v_leader_discipline_base AS
SELECT registration_id,
  count(*) FILTER (WHERE type = 'yellow') AS yellows,
  count(*) FILTER (WHERE type = 'red') AS reds,
  (count(*) FILTER (WHERE type = 'yellow')) * 1 + (count(*) FILTER (WHERE type = 'red')) * 3 AS fair_play_points
FROM match_events
GROUP BY registration_id;

-- Part D: Overrides (deltas)
CREATE TABLE IF NOT EXISTS standings_overrides (
  tournament_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  field text CHECK (field IN ('played','wins','draws','losses','goals_for','goals_against','points')),
  delta integer NOT NULL,
  reason text,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stat_overrides (
  tournament_id uuid NOT NULL,
  registration_id uuid NOT NULL,
  stat text CHECK (stat IN ('goals','assists','yellows','reds')),
  delta integer NOT NULL,
  reason text,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Admin views (base + overrides)
CREATE OR REPLACE VIEW v_standings_admin AS
SELECT b.registration_id, b.name, b.team,
  b.played + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'played'),0) AS P,
  b.wins + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'wins'),0) AS W,
  b.draws + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'draws'),0) AS D,
  b.losses + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'losses'),0) AS L,
  b.goals_for + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'goals_for'),0) AS GF,
  b.goals_against + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'goals_against'),0) AS GA,
  (b.goals_for - b.goals_against) + COALESCE(sum(o.delta) FILTER (WHERE o.field IN ('goals_for','goals_against')),0) AS GD,
  b.points + COALESCE(sum(o.delta) FILTER (WHERE o.field = 'points'),0) AS Pts
FROM v_standings_base b
LEFT JOIN standings_overrides o ON o.registration_id = b.registration_id
GROUP BY b.registration_id, b.name, b.team, b.played, b.wins, b.draws, b.losses, b.goals_for, b.goals_against, b.points;

CREATE OR REPLACE VIEW v_leader_goals_admin AS
SELECT b.registration_id, b.goals + COALESCE(sum(o.delta),0) AS goals
FROM v_leader_goals_base b LEFT JOIN stat_overrides o ON o.registration_id = b.registration_id AND o.stat = 'goals'
GROUP BY b.registration_id, b.goals;

CREATE OR REPLACE VIEW v_leader_assists_admin AS
SELECT b.registration_id, b.assists + COALESCE(sum(o.delta),0) AS assists
FROM v_leader_assists_base b LEFT JOIN stat_overrides o ON o.registration_id = b.registration_id AND o.stat = 'assists'
GROUP BY b.registration_id, b.assists;

CREATE OR REPLACE VIEW v_leader_discipline_admin AS
SELECT b.registration_id, b.yellows + COALESCE(sum(o.delta) FILTER (WHERE o.stat = 'yellows'),0) AS yellows,
       b.reds + COALESCE(sum(o.delta) FILTER (WHERE o.stat = 'reds'),0) AS reds,
       b.fair_play_points AS fair_play_points
FROM v_leader_discipline_base b LEFT JOIN stat_overrides o ON o.registration_id = b.registration_id
GROUP BY b.registration_id, b.yellows, b.reds, b.fair_play_points;
