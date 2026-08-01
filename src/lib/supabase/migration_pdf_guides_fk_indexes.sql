-- Index recommandés par le Supabase Performance Advisor (unindexed_foreign_keys)
-- guide_id est utilisé dans les jointures/suppressions en cascade (ON DELETE CASCADE) depuis pdf_guides

CREATE INDEX IF NOT EXISTS idx_pdf_consents_guide_id  ON public.pdf_consents(guide_id);
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_guide_id ON public.pdf_downloads(guide_id);
