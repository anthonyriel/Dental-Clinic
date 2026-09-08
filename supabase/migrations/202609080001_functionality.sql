-- Apply as the database owner after reviewing existing policies and a database backup.
-- Existing profiles, services and appointments are retained. ID columns may be UUID or numeric.
begin;
create schema if not exists clinic_private;
revoke all on schema clinic_private from public;
grant usage on schema clinic_private to authenticated, anon;

alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists avatar_url text;
alter table public.services add column if not exists is_active boolean not null default true;
alter table public.services add column if not exists duration_minutes integer not null default 60;
alter table public.services add constraint clinic_service_duration check (duration_minutes between 15 and 240 and duration_minutes % 15 = 0);
alter table public.services add constraint clinic_service_price check (price >= 0);
alter table public.appointments add column if not exists version integer not null default 1;
alter table public.appointments add column if not exists service_name text;
alter table public.appointments add column if not exists quoted_price numeric;
alter table public.appointments add column if not exists quote_is_estimate boolean not null default true;
alter table public.appointments add column if not exists duration_minutes integer not null default 60;
alter table public.appointments add column if not exists cancellation_reason text;
alter table public.appointments add column if not exists cancellation_resolution text;
alter table public.appointments add column if not exists previous_status text;
alter table public.appointments add column if not exists starts_at timestamptz;
alter table public.appointments add column if not exists ends_at timestamptz;

-- Existing status checks may need replacement. Fail rather than silently rewrite unknown states.
do $$ begin
  if exists (select 1 from public.appointments where lower(replace(status::text, ' ', '_')) not in ('pending','confirmed','cancelled','completed','cancellation_requested','no_show') or status is null) then
    raise exception 'Unknown appointment statuses exist. Review them before this migration.';
  end if;
end $$;
-- Review-only preflight lists old checks; remove only checks involving the status column.
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.appointments'::regclass and contype = 'c'
    and (select attnum from pg_attribute where attrelid = 'public.appointments'::regclass and attname = 'status') = any(conkey)
  loop execute format('alter table public.appointments drop constraint %I', c.conname); end loop;
end $$;
alter table public.appointments alter column status drop default;
-- status is already text in the supplied schema; avoid an unnecessary type change
-- that could invalidate dependencies such as existing views.
update public.appointments set status = lower(replace(status, ' ', '_'));
alter table public.appointments alter column status set default 'pending';
alter table public.appointments add constraint clinic_appointment_status check (status in ('pending','confirmed','cancelled','completed','cancellation_requested','no_show'));

create or replace function clinic_private.slot_start(p_date date, p_slot text) returns timestamptz
language sql immutable set search_path = '' as $$
  select (p_date + to_timestamp(split_part(p_slot, ' - ', 1), 'HH12:MI AM')::time) at time zone 'Asia/Manila';
$$;
update public.appointments a set service_name = coalesce(a.service_name,s.name), quoted_price = coalesce(a.quoted_price,s.price)
from public.services s where s.id = a.service_id;
-- Historical prices cannot be recovered from the current service catalog; these are legacy estimates.
update public.appointments set starts_at = clinic_private.slot_start(appointment_date::date,time_slot),
  ends_at = clinic_private.slot_start(appointment_date::date,time_slot) + interval '60 minutes';
update public.appointments set previous_status = 'confirmed' where status = 'cancellation_requested' and previous_status is null;
alter table public.appointments alter column starts_at set not null;
alter table public.appointments alter column ends_at set not null;
alter table public.appointments add constraint clinic_valid_interval check (ends_at > starts_at);
-- Database-level protection also covers competing writes outside the booking RPC.
-- Existing overlapping reservations must be reviewed before this constraint can be installed.
alter table public.appointments add constraint clinic_no_overlap exclude using gist
  (tstzrange(starts_at, ends_at, '[)') with &&)
  where (status in ('pending','confirmed','cancellation_requested','completed'));

