-- 0010_player_avatars.sql
-- Player-uploaded profile pictures.
-- Idempotent: safe to re-run. Depends on 0001_core_schema.sql.

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url text;

-- Public bucket. Reads are public so standings/dashboards can render avatars
-- without signed URLs; writes are gated by the storage.objects RLS policies
-- below so each player can only manage objects in their own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-avatars',
  'player-avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Path convention: <auth.uid()>/<filename>. The first path segment is the
-- owner; storage.foldername(name)[1] returns it.
DROP POLICY IF EXISTS "player-avatars: public read" ON storage.objects;
CREATE POLICY "player-avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-avatars');

DROP POLICY IF EXISTS "player-avatars: owner insert" ON storage.objects;
CREATE POLICY "player-avatars: owner insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "player-avatars: owner update" ON storage.objects;
CREATE POLICY "player-avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "player-avatars: owner delete" ON storage.objects;
CREATE POLICY "player-avatars: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
