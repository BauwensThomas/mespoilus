-- RLS sur awin_sync_progress
-- Table interne uniquement accessible via service_role (crons, dashboard admin)

ALTER TABLE awin_sync_progress ENABLE ROW LEVEL SECURITY;

-- Aucun accès public ni utilisateur authentifié
-- Le service_role bypasse automatiquement le RLS → les crons fonctionnent sans policy