create table public.clinic_settings (
  id integer primary key check (id = 1),
  cancellation_hours integer not null default 168 check (cancellation_hours between 0 and 8760),
  booking_notice_minutes integer not null default 0 check (booking_notice_minutes between 0 and 43200),
  booking_horizon_days integer not null default 180 check (booking_horizon_days between 1 and 730),
  opening_days integer[] not null default array[1,2,3,4,5,6],
  morning_start time not null default '09:00', morning_end time not null default '12:00',
  afternoon_start time not null default '13:30', afternoon_end time not null default '17:00',
  check (morning_start < morning_end and morning_end <= afternoon_start and afternoon_start < afternoon_end),
  check (opening_days <@ array[0,1,2,3,4,5,6])
);
insert into public.clinic_settings(id) values(1);
create table public.clinic_closures (closure_date date primary key, reason text not null check (length(trim(reason)) between 1 and 1000));
create table public.appointment_events (
  id bigint generated always as identity primary key, appointment_id text not null,
  patient_id uuid not null, actor_id uuid, action text not null, note text,
  created_at timestamptz not null default now()
);

create or replace function clinic_private.role() returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.profiles where id = auth.uid() and is_active;
$$;
create or replace function clinic_private.active_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_active);
$$;
create or replace function clinic_private.manager() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(clinic_private.role() in ('staff','admin','owner'), false);
$$;

-- Replace permissive policies on these app-owned tables; the app uses RPCs for appointments.
do $$ declare p record; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname = 'public' and tablename in ('profiles','services','appointments','clinic_settings','clinic_closures','appointment_events')
  loop execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename); end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.clinic_closures enable row level security;
alter table public.appointment_events enable row level security;
revoke all on public.profiles,public.services,public.appointments,public.clinic_settings,public.clinic_closures,public.appointment_events from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(username,full_name,phone,birthdate,gender,region,province,municipality,barangay,house_number,street_name,subdivision_purok,zipcode,avatar_url,role,is_active) on public.profiles to authenticated;
grant select on public.services,public.clinic_settings to anon,authenticated;
grant insert,update on public.services to authenticated;
grant select on public.appointments,public.clinic_closures,public.appointment_events to authenticated;
create policy clinic_profiles_read on public.profiles for select to authenticated using (id = auth.uid() or clinic_private.manager());
create policy clinic_profiles_update on public.profiles for update to authenticated using ((id = auth.uid() and clinic_private.active_user()) or clinic_private.role() in ('admin','owner')) with check ((id = auth.uid() and clinic_private.active_user()) or clinic_private.role() in ('admin','owner'));
create policy clinic_services_read on public.services for select to anon,authenticated using (is_active or clinic_private.active_user());
create policy clinic_services_insert on public.services for insert to authenticated with check (clinic_private.manager());
create policy clinic_services_update on public.services for update to authenticated using (clinic_private.manager()) with check (clinic_private.manager());
create policy clinic_appointments_read on public.appointments for select to authenticated using (clinic_private.active_user() and (patient_id = auth.uid() or clinic_private.manager()));
create policy clinic_settings_read on public.clinic_settings for select to anon,authenticated using (true);
create policy clinic_closures_read on public.clinic_closures for select to authenticated using (clinic_private.manager());
create policy clinic_events_read on public.appointment_events for select to authenticated using (clinic_private.active_user() and (patient_id = auth.uid() or clinic_private.manager()));

create or replace function clinic_private.guard_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare caller_role text;
begin
  -- Serialize owner changes, including concurrent attempts to remove the last owner.
  perform pg_advisory_xact_lock(817260901);
  if tg_op = 'INSERT' then
    new.role := 'client'; new.is_active := true; return new;
  end if;
  if auth.uid() is null then return new; end if;
  caller_role := clinic_private.role();
  if new.id is distinct from old.id then raise exception 'Account ID cannot be changed.'; end if;
  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if caller_role is null or caller_role not in ('admin','owner') then raise exception 'Only authorized management can change account access.'; end if;
    if old.id = auth.uid() then raise exception 'You cannot change your own role or account access.'; end if;
    if caller_role <> 'owner' and (old.role::text in ('admin','owner') or new.role::text in ('admin','owner')) then raise exception 'Only an owner can manage administrators and owners.'; end if;
    if old.role::text = 'owner' and old.is_active and (new.role::text <> 'owner' or not new.is_active) and
      not exists(select 1 from public.profiles where id <> old.id and role::text = 'owner' and is_active) then raise exception 'The last active owner must be retained.'; end if;
  elsif old.id <> auth.uid() and (caller_role is null or caller_role not in ('admin','owner') or (caller_role <> 'owner' and old.role::text in ('admin','owner'))) then
    raise exception 'You cannot edit this account.';
  end if;
  if new.role is null or new.role::text not in ('client','staff','admin','owner') then raise exception 'Invalid role.'; end if;
  return new;
