-- حفظ السير الذاتية المسقطة (بالجملة أو واحدة واحدة) بشكل دائم، مع صورتها وصفحاتها والملف الأصلي
-- الموظفون يرون كل البيانات؛ العملاء يرون البيانات العامة فقط عبر cvs_public() (بدون رقم الجواز والوكيل وصفحات السيرة الأصلية والملف الأصلي — العميل يرى سيرة المكتب المولّدة)
create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  n text not null check (char_length(n) between 2 and 80),
  co text not null check (char_length(co) between 2 and 40),
  age int, ex int,
  lg text, sk text,
  sal numeric not null default 0 check (sal >= 0),
  ag text, pp text,
  rel text check (rel is null or rel in ('مسلمة', 'مسيحية', 'غير مسلمة')),
  photo text,                       -- مسار الصورة داخل مخزن cvs
  pages jsonb not null default '[]', -- [{p: مسار الصفحة, w, h}]
  file text, file_name text,        -- الملف الأصلي (للموظفين فقط)
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists cvs_pp_uniq on public.cvs (upper(pp)) where pp is not null and pp <> '';
alter table public.cvs enable row level security;
drop policy if exists cvs_staff_read on public.cvs;
create policy cvs_staff_read on public.cvs for select to authenticated using ((select private.is_staff()));
drop policy if exists cvs_staff_add on public.cvs;
create policy cvs_staff_add on public.cvs for insert to authenticated with check ((select private.is_staff()));
drop policy if exists cvs_edit on public.cvs;
create policy cvs_edit on public.cvs for update to authenticated using ((select private.can_stage('cv_edit')) or (select private.is_manager())) with check ((select private.can_stage('cv_edit')) or (select private.is_manager()));
drop policy if exists cvs_del on public.cvs;
create policy cvs_del on public.cvs for delete to authenticated using ((select private.is_manager()));

create or replace function public.cvs_public() returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', n, 'co', co, 'age', age, 'ex', ex, 'lg', lg, 'sk', sk, 'sal', sal, 'rel', rel, 'photo', photo) order by created_at), '[]')
  from public.cvs;
$$;
grant execute on function public.cvs_public() to anon, authenticated;

-- مخزن الملفات: قراءة عامة (الصور وصفحات السيرة تظهر للعملاء)، والرفع للموظفين، والتعديل لصاحب صلاحية cv_edit، والحذف للمدير
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', true) on conflict (id) do update set public = true;
drop policy if exists cvs_files_add on storage.objects;
create policy cvs_files_add on storage.objects for insert to authenticated with check (bucket_id = 'cvs' and (select private.is_staff()));
drop policy if exists cvs_files_edit on storage.objects;
create policy cvs_files_edit on storage.objects for update to authenticated using (bucket_id = 'cvs' and ((select private.can_stage('cv_edit')) or (select private.is_manager())));
drop policy if exists cvs_files_del on storage.objects;
create policy cvs_files_del on storage.objects for delete to authenticated using (bucket_id = 'cvs' and (select private.is_manager()));
-- الموظفون يحتاجون عرض قائمة ملفات السيرة حتى يحذف المدير ملفاتها مع السيرة
drop policy if exists cvs_files_staff_list on storage.objects;
create policy cvs_files_staff_list on storage.objects for select to authenticated using (bucket_id = 'cvs' and (select private.is_staff()));
