-- Read-only: returns database definitions, not patient data.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('book_appointment','available_slots','book_walk_in','reschedule_appointment','change_appointment')
order by p.proname, arguments;

select c.relname as table_name, k.conname as constraint_name,
       pg_get_constraintdef(k.oid) as definition
from pg_constraint k join pg_class c on c.oid=k.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('appointments','appointment_services','booking_services','bookings')
order by c.relname,k.conname;

select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public' and table_name in ('appointments','appointment_services','booking_services','bookings')
order by table_name,ordinal_position;
