# Deployment preparation

This is a static Vite frontend backed by Supabase. A GitHub push does not apply
database migrations or deploy the site.

## Hosting settings

- Root directory: repository root
- Node.js: 22.12 or newer
- Install: `npm ci`
- Build: `npm run build`
- Output directory: `dist`

Configure your host to serve `/index.html` for application routes such as `/login`,
`/dashboard/book` and `/reset-password`, while preserving real asset requests.
The exact SPA rewrite configuration depends on the chosen hosting provider.

## Environment

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting project's
environment settings before building. Copy the values from your local `.env`
directly into the hosting settings; do not commit them to Git.
Vite exposes these variables to browsers. Use only the public anon/publishable
key, never a service-role key or database password. Rebuild after changing values.

## Supabase and launch checks

The clinic owner reported the manually configured live database is working.
Do not rerun the original migration simply because the frontend is deployed.
See `supabase/SETUP.md` for setting up a separate database environment.

1. Set Supabase Auth Site URL to the final HTTPS domain and allow the app's
   `/login` and `/reset-password` redirect URLs on that domain.
2. Check login, signup confirmation and password recovery on the final domain.
3. Check calendar availability, booking and management confirmation with designated
   test accounts. These actions write to the connected database.
4. Refresh a nested route directly to verify the SPA fallback.
5. Check mobile navigation, the booking calendar and profile forms on a phone.

GitHub Actions runs lint, isolated tests and a build without live credentials.
It does not deploy or apply migrations.
