-- Claude · 15 Nov 2026 · آراء العملاء: العميل المسجّل يكتب رأيه (نجوم + تعليق) ويظهر في الصفحة الرئيسية
-- الجوال محفوظ للإدارة فقط ولا يظهر للعامة · رأي واحد لكل جوال (الجديد يحلّ محل القديم) · الإدارة تقدر تخفي أي رأي
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 500),
  hidden boolean not null default false,
  hidden_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now());
alter table public.reviews enable row level security;  -- لا وصول مباشر: كل شيء عبر الدوال

create or replace function public.review_add(p_name text, p_phone text, p_rating int, p_comment text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare ph text := translate(trim(coalesce(p_phone,'')), '٠١٢٣٤٥٦٧٨٩', '0123456789'); nm text := left(trim(coalesce(p_name,'')), 60); c text := left(trim(coalesce(p_comment,'')), 500); r public.reviews;
begin
  if ph !~ '^05[0-9]{8}$' then raise exception 'سجّل الدخول برقم جوالك أولًا'; end if;
  if nm = '' then raise exception 'الاسم مطلوب'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'اختر عدد النجوم'; end if;
  if char_length(c) < 3 then raise exception 'اكتب تعليقك'; end if;
  select * into r from public.reviews where phone = ph;
  if r.id is not null and r.updated_at > now() - interval '2 minutes' then raise exception 'انتظر قليلًا قبل تعديل رأيك'; end if;
  if (select count(*) from public.reviews where created_at > now() - interval '1 hour') > 60 then raise exception 'حاول لاحقًا'; end if;
  insert into public.reviews (phone, name, rating, comment) values (ph, nm, p_rating, c)
  on conflict (phone) do update set name = excluded.name, rating = excluded.rating, comment = excluded.comment, updated_at = now(), hidden = public.reviews.hidden and public.reviews.hidden_by is not null;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.review_add(text, text, int, text) to anon, authenticated;

create or replace function public.reviews_public() returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'avg', (select round(avg(rating)::numeric, 1) from public.reviews where not hidden),
    'n', (select count(*) from public.reviews where not hidden),
    'items', (select coalesce(jsonb_agg(x order by x->>'at' desc), '[]') from (
      select jsonb_build_object('name', split_part(name, ' ', 1) || case when position(' ' in name) > 0 then ' ' || left(split_part(name, ' ', 2), 1) || '.' else '' end,
        'rating', rating, 'comment', comment, 'at', updated_at) x
      from public.reviews where not hidden order by updated_at desc limit 30) q))
$$;
grant execute on function public.reviews_public() to anon, authenticated;

create or replace function public.reviews_admin() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not (private.is_manager() or private.can_stage('marketing')) then raise exception 'no_perm' using hint = 'لمن لديه صلاحية «الرد الآلي والدعاية»'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(r) order by r.updated_at desc), '[]') from public.reviews r);
end $$;
create or replace function public.review_hide(p_id uuid, p_hide boolean) returns void
language plpgsql security definer set search_path to '' as $$
declare who text; r public.reviews;
begin
  if not (private.is_manager() or private.can_stage('marketing')) then raise exception 'no_perm' using hint = 'لمن لديه صلاحية «الرد الآلي والدعاية»'; end if;
  select name into who from public.staff where id = auth.uid();
  update public.reviews set hidden = p_hide, hidden_by = case when p_hide then who end where id = p_id returning * into r;
  perform private.audit('تعديل', 'آراء العملاء', 'رأي ' || coalesce(r.name,'') || ' (' || r.rating || ' نجوم)', case when p_hide then 'ظاهر' else 'مخفي' end, case when p_hide then 'مخفي' else 'ظاهر' end);
end $$;
revoke execute on function public.reviews_admin(), public.review_hide(uuid, boolean) from public, anon;
grant execute on function public.reviews_admin(), public.review_hide(uuid, boolean) to authenticated;
