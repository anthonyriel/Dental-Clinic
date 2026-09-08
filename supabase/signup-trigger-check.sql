-- Read-only: inspect the function attached to the existing signup trigger.
-- Does not read accounts, patient records or credentials from tables.
select
  n.nspname as function_schema,
  p.proname as function_name,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = p.pronamespace
where t.tgrelid = 'auth.users'::regclass
  and t.tgname = 'on_auth_user_created'
  and not t.tgisinternal;
