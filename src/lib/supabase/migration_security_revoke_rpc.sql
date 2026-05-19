-- Sécurité : Révoquer l'accès public aux fonctions SECURITY DEFINER internes
-- Ces fonctions sont appelées uniquement via le client admin (service key) côté serveur
-- Elles ne doivent pas être accessibles via l'API REST publique

REVOKE EXECUTE ON FUNCTION public.get_agent_stats_aggregated(timestamptz) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_agent_stat(text, text, integer) FROM anon, authenticated;