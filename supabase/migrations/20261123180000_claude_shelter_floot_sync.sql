-- ربط الإيواء بـ Floot (قرار علي 23/11/2026): Floot هو الأساس حاليًا، والتعديل يبقى فيه.
-- مهمة مجدولة في Floot (helpers/syncToAsayel، كل 24 ساعة) تقرأ بياناته وترسل الجديد هنا. لا تعدّل شيئًا في Floot.
-- صفحات الإيواء في برنامجنا للعرض والتقارير والبحث والرد الآلي فقط حتى التحويل الكامل.
-- المرسل حساب خاص floot-sync@sync.asayel.app (ليس موظفًا ولا يظهر في القوائم). رمزه محفوظ في أسرار Floot فقط (ASAYEL_SYNC_PASSWORD).
-- الحساب نفسه أُنشئ خارج هذا الملف حتى لا يُحفظ أي رمز في المستودع.

create table if not exists private.shelter_sync_log (at timestamptz primary key default now(), result jsonb);

create or replace function private.sh_sync_uid() returns uuid language sql stable security definer set search_path = '' as $$
  select id from auth.users where email = 'floot-sync@sync.asayel.app'
$$;

create or replace function public.shelter_sync_state() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is distinct from private.sh_sync_uid() then raise exception 'denied'; end if;
  return jsonb_build_object('att', coalesce((select jsonb_agg(id) from public.shelter_attachments), '[]'::jsonb),
    'wa', coalesce((select max(id) from public.shelter_legacy_warranty), 0));
end $$;

create or replace function public.shelter_sync(p_res jsonb, p_wa jsonb default '[]', p_att jsonb default '[]') returns jsonb language plpgsql security definer set search_path = '' as $$
declare x jsonb; nr int := 0; nw int := 0; na int := 0;
begin
  if auth.uid() is distinct from private.sh_sync_uid() then raise exception 'denied'; end if;
  for x in select * from jsonb_array_elements(coalesce(p_res, '[]')) loop
    insert into public.shelter_residents(version, record, created_by_name, created_at, updated_at, visit_started_at, archived_at, archive_kind, deleted_at, floot_slot)
    values ((x->>'version')::int, x->'record', x->>'created_by_name', coalesce((x->>'updated_at')::timestamptz, now()), coalesce((x->>'updated_at')::timestamptz, now()),
      coalesce((x->>'visit_started_at')::timestamptz, (x->>'updated_at')::timestamptz, now()), (x->>'archived_at')::timestamptz, x->>'archive_kind', (x->>'deleted_at')::timestamptz, (x->>'slot')::int)
    on conflict (floot_slot) do update set version = excluded.version, record = excluded.record, created_by_name = excluded.created_by_name, updated_at = excluded.updated_at,
      visit_started_at = excluded.visit_started_at, archived_at = excluded.archived_at, archive_kind = excluded.archive_kind, deleted_at = excluded.deleted_at
    where (public.shelter_residents.record, public.shelter_residents.archived_at, public.shelter_residents.archive_kind, public.shelter_residents.deleted_at, public.shelter_residents.version)
      is distinct from (excluded.record, excluded.archived_at, excluded.archive_kind, excluded.deleted_at, excluded.version);
    if found then nr := nr + 1; end if;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_wa, '[]')) loop
    insert into public.shelter_legacy_warranty select * from jsonb_populate_record(null::public.shelter_legacy_warranty, x) on conflict (id) do nothing;
    if found then nw := nw + 1; end if;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_att, '[]')) loop
    insert into public.shelter_attachments(id, resident_slot, name, path, content_type, size_bytes, created_by, created_at)
    select (x->>'id')::uuid, r.slot, x->>'name', x->>'path', x->>'content_type', (x->>'size_bytes')::int, 'Floot', coalesce((x->>'created_at')::timestamptz, now())
    from public.shelter_residents r where r.floot_slot = (x->>'resident_slot')::int
    on conflict (id) do nothing;
    if found then na := na + 1; end if;
  end loop;
  insert into private.shelter_sync_log(result) values (jsonb_build_object('residents', nr, 'warranty', nw, 'attachments', na)) on conflict do nothing;
  return jsonb_build_object('residents', nr, 'warranty', nw, 'attachments', na, 'at', now());
end $$;

revoke all on function public.shelter_sync_state(), public.shelter_sync(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.shelter_sync_state(), public.shelter_sync(jsonb, jsonb, jsonb) to authenticated;

-- رفع مرفقات Floot الجديدة: لحساب الربط فقط
drop policy if exists sh_files_sync on storage.objects;
create policy sh_files_sync on storage.objects for insert to authenticated with check (bucket_id = 'shelter' and auth.uid() = (select private.sh_sync_uid()));

-- التعديل في Floot فقط حاليًا: إيقاف دوال التعديل في برنامجنا (تبقى جاهزة ليوم التحويل الكامل)
revoke execute on function public.shelter_save(int, int, jsonb), public.shelter_delete(int, int), public.shelter_restore(int, int), public.shelter_attach(int, text, text, text, int), public.shelter_passport(text) from authenticated;
drop policy if exists sh_files_write on storage.objects;

-- وقت آخر ربط ناجح يظهر في صفحة الإيواء
create or replace function public.shelter_last_sync() returns timestamptz language sql stable security definer set search_path = '' as $$
  select case when private.sh_can('view') then (select max(at) from private.shelter_sync_log) end
$$;
grant execute on function public.shelter_last_sync() to authenticated;
