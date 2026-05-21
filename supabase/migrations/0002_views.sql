-- 0002_views.sql
-- League standings view. Depends on 0001_core_schema.sql.
-- Aggregates played fixtures into a per-player table row.

CREATE OR REPLACE VIEW public.v_standings AS
SELECT
  p.id,
  p.username,
  p.name,
  COALESCE(p.assigned_club, p.preferred_club) AS team,
  p.console,
  COALESCE(stats.played, 0)                                            AS played,
  COALESCE(stats.wins, 0)                                              AS wins,
  COALESCE(stats.draws, 0)                                             AS draws,
  COALESCE(stats.losses, 0)                                            AS losses,
  COALESCE(stats.goals_for, 0)                                         AS goals_for,
  COALESCE(stats.goals_against, 0)                                     AS goals_against,
  COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0)       AS goal_difference,
  COALESCE(stats.wins, 0) * 3 + COALESCE(stats.draws, 0)               AS points,
  COALESCE(stats.goals, 0)                                             AS goals,
  COALESCE(stats.assists, 0)                                           AS assists,
  COALESCE(stats.cards, 0)                                             AS cards
FROM public.players p
LEFT JOIN (
  SELECT
    player_id,
    COUNT(*)                                          AS played,
    SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END)     AS wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END)     AS draws,
    SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END)     AS losses,
    SUM(goals_for)                                    AS goals_for,
    SUM(goals_against)                                AS goals_against,
    SUM(goals)                                        AS goals,
    SUM(assists)                                      AS assists,
    SUM(cards)                                        AS cards
  FROM (
    SELECT
      home_player_id AS player_id,
      CASE
        WHEN COALESCE(home_score, 0) > COALESCE(away_score, 0) THEN 'W'
        WHEN COALESCE(home_score, 0) = COALESCE(away_score, 0) THEN 'D'
        ELSE 'L'
      END AS result,
      COALESCE(home_score, 0)   AS goals_for,
      COALESCE(away_score, 0)   AS goals_against,
      COALESCE(home_goals, 0)   AS goals,
      COALESCE(home_assists, 0) AS assists,
      COALESCE(home_cards, 0)   AS cards
    FROM public.fixtures
    WHERE status IN ('PLAYED', 'FORFEIT')

    UNION ALL

    SELECT
      away_player_id AS player_id,
      CASE
        WHEN COALESCE(away_score, 0) > COALESCE(home_score, 0) THEN 'W'
        WHEN COALESCE(away_score, 0) = COALESCE(home_score, 0) THEN 'D'
        ELSE 'L'
      END AS result,
      COALESCE(away_score, 0)   AS goals_for,
      COALESCE(home_score, 0)   AS goals_against,
      COALESCE(away_goals, 0)   AS goals,
      COALESCE(away_assists, 0) AS assists,
      COALESCE(away_cards, 0)   AS cards
    FROM public.fixtures
    WHERE status IN ('PLAYED', 'FORFEIT')
  ) per_player
  GROUP BY player_id
) stats ON p.id = stats.player_id
WHERE p.status = 'approved';
