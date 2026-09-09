-- Run this entire file in Supabase SQL Editor after the functionality and walk-in migrations.
-- Retains existing appointments and clinic_no_overlap. Does not split historical totals.
begin;

alter table public.appointments add column if not exists service_ids uuid[];
alter table public.appointments add column if not exists price numeric;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists completed_at timestamptz;
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  position integer not null check(position > 0),
  service_name text not null,
  duration_minutes integer not null check(duration_minutes > 0),
  quoted_price numeric,
  quote_is_estimate boolean not null default false,
  created_at timestamptz not null default now(),
  unique(appointment_id,position)
);
comment on table public.appointment_services is 'Service snapshots per visit. Status and visit date belong to appointments. Quoted prices are not payments.';
alter table public.appointment_services enable row level security;
revoke all on public.appointment_services from anon,authenticated;
grant select on public.appointment_services to authenticated;
create policy appointment_service_visibility on public.appointment_services for select to authenticated
using (exists(select 1 from public.appointments a where a.id=appointment_id));

-- Only known single-service history can be reconstructed without inventing allocations.
insert into public.appointment_services(appointment_id,service_id,position,service_name,duration_minutes,quoted_price,quote_is_estimate,created_at)
select a.id,a.service_id,1,coalesce(a.service_name,s.name,'Dental service'),a.duration_minutes,a.quoted_price,a.quote_is_estimate,a.created_at
from public.appointments a left join public.services s on s.id=a.service_id
where coalesce(cardinality(a.service_ids),0)<=1;

-- Existing single-service walk-in/legacy writers also get a historical service record.
create or replace function clinic_private.snapshot_single_service() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.service_ids is null then
    insert into public.appointment_services(appointment_id,service_id,position,service_name,duration_minutes,quoted_price,quote_is_estimate)
    values(new.id,new.service_id,1,coalesce(new.service_name,'Dental service'),new.duration_minutes,new.quoted_price,new.quote_is_estimate);
  end if;
  return new;
end $$;
create trigger snapshot_single_service after insert on public.appointments
for each row execute function clinic_private.snapshot_single_service();
revoke all on function clinic_private.snapshot_single_service() from public,anon,authenticated;

-- Shared interval checks: contiguous treatment, configured opening hours, closures and notice.
-- Private helper accepts a duration; public functions derive it from trusted database records.
create or replace function clinic_private.available_duration_slots(p_date date,p_duration integer,p_exclude_id text)
returns table(appointment_date date,time_slot text) language plpgsql security definer set search_path='' as $$
declare cfg public.clinic_settings%rowtype; start_local timestamp; end_local timestamp; start_utc timestamptz; end_utc timestamptz;
begin
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  if p_exclude_id is not null and not clinic_private.manager() then raise exception 'Only management can reschedule.'; end if;
  select * into strict cfg from public.clinic_settings where id=1;
  if p_date is null or p_duration is null or p_duration<=0 then return; end if;
  if p_date < (now() at time zone 'Asia/Manila')::date or p_date > (now() at time zone 'Asia/Manila')::date+cfg.booking_horizon_days or
     not (extract(dow from p_date)::integer=any(cfg.opening_days)) or exists(select 1 from public.clinic_closures where closure_date=p_date) then return; end if;
  for start_local in select generate_series(p_date+cfg.morning_start,p_date+cfg.afternoon_end,interval '15 minutes') loop
    end_local:=start_local+make_interval(mins=>p_duration);
    if not ((start_local::time>=cfg.morning_start and end_local<=p_date+cfg.morning_end) or (start_local::time>=cfg.afternoon_start and end_local<=p_date+cfg.afternoon_end)) then continue; end if;
    start_utc:=start_local at time zone 'Asia/Manila'; end_utc:=end_local at time zone 'Asia/Manila';
    if start_utc<=now()+make_interval(mins=>cfg.booking_notice_minutes) then continue; end if;
    if exists(select 1 from public.appointments a where a.status in ('pending','confirmed','cancellation_requested','completed') and (p_exclude_id is null or a.id::text<>p_exclude_id) and a.starts_at<end_utc and a.ends_at>start_utc) then continue; end if;
    appointment_date:=p_date; time_slot:=to_char(start_local,'HH12:MI AM')||' - '||to_char(end_local,'HH12:MI AM'); return next;
  end loop;
end $$;
revoke all on function clinic_private.available_duration_slots(date,integer,text) from public,anon,authenticated;

create or replace function public.available_service_slots(p_date date,p_service_ids uuid[],p_exclude_id text default null)
returns table(appointment_date date,time_slot text) language plpgsql security definer set search_path='' as $$
declare duration integer; selected_count integer;
begin
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  if p_exclude_id is not null then
    if not clinic_private.manager() then raise exception 'Only management can reschedule.'; end if;
    select a.duration_minutes into duration from public.appointments a where a.id::text=p_exclude_id and a.status in ('pending','confirmed');
    if not found then return; end if;
  else
    if coalesce(cardinality(p_service_ids),0)=0 or array_position(p_service_ids,null) is not null then raise exception 'Select at least one valid service.'; end if;
    select count(*),sum(s.duration_minutes) into selected_count,duration from public.services s where s.id=any(p_service_ids) and s.is_active;
    if selected_count<>cardinality(p_service_ids) then raise exception 'A selected service is unavailable or repeated. Refresh your services.'; end if;
  end if;
  return query select * from clinic_private.available_duration_slots(p_date,duration,p_exclude_id);
