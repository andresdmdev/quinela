# Quiniela Mundialista FIFA 2026

Private web application to manage a friendly betting pool for the FIFA World Cup 2026 among 6 friends.

## Technologies

- Astro 5 with server-side rendering (`output: 'server'`)
- React 19 for interactive components
- Tailwind CSS v4
- Supabase (Auth + Postgres + Storage)
- football-data.org API (free tier)
- Deploy on Vercel

## Main Features

- Google OAuth login.
- Profile management: display name and avatar upload.
- Dashboard with upcoming matches and live leaderboard.
- Predictions with automatic lock 1 hour before kickoff.
- Group stage global cutoff: June 10, 2026 at 23:59 UTC-5.
- Automatic points calculation.
- Finished match history with prediction audit.
- Mobile-first design with bottom tab bar.
- Light theme by default.

## football-data.org Rate Limit

- Free tier limit: 10 requests/minute.
- Solution: server-side proxy with 3-minute cache in Supabase + browser cache.
- Visible disclaimer when the API is rate-limited.

## Folder Structure

```text
src/
├── components/
│   ├── react/           # Interactive React components
│   └── astro/           # Static Astro components
├── layouts/
├── pages/
│   └── api/
├── lib/                 # Supabase client, football-data client, utilities
├── db/                  # SQL schema and types
└── styles/
```

## Environment Variables

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FOOTBALL_DATA_API_KEY=
```

## Implementation Phases

1. Setup Astro + React + Tailwind + Vercel adapter.
2. Configure Supabase Auth with Google OAuth.
3. Create database schema and RLS policies.
4. Integrate football-data.org with proxy + cache.
5. Build predictions screen with time lock.
6. Build dashboard with leaderboard and upcoming matches.
7. Build history and audit screen.
8. Implement points calculation.
9. Build mobile-first UI/UX.
10. Deploy to Vercel.

## Local Development

This project uses [pnpm](https://pnpm.io) as package manager.

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Run `pnpm install`.
3. Run `pnpm run dev`.
4. Open `http://localhost:4321`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example` in Vercel settings.
4. Deploy.

## Additional Documentation

- `docs/SUPABASE_SETUP.md` — Supabase configuration.
- `docs/GOOGLE_OAUTH_SETUP.md` — Google OAuth configuration.
- `docs/UI_REDISEÑO.md` — UI redesign details and color palette.
