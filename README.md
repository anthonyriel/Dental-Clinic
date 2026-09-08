# Dentaprime Dental Clinic

Responsive React, Vite and Tailwind frontend with Supabase authentication,
database-enforced booking rules, and patient and clinic management portals.

## Development

Use Node.js 22.12 or newer. Run `npm ci`, copy `.env.example` to `.env`, supply
your public Supabase URL and anon/publishable key, then run `npm run dev`.
Never put a service-role key or database password in the frontend.

## Validation

- `npm run lint`
- `npm test`
- `npm run build`

Tests use synthetic data in an isolated PGlite database, never production.
GitHub Actions runs these checks on pushes and pull requests.

## Features

- Responsive mint glassmorphism public pages and patient/management portals.
- Booking wizard with monthly availability and service-specific time ranges.
- Database-enforced booking conflicts, clinic hours, closures and notice periods.
- Appointment status rules, cancellation review, rescheduling and activity updates.
- Protected account roles, profile management and service archiving.
- Historical service names and price estimates for appointment records.

Updates are in-app; there are no automated SMS or reminder emails. The contact
form opens an email draft. Booking currently assumes one clinic capacity.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting and Supabase settings.
The clinic owner reported the manually configured live database is working.
SQL files are retained for reference and new environment setup; deploying the
frontend does not automatically rerun migrations.

Environment files, dependencies, build output, local backups and the local planning
document are excluded from Git. Only placeholder `.env.example` is committed.