end $$;
create trigger clinic_profile_guard before insert or update on public.profiles for each row execute function clinic_private.guard_profile();

-- Preserve the existing on_auth_user_created trigger and function signature.
-- Only signup role handling changes: metadata cannot grant management access.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (
    id,username,full_name,role,phone,birthdate,gender,region,province,municipality,
    barangay,house_number,street_name,subdivision_purok,zipcode,country
  ) values (
    new.id,new.raw_user_meta_data->>'username',new.raw_user_meta_data->>'full_name',
    'client',new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'birthdate','')::date,new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'region',new.raw_user_meta_data->>'province',
    new.raw_user_meta_data->>'municipality',new.raw_user_meta_data->>'barangay',
    new.raw_user_meta_data->>'house_number',new.raw_user_meta_data->>'street_name',
    new.raw_user_meta_data->>'subdivision_purok',new.raw_user_meta_data->>'zipcode','Philippines'
  );
  return new;
end;
$$;

create or replace function public.available_slots(p_date date,p_service_id text,p_exclude_id text default null)
returns table(appointment_date date,time_slot text) language plpgsql security definer set search_path = '' as $$
declare cfg public.clinic_settings%rowtype; duration integer; start_local timestamp; end_local timestamp; start_utc timestamptz; end_utc timestamptz;
begin
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  if p_exclude_id is not null and not clinic_private.manager() then raise exception 'Only management can reschedule.'; end if;
  select * into strict cfg from public.clinic_settings where id=1;
  select s.duration_minutes into duration from public.services s where s.id::text=p_service_id and s.is_active;
  if duration is null then return; end if;
  if p_date < (now() at time zone 'Asia/Manila')::date or p_date > (now() at time zone 'Asia/Manila')::date+cfg.booking_horizon_days or
     not (extract(dow from p_date)::integer=any(cfg.opening_days)) or exists(select 1 from public.clinic_closures where closure_date=p_date) then return; end if;
  for start_local in select generate_series(p_date+cfg.morning_start,p_date+cfg.afternoon_end,interval '15 minutes') loop
    end_local := start_local+make_interval(mins=>duration);
    if not ((start_local::time>=cfg.morning_start and end_local<=p_date+cfg.morning_end) or (start_local::time>=cfg.afternoon_start and end_local<=p_date+cfg.afternoon_end)) then continue; end if;
    start_utc:=start_local at time zone 'Asia/Manila'; end_utc:=end_local at time zone 'Asia/Manila';
    if start_utc <= now()+make_interval(mins=>cfg.booking_notice_minutes) then continue; end if;
    if exists(select 1 from public.appointments a where a.status in ('pending','confirmed','cancellation_requested','completed') and (p_exclude_id is null or a.id::text<>p_exclude_id) and a.starts_at<end_utc and a.ends_at>start_utc) then continue; end if;
    appointment_date:=p_date; time_slot:=to_char(start_local,'HH12:MI AM')||' - '||to_char(end_local,'HH12:MI AM'); return next;
  end loop;
end $$;

create or replace function public.book_appointment(p_service_id text,p_date date,p_time_slot text) returns text
language plpgsql security definer set search_path = '' as $$
declare svc public.services%rowtype; appt public.appointments%rowtype; start_time timestamptz;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  if not exists(select 1 from public.available_slots(p_date,p_service_id) s where s.time_slot=p_time_slot) then raise exception 'That time is no longer available. Please select another.'; end if;
  select * into strict svc from public.services where id::text=p_service_id and is_active for share;
  start_time:=clinic_private.slot_start(p_date,p_time_slot);
  insert into public.appointments(patient_id,service_id,appointment_date,time_slot,status,service_name,quoted_price,quote_is_estimate,duration_minutes,starts_at,ends_at)
  values(auth.uid(),svc.id,p_date,p_time_slot,'pending',svc.name,svc.price,false,svc.duration_minutes,start_time,start_time+make_interval(mins=>svc.duration_minutes)) returning * into appt;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note) values(appt.id::text,appt.patient_id,auth.uid(),'requested',p_date::text||' · '||p_time_slot);
  return appt.id::text;
