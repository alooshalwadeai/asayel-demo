-- الإيواء داخل البرنامج (طلب علي 23/11/2026): نفس برنامج الإيواء على Floot بحقوله وحالاته وأرشيفه وتقاريره،
-- بدون أي ربط أو تعديل على Floot. البيانات تُنسخ منه مرة واحدة.
-- الصلاحيات: shelter = إضافة وتعديل · shelter_admin = حذف واسترجاع من الأرشيف وتوجيه المدير · shelter_view = اطلاع وتقارير فقط · المدير = الكل

create table if not exists public.shelter_residents (
  slot serial primary key,
  version int not null default 1,
  record jsonb not null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  visit_started_at timestamptz not null default now(),
  archived_at timestamptz,
  archive_kind text check (archive_kind in ('inside','outside','returned','transferred')),
  deleted_at timestamptz,
  floot_slot int unique
);
create index if not exists shelter_residents_passport on public.shelter_residents ((regexp_replace(upper(record->>'passport'),'[[:space:]]','','g')));
alter table public.shelter_residents enable row level security;

create table if not exists public.shelter_attachments (
  id uuid primary key default gen_random_uuid(),
  resident_slot int references public.shelter_residents(slot) on delete cascade,
  name text not null,
  path text not null,
  content_type text,
  size_bytes int,
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.shelter_attachments enable row level security;

-- جدول قديم في Floot (لقطات الضمان) يُحفظ كما هو للرجوع إليه
create table if not exists public.shelter_legacy_warranty (
  id int primary key,
  resident_slot int, source_version int, passport_key text, office_name text,
  warranty_start date, warranty_end date, record jsonb, created_by_name text, saved_at timestamptz
);
alter table public.shelter_legacy_warranty enable row level security;

create or replace function private.perm_keys()
returns text language sql immutable set search_path = '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch|shelter|shelter_admin|shelter_view|transfer|marketing|cv_edit|pg_customers|pg_reports|pg_insights|pg_chat|pg_guarantee|pg_leaves)$'
$$;

create or replace function private.sh_can(p_level text) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_manager() or exists (select 1 from public.staff s where s.id = auth.uid() and s.active and s.perms && case p_level
    when 'view' then array['shelter','shelter_admin','shelter_view']
    when 'edit' then array['shelter','shelter_admin']
    else array['shelter_admin'] end::text[])
$$;
create or replace function private.sh_who() returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select name from public.staff where id = auth.uid()), 'المدير')
$$;
create or replace function private.sh_pp(p text) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(upper(coalesce(p, '')), '[[:space:]]', '', 'g')
$$;

drop policy if exists sh_read on public.shelter_residents;
create policy sh_read on public.shelter_residents for select to authenticated using ((select private.sh_can('view')));
drop policy if exists sh_att_read on public.shelter_attachments;
create policy sh_att_read on public.shelter_attachments for select to authenticated using ((select private.sh_can('view')));
drop policy if exists sh_legacy_read on public.shelter_legacy_warranty;
create policy sh_legacy_read on public.shelter_legacy_warranty for select to authenticated using ((select private.sh_can('view')));

-- السفر: بعد يوم السفر تنتقل العاملة لأرشيف السفر (داخل/خارج الضمان حسب تاريخ السفر)
create or replace function private.sh_archive_departures() returns void language sql security definer set search_path = '' as $$
  update public.shelter_residents set archived_at = ((record->>'ticketDate')::date + 1)::timestamp at time zone 'Asia/Riyadh',
    archive_kind = case when (record->>'arrival') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and (record->>'ticketDate')::date <= (record->>'arrival')::date + 90 then 'inside' else 'outside' end,
    updated_at = now(), version = version + 1
  where archived_at is null and deleted_at is null and record->>'ticket' = 'true'
    and case when record->>'ticketDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then (record->>'ticketDate')::date < (now() at time zone 'Asia/Riyadh')::date else false end;
$$;

