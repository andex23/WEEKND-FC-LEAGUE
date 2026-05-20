# Database schema

The canonical schema lives in `supabase/migrations/`. The old, conflicting
ad-hoc scripts have been moved to `scripts/_DEPRECATED/` for history only — do
not run them.

## Migration files (run in order)

| File | Purpose |
| --- | --- |
| `0001_core_schema.sql` | `league_settings`, `tournaments`, `players`, `fixtures` |
| `0002_views.sql` | `v_standings` view |
| `0003_events.sql` | `match_events`, `notifications`, `messages` |
| `0004_functions_rls.sql` | triggers, `is_admin()`, league functions, RLS policies |
| `0005_seed.sql` | optional development seed |

All migrations are idempotent (`CREATE TABLE IF NOT EXISTS`,
`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`) — they are safe to re-run and
safe to apply on top of an existing database.

## How to apply

Open the Supabase project's SQL editor and run each file in order (0001 → 0005),
or with the Supabase CLI:

```bash
supabase db push
```

## Applying to an EXISTING database

If the project already has tables from the old scripts, the column shapes may
differ. The migrations add any missing columns but do **not** drop or rename
existing ones. Before relying on the app, confirm the live shape matches:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

If a column has the wrong type or name, write a one-off reconciling statement —
do not edit the numbered migrations after they have been applied.

## Key conventions

- `players.id` **is** `auth.users.id` (1:1). There is no separate `profiles`
  table.
- `players.status` is `pending` until an admin approves the registration.
- `v_standings` only includes `approved` players and aggregates `PLAYED` /
  `FORFEIT` fixtures.
- Per-player goals/assists/cards come from `match_events`.
- Server code uses the service-role client for admin writes (bypasses RLS) and
  the session client for player-scoped reads/writes (enforced by RLS).
