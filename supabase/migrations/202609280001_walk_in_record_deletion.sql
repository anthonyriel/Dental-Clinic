-- Run after 202609270001_client_records.sql. No existing data is deleted.
begin;
alter table public.client_records add column is_active boolean not null default true;

create function public.set_client_record_active(p_id uuid,p_version integer,p_active boolean) returns void
language plpgsql security definer set search_path='' as $$
declare c public.client_records%rowtype;
begin
  perform pg_advisory_xact_lock(817260901);
  perform pg_advisory_xact_lock(817260927);
  if coalesce(clinic_private.role(),'') not in ('admin','owner') then raise exception 'Administrator access required.'; end if;
  select * into strict c from public.client_records where id=p_id for update;
  if c.profile_id is not null then raise exception 'Manage linked accounts in People & access.'; end if;
  if c.version is distinct from p_version then raise exception 'This record changed. Refresh and try again.'; end if;
  if p_active is null then raise exception 'Choose an account status.'; end if;
  update public.client_records set is_active=p_active,version=version+1 where id=p_id;
  if not p_active then delete from clinic_private.client_invitations where client_id=p_id; end if;
end $$;

create function public.delete_client_record(p_id uuid,p_version integer,p_confirmation text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.client_records%rowtype;
begin
  perform pg_advisory_xact_lock(817260902);
  perform pg_advisory_xact_lock(817260901);
  perform pg_advisory_xact_lock(817260927);
  if coalesce(clinic_private.role(),'') not in ('admin','owner') then raise exception 'Administrator access required.'; end if;
  if p_confirmation is distinct from 'DELETE' then raise exception 'Type DELETE to confirm permanent deletion.'; end if;
  select * into strict c from public.client_records where id=p_id for update;
  if c.profile_id is not null then raise exception 'Manage linked accounts in People & access.'; end if;
  if c.is_active then raise exception 'Deactivate this client record first.'; end if;
  if c.version is distinct from p_version then raise exception 'This record changed. Refresh and try again.'; end if;
  -- Refuse inconsistent identity links instead of deleting a registered patient's visit.
  if exists(select 1 from public.appointments where client_record_id=p_id and patient_id is not null) then
    raise exception 'This record has a linked patient appointment. Review the identity link before deleting.';
  end if;
  delete from public.appointment_events e using public.appointments a where e.appointment_id=a.id::text and a.client_record_id=p_id;
  delete from public.appointments where client_record_id=p_id;
  -- appointment_services/payments and invitation claims cascade from their parents.
  delete from public.client_records where id=p_id;
end $$;

-- Existing RPCs are retained; enforce inactive-record checks at the write boundary.
create function clinic_private.check_client_record_booking() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.client_records where id=new.client_record_id and is_active for share;
  if not found then raise exception 'This client record is deactivated. Restore it before booking.'; end if;
  return new;
end $$;
-- Alphabetical order runs after clinic_attach_client populates client_record_id.
create trigger clinic_check_client_active before insert on public.appointments for each row execute function clinic_private.check_client_record_booking();

create function clinic_private.check_client_record_invitation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.client_records where id=new.client_id and is_active for share;
  if not found then raise exception 'Restore this client record before sending an invitation.'; end if;
  return new;
end $$;
create trigger clinic_check_invitation_active before insert or update on clinic_private.client_invitations for each row execute function clinic_private.check_client_record_invitation();

revoke all on function public.set_client_record_active(uuid,integer,boolean),public.delete_client_record(uuid,integer,text),clinic_private.check_client_record_booking(),clinic_private.check_client_record_invitation() from public,anon,authenticated;
grant execute on function public.set_client_record_active(uuid,integer,boolean),public.delete_client_record(uuid,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
