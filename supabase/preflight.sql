-- Read-only inventory. Run in Supabase SQL Editor before applying the migration.
select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns
where table_schema='public' and table_name in ('profiles','services','appointments') order by table_name,ordinal_position;
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','storage');
select n.nspname as schema_name,c.relname as table_name,t.tgname,pg_get_triggerdef(t.oid) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and ((n.nspname='auth' and c.relname='users') or (n.nspname='public' and c.relname in ('profiles','services','appointments')));
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid in ('public.profiles'::regclass,'public.services'::regclass,'public.appointments'::regclass);
select status,count(*) from public.appointments group by status;
-- No names, phone numbers, emails or individual appointment data are selected.
