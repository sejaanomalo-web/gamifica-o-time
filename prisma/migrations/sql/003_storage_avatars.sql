-- Storage bucket `avatars` + RLS pra upload de foto de perfil.
--
-- Estratégia: bucket público (URL acessível por qualquer um), mas escrita
-- restrita ao próprio usuário autenticado. Cada usuário só pode mexer em
-- arquivos que estão dentro de uma pasta com o seu auth.uid() como prefixo:
--
--   avatars/<auth.uid()>/<filename>
--
-- Idempotente: roda quantas vezes precisar.

-- ── Bucket ───────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                              -- bucket público (URL aberta)
  5 * 1024 * 1024,                   -- limite 5 MB por arquivo
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies em storage.objects ─────────────────────────────────────────
-- Lê todo mundo (public bucket — necessário pra o navegador puxar o avatar).
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Insert: só na própria pasta (primeira parte do path == auth.uid()).
DROP POLICY IF EXISTS "avatars_self_insert" ON storage.objects;
CREATE POLICY "avatars_self_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Update: idem (pode reupload com mesmo nome).
DROP POLICY IF EXISTS "avatars_self_update" ON storage.objects;
CREATE POLICY "avatars_self_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Delete: idem.
DROP POLICY IF EXISTS "avatars_self_delete" ON storage.objects;
CREATE POLICY "avatars_self_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
