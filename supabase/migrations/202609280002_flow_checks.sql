-- Apply after the Client Records and walk-in record deletion migrations.
-- No existing bookings are deleted or changed.
begin;
alter table public.appointments add column patient_request_id uuid unique;
create function public.book_patient_appointment(p_service_ids uuid[],p_date date,p_time_slot text,p_request_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare existing public.appointments%rowtype; booked_id text;
begin
  perform pg_advisory_xact_lock(817260902);
  if not clinic_private.active_user() then raise exception 'An active account is required.'; end if;
  if p_request_id is null then raise exception 'A booking request ID is required.'; end if;
  select * into existing from public.appointments where patient_request_id=p_request_id;
  if found then
    if existing.patient_id is distinct from auth.uid() or existing.service_ids is distinct from p_service_ids
      or existing.appointment_date is distinct from p_date or existing.time_slot is distinct from p_time_slot then
      raise exception 'This request already belongs to another booking. Check your appointment history.';
    end if;
    return existing.id::text;
  end if;
  booked_id:=public.book_appointment(p_service_ids,p_date,p_time_slot);
  update public.appointments set patient_request_id=p_request_id where id::text=booked_id;
  return booked_id;
end $$;

create function public.delete_closed_appointment(p_id text,p_version integer) returns void
language plpgsql security definer set search_path='' as $$
declare a public.appointments%rowtype;
begin
  perform pg_advisory_xact_lock(817260902);
  perform pg_advisory_xact_lock(817260901);
  if coalesce(clinic_private.role(),'') not in ('admin','owner') then raise exception 'Administrator access required.'; end if;
  select * into strict a from public.appointments where id::text=p_id for update;
  if a.version is distinct from p_version then raise exception 'This appointment changed. Refresh and try again.'; end if;
  if a.status not in ('cancelled','no_show') then raise exception 'Only cancelled or no-show appointments can be deleted here.'; end if;
  delete from public.appointment_events where appointment_id=a.id::text;
  delete from public.appointments where id=a.id;
end $$;
revoke delete on public.appointments from anon,authenticated;
revoke all on function public.book_patient_appointment(uuid[],date,text,uuid),public.delete_closed_appointment(text,integer) from public,anon;
grant execute on function public.book_patient_appointment(uuid[],date,text,uuid),public.delete_closed_appointment(text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
