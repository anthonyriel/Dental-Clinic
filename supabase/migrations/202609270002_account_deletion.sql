-- Apply after 202609270001_client_records.sql. Enables explicit per-account deletion.
-- Running this migration DOES NOT deactivate or delete any existing account.
begin;
alter table public.profiles add column deletion_pending boolean not null default false;
create table clinic_private.account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
revoke all on clinic_private.account_deletions from public,anon,authenticated;

create function clinic_private.guard_pending_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if old.deletion_pending then raise exception 'Permanent deletion has started. Retry deletion; this account cannot be restored or edited.'; end if;
  if new.deletion_pending and not exists(select 1 from clinic_private.account_deletions where user_id=old.id) then
    raise exception 'Use the authorized account deletion action.';
  end if;
  return new;
end $$;
create trigger clinic_pending_deletion before update on public.profiles for each row execute function clinic_private.guard_pending_deletion();
revoke all on function clinic_private.guard_pending_deletion() from public,anon,authenticated;

create function public.prepare_account_deletion(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target public.profiles%rowtype; caller_role text; files jsonb;
begin
  perform pg_advisory_xact_lock(817260901);
  caller_role:=clinic_private.role();
  if caller_role is null or caller_role not in ('admin','owner') then raise exception 'Administrator access required.'; end if;
  if p_user_id=auth.uid() then raise exception 'You cannot delete your own account.'; end if;
  select * into target from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Account no longer exists. Refresh the list.'; end if;
  if target.is_active then raise exception 'Deactivate this account before permanently deleting it.'; end if;
  if caller_role<>'owner' and target.role in ('admin','owner') then raise exception 'Only an owner can manage administrators and owners.'; end if;
  if exists(select 1 from storage.objects o where coalesce(to_jsonb(o)->>'owner_id',to_jsonb(o)->>'owner')=p_user_id::text and bucket_id<>'avatars') then
    raise exception 'This account owns other clinic files. Reassign or remove those files in Supabase Storage before deleting the account.';
  end if;
  select coalesce(jsonb_agg(name),'[]'::jsonb) into files from storage.objects o
    where bucket_id='avatars' and (coalesce(to_jsonb(o)->>'owner_id',to_jsonb(o)->>'owner')=p_user_id::text or left(name,37)=p_user_id::text||'-');
  insert into clinic_private.account_deletions(user_id) values(p_user_id) on conflict do nothing;
  if not target.deletion_pending then update public.profiles set deletion_pending=true where id=p_user_id; end if;
  return jsonb_build_object('avatar_paths',files);
end $$;
revoke all on function public.prepare_account_deletion(uuid) from public,anon;
grant execute on function public.prepare_account_deletion(uuid) to authenticated;

-- Auth Admin API deletes the login; this trigger removes its linked clinic data
-- in that same transaction. A failed Auth deletion rolls back all database cleanup.
create function clinic_private.delete_account_history() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(817260902);
  perform pg_advisory_xact_lock(817260901);
  if not exists(select 1 from public.profiles where id=old.id) then return old; end if;
  if not exists(select 1 from clinic_private.account_deletions where user_id=old.id)
    or not exists(select 1 from public.profiles where id=old.id and not is_active and deletion_pending) then
    raise exception 'Deactivate this account and use the permanent deletion action first.';
  end if;
  if exists(select 1 from storage.objects o where coalesce(to_jsonb(o)->>'owner_id',to_jsonb(o)->>'owner')=old.id::text
    or (bucket_id='avatars' and left(name,37)=old.id::text||'-')) then
    raise exception 'Remove this account avatar files through the Storage API before deleting it.';
  end if;
  delete from public.appointment_events e where e.patient_id=old.id or exists(
    select 1 from public.appointments a where a.id::text=e.appointment_id and
      (a.patient_id=old.id or a.client_record_id in (select id from public.client_records where profile_id=old.id)));
  delete from public.appointments where patient_id=old.id or client_record_id in (select id from public.client_records where profile_id=old.id);
  delete from public.client_records where profile_id=old.id;
  -- Other people's history remains intact, without a dangling staff identifier.
  update public.appointment_events set actor_id=null where actor_id=old.id;
  update public.client_records set created_by=null where created_by=old.id;
  return old;
end $$;
create trigger clinic_delete_account_history before delete on auth.users for each row execute function clinic_private.delete_account_history();
revoke all on function clinic_private.delete_account_history() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
