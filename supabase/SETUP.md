# Database setup reference

The local app now relies on the checked booking and status functions in
`migrations/202609080001_functionality.sql`. Do not deploy the changed frontend by
itself. A corrected connection check using Vite's actual environment loader succeeded.
The earlier HTTP 401 diagnosis came from an incorrect manual environment-file reader;
the existing key does not need replacement. The supplied column defaults, public-table
constraints, policies and trigger attachment have now been reviewed and reproduced in
local tests. The supplied signup function and trigger are also reproduced in tests.
The clinic owner subsequently reported successful manual live setup. These instructions are retained for new environments and reference; do not rerun the original migration on the working database. Auth email delivery should be checked on the final deployment domain.

## Before applying

1. Back up the Supabase database. The ZIP under `backups/` contains source files only.
2. The user supplied both the preflight results and signup function on 2026-09-08.
   The scripts have been checked against those definitions.
3. Compare the existing columns and triggers against the migration. In particular:
   - Profiles use UUID IDs and the profile fields already referenced in the app.
   - Service and appointment IDs can be UUID or numeric; RPC arguments use text IDs.
   - Review any existing triggers that also change status, delete profiles, or send messages.
   - The migration replaces policies on the six app-owned tables it lists. Review any
     additional access rules your clinic needs before replacement.
   - The supplied schema confirms status is already text, so no type conversion is
     performed. Existing status checks and triggers still need review. The migration
     is transactional and errors roll it back.
4. Check existing appointment overlaps and cancellation requests. The migration stops
   if existing reservations overlap; resolve those with the clinic instead of deleting
   history. Existing cancellation
   requests have no recorded original status; the migration defaults their prior status
   to confirmed. Correct those whose original status is known to have been pending.
5. Legacy service prices are copied from today's catalog because historical prices are
   unavailable. They are estimates, not recovered historical quotes. Newly created
   bookings store their actual quote separately.

## Apply and finish configuration

1. Apply the migration once as the database owner. It creates a single-capacity clinic
   schedule with Mon–Sat hours 09:00–12:00 and 13:30–17:00, 60-minute default services,
   a 180-day booking horizon and 168-hour cancellation notice. Adjust through Availability.
2. Preserve the existing `on_auth_user_created` trigger on `auth.users`, which calls
   `handle_new_user()`. The migration replaces this function in place, retaining the
   supplied field mapping and Philippines country value but hardcoding new roles to
   client. It does not create a second signup trigger. The profile guard also
   forces newly inserted accounts to client and active, even if signup metadata asks
   for elevated access. Bootstrap the first owner using a trusted database-owner UPDATE.
3. Confirm `.env` contains the project's current public URL and anon/publishable key.
   Never place a service-role key in Vite environment variables.
4. Add the app's `/login` and `/reset-password` URLs to Supabase Auth redirect URLs;
   configure the Site URL, email confirmation, and email delivery. Password recovery
   uses Supabase Auth email; verify delivery on a staging account.
5. Review and apply `avatar-policies.sql` for the existing `avatars` bucket: allow only an active user to upload files with
   their own UUID prefix. The app uses `USER_UUID-TIMESTAMP.jpg`. The profile URL is
   public in the current design; do not put treatment images or documents in this bucket.
6. Deploy the frontend with SPA fallback to index.html, then verify with separate
   patient, staff, admin and owner test accounts.

## Verification

`npm test` runs isolated PostgreSQL tests using PGlite and pure appointment-rule tests.
No real patient records or remote database are used. The test fixture matches the
column types, nullability, defaults, foreign keys, uniqueness, status checks and public
table access policies supplied on 2026-09-08. It also tests retention of synthetic
confirmed and cancelled appointments, signup through the supplied trigger, rejection
of owner-role signup metadata, and avatar ownership restrictions over the supplied
storage policies. The auth.users and storage tables are local stubs; tests do not
establish that real signup/recovery emails or actual storage uploads work.

Staging checks: competing bookings from two browser sessions; different-length overlaps;
same-day elapsed times; signup confirmation and reset emails; cancellation approval and
rejection; stale management updates; rescheduling; archived service history; role changes;
inactive account access; closures; avatar upload ownership; failed-network retry.

## Deliberate boundaries

- One patient at a time; multiple dentists/chairs and partial-day exceptions are not modeled.
- Appointment Updates is an in-app activity feed, not email/SMS delivery or push alerts.
- Contact opens an email draft and explicitly asks the visitor to send it in their email app.
- Existing bookings remain reserved when opening hours change; arrange their changes separately.
- Account deactivation prevents data access through RLS but does not delete the Auth account.
- Appointment and user lists fetch all pages, then filter/page locally. Large installations
  should move searching and pagination to dedicated server queries.

## Manual execution order

After taking a database backup, open each file and copy its complete contents into a
new Supabase SQL Editor query. Run as the database owner (normally postgres).

1. migrations/202609080001_functionality.sql
2. avatar-policies.sql
3. verify-update.sql (read-only)

Run each update script once, in order. Each has its own transaction. If a script
errors, stop and share the exact error rather than running selected fragments or
retrying a successfully completed script. The main migration intentionally creates
new objects without overwriting an already completed migration.

The reported existing statuses were confirmed: 1 and cancelled: 1. Verification
should retain those counts unless appointments changed in the meantime. After both
updates succeed, restart the app and test signup, login, booking, cancellation review,
service management, and profile image upload. There is no need to change the .env key.

