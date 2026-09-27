# Predeployment flow review — September 28, 2026

## Apply before redeploying

Run `migrations/202609280002_flow_checks.sql` once in Supabase SQL Editor, after the migrations you already applied. It adds patient booking request IDs and an administrator-only function for deleting cancelled/no-show appointments. It does not delete existing data. Then deploy the updated frontend. The existing Edge Functions do not need code changes for this update.

## Adjustments

- Client Records now considers the linked login's active/deletion status. Deactivated and deletion-pending accounts no longer appear as eligible choices in staff booking. Record-only clients still use their own activation status.
- Only admins/owners see the account-management link and appointment deletion action. Appointment deletion checks the current version and cancelled/no-show status, and removes its service lines and events in the same transaction. Failed requests no longer rely on a direct table delete that could report success without removing a row.
- Patient bookings now carry one request ID across retries. An uncertain connection result keeps the original request on the review step; retrying cannot create a second appointment with that request ID. Explicit validation errors return the user to availability. After leaving/reloading the page, check appointment history before starting another booking.
- Staff booking confirmation uses a saved receipt so availability refreshes cannot erase its displayed date/time. Ambiguous database connection failures also retain the same request for retry.
- Failed queries for a newly selected record cannot relabel a previous record's cached data as the new result.
- Pages load on demand instead of downloading every portal page on first visit. A page-load error now shows a reload action instead of an empty screen. Password recovery uses the simple authentication layout.

## Checks and limits

Local database tests cover booking retries, permissions, inactive accounts, deletion, snapshots, payments and retained history. Lint and the production build were checked. The public home → sign-in → password-recovery navigation was checked in a browser without submitting forms.

Authenticated browser flows, actual email delivery and the new migration on live Supabase still require a brief test after deployment. No live data, Supabase schema, deployed functions or Render configuration were changed during this review.

After deployment, use disposable test data to check:

1. Patient multi-service booking, management confirmation/completion and per-service paid amounts in reports.
2. Walk-in/call/text booking using an existing record; deactivated records should not be offered.
3. Account/record restore and explicit permanent deletion, confirming other clients remain.
4. Invitation and password-reset links on the live domain. Refresh a nested route directly (for example `/management/clients`) to confirm the hosting rewrite still works.

Existing constraints remain: historical walk-ins are not merged by name, clinic contact details are separate from login/profile settings, and list pages currently download paginated history into the browser. As the clinic's dataset grows, server-side search, filters and report aggregation will be the next performance improvement.
