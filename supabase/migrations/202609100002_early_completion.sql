-- Run once AFTER 202609100001_multiple_services.sql.
-- Staff may record treatment already delivered before the scheduled visit.
begin;

create or replace function public.complete_appointment(p_id text,p_version integer,p_reason text,p_price numeric) returns void
language plpgsql security definer set search_path='' as $$
declare appt public.appointments%rowtype;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if appt.status is null or appt.status not in ('pending','confirmed') then raise exception 'Only pending or confirmed visits can be completed.'; end if;
  if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Provide a treatment note of 1 to 1000 characters.'; end if;
  if p_price is null or p_price<0 or p_price>='Infinity'::numeric then raise exception 'Enter a finite, non-negative final visit price.'; end if;
  update public.appointments set status='completed',price=p_price,notes=trim(p_reason),completed_at=now(),version=version+1 where id=appt.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note)
  values(p_id,appt.patient_id,auth.uid(),'completed',case when appt.starts_at>now() then 'Completed before scheduled visit. ' else '' end||trim(p_reason));
end $$;
revoke all on function public.complete_appointment(text,integer,text,numeric) from public,anon;
grant execute on function public.complete_appointment(text,integer,text,numeric) to authenticated;

-- Keep the original scheduled dates for history, but release a reservation fulfilled early.
-- Normal completed appointments still protect their original interval.
alter table public.appointments drop constraint clinic_no_overlap;
alter table public.appointments add constraint clinic_no_overlap exclude using gist
  (tstzrange(starts_at,ends_at,'[)') with &&)
  where (status in ('pending','confirmed','cancellation_requested') or
    (status='completed' and (completed_at is null or completed_at>=starts_at)));

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
    if exists(select 1 from public.appointments a where (a.status in ('pending','confirmed','cancellation_requested') or (a.status='completed' and (a.completed_at is null or a.completed_at>=a.starts_at))) and (p_exclude_id is null or a.id::text<>p_exclude_id) and a.starts_at<end_utc and a.ends_at>start_utc) then continue; end if;
    appointment_date:=p_date; time_slot:=to_char(start_local,'HH12:MI AM')||' - '||to_char(end_local,'HH12:MI AM'); return next;
  end loop;
end $$;

create or replace function public.available_walk_in_slots(p_date date,p_service_id text,p_exclude_id text default null)
returns table(appointment_date date,time_slot text) language plpgsql security definer set search_path = '' as $$
declare cfg public.clinic_settings%rowtype; duration integer; start_local timestamp; end_local timestamp; start_utc timestamptz; end_utc timestamptz;
begin
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  if p_exclude_id is not null and not clinic_private.manager() then raise exception 'Only management can reschedule.'; end if;
  select * into strict cfg from public.clinic_settings where id=1;
  select s.duration_minutes into duration from public.services s where s.id::text=p_service_id and s.is_active;
  if duration is null then return; end if;
  if p_date <> (now() at time zone 'Asia/Manila')::date or
     not (extract(dow from p_date)::integer=any(cfg.opening_days)) or exists(select 1 from public.clinic_closures where closure_date=p_date) then return; end if;
  for start_local in select generate_series(p_date+cfg.morning_start,p_date+cfg.afternoon_end,interval '15 minutes') loop
    end_local := start_local+make_interval(mins=>duration);
    if not ((start_local::time>=cfg.morning_start and end_local<=p_date+cfg.morning_end) or (start_local::time>=cfg.afternoon_start and end_local<=p_date+cfg.afternoon_end)) then continue; end if;
    start_utc:=start_local at time zone 'Asia/Manila'; end_utc:=end_local at time zone 'Asia/Manila';
    if start_utc <= now() then continue; end if;
    if exists(select 1 from public.appointments a where (a.status in ('pending','confirmed','cancellation_requested') or (a.status='completed' and (a.completed_at is null or a.completed_at>=a.starts_at))) and (p_exclude_id is null or a.id::text<>p_exclude_id) and a.starts_at<end_utc and a.ends_at>start_utc) then continue; end if;
    appointment_date:=p_date; time_slot:=to_char(start_local,'HH12:MI AM')||' - '||to_char(end_local,'HH12:MI AM'); return next;
  end loop;
end $$;

notify pgrst,'reload schema';
commit;
