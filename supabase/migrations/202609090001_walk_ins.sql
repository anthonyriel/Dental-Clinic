-- Run once in Supabase SQL Editor AFTER the original functionality migration.
-- Adds walk-in visits without creating login accounts. Existing bookings are retained.
begin;
alter table public.appointments alter column patient_id drop not null;
alter table public.appointment_events alter column patient_id drop not null;
alter table public.appointments add column walk_in_name text;
alter table public.appointments add column walk_in_phone text;
alter table public.appointments add column walk_in_request_id uuid unique;
alter table public.appointments add constraint clinic_patient_identity check (
  (patient_id is not null and walk_in_name is null and walk_in_phone is null and walk_in_request_id is null)
  or (patient_id is null and walk_in_name is not null and length(trim(walk_in_name)) between 1 and 120
      and walk_in_request_id is not null and (walk_in_phone is null or walk_in_phone ~ '^09[0-9]{9}$'))
);
-- Existing RLS grants visibility to active management only when patient_id is null.
-- Do not grant direct INSERT/UPDATE access; use the checked functions below.
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
    if exists(select 1 from public.appointments a where a.status in ('pending','confirmed','cancellation_requested','completed') and (p_exclude_id is null or a.id::text<>p_exclude_id) and a.starts_at<end_utc and a.ends_at>start_utc) then continue; end if;
    appointment_date:=p_date; time_slot:=to_char(start_local,'HH12:MI AM')||' - '||to_char(end_local,'HH12:MI AM'); return next;
  end loop;
end $$;


create or replace function public.book_walk_in(p_service_id text,p_date date,p_time_slot text,p_name text,p_phone text,p_request_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare svc public.services%rowtype; appt public.appointments%rowtype; start_time timestamptz; phone text;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  if p_request_id is null then raise exception 'A request ID is required.'; end if;
  select * into appt from public.appointments where walk_in_request_id=p_request_id;
  if found then return appt.id::text; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 120 then raise exception 'Enter a patient name of 1 to 120 characters.'; end if;
  phone:=nullif(regexp_replace(coalesce(p_phone,''),'[[:space:]()-]','','g'),'');
  if phone ~ '^([+]63|63)9[0-9]{9}$' then phone:='0'||regexp_replace(phone,'^[+]?63',''); end if;
  if phone is not null and phone !~ '^09[0-9]{9}$' then raise exception 'Enter a valid Philippine mobile number or leave it blank.'; end if;
  if p_date is null or p_date<>(now() at time zone 'Asia/Manila')::date then raise exception 'Walk-ins must be registered for today (Philippine time).'; end if;
  if not exists(select 1 from public.available_walk_in_slots(p_date,p_service_id) s where s.time_slot=p_time_slot) then raise exception 'That time is no longer available. Please select another.'; end if;
  select * into strict svc from public.services where id::text=p_service_id and is_active for share;
  start_time:=clinic_private.slot_start(p_date,p_time_slot);
  insert into public.appointments(patient_id,walk_in_name,walk_in_phone,walk_in_request_id,service_id,appointment_date,time_slot,status,service_name,quoted_price,quote_is_estimate,duration_minutes,starts_at,ends_at)
  values(null,trim(p_name),phone,p_request_id,svc.id,p_date,p_time_slot,'confirmed',svc.name,svc.price,false,svc.duration_minutes,start_time,start_time+make_interval(mins=>svc.duration_minutes)) returning * into appt;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note)
  values(appt.id::text,null,auth.uid(),'walk_in_registered',p_date::text||' · '||p_time_slot);
  return appt.id::text;
end $$;
-- NULL-safe ownership checks prevent patients from acting on a walk-in's record.
create or replace function public.change_appointment(p_id text,p_action text,p_version integer,p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare appt public.appointments%rowtype; next_status text; cutoff integer; resolution text;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if not clinic_private.manager() and appt.patient_id is distinct from auth.uid() then raise exception 'Appointment not available.'; end if;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Provide a note of 1 to 1000 characters.'; end if;
  if p_action='request_cancellation' then
    if appt.patient_id is distinct from auth.uid() or appt.status not in ('pending','confirmed') then raise exception 'Cancellation cannot be requested.'; end if;
    select cancellation_hours into cutoff from public.clinic_settings where id=1;
    if appt.starts_at < now()+make_interval(hours=>cutoff) then raise exception 'The online cancellation cutoff has passed. Please call the clinic.'; end if;
    next_status:='cancellation_requested';
  else
    if not clinic_private.manager() then raise exception 'Management access required.'; end if;
    case p_action
      when 'confirmed' then if appt.status<>'pending' or appt.starts_at<=now() then raise exception 'Only future pending appointments can be confirmed.'; end if; next_status:='confirmed';
      when 'completed','no_show' then if appt.status<>'confirmed' or appt.starts_at>now() then raise exception 'Only confirmed visits that have started can be completed or marked no-show.'; end if; next_status:=p_action;
      when 'cancelled' then if appt.status not in ('pending','confirmed') then raise exception 'This appointment cannot be cancelled.'; end if; next_status:='cancelled';
      when 'approve_cancellation' then if appt.status<>'cancellation_requested' then raise exception 'No cancellation request is pending.'; end if; next_status:='cancelled'; resolution:='Approved: '||trim(p_reason);
      when 'reject_cancellation' then if appt.status<>'cancellation_requested' then raise exception 'No cancellation request is pending.'; end if; next_status:=coalesce(appt.previous_status,'confirmed'); resolution:='Rejected: '||trim(p_reason);
      else raise exception 'Invalid appointment action.';
    end case;
  end if;
  update public.appointments set status=next_status,version=version+1,
    previous_status=case when p_action='request_cancellation' then appt.status else previous_status end,
    cancellation_reason=case when p_action in ('request_cancellation','cancelled') then trim(p_reason) else cancellation_reason end,
    cancellation_resolution=case when p_action='request_cancellation' then null else coalesce(resolution,cancellation_resolution) end where id=appt.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note) values(p_id,appt.patient_id,auth.uid(),p_action,trim(p_reason));
end $$;


revoke all on function public.available_walk_in_slots(date,text,text),public.book_walk_in(text,date,text,text,text,uuid) from public,anon;
grant execute on function public.available_walk_in_slots(date,text,text),public.book_walk_in(text,date,text,text,text,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
