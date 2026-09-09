# Applying the multi-service fix

Run **all of `migrations/202609100001_multiple_services.sql`** in the SQL Editor of the existing Supabase project, once. It follows the functionality and walk-in migrations you already applied. Do not rerun those older files. Deploy the updated frontend after this SQL succeeds; the new frontend requires the new table and availability function.

This file replaces the supplied `book_appointment(uuid[], date, text)` function, which inserted overlapping appointments for one patient. It keeps the existing overlap constraint and all existing appointments. It does not require another database or changes to `.env`.

Each new multi-service booking creates:

- One `appointments` row for the patient's whole visit, status, date and reserved interval.
- One `appointment_services` row per selected service, with a stable service ID reference, selection order, name, quoted price and duration snapshots.
- One booking event. Cancelling, confirming or rescheduling applies to the entire visit.

Availability checks the total duration against other reservations, configured hours, lunch breaks, closures, notice and booking horizon. Treatments must fit into one continuous morning or afternoon opening period. The server calculates the end time; the browser displays it without extending it locally.

Existing single-service appointments are copied into the service table using their stored snapshots. Single-service walk-ins continue working and receive a service record too. Historical rows already containing several `service_ids` are left intact without guessing each service's old price or duration; those rows need manual review before service-level historical reports. This migration does not reconstruct data that was never recorded.

For future reports, join `appointment_services.appointment_id` to `appointments.id`. Count visits from `appointments`, and treatments from `appointment_services`. Filter completed visits when reporting completed treatments. Line prices are **quotes**, not proof of payment. The existing management screen records a total for the visit; this change does not allocate that actual total among services. Service-level payments or independently completing individual treatments will need a separate feature.

Completion now saves the final visit price through `complete_appointment`, which checks management access, status and version and records the completion event and timestamp. Confirmed visits can be completed only after their scheduled start, matching the existing database rule.

## Manual verification after applying

1. Select a 30-minute and a 60-minute service. The calendar and times should show a 90-minute visit, with no slot spanning the lunch break.
2. Book it once. Confirm there is one new appointment and two related service records, each with its own quoted price and duration.
3. Check that another booking cannot overlap any part of that visit, including its last service. A rejected attempt should create no rows.
4. In management, reschedule the visit. Its 90-minute duration and both service records should remain unchanged.
5. Check that a different patient cannot see the visit or its service records. Test an ordinary single-service booking and a walk-in too.

Local database tests cover these rules, including invalid selections, private records, catalog changes, unknown prices and stale rescheduling. They do not substitute for checking your deployed application against the live project.
