# Client records, staff bookings and optional login invitations

## Manual setup order

1. Apply `migrations/202609270001_client_records.sql` in your existing project's SQL Editor, once. It assumes the functionality, walk-in, multi-service, early-completion, per-service payment and legacy-payment migrations have already been applied. Do not rerun those older files.
2. In Supabase **Edge Functions**, create a function named **invite-client**. Paste the entire contents of `functions/invite-client/index.ts` into its `index.ts`, then deploy it. Keep JWT verification enabled. The function additionally verifies the session with Auth and uses the staff user's permissions to prepare the invitation.
3. In Edge Function secrets, add **APP_URL** with your actual frontend origin, for example `https://your-clinic.onrender.com` (no trailing slash or extra path). For local testing, optionally set **ALLOWED_ORIGINS** to `http://localhost:5173`. Multiple additional origins can be comma-separated. All invitations still return to APP_URL.
4. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. The service role key stays in the function; never add it to any `VITE_` variable or frontend file.
5. In **Authentication → URL Configuration**, allow `APP_URL/reset-password`. Check the Auth invite email template uses the invitation confirmation URL and honors the requested redirect. Configure your email provider/SMTP for production invitation delivery if you have not done so.
6. Deploy the updated frontend. Confirm the new **Staff booking** and **Client records** links appear for staff, admins and owners.

SQL alone enables the records and booking flows. The optional **Create login & send invitation** button requires the Edge Function and email configuration too. Nothing in this change was applied to the live database or sent to clients automatically.

## Staff workflow

- Search Client records before creating a client. Name, mobile, email and birthdate are supported. Mobile, email and birthdate are optional; the clinic record does not require a login.
- In Staff booking, select the existing client (or create a record), choose Walk-in, Phone call or Text message, select services, date and an available time. Walk-ins are today only. Calls/texts may book today or a future date within the clinic's booking horizon. All staff bookings are confirmed immediately.
- Staff availability ignores the online advance-notice delay but still enforces future start times, clinic hours, breaks, closures and the entire combined service duration. Repeated network retries use the same request ID and do not create duplicate bookings.
- Finish visits with the existing per-service paid-amount form. Their details, service prices, completion status and payments appear in the client's history.
- To give a client login access, save their email and confirm it belongs to them. Click **Create login & send invitation**. They receive an email link, choose their own password on the existing reset-password page, and sign in using their email. Staff do not see or assign their password.
- The database links their client record and history during account creation, using a one-time server-generated token matched to the invited email. Clients can then see their own earlier visits. This never changes the staff session or grants the invited account a staff role.
- A record with an existing linked login cannot receive a second account. The client can use **Forgot password** if they need another access link. If an invitation attempt has an uncertain result, refresh the record first; a linked-login indicator means the account already exists.

## Existing records and limits

Existing registered patients are copied into client records and linked to their appointments. Existing walk-ins are imported separately per historical visit; identical names or shared mobile numbers are not automatically merged, since they do not prove identity. New bookings reuse the selected record going forward. Merging historic duplicates or attaching a pre-existing unrelated login is not included in this migration.

Clinic contact details are separate from login settings; editing a record's email does not change an existing account's sign-in email. The migration protects linked records from account deletion; use account deactivation to retain history. No charting, prescriptions, file attachments, installment ledger or clinical diagnosis fields are introduced here.

## Verification after setup

1. As staff, create a record without email and book a same-day walk-in with two services. Book a future call/text visit using that same record; verify both appear under one client.
2. Try an overlapping time and a repeated submission; neither should create another reservation. Check ordinary online booking and payment completion still work.
3. Save a test email you control, send an invitation, open it in a separate/private browser, set a password and sign in. Confirm the staff session remains signed in and the client can see their earlier appointments.
4. Sign in as a different patient. Confirm they cannot open management pages, create client records, book on another person's behalf, or see the invited client's data.
5. Check booking source labels and the report walk-in count; account-linked walk-ins retain their walk-in source and phone/text bookings are not counted as walk-ins.

Local tests exercise the migration, RLS, snapshots, history linking and a mocked invitation handler. The actual email service, deployed Edge Function, and confirmation redirect still need this live verification.

Official reference: [Supabase inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) and [Edge Function authentication](https://supabase.com/docs/guides/functions/auth-legacy-jwt).
