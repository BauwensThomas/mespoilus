-- Fonction d'agregation des stats activity_logs cote DB
-- Evite la limite Supabase de 1000 lignes sur les requetes sans limit()
CREATE OR REPLACE FUNCTION get_agent_stats_aggregated(start_of_month TIMESTAMPTZ)
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_by_agent', (
      SELECT COALESCE(json_object_agg(agent_id, stats), '{}')
      FROM (
        SELECT
          agent_id,
          json_build_object(
            'tasks',  COUNT(*) FILTER (WHERE status = 'success'),
            'failed', COUNT(*) FILTER (WHERE status = 'error'),
            'tokens', COALESCE(SUM(tokens_used), 0)
          ) AS stats
        FROM activity_logs
        GROUP BY agent_id
      ) t
    ),
    'monthly_by_agent', (
      SELECT COALESCE(json_object_agg(agent_id, stats), '{}')
      FROM (
        SELECT
          agent_id,
          json_build_object(
            'tasks',  COUNT(*) FILTER (WHERE status = 'success'),
            'tokens', COALESCE(SUM(tokens_used), 0)
          ) AS stats
        FROM activity_logs
        WHERE created_at >= start_of_month
        GROUP BY agent_id
      ) t
    ),
    'global_total_tasks',    (SELECT COUNT(*)                    FROM activity_logs WHERE status = 'success'),
    'global_total_tokens',   (SELECT COALESCE(SUM(tokens_used), 0) FROM activity_logs),
    'global_monthly_tasks',  (SELECT COUNT(*)                    FROM activity_logs WHERE status = 'success' AND created_at >= start_of_month),
    'global_monthly_tokens', (SELECT COALESCE(SUM(tokens_used), 0) FROM activity_logs WHERE created_at >= start_of_month)
  )
$$;
