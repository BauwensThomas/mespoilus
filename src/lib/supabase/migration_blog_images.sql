-- Bucket Supabase Storage pour les images d'articles et posts sociaux
-- À exécuter dans Supabase Dashboard → Storage → New bucket
-- Ou via SQL Editor (nécessite les extensions storage activées)

-- Note : la création de bucket via SQL n'est pas supportée directement.
-- Créer manuellement dans Dashboard : Storage → New bucket → "blog-images" → Public : ON

-- Politique d'accès public en lecture (à exécuter après création du bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read blog-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Service role upload blog-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Service role update blog-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'blog-images');
