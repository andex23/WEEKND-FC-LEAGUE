# Invite-Only Tournaments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build invite-only tournament entries, player accept/decline with club choice, entry-based fixture generation, dummy approved players, and a unified dark admin setup/dashboard experience.

**Architecture:** Add a `tournament_entries` table and route tournament participation through entries instead of admin-assigned clubs. Keep existing `players` as identity/profile records and generate fixtures from accepted tournament entries. Update admin and player surfaces around invitations, entry counts, and entry-based fixtures.

**Tech Stack:** Next.js App Router, React client components, Supabase Postgres/Auth, `@supabase/ssr`, Nodemailer SMTP helpers, Node test runner.

---

### Task 1: Database Migration And Entry Helpers

**Files:**
- Create: `supabase/migrations/0007_tournament_entries.sql`
- Create: `lib/tournaments/entries.ts`
- Test: `tests/tournament-entries.test.mjs`

- [ ] Add the migration for `public.tournament_entries` with one entry per `(tournament_id, player_id)`, status check values `invited`, `accepted`, `declined`, and a `selected_club` check requiring a club when accepted.
- [ ] Add lightweight helper functions for normalizing entry status and filtering accepted entries into fixture roster records.
- [ ] Add focused Node tests proving accepted entries with clubs become fixture roster records and invited/declined entries are excluded.
- [ ] Run `node --test tests/tournament-entries.test.mjs`.

### Task 2: Apply Schema To The Current Supabase Project

**Files:**
- Use: `supabase/migrations/0007_tournament_entries.sql`

- [ ] Apply the migration SQL to the connected Supabase project using the service role credentials already in `.env.local`.
- [ ] Verify `tournament_entries` can be selected through the service role.

### Task 3: Tournament Entries API

**Files:**
- Create: `app/api/admin/tournament-entries/route.ts`
- Create: `app/api/player/tournament-entries/route.ts`

- [ ] Implement admin GET for tournament entries with joined player and tournament details.
- [ ] Implement admin POST actions: `invite`, `invite_all_approved`, and `remove`.
- [ ] Implement player GET for the signed-in player’s tournament entries.
- [ ] Implement player POST actions: `accept` with `selectedClub`, and `decline`.
- [ ] Validate that only approved players can be invited and only the signed-in player can accept/decline their own entry.

### Task 4: Entry-Based Fixture Generation

**Files:**
- Modify: `app/api/admin/generate-fixtures/route.ts`
- Modify: `lib/utils/fixtures.ts` only if needed

- [ ] Load accepted entries for `tournamentId`.
- [ ] Build fixture roster from `entry.player_id`, `entry.player.name`, and `entry.selected_club`.
- [ ] Require at least two accepted entries before generating.
- [ ] Keep the existing approved-player fallback only when no entries exist, so older local data still works.
- [ ] Return clear errors for no accepted entries or too few accepted entries.

### Task 5: Dummy Approved Player Seed

**Files:**
- Modify: `app/api/admin/seed/route.ts`

- [ ] Expand the seed list to at least 12 realistic approved players.
- [ ] Create confirmed auth users and approved `players` rows.
- [ ] Do not set `assigned_club`.
- [ ] Return seeded credentials and counts for local testing.

### Task 6: Admin Tournament UI

**Files:**
- Modify: `app/admin/tournaments/page.tsx`
- Modify: `app/admin/setup/page.tsx`

- [ ] Replace admin setup’s white wizard shell with the dark Weekend FC admin theme.
- [ ] Remove the Teams step and any admin team assignment language.
- [ ] Add invite/entry status sections showing invited, accepted, declined, and available approved player counts.
- [ ] Add controls to invite all approved players and generate fixtures from accepted entries.
- [ ] Keep tournament settings editable after creation.

### Task 7: Admin Dashboard And Players Page Enhancements

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/players/page.tsx`

- [ ] Ensure the main admin overview shows summary counts and recent registrations, not the full player table.
- [ ] Ensure the Players page has the full player table, status filters, and enough player details for registered-player management.
- [ ] Add tournament invite history or entry counts to player detail surfaces where practical.
- [ ] Keep all pages on the same dark admin theme.

### Task 8: Player Dashboard Invitations

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create or modify: `app/dashboard/_components/TournamentInvites.tsx`

- [ ] Fetch the signed-in player’s tournament entries.
- [ ] Show invited tournaments awaiting response.
- [ ] Let the player accept with a selected club.
- [ ] Let the player decline.
- [ ] Show accepted and declined tournament states.

### Task 9: Verification

**Commands:**
- `node --test tests/tournament-entries.test.mjs`
- `node --test tests/approval-email.test.mjs`
- `corepack pnpm run typecheck`
- `corepack pnpm run build`
- `git diff --check`

- [ ] Seed dummy players through the admin seed route.
- [ ] Create a draft tournament.
- [ ] Invite approved players.
- [ ] Accept at least two entries as players or through direct API smoke calls.
- [ ] Generate fixtures from accepted entries.
- [ ] Verify admin setup and player dashboard render without framework overlays or relevant console errors.
