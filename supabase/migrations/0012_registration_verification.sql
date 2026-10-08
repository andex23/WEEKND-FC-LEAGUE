-- Local review only. Apply after 0011 and before deploying the registration flow.
-- No passwords, verification tokens, addresses, or email bodies are persisted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.registration_email_deliveries (
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('verified_registration', 'approval')),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sending', 'sent', 'failed')),
  claim_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, kind)
);
ALTER TABLE public.registration_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_email_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_email_deliveries TO service_role;

-- Auth tables are intentionally not broadly granted to service_role. This
-- narrow predicate is private, not exposed through the Data API, and returns
-- only verified ownership. Anonymous/authenticated roles cannot execute it.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO service_role;
CREATE OR REPLACE FUNCTION private.registration_email_verified(player_id uuid, player_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE u.id = player_id AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(player_email)
  );
$$;
REVOKE ALL ON FUNCTION private.registration_email_verified(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.registration_email_verified(uuid, text) TO service_role;

-- The trigger runs as the caller (service role). Approval
-- and its durable delivery are committed together. Existing approved accounts
-- are left intact and are not backfilled into the email queue.
CREATE OR REPLACE FUNCTION public.queue_verified_player_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'approved' AND
    (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    IF NOT private.registration_email_verified(NEW.id, NEW.email) THEN
      RAISE EXCEPTION 'Player must verify their email before approval' USING ERRCODE = '23514';
    END IF;
    INSERT INTO public.registration_email_deliveries (player_id, kind)
      VALUES (NEW.id, 'approval') ON CONFLICT (player_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_verified_player_approval() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_verified_player_approval() TO service_role;
DROP TRIGGER IF EXISTS queue_verified_player_approval ON public.players;
CREATE TRIGGER queue_verified_player_approval
  AFTER INSERT OR UPDATE OF status ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.queue_verified_player_approval();

-- An approval is not ready for league access until its required email has been
-- accepted. Legacy approved accounts have no delivery row and remain eligible.
CREATE OR REPLACE FUNCTION private.has_league_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.players p JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid() AND p.status = 'approved' AND u.email_confirmed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.registration_email_deliveries d
        WHERE d.player_id = p.id AND d.kind = 'approval' AND d.state <> 'sent'
      )
  );
$$;
CREATE OR REPLACE FUNCTION public.player_access_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.has_league_access();
$$;
REVOKE ALL ON FUNCTION public.player_access_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.player_access_ready() TO authenticated, service_role;

COMMIT;
