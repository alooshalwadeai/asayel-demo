-- دور التطبيق tenant_app لا يملك الوصول لمخطط auth (لا يمكن منحه من postgres)، فتُقرأ هوية المستخدم عبر دالة وسيطة بملكية postgres.
create or replace function private.auth_uid() returns uuid language sql stable security definer set search_path to '' as $$ select auth.uid() $$;
revoke all on function private.auth_uid() from public;
grant execute on function private.auth_uid() to tenant_app, authenticated, anon;
do $$ declare r record; d text; begin
  for r in select p.oid from pg_proc p join pg_roles o on o.oid = p.proowner where o.rolname = 'tenant_app' and p.prosrc ~ 'auth\.uid\(\)'
  loop d := replace(pg_get_functiondef(r.oid), 'auth.uid()', 'private.auth_uid()'); execute d; end loop;
end $$;
alter table public.messages alter column sender set default private.auth_uid();
alter table public.reads alter column user_id set default private.auth_uid();
alter table public.cvs alter column created_by set default private.auth_uid();
alter table public.agent_entries_history alter column changed_by set default private.auth_uid();
