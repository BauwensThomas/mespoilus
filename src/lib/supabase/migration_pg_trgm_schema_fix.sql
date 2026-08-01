-- Corrige l'advisor "extension_in_public" (WARN sécurité) déclenché par
-- la création de pg_trgm dans migration_index_cleanup.sql
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
