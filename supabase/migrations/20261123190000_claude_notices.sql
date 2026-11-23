-- الإشعارات والتنويهات الرسمية لكل البرنامج (طلب علي 23/11/2026) — مثل تنويهات برنامج الإيواء لكن لجميع الأقسام
-- المدير ومن لديه صلاحية notice_send يرسل تنويهًا لموظف أو أكثر، مع مرفقات (صور/PDF/صوت) وجدولة خلال 7 أيام
-- المستلم يرى نافذة لا تُغلق خلال الدوام حتى يضغط «موافق، تمت القراءة» · المرسل يرى من قرأ ومن لم يقرأ

create table if not exists public.notices (
  id bigserial primary key,
  sender uuid not null,
  sender_name text not null,
  body text not null check (length(body) between 1 and 3000),
  media jsonb not null default '[]',
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.notice_recipients (
  notice_id bigint not null references public.notices(id) on delete cascade,
  staff_id uuid not null,
  read_at timestamptz,
  primary key (notice_id, staff_id)
);
create index if not exists notice_recipients_staff on public.notice_recipients (staff_id, read_at);
alter table public.notices enable row level security;
alter table public.notice_recipients enable row level security;

create or replace function private.perm_keys()
returns text language sql immutable set search_path = '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch|shelter|shelter_admin|shelter_view|transfer|marketing|cv_edit|notice_send|pg_customers|pg_reports|pg_insights|pg_chat|pg_guarantee|pg_leaves)$'
$$;

create or replace function private.nt_can_send() returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_manager() or exists (select 1 from public.staff s where s.id = auth.uid() and s.active and 'notice_send' = any(s.perms))
$$;
create or replace function private.nt_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_manager() or exists (select 1 from public.staff s where s.id = auth.uid() and s.active)
$$;

create or replace function public.notice_list() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid(); can boolean := private.nt_can_send();
begin
  if not private.nt_staff() then raise exception 'no_perm' using hint = 'للموظفين فقط'; end if;
  return jsonb_build_object('can_send', can, 'me', me,
    'inbox', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'sender', n.sender_name, 'body', n.body, 'media', n.media, 'at', coalesce(n.scheduled_at, n.created_at), 'read_at', r.read_at) order by coalesce(n.scheduled_at, n.created_at) desc)
      from public.notice_recipients r join public.notices n on n.id = r.notice_id
      where r.staff_id = me and coalesce(n.scheduled_at, n.created_at) <= now() and coalesce(n.scheduled_at, n.created_at) > now() - interval '60 days'), '[]'::jsonb),
    'sent', case when can then coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'media', n.media, 'created_at', n.created_at, 'scheduled_at', n.scheduled_at,
        'receipts', (select coalesce(jsonb_agg(jsonb_build_object('name', coalesce(s.name, 'موظف'), 'read_at', r.read_at) order by s.name), '[]'::jsonb) from public.notice_recipients r left join public.staff s on s.id = r.staff_id where r.notice_id = n.id)) order by n.created_at desc)
      from public.notices n where n.sender = me and n.created_at > now() - interval '60 days'), '[]'::jsonb) else '[]'::jsonb end,
    'members', case when can then coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.name) from public.staff s where s.active and s.id <> me), '[]'::jsonb) else '[]'::jsonb end);
end $$;

create or replace function public.notice_send(p_body text, p_recipients uuid[], p_media jsonb default '[]', p_scheduled timestamptz default null) returns bigint language plpgsql security definer set search_path = '' as $$
declare nid bigint; nm text; b text := btrim(coalesce(p_body, '')); m jsonb := coalesce(p_media, '[]'::jsonb);
begin
  if not private.nt_can_send() then raise exception 'no_perm' using hint = 'إرسال التنويهات للمدير ومن لديه صلاحية'; end if;
  if coalesce(array_length(p_recipients, 1), 0) = 0 then raise exception 'اختر مستلمًا واحدًا على الأقل'; end if;
  if b = '' and jsonb_array_length(m) = 0 then raise exception 'اكتب تنويهًا أو أرفق ملفًا أو رسالة صوتية'; end if;
  if jsonb_array_length(m) > 5 then raise exception 'خمسة مرفقات بحد أقصى'; end if;
  if exists (select 1 from jsonb_array_elements(m) e where (e->>'path') !~ ('^' || auth.uid() || '/')) then raise exception 'مرفق غير صالح'; end if;
  if p_scheduled is not null and (p_scheduled <= now() or p_scheduled > now() + interval '7 days') then raise exception 'حدد موعدًا قادمًا خلال الأيام السبعة المقبلة'; end if;
  select coalesce((select name from public.staff where id = auth.uid()), 'إدارة المكتب') into nm;
  insert into public.notices(sender, sender_name, body, media, scheduled_at) values (auth.uid(), nm, case when b = '' then 'تنويه صوتي أو مرفق' else left(b, 3000) end, m, p_scheduled) returning id into nid;
  insert into public.notice_recipients(notice_id, staff_id) select distinct nid, s.id from public.staff s where s.id = any(p_recipients) and s.active and s.id <> auth.uid();
  if not found then raise exception 'المستلمون غير متاحين'; end if;
  perform private.audit('إرسال', 'التنويهات', 'تنويه رسمي #' || nid || ' إلى ' || (select count(*) from public.notice_recipients where notice_id = nid) || ' موظف', '—', coalesce(to_char(p_scheduled at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI'), 'فوري'));
  return nid;
end $$;

create or replace function public.notice_read(p_id bigint) returns timestamptz language plpgsql security definer set search_path = '' as $$
declare t timestamptz;
begin
  update public.notice_recipients set read_at = coalesce(read_at, now()) where notice_id = p_id and staff_id = auth.uid() returning read_at into t;
  if t is null then raise exception 'التنويه غير متاح'; end if;
  return t;
end $$;

revoke all on function public.notice_list(), public.notice_send(text, uuid[], jsonb, timestamptz), public.notice_read(bigint) from public, anon;
grant execute on function public.notice_list(), public.notice_send(text, uuid[], jsonb, timestamptz), public.notice_read(bigint) to authenticated;

-- مرفقات التنويهات: حاوية خاصة · الرفع للمرسل في مجلده · القراءة للمرسل أو لمستلم التنويه
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('notices', 'notices', false, 4194304,
  array['image/jpeg','image/png','image/webp','application/pdf','text/plain','audio/webm','audio/mp4','audio/ogg']) on conflict (id) do nothing;
drop policy if exists nt_files_write on storage.objects;
create policy nt_files_write on storage.objects for insert to authenticated with check (bucket_id = 'notices' and (select private.nt_can_send()) and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists nt_files_read on storage.objects;
create policy nt_files_read on storage.objects for select to authenticated using (bucket_id = 'notices' and (
  (storage.foldername(name))[1] = (select auth.uid())::text
  or exists (select 1 from public.notices n join public.notice_recipients r on r.notice_id = n.id
    where r.staff_id = (select auth.uid()) and n.media @> jsonb_build_array(jsonb_build_object('path', name)))));
drop policy if exists nt_files_delete on storage.objects;
create policy nt_files_delete on storage.objects for delete to authenticated using (bucket_id = 'notices' and (storage.foldername(name))[1] = (select auth.uid())::text and not exists (select 1 from public.notices n where n.media @> jsonb_build_array(jsonb_build_object('path', name))));
