-- Backup hebdomadaire des données (cron /api/cron/db-backup, 04/10/2026)
-- Liste dynamiquement les tables du schéma public avec leur clé primaire et les
-- tables dont elles dépendent (FK), pour que toute nouvelle table soit sauvegardée
-- sans modifier le code et que la restauration respecte l'ordre des FK.

-- columns = colonnes à exporter : exclut les colonnes générées (GENERATED ALWAYS AS ... STORED),
-- qu'on ne peut pas réinsérer et que Postgres recalcule tout seul.
DROP FUNCTION IF EXISTS public.backup_list_tables();
CREATE FUNCTION public.backup_list_tables()
RETURNS TABLE(table_name text, pk_columns text[], depends_on text[], columns text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.relname::text AS table_name,
    COALESCE((
      SELECT array_agg(a.attname::text ORDER BY k.ord)
      FROM pg_catalog.pg_constraint pk
      CROSS JOIN LATERAL unnest(pk.conkey) WITH ORDINALITY AS k(attnum, ord)
      JOIN pg_catalog.pg_attribute a ON a.attrelid = pk.conrelid AND a.attnum = k.attnum
      WHERE pk.conrelid = c.oid AND pk.contype = 'p'
    ), '{}') AS pk_columns,
    COALESCE((
      SELECT array_agg(DISTINCT r.relname::text)
      FROM pg_catalog.pg_constraint fk
      JOIN pg_catalog.pg_class r ON r.oid = fk.confrelid
      WHERE fk.conrelid = c.oid AND fk.contype = 'f' AND fk.confrelid <> c.oid
    ), '{}') AS depends_on,
    (
      SELECT array_agg(a.attname::text ORDER BY a.attnum)
      FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
    ) AS columns
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  ORDER BY 1;
$$;

-- Appelée uniquement par le client admin (service role) côté serveur
REVOKE EXECUTE ON FUNCTION public.backup_list_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_list_tables() TO service_role;

-- Bucket privé des sauvegardes (créé via l'API Storage, pas en SQL) :
--   db-backups (public = false), structure <YYYY-MM-DD>/<table>.json.gz + manifest.json
--   Rétention : 4 sauvegardes, les plus anciennes sont supprimées par le cron.
