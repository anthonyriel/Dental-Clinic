# Walk-in records: deactivate, restore or delete

Walk-ins and phone/text clients without logins have Client Records, not profiles in People & access.

## Manual installation

Run `migrations/202609280001_walk_in_record_deletion.sql` once in the Supabase SQL Editor, after the earlier Client Records migration. Deploy the updated frontend. This migration does not delete any existing data. No new Edge Function or secrets are required for this feature.

## Use

As an admin or owner, open **Client records**, find the walk-in, and select the record:

1. **Deactivate record** retains history and existing appointments, but blocks new bookings and invitations. Existing visits still reserve their times; manage their status in Appointments when necessary.
2. Use the **Deactivated** filter to find it again, then **Restore record** to reuse it.
3. To erase it, choose **Permanently delete**, review its name, ID and history, then type **DELETE**. Its appointments, service/payment lines, appointment events and pending invitations are removed in one transaction. Reports change accordingly.

Staff can continue booking and viewing records; deactivation/restoration/deletion requires admin or owner access. Linked accounts must use **People & access**, including the existing account-deletion workflow. You cannot use this record-only action to bypass account protections.

Historical walk-in visits were imported as separate records. Identical names do not prove identity: review each matching record rather than assuming one deletion removes every visit with that name. This feature deletes exactly the selected record's history. Service catalog entries and other clients remain.

If a result is uncertain, refresh the client list before retrying. A missing record means deletion completed. Deactivation can be restored; permanent deletion cannot.
