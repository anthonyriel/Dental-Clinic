# Restore or permanently delete accounts

No existing accounts are deleted by installation. The earlier bulk-cleanup request is not executed.

## Install manually

1. Apply `migrations/202609270001_client_records.sql` first if you have not already applied it.
2. Run the complete `migrations/202609270002_account_deletion.sql` in the Supabase SQL Editor once.
3. Create and deploy the Supabase Edge Function **delete-account**, using `functions/delete-account/index.ts`. Keep JWT verification enabled.
4. Set the function secret **APP_URL** to your Render frontend origin, for example `https://your-clinic.onrender.com`. Optionally set **ALLOWED_ORIGINS** to `http://localhost:5173` for local testing. These may already exist from invite-client setup. Supabase's built-in URL, anonymous key and service role secrets are used on the server; do not expose the service role key in Vite.
5. Deploy the updated frontend.

## Workflow

Under **People & access → Deactivated**, choose **Restore account** to reactivate a login while retaining its history. Alternatively, select **Permanently delete**, check the selected person's name/ID, and type **DELETE**. Only an authorized admin/owner can do this; you cannot delete yourself, and admins cannot delete other admins or owners. The target must already be deactivated. Owners may manage other deactivated admins/owners.

Permanent deletion removes that login, profile, avatar files, linked client record, invitations, appointments, per-service payments and appointment events. Reports consequently lose those visits/payments. Other clients' data and clinic configuration remain. Staff references in other clients' history are cleared without deleting those clients' visits. Unlinked historic walk-ins are not guessed to belong to the account based on names or phones and remain separate.

Deleting stored photos and deleting database data use different services. Once deletion begins the account is locked against restoration/edits. If interrupted, use **Retry permanent deletion**. Already-removed photos cannot be restored. The remaining database history and Auth account are deleted together when Auth deletion succeeds. If the result is uncertain, refresh; an absent account means deletion completed.

If the user owns files outside the avatars bucket, deletion stops before starting. Reassign clinic-owned files or remove that user's files through Supabase Storage, then retry. Storage object rows must not be deleted directly with SQL: use the Storage dashboard/API to remove actual files.

Direct Auth-dashboard deletion of an existing profile is now guarded; use this workflow to authorize cleanup first. No backup copies are erased by this feature. There is no recovery action after permanent deletion.

## Verify with a test account

- Deactivate, restore and sign in again; confirm appointment history is retained.
- Deactivate a test client with a photo and completed payments, then permanently delete. Confirm the Auth user, profile, client record, visits and payments disappear, and other clients/report entries remain.
- Verify a staff account cannot call deletion, an admin cannot delete an admin/owner, and self-deletion fails.
- If an Edge Function or Storage operation fails, check the account remains inactive and retry deletion after correcting the failure.

Local tests cover permissions, restoration, database cleanup and mocked server calls. Verify actual Auth and Storage deletion in your live Supabase project using disposable test data.

References: [Auth user management](https://supabase.com/docs/guides/auth/managing-user-data), [Auth Admin deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser).
