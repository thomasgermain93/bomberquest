-- Leaderboard RPC
-- Extrait les données de classement depuis player_saves.save_data (JSON)
-- Joints avec profiles pour les pseudos

CREATE OR REPLACE FUNCTION get_leaderboard(board_type TEXT, lim INT DEFAULT 50)
RETURNS TABLE(
  rank BIGINT,
  display_name TEXT,
  value BIGINT,
  user_id UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY value DESC) as rank,
    COALESCE(p.display_name, 'Joueur anonyme') as display_name,
    value,
    s.user_id
  FROM (
    SELECT
      user_id,
      CASE
        WHEN board_type = 'level' THEN (save_data->>'accountLevel')::BIGINT
        WHEN board_type = 'hunts' THEN (save_data->>'mapsCompleted')::BIGINT
        ELSE 0
      END as value
    FROM player_saves
    WHERE save_data IS NOT NULL
  ) s
  LEFT JOIN profiles p ON p.id = s.user_id
  WHERE value > 0
  ORDER BY value DESC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard TO anon, authenticated;
