-- Keep private player fields and privileged writes behind authenticated server routes.
-- Column grants complement RLS: owning a row must not allow changing role or status.
BEGIN;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.players FROM anon, authenticated;
GRANT SELECT (id, username, name, preferred_club, assigned_club, console, avatar_url, status) ON public.players TO anon, authenticated;
GRANT UPDATE (avatar_url, available) ON public.players TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fixtures FROM anon, authenticated;
-- Result submission now uses the server after checking the authenticated participant.
COMMIT;
