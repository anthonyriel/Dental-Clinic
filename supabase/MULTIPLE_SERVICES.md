# Applying the multi-service fix

Run **all of `migrations/202609100001_multiple_services.sql`** in the SQL Editor of the existing Supabase project, once. It follows the functionality and walk-in migrations you already applied. Do not rerun those older files. Deploy the updated frontend after this SQL succeeds; the new frontend requires the new table and availability function.

This file replaces the supplied `book_appointment(uuid[], date, text)` function, which inserted overlapping appointments for one patient. It keeps the existing overlap constraint and all existing appointments. It does not require another database or changes to `.env`.

Each new multi-service booking creates:

- One `appointments` row for the patient's whole visit, status, date and reserved interval.
- One `appointment_services` row per selected service, with a stable service ID reference, selection order, name, quoted price and duration snapshots.
- One booking event. Cancelling, confirming or rescheduling applies to the entire visit.

Availability checks the total duration against other reservations, configured hours, lunch breaks, closures, notice and booking horizon. Treatments must fit into one continuous morning or afternoon opening period. The server calculates the end time; the browser displays it without extending it locally.

Existing single-service appointments are copied into the service table using their stored snapshots. Single-service walk-ins continue working and receive a service record too. Historical rows already containing several `service_ids` are left intact without guessing each service's old price or duration; those rows need manual review before service-level historical reports. This migration does not reconstruct data that was never recorded.

For future reports, join `appointment_services.appointment_id` to `appointments.id`. Count visits from `appointments`, and treatments from `appointment_services`. Filter completed visits when reporting completed treatments. `quoted_price` is a quote, not a payment.

Run `migrations/202609100003_service_payments.sql` after the early-completion migration, then deploy the updated frontend. Completion requires one explicit paid amount per service (including 0 for no charge), stored in `appointment_services.paid_amount`. Supabase calculates `appointments.price` from those amounts and saves the amounts, completed status, timestamp and event together. Each amount supports up to two decimal places. Quoted prices remain unchanged, and future appointments can still be completed early.

Previously completed visits keep their total but have NULL service-level amounts, displayed as “Paid amount not recorded.” Do not treat NULL as zero or allocate the old total using quoted prices. For service revenue, sum recorded `paid_amount` values and separately identify historical visits whose breakdown is missing. This feature records amounts paid at completion; it is not an installment, refund or partial-treatment workflow.

For older completed single-service visits, run `migrations/202609100004_legacy_single_service_payments.sql`. It copies the existing actual visit total into an empty service payment only when exactly one service record matches the appointment's service ID and there is no multi-service selection. Existing service payments, quotes, non-completed appointments and ambiguous multi-service totals are left unchanged. The query returns the service payments it filled and is safe to rerun.

Completion saves the final visit price through `complete_appointment`, which checks management access, status and version and records the completion event and timestamp.

For early treatment, run `migrations/202609100002_early_completion.sql` after the multi-service migration. Staff can then complete pending or confirmed visits before the scheduled date once all services have actually been delivered. The original scheduled date and service quotes remain unchanged; `completed_at` records when staff marked treatment complete. The original future slot is released in both online and walk-in availability. This records a completed treatment, not a new reservation for today's chair time; staff must coordinate actual treatment availability. Cancellation requests must be resolved before completion, and future visits still cannot be marked no-show.

## Manual verification after applying

1. Select a 30-minute and a 60-minute service. The calendar and times should show a 90-minute visit, with no slot spanning the lunch break.
2. Book it once. Confirm there is one new appointment and two related service records, each with its own quoted price and duration.
3. Check that another booking cannot overlap any part of that visit, including its last service. A rejected attempt should create no rows.
4. In management, reschedule the visit. Its 90-minute duration and both service records should remain unchanged.
5. Check that a different patient cannot see the visit or its service records. Test an ordinary single-service booking and a walk-in too.

Local database tests cover these rules, including invalid selections, private records, catalog changes, unknown prices and stale rescheduling. They do not substitute for checking your deployed application against the live project.
