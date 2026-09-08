-- Read-only confirmation after BOTH update scripts succeed.
select table_name,column_name from information_schema.columns
where table_schema='public' and
  ((table_name='profiles' and column_name='is_active') or
   (table_name='services' and column_name in ('is_active','duration_minutes')) or
   (table_name='appointments' and column_name in ('version','service_name','quoted_price','starts_at','ends_at')))
order by table_name,column_name;
select status,count(*) from public.appointments group by status;
select cancellation_hours,booking_horizon_days,morning_start,morning_end,afternoon_start,afternoon_end from public.clinic_settings where id=1;
select n.nspname as schema_name,p.proname as function_name,p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('handle_new_user','available_slots','book_appointment','change_appointment','reschedule_appointment','save_clinic_settings','set_clinic_closure')
order by p.proname;
