# Weekend FC

A web platform for running a community EA FC league. Players can follow fixtures, submit results, and view standings, while organizers manage registrations, tournaments, and match approvals.

[Website](https://www.weekendfc.online/)

## What it does

- Publishes fixtures, standings, and player statistics.
- Handles player registration and an authenticated player dashboard.
- Supports result submission and administrator approval.
- Gives organizers tools for players, tournaments, and fixture generation.
- Includes match reminder and announcement endpoints.

## Built with

Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase, and Nodemailer. The repository uses pnpm 10.15.0.

## Run locally

```bash
git clone https://github.com/andex23/WEEKND-FC-LEAGUE.git
cd WEEKND-FC-LEAGUE
pnpm install
```

Create `.env.local` with your development Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

Follow the [database setup guide](supabase/README.md) and apply the canonical migrations in `supabase/migrations/` in order. The SQL files under `scripts/_DEPRECATED/` are historical and should not be used for a fresh setup. Configure Supabase authentication redirects for your local origin.

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Email and scheduled notifications need their own provider and deployment configuration.

## Checks

```bash
pnpm typecheck
pnpm build
```

## Code map

| Path | Purpose |
| --- | --- |
| `app/dashboard/` | Player workspace |
| `app/admin/` | League administration |
| `app/api/` | Registration, fixtures, results, and notifications |
| `components/` | Shared interface components |
| `supabase/migrations/` | Canonical database schema and policies |
| `docs/` | Additional project notes |

## License

This project is proprietary to Weekend FC Community.