end $$;

create or replace function public.change_appointment(p_id text,p_action text,p_version integer,p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare appt public.appointments%rowtype; next_status text; cutoff integer; resolution text;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if not clinic_private.manager() and appt.patient_id<>auth.uid() then raise exception 'Appointment not available.'; end if;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Provide a note of 1 to 1000 characters.'; end if;
  if p_action='request_cancellation' then
    if appt.patient_id<>auth.uid() or appt.status not in ('pending','confirmed') then raise exception 'Cancellation cannot be requested.'; end if;
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

create or replace function public.reschedule_appointment(p_id text,p_version integer,p_reason text,p_date date,p_time_slot text) returns void
language plpgsql security definer set search_path = '' as $$
declare appt public.appointments%rowtype; duration integer; start_time timestamptz;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  select * into strict appt from public.appointments where id::text=p_id for update;
  if p_version is null or appt.version<>p_version then raise exception 'This appointment changed. Refresh before trying again.'; end if;
  if appt.status not in ('pending','confirmed') or p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Select an active appointment and provide a reason.'; end if;
  if not exists(select 1 from public.available_slots(p_date,appt.service_id::text,p_id) s where s.time_slot=p_time_slot) then raise exception 'That time is no longer available.'; end if;
  select duration_minutes into strict duration from public.services where id=appt.service_id for share;
  start_time:=clinic_private.slot_start(p_date,p_time_slot);
  update public.appointments set appointment_date=p_date,time_slot=p_time_slot,starts_at=start_time,ends_at=start_time+make_interval(mins=>duration),duration_minutes=duration,version=version+1 where id=appt.id;
  insert into public.appointment_events(appointment_id,patient_id,actor_id,action,note) values(p_id,appt.patient_id,auth.uid(),'rescheduled',appt.appointment_date::text||' '||appt.time_slot||' → '||p_date::text||' '||p_time_slot||'. '||trim(p_reason));
end $$;

create or replace function public.save_clinic_settings(p_settings jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  update public.clinic_settings set cancellation_hours=(p_settings->>'cancellation_hours')::integer,
    booking_notice_minutes=(p_settings->>'booking_notice_minutes')::integer,booking_horizon_days=(p_settings->>'booking_horizon_days')::integer,
    opening_days=array(select jsonb_array_elements_text(p_settings->'opening_days')::integer),
    morning_start=(p_settings->>'morning_start')::time,morning_end=(p_settings->>'morning_end')::time,
    afternoon_start=(p_settings->>'afternoon_start')::time,afternoon_end=(p_settings->>'afternoon_end')::time where id=1;
  -- Existing bookings are retained; management must arrange changes with those patients.
end $$;
create or replace function public.set_clinic_closure(p_date date,p_reason text,p_closed boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.manager() then raise exception 'Management access required.'; end if;
  if p_closed then
    if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'Provide a closure reason.'; end if;
    if exists(select 1 from public.appointments where appointment_date::date=p_date and status in ('pending','confirmed','cancellation_requested')) then raise exception 'Reschedule or cancel existing appointments before closing this date.'; end if;
    insert into public.clinic_closures values(p_date,trim(p_reason)) on conflict(closure_date) do update set reason=excluded.reason;
  else delete from public.clinic_closures where closure_date=p_date; end if;
end $$;

-- No API role can call internal trigger routines. Only checked entry points are public.
revoke execute on all functions in schema clinic_private from public,anon,authenticated;
grant execute on function clinic_private.role(),clinic_private.active_user(),clinic_private.manager() to authenticated,anon;
revoke execute on function public.available_slots(date,text,text),public.book_appointment(text,date,text),public.change_appointment(text,text,integer,text),public.reschedule_appointment(text,integer,text,date,text),public.save_clinic_settings(jsonb),public.set_clinic_closure(date,text,boolean) from public,anon;
grant execute on function public.available_slots(date,text,text),public.book_appointment(text,date,text),public.change_appointment(text,text,integer,text),public.reschedule_appointment(text,integer,text,date,text),public.save_clinic_settings(jsonb),public.set_clinic_closure(date,text,boolean) to authenticated;
notify pgrst, 'reload schema';
commit;
