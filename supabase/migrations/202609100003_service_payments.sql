-- Run once AFTER 202609100002_early_completion.sql. Existing payment totals are retained.
begin;
alter table public.appointment_services add column paid_amount numeric
  check(paid_amount>=0 and paid_amount<'Infinity'::numeric and paid_amount=round(paid_amount,2));
comment on column public.appointment_services.paid_amount is 'Actual amount paid for this service at completion; NULL means no service-level payment was recorded. Never infer from a quote.';

create or replace function public.complete_appointment_services(p_id text,p_version integer,p_reason text,p_payments jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare appt public.appointments%rowtype; item jsonb; line_id uuid; amount numeric; total numeric:=0; seen uuid[]:='{}'; line_count integer;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if appt.status is null or appt.status not in ('pending','confirmed') then raise exception 'Only pending or confirmed visits can be completed.'; end if;
  if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Provide a treatment note of 1 to 1000 characters.'; end if;
  perform id from public.appointment_services where appointment_id=appt.id for update;
  select count(*) into line_count from public.appointment_services where appointment_id=appt.id;
  if line_count=0 then raise exception 'Service records are missing. Review this appointment before recording payment.'; end if;
  if p_payments is null or jsonb_typeof(p_payments)<>'array' then raise exception 'Enter an amount paid for every service.'; end if;
  if jsonb_array_length(p_payments)<>line_count then raise exception 'Enter an amount paid for every service.'; end if;
  for item in select value from jsonb_array_elements(p_payments) loop
    if jsonb_typeof(item)<>'object' or coalesce(item->>'appointment_service_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Invalid service payment record.'; end if;
    line_id:=(item->>'appointment_service_id')::uuid;
    if line_id=any(seen) or not exists(select 1 from public.appointment_services where id=line_id and appointment_id=appt.id) then raise exception 'Service payment does not match this appointment or is repeated.'; end if;
    if coalesce(item->>'paid_amount','') !~ '^[0-9]{1,10}([.][0-9]{1,2})?$' then raise exception 'Enter a non-negative amount with at most two decimal places for every service.'; end if;
    amount:=(item->>'paid_amount')::numeric;
    update public.appointment_services set paid_amount=amount where id=line_id;
    total:=total+amount; seen:=array_append(seen,line_id);
  end loop;
  update public.appointments set status='completed',price=total,notes=trim(p_reason),completed_at=now(),version=version+1 where id=appt.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note)
  values(p_id,appt.patient_id,auth.uid(),'completed',case when appt.starts_at>now() then 'Completed before scheduled visit. ' else '' end||trim(p_reason));
end $$;

-- Old deployed clients may still submit a visit total. Only a single service can be
-- allocated unambiguously; multi-service visits must use the new payment form.
create or replace function public.complete_appointment(p_id text,p_version integer,p_reason text,p_price numeric) returns void
language plpgsql security definer set search_path='' as $$
declare line_id uuid; line_count integer;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  select count(*) into line_count from public.appointment_services where appointment_id::text=p_id;
  if line_count<>1 then raise exception 'Refresh the application and enter an amount paid for each service.'; end if;
  select id into line_id from public.appointment_services where appointment_id::text=p_id;
  perform public.complete_appointment_services(p_id,p_version,p_reason,jsonb_build_array(jsonb_build_object('appointment_service_id',line_id,'paid_amount',p_price)));
end $$;
revoke all on function public.complete_appointment_services(text,integer,text,jsonb),public.complete_appointment(text,integer,text,numeric) from public,anon;
grant execute on function public.complete_appointment_services(text,integer,text,jsonb),public.complete_appointment(text,integer,text,numeric) to authenticated;
notify pgrst,'reload schema';
commit;