create or replace function public.shelter_rows() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not private.sh_can('view') then raise exception 'no_perm' using hint = 'ليست لديك صلاحية الإيواء'; end if;
  perform private.sh_archive_departures();
  return jsonb_build_object('can', jsonb_build_object('edit', private.sh_can('edit'), 'admin', private.sh_can('admin')),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('slot', r.slot, 'version', r.version, 'createdByName', r.created_by_name, 'record', r.record,
      'previousVisits', (select coalesce(jsonb_agg(jsonb_build_object('reason', coalesce(h.record->>'reason', 'لم يسجل السبب'), 'at', h.visit_started_at) order by h.visit_started_at desc), '[]'::jsonb)
        from public.shelter_residents h where h.archive_kind = 'returned' and h.deleted_at is null and private.sh_pp(h.record->>'passport') = private.sh_pp(r.record->>'passport'))) order by r.slot)
      from public.shelter_residents r where r.archived_at is null and r.deleted_at is null), '[]'::jsonb));
end $$;

create or replace function public.shelter_save(p_slot int, p_version int, p_record jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare ex public.shelter_residents; old jsonb; r jsonb := p_record; today date := (now() at time zone 'Asia/Riyadh')::date; n int; hist jsonb; saved public.shelter_residents; arch timestamptz; kind text;
begin
  if not private.sh_can('edit') and not private.sh_can('admin') then raise exception 'no_perm' using hint = 'ليست لديك صلاحية تعديل الإيواء'; end if;
  perform pg_advisory_xact_lock(923892);
  if coalesce(p_slot, 0) > 0 then
    select * into ex from public.shelter_residents where slot = p_slot for update;
    if ex.slot is null or ex.version <> p_version or ex.archived_at is not null or ex.deleted_at is not null then raise exception 'السجل تغيّر أو انتقل للأرشيف؛ حدّث الصفحة.'; end if;
    old := ex.record;
  end if;
  if not private.sh_can('admin') and coalesce(r->>'direction', '') <> coalesce(old->>'direction', '') then raise exception 'توجيه المدير لمن لديه صلاحية مدير الإيواء فقط'; end if;
  if not private.sh_can('edit') and ex.slot is not null and (r - 'direction') <> (old - 'direction') then raise exception 'صلاحيتك تعديل توجيه المدير فقط'; end if;
  r := jsonb_set(r, '{passport}', to_jsonb(private.sh_pp(r->>'passport')));
  if btrim(coalesce(r->>'name', '')) = '' then raise exception 'أدخل اسم العاملة'; end if;
  if coalesce(r->>'passport', '') = '' then raise exception 'أدخل رقم الجواز؛ فهو الرقم الموحد للعاملة'; end if;
  if coalesce(r->>'arrival', '') <> '' and (r->>'arrival')::date > today then raise exception 'تاريخ دخول المملكة لا يكون في المستقبل'; end if;
  if coalesce(r->>'shelter', '') <> '' and (r->>'shelter')::date > today then raise exception 'تاريخ الإيواء لا يكون في المستقبل'; end if;
  if coalesce(r->>'shelter', '') <> '' and (coalesce(r->>'arrival', '') = '' or (r->>'shelter')::date < (r->>'arrival')::date) then raise exception 'أدخل تاريخ الدخول أولًا؛ الإيواء لا يسبق الدخول'; end if;
  if coalesce((r->>'transferDeposit')::numeric, 0) > coalesce((r->>'transferCost')::numeric, 0) then raise exception 'مقدم النقل لا يتجاوز تكلفة النقل'; end if;
  if (r->>'ticket')::boolean and coalesce(r->>'ticketValidUntil', '') = '' then raise exception 'أدخل آخر يوم ساري للتذكرة'; end if;
  if (r->>'ticket')::boolean and (coalesce(r->>'arrival', '') = '' or (coalesce(r->>'ticketDate', '') = '' and not (ex.slot is not null and (private.sh_can('admin') or ((old->>'ticket')::boolean and coalesce(old->>'ticketDate', '') = ''))))) then raise exception 'أدخل تاريخ السفر وتاريخ دخول المملكة'; end if;
  if (r->>'transferCompleted')::boolean and r->>'status' <> 'transfer' then raise exception 'اختر حالة «تحت إجراءات النقل» قبل إتمام النقل'; end if;
  if (r->>'transferCompleted')::boolean and (coalesce(r->>'transferCompletedDate', '') = '' or btrim(coalesce(r->>'newSponsorName', '')) = '' or btrim(coalesce(r->>'newSponsorPhone', '')) = '') then raise exception 'أدخل اسم الكفيل الجديد وجواله وتاريخ النقل قبل الحفظ'; end if;
  if (r->>'returnCompleted')::boolean and (r->>'transferCompleted')::boolean then raise exception 'لا يمكن إتمام النقل والعودة في الوقت نفسه'; end if;
  if (r->>'returnCompleted')::boolean and r->>'status' <> 'returned' then raise exception 'اختر حالة «للإصلاح والعودة إلى الكفيل» أولًا'; end if;
  if (r->>'returnCompleted')::boolean and coalesce(r->>'shelter', '') = '' then raise exception 'أدخل تاريخ الإيواء لحساب مدة البقاء'; end if;
  if ex.slot is null then
    select count(*) into n from public.shelter_residents where archive_kind = 'returned' and deleted_at is null and private.sh_pp(record->>'passport') = r->>'passport';
    r := jsonb_set(r, '{visits}', to_jsonb(greatest(coalesce((r->>'visits')::int, 0), n + 1)));
    if n > 0 then
      select jsonb_build_object('name', r->>'name', 'count', n, 'visits', coalesce(jsonb_agg(jsonb_build_object('reason', coalesce(h.record->>'reason', 'لم يسجل السبب'), 'date', coalesce(nullif(h.record->>'shelter', ''), (h.visit_started_at at time zone 'Asia/Riyadh')::date::text))), '[]'::jsonb))
        into hist from (select * from public.shelter_residents where archive_kind = 'returned' and deleted_at is null and private.sh_pp(record->>'passport') = r->>'passport' order by visit_started_at desc limit 2) h;
    end if;
  end if;
  if (r->>'transferCompleted')::boolean then
    r := r || jsonb_build_object('previousSponsor', coalesce(old->>'sponsor', r->>'sponsor'), 'previousSponsorIdentity', coalesce(old->>'identity', r->>'identity'),
      'previousSponsorPhone', coalesce(old->>'phone', r->>'phone'), 'previousArrival', coalesce(old->>'arrival', r->>'arrival'), 'previousShelter', coalesce(old->>'shelter', r->>'shelter'),
      'sponsor', r->>'newSponsorName', 'phone', r->>'newSponsorPhone', 'identity', r->>'newSponsorIdentity', 'office', 'نقل كفالة');
  end if;
  if (r->>'returnCompleted')::boolean or (r->>'transferCompleted')::boolean then arch := now(); kind := case when (r->>'transferCompleted')::boolean then 'transferred' else 'returned' end; end if;
  if ex.slot is null then
    insert into public.shelter_residents(record, created_by_name, archived_at, archive_kind) values (r, private.sh_who(), arch, kind) returning * into saved;
  else
    update public.shelter_residents set record = r, version = version + 1, updated_at = now(), archived_at = arch, archive_kind = kind where slot = ex.slot returning * into saved;
  end if;
  perform private.audit(case when ex.slot is null then 'إضافة' else 'تعديل' end, 'الإيواء', 'عاملة ' || (r->>'name') || ' · جواز ' || (r->>'passport'), coalesce(old->>'status', '—'), coalesce(kind, r->>'status'));
  return jsonb_build_object('row', jsonb_build_object('slot', saved.slot, 'version', saved.version, 'record', saved.record, 'createdByName', saved.created_by_name), 'archived', saved.archived_at is not null, 'previousVisitAlert', hist);
end $$;

create or replace function public.shelter_delete(p_slot int, p_version int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare x public.shelter_residents;
begin
  if not private.sh_can('admin') then raise exception 'no_perm' using hint = 'حذف السجل لمدير الإيواء فقط'; end if;
  select * into x from public.shelter_residents where slot = p_slot for update;
  if x.slot is null or x.deleted_at is not null or x.version <> p_version then raise exception 'السجل تغيّر؛ حدّث الصفحة.'; end if;
  if x.archived_at is not null then raise exception 'لا يمكن حذف أي سجل من الأرشيف'; end if;
  update public.shelter_residents set deleted_at = now(), version = version + 1 where slot = p_slot;
  perform private.audit('حذف', 'الإيواء', 'عاملة ' || (x.record->>'name') || ' · جواز ' || (x.record->>'passport'), 'في الإيواء', 'محذوف');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.shelter_restore(p_slot int, p_version int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare x public.shelter_residents; r jsonb;
begin
  if not private.sh_can('admin') then raise exception 'no_perm' using hint = 'الاسترجاع من الأرشيف لمدير الإيواء فقط'; end if;
  perform pg_advisory_xact_lock(923892);
  select * into x from public.shelter_residents where slot = p_slot for update;
  if x.slot is null or x.deleted_at is not null or x.archived_at is null or x.version <> p_version then raise exception 'تغيّر سجل الأرشيف؛ حدّث النتائج ثم حاول مرة أخرى.'; end if;
  if exists (select 1 from public.shelter_residents where archived_at is null and deleted_at is null and private.sh_pp(record->>'passport') = private.sh_pp(x.record->>'passport')) then raise exception 'العاملة موجودة بالفعل في السجل برقم الجواز نفسه.'; end if;
  r := x.record || jsonb_build_object('ticketDate', '', 'returnCompleted', false, 'status', case when x.record->>'status' = 'returned' then 'shelter' else x.record->>'status' end);
  update public.shelter_residents set record = r, archived_at = null, archive_kind = null, version = version + 1, updated_at = now() where slot = p_slot;
  perform private.audit('استرجاع', 'الإيواء', 'عاملة ' || (r->>'name') || ' من الأرشيف', x.archive_kind, 'في الإيواء');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.shelter_archive(p_section text, p_from date, p_to date, p_office text default 'all', p_search text default '') returns jsonb language plpgsql security definer set search_path = '' as $$
declare kinds text[] := case p_section when 'travel' then array['inside','outside'] else array[p_section] end; t text := lower(coalesce(p_search, '')); pp text := private.sh_pp(p_search);
begin
  if not private.sh_can('view') then raise exception 'no_perm' using hint = 'ليست لديك صلاحية الإيواء'; end if;
  perform private.sh_archive_departures();
  return coalesce((select jsonb_agg(jsonb_build_object('slot', r.slot, 'version', r.version, 'record', r.record, 'archiveKind', r.archive_kind, 'archivedAt', r.archived_at, 'visitStartedAt', r.visit_started_at,
      'stayDays', case when coalesce(r.record->>'shelter', '') <> '' then greatest(0, (r.archived_at at time zone 'Asia/Riyadh')::date - (r.record->>'shelter')::date) else 0 end) order by r.archived_at desc, r.slot)
    from public.shelter_residents r where r.archived_at is not null and r.deleted_at is null and r.archive_kind = any(kinds)
      and coalesce(nullif(r.record->>'shelter', ''), (r.visit_started_at at time zone 'Asia/Riyadh')::date::text) <= p_to::text
      and (r.archived_at at time zone 'Asia/Riyadh')::date >= p_from
      and (coalesce(p_search, '') = '' or position(t in lower(coalesce(r.record->>'name', '') || ' ' || coalesce(r.record->>'sponsor', ''))) > 0 or position(pp in private.sh_pp(r.record->>'passport')) > 0)), '[]'::jsonb);
end $$;

create or replace function public.shelter_search(p_term text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare t text := regexp_replace(translate(lower(coalesce(p_term, '')), 'أإآ٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', 'ااا01234567890123456789'), '[[:space:]ـًٌٍَُِّْٰ]', '', 'g');
begin
  if not private.sh_can('view') then raise exception 'no_perm' using hint = 'ليست لديك صلاحية الإيواء'; end if;
  if length(t) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(x) from (select jsonb_build_object('slot', r.slot, 'record', r.record, 'archiveKind', r.archive_kind, 'archivedAt', r.archived_at) x
    from public.shelter_residents r where r.deleted_at is null and exists (select 1 from unnest(array['name','passport','sponsor','identity','previousSponsor','previousSponsorIdentity','phone']) f
      where position(t in regexp_replace(translate(lower(coalesce(r.record->>f, '')), 'أإآ٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', 'ااا01234567890123456789'), '[[:space:]ـًٌٍَُِّْٰ]', '', 'g')) > 0)
    order by r.archived_at is null desc, r.updated_at desc limit 60) q), '[]'::jsonb);
end $$;

-- تعبئة تلقائية برقم الجواز من الأرشيف (تم النقل أولًا ثم الإصلاح والعودة)
create or replace function public.shelter_passport(p_passport text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare pp text := private.sh_pp(p_passport); x public.shelter_residents;
begin
  if not private.sh_can('edit') then raise exception 'no_perm'; end if;
  select * into x from public.shelter_residents where archive_kind = 'transferred' and deleted_at is null and private.sh_pp(record->>'passport') = pp order by archived_at desc limit 1;
  if x.slot is not null then return jsonb_build_object('source', 'transferred', 'previousSponsor', x.record->>'previousSponsor', 'match', jsonb_build_object('name', x.record->>'name', 'sponsor', x.record->>'sponsor', 'identity', x.record->>'identity', 'phone', x.record->>'phone', 'arrival', x.record->>'arrival', 'office', 'نقل كفالة', 'officeNumber', '', 'nationality', x.record->>'nationality')); end if;
  select * into x from public.shelter_residents where archive_kind = 'returned' and deleted_at is null and private.sh_pp(record->>'passport') = pp order by archived_at desc, slot desc limit 1;
  if x.slot is not null then return jsonb_build_object('source', 'archive', 'match', jsonb_build_object('name', x.record->>'name', 'sponsor', x.record->>'sponsor', 'identity', x.record->>'identity', 'phone', x.record->>'phone', 'arrival', x.record->>'arrival', 'office', x.record->>'office', 'officeNumber', x.record->>'officeNumber', 'nationality', x.record->>'nationality')); end if;
  return jsonb_build_object('match', null);
end $$;

create or replace function public.shelter_attach(p_slot int, p_name text, p_path text, p_type text, p_size int) returns jsonb language plpgsql security definer set search_path = '' as $$
declare x public.shelter_residents; a public.shelter_attachments;
begin
  if not private.sh_can('edit') then raise exception 'no_perm' using hint = 'إضافة المرفقات لمسؤول الإيواء'; end if;
  select * into x from public.shelter_residents where slot = p_slot and deleted_at is null;
  if x.slot is null then raise exception 'السجل غير متاح'; end if;
  if p_path !~ ('^' || p_slot || '/') then raise exception 'مسار غير صالح'; end if;
  insert into public.shelter_attachments(resident_slot, name, path, content_type, size_bytes, created_by) values (p_slot, left(p_name, 200), p_path, p_type, p_size, private.sh_who()) returning * into a;
  return to_jsonb(a);
end $$;

-- الرد الآلي: حالة العاملة في الإيواء أو النقل (برقم هوية الكفيل أو جواله)
create or replace function private.sh_bot(p_ph text, p_nid text) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('status', r.record->>'status', 'archive', r.archive_kind, 'ticketDate', r.record->>'ticketDate', 'ticket', r.record->>'ticket') order by r.updated_at desc), '[]'::jsonb)
  from (select * from public.shelter_residents x where x.deleted_at is null
    and ((coalesce(p_nid, '') <> '' and (regexp_replace(x.record->>'identity', '\D', '', 'g') = p_nid or regexp_replace(x.record->>'newSponsorIdentity', '\D', '', 'g') = p_nid))
      or (coalesce(p_ph, '') <> '' and (right(regexp_replace(x.record->>'phone', '\D', '', 'g'), 9) = right(p_ph, 9) or right(regexp_replace(x.record->>'newSponsorPhone', '\D', '', 'g'), 9) = right(p_ph, 9))))
    and (x.archived_at is null or x.archived_at > now() - interval '30 days') order by x.updated_at desc limit 3) r
$$;

create or replace function public.bot_rec_status(p_token text default null, p_nid text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ph text; v_nid text := translate(btrim(coalesce(p_nid, '')), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'); full_info boolean := false; anid text; sh jsonb;
begin
  if coalesce(p_token, '') <> '' then
    select s.ph into v_ph from private.cust_sessions s where s.token_hash = extensions.digest(p_token, 'sha256') and s.expires_at > now();
    full_info := v_ph is not null;
  end if;
  if v_ph is null and v_nid <> '' then
    if v_nid !~ '^[12][0-9]{9}$' then return jsonb_build_object('error', 'nid'); end if;
    select a.ph into v_ph from public.cust_accounts a where a.nid = v_nid;
  end if;
  if v_ph is not null then select a.nid into anid from public.cust_accounts a where a.ph = v_ph limit 1; end if;
  sh := private.sh_bot(v_ph, coalesce(nullif(v_nid, ''), anid));
  if v_ph is null and jsonb_array_length(sh) = 0 then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'shelter', sh, 'orders', coalesce((select jsonb_agg(jsonb_build_object(
      'stage', o.stage, 'status', o.status, 'med_fail', o.med_fail_at is not null,
      'ref', case when full_info then o.ref end, 'worker', case when full_info then o.worker_name end,
      'mno', case when full_info then o.musaned_no end, 'flight', case when full_info then o.flight_date end) order by o.created_at desc)
    from (select * from public.rec_orders x where v_ph is not null and x.cust_phone = v_ph and x.status <> 'cancelled' order by x.created_at desc limit 5) o), '[]'::jsonb));
end $$;

revoke all on function public.shelter_rows(), public.shelter_save(int,int,jsonb), public.shelter_delete(int,int), public.shelter_restore(int,int), public.shelter_archive(text,date,date,text,text), public.shelter_search(text), public.shelter_passport(text), public.shelter_attach(int,text,text,text,int) from public, anon;
grant execute on function public.shelter_rows(), public.shelter_save(int,int,jsonb), public.shelter_delete(int,int), public.shelter_restore(int,int), public.shelter_archive(text,date,date,text,text), public.shelter_search(text), public.shelter_passport(text), public.shelter_attach(int,text,text,text,int) to authenticated;
revoke all on function public.bot_rec_status(text, text) from public;
grant execute on function public.bot_rec_status(text, text) to anon, authenticated;

-- مرفقات الإيواء: حاوية خاصة، القراءة لمن له صلاحية الإيواء والرفع لمسؤول الإيواء
insert into storage.buckets (id, name, public, file_size_limit) values ('shelter', 'shelter', false, 4194304) on conflict (id) do nothing;
drop policy if exists sh_files_read on storage.objects;
create policy sh_files_read on storage.objects for select to authenticated using (bucket_id = 'shelter' and (select private.sh_can('view')));
drop policy if exists sh_files_write on storage.objects;
create policy sh_files_write on storage.objects for insert to authenticated with check (bucket_id = 'shelter' and (select private.sh_can('edit')));
