-- المرحلة (٢): تسجيل المكتب (إيميل وكلمة مرور المكتب) + ربط الجهاز بالمكتب + دخول الموظفين بالاسم والرمز
alter table public.tenants add column if not exists pw_hash text, add column if not exists fails int not null default 0, add column if not exists locked_until timestamptz;
create unique index if not exists tenants_email_uniq on public.tenants (lower(official_email)) where official_email is not null;

create table if not exists private.tenant_devices (
  token_hash bytea primary key,
  tenant_id bigint not null references public.tenants(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
revoke all on private.tenant_devices from public, anon, authenticated;

create or replace function private.device_token(p_tenant bigint) returns text language plpgsql security definer set search_path to '' as $$
declare t text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  insert into private.tenant_devices(token_hash, tenant_id) values (extensions.digest(t, 'sha256'), p_tenant);
  return t;
end $$;
revoke all on function private.device_token(bigint) from public, anon, authenticated;

-- «سجّل مكتبك»: ينشئ المكتب (تجربة 14 يومًا) ومدير المكتب، ويربط هذا الجهاز بالمكتب
create or replace function public.tenant_signup(p_office text, p_slug text, p_email text, p_password text, p_phone text, p_mgr_name text, p_pin text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare nm text := left(trim(coalesce(p_office, '')), 80); sl text := lower(trim(coalesce(p_slug, ''))); em text := lower(trim(coalesce(p_email, '')));
  mg text := left(trim(coalesce(p_mgr_name, '')), 60); ph text := trim(coalesce(p_phone, '')); tid bigint; uid uuid := gen_random_uuid(); sem text;
begin
  if char_length(nm) < 3 then raise exception 'اكتب اسم المكتب'; end if;
  if sl !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then raise exception 'رابط المكتب بالإنجليزي: حروف صغيرة وأرقام وشرطة (3 إلى 40)'; end if;
  if sl in ('admin','api','app','www','o','signup','login','dev','developer','support','asayel','test') then raise exception 'هذا الرابط محجوز · اختر غيره'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then raise exception 'الإيميل غير صحيح'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'كلمة مرور المكتب 8 أحرف أو أرقام على الأقل'; end if;
  if ph !~ '^05[0-9]{8}$' then raise exception 'رقم جوال المكتب يبدأ بـ 05 ويتكون من 10 أرقام'; end if;
  if char_length(mg) < 3 then raise exception 'اكتب اسم مدير المكتب'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then raise exception 'رمز المدير من 4 إلى 8 أرقام'; end if;
  if (select count(*) from public.tenants where created_at > now() - interval '1 hour') >= 20 then raise exception 'حاول لاحقًا'; end if;
  if exists (select 1 from public.tenants where slug = sl) then raise exception 'رابط المكتب مستخدم · اختر غيره'; end if;
  if exists (select 1 from public.tenants where lower(official_email) = em) then raise exception 'هذا الإيميل مسجّل بمكتب آخر'; end if;
  insert into public.tenants (slug, name, phones, official_email, status, plan, trial_ends_at, pw_hash)
  values (sl, nm, array[ph], em, 'trial', 'rec_rent', now() + interval '14 days', extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning id into tid;
  sem := 'manager.t' || tid || '@staff.asayel.app';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', sem, extensions.crypt(p_pin, extensions.gen_salt('bf')), now(),
          jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'tenant_id',tid), jsonb_build_object('name', mg), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', sem, 'email_verified', true), 'email', now(), now(), now());
  insert into public.staff (id, name, username, chat, is_manager, perms, tenant_id) values (uid, mg, 'manager', 'full', true, array['chat_full'], tid);
  update public.tenants set owner_id = uid where id = tid;
  return jsonb_build_object('slug', sl, 'tenant_id', tid, 'device', private.device_token(tid));
end $$;

-- ربط جهاز جديد بالمكتب: إيميل المكتب وكلمة مروره (قفل 15 دقيقة بعد 5 محاولات خاطئة)
create or replace function public.tenant_device_link(p_slug text, p_email text, p_password text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare t public.tenants;
begin
  select * into t from public.tenants where slug = lower(trim(coalesce(p_slug, ''))) for update;
  if t.id is null then raise exception 'المكتب غير موجود'; end if;
  if t.status = 'suspended' then raise exception 'اشتراك المكتب موقوف · تواصل مع المطوّر'; end if;
  if t.locked_until is not null and t.locked_until > now() then raise exception 'محاولات كثيرة · حاول بعد ربع ساعة'; end if;
  if lower(coalesce(t.official_email, '')) <> lower(trim(coalesce(p_email, ''))) or t.pw_hash is null or t.pw_hash <> extensions.crypt(coalesce(p_password, ''), t.pw_hash) then
    update public.tenants set fails = fails + 1, locked_until = case when fails + 1 >= 5 then now() + interval '15 minutes' end where id = t.id;
    raise exception 'إيميل المكتب أو كلمة المرور غير صحيحة';
  end if;
  update public.tenants set fails = 0, locked_until = null where id = t.id;
  return jsonb_build_object('slug', t.slug, 'name', t.name, 'device', private.device_token(t.id));
end $$;

-- قائمة أسماء الموظفين لشاشة الدخول: فقط لجهاز مربوط بهذا المكتب
drop function if exists public.staff_logins();
create or replace function public.staff_logins(p_device text default null) returns table(name text, username text) language sql stable security definer set search_path to '' as $$
  select s.name, s.username || '.t' || s.tenant_id
  from public.staff s
  where s.active and s.tenant_id = private.current_tenant_id()
    and exists (select 1 from private.tenant_devices d where d.token_hash = extensions.digest(coalesce(p_device, ''), 'sha256') and d.tenant_id = s.tenant_id)
  order by s.is_manager desc, s.created_at, s.name
$$;

revoke all on function public.tenant_signup(text,text,text,text,text,text,text), public.tenant_device_link(text,text,text), public.staff_logins(text) from public;
grant execute on function public.tenant_signup(text,text,text,text,text,text,text), public.tenant_device_link(text,text,text), public.staff_logins(text) to anon, authenticated;
