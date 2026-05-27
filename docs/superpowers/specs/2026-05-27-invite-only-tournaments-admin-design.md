# Invite-Only Tournaments and Admin Dashboard Design

## Goal

Weekend FC tournaments should be invite-only. Admin creates and configures a tournament, invites approved players, and players decide whether to enter. Players choose their own club for each tournament entry. Admin should manage the tournament and monitor player status, but should not assign teams.

The admin area should also feel like a complete operations dashboard: summary metrics on the overview, full registered-player details on a separate Players page, and a unified dark Weekend FC theme across setup, players, tournaments, and settings.

## Product Flow

1. Admin creates a tournament in draft.
2. Admin edits tournament settings: name, season, dates, format, rules, points, tiebreakers, and scheduling.
3. Admin invites approved players.
4. Invited players see the tournament invitation on their dashboard.
5. Player accepts or declines.
6. If accepting, the player selects their own club for that tournament.
7. Admin sees invited, accepted, and declined counts.
8. Admin generates fixtures only from accepted entries.
9. Generated fixtures use the club selected on the tournament entry, not an admin-assigned club.

## Data Model

Add a `tournament_entries` table:

- `id`
- `tournament_id`
- `player_id`
- `status`: `invited`, `accepted`, `declined`
- `selected_club`
- `invited_at`
- `responded_at`
- `created_at`
- `updated_at`

Constraints:

- One entry per player per tournament.
- `selected_club` is required when status is `accepted`.
- Fixtures are generated from accepted entries only.

Existing `players.preferred_club` remains a profile/default club. Existing `players.assigned_club` should no longer drive tournament setup.

## Admin Dashboard

The main admin dashboard becomes a summary and command center:

- total registered players
- pending approvals
- approved players
- rejected players
- active/draft tournaments
- invited, accepted, declined tournament entries
- generated fixtures count
- recent registrations
- active/draft tournament cards
- quick actions for create tournament, invite players, view players, and generate fixtures

The dashboard should not contain the full player table.

## Players Page

The separate Players page owns registered-player details:

- searchable table of all registered players
- filters by approval status, console, and club
- player detail drawer or detail panel
- details: name, username/gamer tag, email, console, location, preferred club, approval status, created date
- player tournament history: invited, accepted, declined entries
- actions: approve, reject, invite to tournament, view details

## Tournament Admin

Tournament setup should remove the old Teams/admin-assignment step. The new setup structure:

- tournament details
- rules and match settings
- points and tiebreakers
- invitations
- entry status
- scheduling
- review and publish

Tournament detail/settings page should support:

- edit tournament basics
- invite all approved players
- invite selected approved players
- view invited/accepted/declined entries
- resend invitation notices if SMTP is configured
- generate fixtures when at least two players have accepted

## Player Dashboard

The player dashboard should show tournament invitations:

- invited tournaments awaiting response
- accepted tournaments
- declined tournaments
- accept action with club selection
- decline action

Accepted tournament entries should show the selected club and the tournament status.

## Fixture Generation

Fixture generation should use `tournament_entries`:

- query accepted entries for the selected tournament
- join each entry to its player
- use `selected_club` as that player’s tournament club
- require at least two accepted entries
- clear and regenerate only that tournament’s fixtures

The existing approved-player fallback can remain temporarily for older data, but new admin UI should drive the entry-based flow.

## Dummy Players

Add a local/admin seed path to create approved dummy players for testing:

- confirmed auth users
- approved `players` rows
- realistic names, emails, consoles, and preferred clubs
- no `assigned_club` needed

These dummy players can then be invited to test tournaments.

## Theme Direction

Use one dark Weekend FC admin theme everywhere:

- near-black page background
- dark panels with subtle borders
- emerald and gold command accents
- compact operational layout
- no white setup screens
- no marketing-style hero layout inside admin

Cards should be used for repeated items and panels only. Admin pages should favor dense, scannable operations UI.

## Error Handling

- Creating a tournament validates required fields.
- Inviting players rejects non-approved players.
- Accepting an invite requires a selected club.
- Fixture generation fails clearly if fewer than two players accepted.
- Email notification failures should not corrupt entry state.
- Admin actions return clear API messages and UI toasts.

## Verification

Automated checks:

- typecheck
- build
- existing approval-email tests
- focused API tests for entry eligibility and fixture roster shaping if practical

Manual smoke:

- seed dummy players
- create draft tournament
- invite approved players
- player sees invitation
- player accepts with club
- player declines another invitation
- admin sees entry counts
- generate fixtures from accepted entries only
- admin setup and players pages use the unified dark theme
