-- حسابات العملاء محفوظة في قاعدة البيانات: يدخل العميل من أي جوال أو جهاز برقم جواله وكلمة المرور،
-- ويستعيد كلمة المرور بنفسه برقم الجوال + رقم الهوية + تاريخ الميلاد (كما سجّلها).
-- الجداول مغلقة تمامًا (RLS بدون سياسات)، والوصول فقط عبر الدوال أدناه. كلمة المرور مخزّنة مشفّرة (bcrypt).

create table if not exists public.cust_accounts (
  ph text primary key check (ph ~ '^05[0-9]{8}$'),
  nid text not null unique check (nid ~ '^[12][0-9]{9}$'),
  name text not null check (char_length(name) between 3 and 80),
  dob text check (dob is null or dob ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  pw_hash text not null,
  profile jsonb not null default '{}'::jsonb check (pg_column_size(profile) < 8000),
  fails int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cust_accounts enable row level security;
revoke all on public.cust_accounts from anon, authenticated;

create table if not exists private.cust_sessions (
  token_hash bytea primary key,
  ph text not null references public.cust_accounts(ph) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days'
);
create index if not exists cust_sessions_ph on private.cust_sessions (ph);
revoke all on private.cust_sessions from anon, authenticated;

create or replace function private.cust_pw_ok(p text) returns boolean language plpgsql immutable set search_path to '' as $$
declare d int;
begin
  if coalesce(p, '') !~ '^[0-9]{8}$' then return false; end if;
  for d in 0..9 loop if length(p) - length(replace(p, d::text, '')) > 4 then return false; end if; end loop;
  return true;
end $$;

create or replace function private.cust_view(a public.cust_accounts) returns jsonb language sql stable set search_path to '' as $$
  select jsonb_build_object('name', a.name, 'nid', a.nid, 'ph', a.ph, 'dob', a.dob, 'profile', a.profile) $$;

create or replace function private.cust_new_session(p_ph text) returns text language plpgsql security definer set search_path to '' as $$
declare t text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  delete from private.cust_sessions where ph = p_ph and expires_at < now();
  insert into private.cust_sessions(token_hash, ph) values (extensions.digest(t, 'sha256'), p_ph);
  return t;
end $$;

create or replace function public.cust_register(p_name text, p_nid text, p_ph text, p_dob text, p_pw text, p_profile jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare n text := left(trim(coalesce(p_name, '')), 80); a public.cust_accounts;
begin
  if array_length(regexp_split_to_array(n, '\s+'), 1) < 3 then raise exception 'اكتب الاسم الكامل (ثلاثي على الأقل)'; end if;
  if coalesce(p_nid, '') !~ '^[12][0-9]{9}$' then raise exception 'رقم الهوية أو الإقامة 10 أرقام ويبدأ بـ 1 أو 2'; end if;
  if coalesce(p_ph, '') !~ '^05[0-9]{8}$' then raise exception 'رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام'; end if;
  if not private.cust_pw_ok(p_pw) then raise exception 'كلمة المرور 8 أرقام، ولا يتكرر نفس الرقم أكثر من 4 مرات'; end if;
  if p_dob is not null and p_dob !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'اختر تاريخ الميلاد'; end if;
  if (select count(*) from public.cust_accounts where created_at > now() - interval '1 hour') > 200 then raise exception 'حاول لاحقًا'; end if;
  if exists (select 1 from public.cust_accounts where ph = p_ph) then raise exception 'هذا الجوال مسجّل · سجّل دخولك'; end if;
  if exists (select 1 from public.cust_accounts where nid = p_nid) then raise exception 'رقم الهوية مسجّل بحساب آخر · راجع المكتب'; end if;
  insert into public.cust_accounts(ph, nid, name, dob, pw_hash, profile)
  values (p_ph, p_nid, n, p_dob, extensions.crypt(p_pw, extensions.gen_salt('bf')), coalesce(p_profile, '{}'::jsonb) - 'pw')
  returning * into a;
  return jsonb_build_object('token', private.cust_new_session(a.ph), 'account', private.cust_view(a));
end $$;

create or replace function public.cust_login(p_ph text, p_pw text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.cust_accounts;
begin
  select * into a from public.cust_accounts where ph = p_ph for update;
  if a.ph is null then return jsonb_build_object('error', 'not_found'); end if;
  if a.locked_until is not null and a.locked_until > now() then raise exception 'محاولات كثيرة · حاول بعد ربع ساعة أو استعد كلمة المرور'; end if;
  if a.pw_hash <> extensions.crypt(coalesce(p_pw, ''), a.pw_hash) then
    update public.cust_accounts set fails = fails + 1, locked_until = case when fails + 1 >= 5 then now() + interval '15 minutes' end where ph = a.ph;
    return jsonb_build_object('error', 'bad_password');
  end if;
  update public.cust_accounts set fails = 0, locked_until = null where ph = a.ph;
  return jsonb_build_object('token', private.cust_new_session(a.ph), 'account', private.cust_view(a));
end $$;

create or replace function public.cust_save(p_token text, p_profile jsonb) returns jsonb language plpgsql security definer set search_path to '' as $$
declare s private.cust_sessions;
begin
  select * into s from private.cust_sessions where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256') and expires_at > now();
  if s.ph is null then return jsonb_build_object('error', 'session'); end if;
  update public.cust_accounts set profile = coalesce(p_profile, '{}'::jsonb) - 'pw', updated_at = now() where ph = s.ph;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.cust_recover(p_ph text, p_nid text, p_dob text, p_pw text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare a public.cust_accounts;
begin
  if not private.cust_pw_ok(p_pw) then raise exception 'كلمة المرور الجديدة 8 أرقام، ولا يتكرر نفس الرقم أكثر من 4 مرات'; end if;
  select * into a from public.cust_accounts where ph = p_ph for update;
  if a.ph is null then raise exception 'هذا الجوال غير مسجّل · سجّل حسابًا جديدًا'; end if;
  if a.locked_until is not null and a.locked_until > now() then raise exception 'محاولات كثيرة · حاول بعد ربع ساعة أو تواصل مع المكتب'; end if;
  if a.nid <> coalesce(p_nid, '') or a.dob is null or a.dob <> coalesce(p_dob, '') then
    update public.cust_accounts set fails = fails + 1, locked_until = case when fails + 1 >= 5 then now() + interval '15 minutes' end where ph = a.ph;
    raise exception 'البيانات غير مطابقة لبيانات الحساب · تأكد من رقم الهوية وتاريخ الميلاد كما سجّلتها';
  end if;
  update public.cust_accounts set pw_hash = extensions.crypt(p_pw, extensions.gen_salt('bf')), fails = 0, locked_until = null, updated_at = now() where ph = a.ph;
  delete from private.cust_sessions where ph = a.ph;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.cust_register(text,text,text,text,text,jsonb), public.cust_login(text,text), public.cust_save(text,jsonb), public.cust_recover(text,text,text,text) from public;
grant execute on function public.cust_register(text,text,text,text,text,jsonb), public.cust_login(text,text), public.cust_save(text,jsonb), public.cust_recover(text,text,text,text) to anon, authenticated;
revoke all on function private.cust_new_session(text), private.cust_view(public.cust_accounts), private.cust_pw_ok(text) from public, anon, authenticated;
