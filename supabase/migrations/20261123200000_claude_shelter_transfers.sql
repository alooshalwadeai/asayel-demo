-- نقل الخدمات (طلب علي 23/11/2026): عاملات الإيواء اللاتي في مسار النقل يظهرن في صفحة «نقل الخدمات»
-- المصدر بيانات الإيواء (من Floot): ترغب في تجربة النقل ← تحت التجربة لدى العميل الجديد ← تم النقل (آخر 90 يومًا)
-- القراءة لمن لديه صلاحية الإيواء أو صلاحية نقل الخدمات أو المدير
create or replace function public.shelter_transfers() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not (private.sh_can('view') or exists (select 1 from public.staff s where s.id = auth.uid() and s.active and 'transfer' = any(s.perms))) then
    raise exception 'no_perm' using hint = 'ليست لديك صلاحية نقل الخدمات';
  end if;
  perform private.sh_archive_departures();
  return coalesce((select jsonb_agg(jsonb_build_object('slot', r.slot, 'record', r.record, 'archiveKind', r.archive_kind, 'archivedAt', r.archived_at, 'updatedAt', r.updated_at)
      order by r.archived_at is not null, r.updated_at desc)
    from public.shelter_residents r where r.deleted_at is null and (
      (r.archived_at is null and r.record->>'status' in ('wants_transfer', 'transfer'))
      or (r.archive_kind = 'transferred' and r.archived_at > now() - interval '90 days'))), '[]'::jsonb);
end $$;
revoke all on function public.shelter_transfers() from public, anon;
grant execute on function public.shelter_transfers() to authenticated;
