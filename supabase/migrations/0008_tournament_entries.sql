-- 0008_tournament_entries.sql
-- Invite-only tournament participation. Players choose their own club per
-- tournament entry; admin no longer assigns teams for tournament setup.

CREATE TABLE IF NOT EXISTS public.tournament_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited',
  selected_club text,
  invited_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_entries_unique_player UNIQUE (tournament_id, player_id),
  CONSTRAINT tournament_entries_status_check CHECK (status IN ('invited', 'accepted', 'declined')),
  CONSTRAINT tournament_entries_selected_club_check CHECK (
    status <> 'accepted' OR NULLIF(btrim(selected_club), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS tournament_entries_tournament_id_idx
  ON public.tournament_entries(tournament_id);

CREATE INDEX IF NOT EXISTS tournament_entries_player_id_idx
  ON public.tournament_entries(player_id);

CREATE INDEX IF NOT EXISTS tournament_entries_status_idx
  ON public.tournament_entries(status);

DROP TRIGGER IF EXISTS tournament_entries_set_updated_at ON public.tournament_entries;
CREATE TRIGGER tournament_entries_set_updated_at
BEFORE UPDATE ON public.tournament_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_entries_select ON public.tournament_entries;
CREATE POLICY tournament_entries_select ON public.tournament_entries
FOR SELECT USING (
  player_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS tournament_entries_player_update ON public.tournament_entries;
CREATE POLICY tournament_entries_player_update ON public.tournament_entries
FOR UPDATE USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS tournament_entries_admin_all ON public.tournament_entries;
CREATE POLICY tournament_entries_admin_all ON public.tournament_entries
FOR ALL USING (public.is_admin())
WITH CHECK (public.is_admin());
