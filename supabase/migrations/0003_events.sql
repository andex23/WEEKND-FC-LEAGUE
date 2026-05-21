-- 0003_events.sql
-- Match events (for real goal/assist/card stats), notifications and messages.
-- Depends on 0001_core_schema.sql.

-- ---------------------------------------------------------------------------
-- match_events  -- one row per goal / assist / card, attributed to a player
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id    uuid NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('goal', 'assist', 'yellow', 'red', 'own_goal')),
  minute        integer,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_events_fixture_id_idx ON public.match_events(fixture_id);
CREATE INDEX IF NOT EXISTS match_events_player_id_idx ON public.match_events(player_id);
CREATE INDEX IF NOT EXISTS match_events_type_idx ON public.match_events(type);

-- ---------------------------------------------------------------------------
-- notifications  -- user_id NULL == broadcast to everyone
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.players(id) ON DELETE CASCADE,
  title         text NOT NULL,
  body          text,
  read_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- ---------------------------------------------------------------------------
-- messages  -- admin -> player(s) messaging; recipient_id NULL == broadcast
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid REFERENCES public.players(id) ON DELETE SET NULL,
  recipient_id  uuid REFERENCES public.players(id) ON DELETE CASCADE,
  subject       text,
  body          text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);
