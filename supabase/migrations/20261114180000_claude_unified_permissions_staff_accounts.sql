-- Claude · 14 Nov 2026
-- صفحة صلاحيات واحدة: كل صلاحيات الموظف في staff.perms (يحددها المدير من «الموظفون والصلاحيات»)
-- + صلاحيات جديدة تُطبَّق على الخادم + إنشاء حسابات الموظفين وإعادة كلمة المرور وإيقاف الحساب.
-- لا أسرار في هذا الملف.

-- 1) المفاتيح المسموحة
create or replace function private.perm_keys() returns text
language sql immutable set search_path to '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch)$'
$$;

alter table public.staff add column if not exists active boolean not null default true;

-- 2) الأعمدة القديمة (payroll / chat / archive) وجداول ChatGPT تتبع staff.perms
create or replace function private.staff_perm_sync() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if new.perms is distinct from old.perms then
    new.payroll := 'payroll' = any(new.perms);
    new.chat := case when 'chat_full' = any(new.perms) then 'full' else 'view' end;
    new.archive := 'chat_arch' = any(new.perms);
  else
    if new.payroll is distinct from old.payroll then
      new.perms := array_remove(new.perms, 'payroll') || case when new.payroll then array['payroll'] else '{}'::text[] end;
    end if;
    if new.chat is distinct from old.chat then
      new.perms := array_remove(new.perms, 'chat_full') || case when new.chat = 'full' then array['chat_full'] else '{}'::text[] end;
    end if;
    if new.archive is distinct from old.archive then
      new.perms := array_remove(new.perms, 'chat_arch') || case when new.archive then array['chat_arch'] else '{}'::text[] end;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists staff_perm_sync on public.staff;
create trigger staff_perm_sync before update on public.staff for each row execute function private.staff_perm_sync();

create or replace function private.staff_perm_tables() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if 'visa_assist' = any(new.perms) then insert into asayel_booking.permissions values (new.id) on conflict do nothing;
  else delete from asayel_booking.permissions where employee = new.id; end if;
  if 'med_swap' = any(new.perms) then insert into asayel_booking.medical_permissions values (new.id) on conflict do nothing;
  else delete from asayel_booking.medical_permissions where employee = new.id; end if;
  return null;
end $$;
drop trigger if exists staff_perm_tables on public.staff;
create trigger staff_perm_tables after insert or update of perms on public.staff for each row execute function private.staff_perm_tables();

-- 3) نقل الصلاحيات الحالية + صلاحيات افتراضية للحسابات التجريبية (يعدّلها المدير لاحقًا)
update public.staff s set perms = (
  select coalesce(array_agg(distinct x), '{}') from unnest(
    s.perms
    || case when s.payroll then array['payroll'] else '{}'::text[] end
    || case when s.chat = 'full' then array['chat_full'] else '{}'::text[] end
    || case when s.archive then array['chat_arch'] else '{}'::text[] end
    || case when exists(select 1 from asayel_booking.permissions p where p.employee = s.id) then array['visa_assist'] else '{}'::text[] end
    || case when exists(select 1 from asayel_booking.medical_permissions p where p.employee = s.id) then array['med_swap'] else '{}'::text[] end
    || case s.username
         when 'haya' then array['rent_ok','rent_workers']
         when 'reem' then array['ag_entry','taf_edit','visa_assist']
         when 'khaled' then array['ag_entry','audit']
         when 'sara' then array['taf_edit']
         when 'majed' then array['ag_entry','taf_edit','rent_ok','rent_workers','audit','visa_assist','med_swap']
         when 'partner' then array['audit']
         else '{}'::text[] end
  ) x)
where not s.is_manager;

-- 4) المنع على الخادم
drop policy if exists ae_staff_insert on public.agent_entries;
create policy ae_staff_insert on public.agent_entries for insert to authenticated
  with check (void = false and ((select private.can_stage('ag_entry')) or (kind = 'charge' and (select private.can_stage('v2')))));

drop policy if exists rb_staff_update on public.rent_bookings;
create policy rb_staff_update on public.rent_bookings for update to authenticated
  using ((select private.can_stage('rent_ok'))) with check ((select private.can_stage('rent_ok')));

drop policy if exists rw_staff_insert on public.rent_workers;
drop policy if exists rw_staff_update on public.rent_workers;
drop policy if exists rw_staff_delete on public.rent_workers;
create policy rw_staff_insert on public.rent_workers for insert to authenticated with check ((select private.can_stage('rent_workers')));
create policy rw_staff_update on public.rent_workers for update to authenticated
  using ((select private.can_stage('rent_workers')) or (select private.can_stage('rent_ok')))
  with check ((select private.can_stage('rent_workers')) or (select private.can_stage('rent_ok')));
create policy rw_staff_delete on public.rent_workers for delete to authenticated using ((select private.can_stage('rent_workers')));

drop policy if exists tsh_staff_insert on public.tafweed_sheet;
drop policy if exists tsh_staff_update on public.tafweed_sheet;
drop policy if exists tsh_staff_delete on public.tafweed_sheet;
create policy tsh_staff_insert on public.tafweed_sheet for insert to authenticated with check ((select private.can_stage('taf_edit')) or (select private.can_stage('nm_paid')));
create policy tsh_staff_update on public.tafweed_sheet for update to authenticated
  using ((select private.can_stage('taf_edit')) or (select private.can_stage('nm_paid')))
  with check ((select private.can_stage('taf_edit')) or (select private.can_stage('nm_paid')));
