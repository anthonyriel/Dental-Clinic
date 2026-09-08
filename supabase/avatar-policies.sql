-- Apply after the main migration and storage-policy inventory.
-- Existing policies for unrelated buckets remain intact. Restrictive policies ensure
-- a pre-existing broad permissive policy cannot bypass ownership checks for avatars.
begin;
create policy clinic_avatar_insert_guard on storage.objects as restrictive for insert to anon,authenticated
with check (bucket_id <> 'avatars' or (clinic_private.active_user() and left(name,37)=auth.uid()::text||'-' and name not like '%/%' and name like '%.jpg'));
create policy clinic_avatar_update_guard on storage.objects as restrictive for update to anon,authenticated
using (bucket_id <> 'avatars' or (clinic_private.active_user() and left(name,37)=auth.uid()::text||'-'))
with check (bucket_id <> 'avatars' or (clinic_private.active_user() and left(name,37)=auth.uid()::text||'-' and name not like '%/%' and name like '%.jpg'));
create policy clinic_avatar_delete_guard on storage.objects as restrictive for delete to anon,authenticated
using (bucket_id <> 'avatars' or (clinic_private.active_user() and left(name,37)=auth.uid()::text||'-'));
create policy clinic_avatar_upload on storage.objects for insert to authenticated
with check (bucket_id='avatars' and clinic_private.active_user() and left(name,37)=auth.uid()::text||'-' and name not like '%/%' and name like '%.jpg');
-- This app creates new names rather than overwriting existing objects.
update storage.buckets set file_size_limit=5242880,allowed_mime_types=array['image/jpeg'] where id='avatars';
commit;
