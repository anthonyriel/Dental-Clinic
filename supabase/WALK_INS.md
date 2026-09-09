# Enable walk-in registration

Run the entire `migrations/202609090001_walk_ins.sql` file once in your existing
Supabase project's SQL Editor as the database owner. Keep a current database backup.
Do not rerun the original `202609080001_functionality.sql` migration.

The script is transactional and requires the original functionality setup. It keeps
existing appointments and accounts. No script has been applied to the live database
by the assistant. Apply this SQL before deploying the updated frontend.

## How it works

- Staff, admins and owners use **Register walk-in** in the management navigation.
- Enter a patient name, optional Philippine mobile number, service and available
  time today. The visit starts as confirmed and appears in the regular schedule.
- No Supabase Auth user or profile is created. Name and phone are stored on the
  appointment; these are visit records, not a deduplicated patient directory.
- Walk-ins share clinic capacity with online bookings. Hours, special closures,
  treatment duration and overlap protection still apply. Staff can reserve the
  next available future start time today without the online advance-notice period.
- Existing management actions handle cancellation, rescheduling and completion.
  Rescheduling uses the existing online availability rules and booking horizon.
- Regular patients cannot read walk-ins or their activity records. The updated
  status function uses NULL-safe ownership checks for patientless appointments.
- Each registration has a unique request ID; retrying an uncertain response with
  the same ID returns the original booking rather than duplicating it.

## Manual verification

After SQL succeeds and the frontend is deployed, sign in with a management test
account, register a designated test walk-in, and check the name, time and Walk-in
label in the schedule. Confirm that the same time is no longer bookable online.
Cancel the test booking with a clear note when finished. Use a regular client
account to verify that the walk-in does not appear in their history or updates.

The automated tests use an isolated database and synthetic identities, including
a fixed test clock. They do not access your live Supabase data.