create policy tsh_staff_delete on public.tafweed_sheet for delete to authenticated using ((select private.can_stage('taf_edit')));

drop policy if exists audit_sel on public.audit_log;
create policy audit_sel on public.audit_log for select to authenticated using ((select private.can_stage('audit')));

-- 5) حفظ الصلاحيات (كل المفاتيح)
create or replace function public.set_stage_perms(p_id uuid, p_perms text[], p_countries text[] default null)
returns void language plpgsql security definer set search_path to '' as $$
declare o public.staff;
begin
  if not private.is_manager() then raise exception 'manager only'; end if;
  select * into o from public.staff where id = p_id;
  if o.is_manager then raise exception 'المدير يملك كل الصلاحيات'; end if;
  update public.staff set perms = coalesce((select array_agg(distinct x) from unnest(p_perms) x where x ~ private.perm_keys()), '{}'),
    countries = case when p_countries is null then countries else coalesce((select array_agg(distinct left(trim(x),30)) from unnest(p_countries) x where trim(x) <> ''), '{}') end
  where id = p_id;
  perform private.audit('صلاحيات', 'الموظفون والصلاحيات', 'صلاحيات الموظف · ' || coalesce(o.name,''),
    array_to_string(o.perms, '، ') || ' | الدول: ' || coalesce(nullif(array_to_string(o.countries, '، '),''), 'كل الدول'),
    array_to_string(p_perms, '، ') || ' | الدول: ' || coalesce(nullif(array_to_string(coalesce(p_countries, o.countries), '، '),''), 'كل الدول'));
end $$;

create or replace function public.stage_perms() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not private.is_manager() then raise exception 'manager only'; end if;
  return (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'user', s.username, 'mgr', s.is_manager, 'active', s.active, 'perms', s.perms, 'countries', s.countries) order by s.created_at, s.name) from public.staff s);
end $$;

-- 6) حسابات الموظفين
create or replace function public.staff_logins() returns table(name text, username text)
language sql stable security definer set search_path to '' as $$
  select s.name, s.username from public.staff s where s.active order by s.is_manager desc, s.created_at, s.name
$$;
grant execute on function public.staff_logins() to anon, authenticated;

create or replace function public.staff_create(p_name text, p_username text, p_password text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare uid uuid := gen_random_uuid(); em text; nm text := left(trim(p_name), 60); un text := lower(trim(p_username));
begin
  if not private.is_manager() then raise exception 'للمدير فقط'; end if;
  if nm = '' then raise exception 'اكتب اسم الموظف'; end if;
  if un !~ '^[a-z][a-z0-9_]{2,19}$' then raise exception 'اسم الدخول بالإنجليزي: حروف وأرقام من 3 إلى 20 ويبدأ بحرف'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'الرمز 6 أرقام أو أحرف على الأقل'; end if;
  if exists(select 1 from public.staff where username = un or name = nm) then raise exception 'الاسم أو اسم الدخول مستخدم من قبل'; end if;
  em := un || '@staff.asayel.app';
  if exists(select 1 from auth.users where email = em) then raise exception 'اسم الدخول مستخدم من قبل'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('name', nm), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  insert into public.staff (id, name, username, chat, perms) values (uid, nm, un, 'full', array['chat_full']);
  perform private.audit('إضافة', 'الموظفون والصلاحيات', 'حساب موظف جديد · ' || nm || ' (' || un || ')', '—', 'حساب فعّال');
  return uid;
end $$;

create or replace function public.staff_set_password(p_id uuid, p_password text)
returns void language plpgsql security definer set search_path to '' as $$
declare o public.staff;
begin
  if not private.is_manager() then raise exception 'للمدير فقط'; end if;
  select * into o from public.staff where id = p_id;
  if o.id is null or o.is_manager then raise exception 'لا يمكن تغيير رمز هذا الحساب من هنا'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'الرمز 6 أرقام أو أحرف على الأقل'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
  perform private.audit('تعديل', 'الموظفون والصلاحيات', 'إعادة تعيين رمز الدخول · ' || o.name, '—', 'رمز جديد');
end $$;

create or replace function public.staff_set_active(p_id uuid, p_on boolean)
returns void language plpgsql security definer set search_path to '' as $$
declare o public.staff;
begin
  if not private.is_manager() then raise exception 'للمدير فقط'; end if;
  select * into o from public.staff where id = p_id;
  if o.id is null or o.is_manager then raise exception 'لا يمكن إيقاف هذا الحساب'; end if;
  update public.staff set active = p_on where id = p_id;
  update auth.users set banned_until = case when p_on then null else 'infinity'::timestamptz end where id = p_id;
  if not p_on then delete from auth.sessions where user_id = p_id; end if;
  perform private.audit('تعديل', 'الموظفون والصلاحيات', 'حساب الموظف · ' || o.name, case when o.active then 'فعّال' else 'موقوف' end, case when p_on then 'فعّال' else 'موقوف' end);
end $$;

revoke execute on function public.staff_create(text, text, text), public.staff_set_password(uuid, text), public.staff_set_active(uuid, boolean) from public, anon;
grant execute on function public.staff_create(text, text, text), public.staff_set_password(uuid, text), public.staff_set_active(uuid, boolean) to authenticated;
