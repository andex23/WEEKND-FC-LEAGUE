# Database schema

The canonical schema lives in `supabase/migrations/`. The old, conflicting
ad-hoc scripts have been moved to `scripts/_DEPRECATED/` for history only — do
not run them.

## Schema source files and verified setup order

For a fresh Supabase project, regenerate and review `apply-all.sql` with
`node scripts/build-schema.mjs`, then run that bundle in the SQL editor.
It includes the current verification/security changes and deliberately omits
the optional demo seed. Never run the full fresh-project bundle against an
existing production database.

`scripts/schema-files.mjs` is the explicit dependency order. The historical
filenames contain two `0009` prefixes, and player permissions require the
`avatar_url` column introduced by `0010`. Do not run this legacy folder through
`supabase db push` or sort by filename without first reconciling migration
history on a staging copy. Existing numbered files have not been renamed.

| File | Purpose |
| --- | --- |
| `0001_core_schema.sql` | `league_settings`, `tournaments`, `players`, `fixtures` |
| `0002_views.sql` | `v_standings` view |
| `0003_events.sql` | `match_events`, `notifications`, `messages` |
| `0004_functions_rls.sql` | triggers, `is_admin()`, league functions, RLS policies |
| `0005_seed.sql` | optional development seed |
| `0006_speed_test.sql` | connection-speed columns + `speed-tests` storage bucket |
| `0007_match_reminders.sql` | `fixtures.reminder_sent_at` for the reminder cron |
| `0008_tournament_entries.sql` | Tournament invitation/response schema |
| `0009_league_settings_sections.sql` | Public branding and private integration settings |
| `0010_player_avatars.sql` | Avatar column/bucket; must precede player permissions |
| `0009_player_permissions.sql` | Historical player column grants |
| `0011_access_and_rate_limits.sql` | Verified/approved access, private data grants, durable rate limits |
| `0012_registration_verification.sql` | Verified-email approval guard, mail queue and access-ready predicate |

All migrations are idempotent (`CREATE TABLE IF NOT EXISTS`,
`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`) — they are safe to re-run and
safe to apply on top of an existing database.

## How to apply

For a fresh project, generate the complete dependency-ordered bundle:

```bash
node scripts/build-schema.mjs
```

## Applying to an EXISTING database

First inspect current schema, grants and policies. After verifying the earlier
prerequisites, review and explicitly authorize security migrations `0011` and
`0012`; apply them before the new app code. Do not create users, overwrite
approval/verification state, replay demo seed, or send historical alerts.
Keep old approval/registration writes paused during the coordinated rollout,
because the old application approves by confirming email on an owner's behalf.
See `docs/security/registration-verification.md` for configuration and smoke tests.

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