end $$;

-- Retain the old API for single-service screens and old deployed clients.
create or replace function public.available_slots(p_date date,p_service_id text,p_exclude_id text default null)
returns table(appointment_date date,time_slot text) language sql security definer set search_path='' as $$
  select * from public.available_service_slots(p_date,array[p_service_id::uuid],p_exclude_id);
$$;

-- Supplied live version returns void, so DROP is needed before changing its return type.
drop function if exists public.book_appointment(uuid[],date,text);
create function public.book_appointment(p_service_ids uuid[],p_date date,p_time_slot text) returns text
language plpgsql security definer set search_path='' as $$
declare appt public.appointments%rowtype; start_time timestamptz; duration integer; total numeric; names text;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  -- Lock catalog rows before validating so duration/price cannot change mid-booking.
  perform s.id from public.services s where s.id=any(p_service_ids) order by s.id for share;
  if not exists(select 1 from public.available_service_slots(p_date,p_service_ids) s where s.time_slot=p_time_slot) then raise exception 'That time is no longer available for all selected services. Please select another.'; end if;
  select sum(s.duration_minutes),case when count(s.price)=count(*) then sum(s.price) else null end,string_agg(s.name,' + ' order by x.position)
  into duration,total,names from unnest(p_service_ids) with ordinality x(id,position) join public.services s on s.id=x.id;
  start_time:=clinic_private.slot_start(p_date,p_time_slot);
  insert into public.appointments(patient_id,service_id,service_ids,appointment_date,time_slot,status,service_name,quoted_price,quote_is_estimate,duration_minutes,starts_at,ends_at)
  values(auth.uid(),case when cardinality(p_service_ids)=1 then p_service_ids[1] else null end,p_service_ids,p_date,p_time_slot,'pending',names,total,total is null,duration,start_time,start_time+make_interval(mins=>duration)) returning * into appt;
  insert into public.appointment_services(appointment_id,service_id,position,service_name,duration_minutes,quoted_price,quote_is_estimate)
  select appt.id,s.id,x.position::integer,s.name,s.duration_minutes,s.price,s.price is null
  from unnest(p_service_ids) with ordinality x(id,position) join public.services s on s.id=x.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note)
  values(appt.id::text,appt.patient_id,auth.uid(),'requested',p_date::text||' · '||p_time_slot);
  return appt.id::text;
end $$;

create or replace function public.book_appointment(p_service_id text,p_date date,p_time_slot text) returns text
language sql security definer set search_path='' as $$
  select public.book_appointment(array[p_service_id::uuid],p_date,p_time_slot);
$$;

create or replace function public.reschedule_appointment(p_id text,p_version integer,p_reason text,p_date date,p_time_slot text) returns void
language plpgsql security definer set search_path='' as $$
declare appt public.appointments%rowtype; start_time timestamptz;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if appt.status not in ('pending','confirmed') or p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Select an active appointment and provide a reason.'; end if;
  if not exists(select 1 from public.available_service_slots(p_date,null,p_id) s where s.time_slot=p_time_slot) then raise exception 'That time is no longer available.'; end if;
  start_time:=clinic_private.slot_start(p_date,p_time_slot);
  update public.appointments set appointment_date=p_date,time_slot=p_time_slot,starts_at=start_time,ends_at=start_time+make_interval(mins=>appt.duration_minutes),version=version+1 where id=appt.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note)
  values(p_id,appt.patient_id,auth.uid(),'rescheduled',appt.appointment_date::text||' '||appt.time_slot||' → '||p_date::text||' '||p_time_slot||'. '||trim(p_reason));
end $$;

-- Preserve the manually added final visit price while enforcing status/version checks.
create or replace function public.complete_appointment(p_id text,p_version integer,p_reason text,p_price numeric) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  if p_price is null or p_price<0 or p_price>='Infinity'::numeric then raise exception 'Enter a finite, non-negative final visit price.'; end if;
  perform public.change_appointment(p_id,'completed',p_version,p_reason);
  update public.appointments set price=p_price,notes=trim(p_reason),completed_at=now() where id::text=p_id;
end $$;
revoke all on function public.complete_appointment(text,integer,text,numeric) from public,anon;
grant execute on function public.complete_appointment(text,integer,text,numeric) to authenticated;

revoke all on function public.available_service_slots(date,uuid[],text),public.book_appointment(uuid[],date,text) from public,anon;
grant execute on function public.available_service_slots(date,uuid[],text),public.book_appointment(uuid[],date,text) to authenticated;
notify pgrst,'reload schema';
commit;
