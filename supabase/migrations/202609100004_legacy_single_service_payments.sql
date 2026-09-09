-- Run after 202609100003_service_payments.sql. Safe to rerun.
-- Copy an existing actual visit payment only when its service allocation is unambiguous.
-- Never copy a quote, overwrite an existing service payment, or split a multi-service total.
begin;
select pg_advisory_xact_lock(817260902);
update public.appointment_services s
set paid_amount=a.price
from public.appointments a
where s.appointment_id=a.id
  and a.status='completed'
  and a.price is not null and a.price>=0 and a.price<'Infinity'::numeric
  and a.price=round(a.price,2)
  and s.paid_amount is null
  and a.service_id is not null and s.service_id=a.service_id
  and (a.service_ids is null or a.service_ids=array[a.service_id])
  and (select count(*) from public.appointment_services line where line.appointment_id=a.id)=1
returning s.appointment_id,s.service_name,s.paid_amount;
commit;
