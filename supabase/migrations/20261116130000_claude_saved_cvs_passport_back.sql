-- قرار المستخدم بعد السؤال: رقم الجواز يُحفظ ويظهر في بطاقة العاملة للموظفين والعملاء مع الدولة والديانة
alter table public.cvs add column if not exists pp text;
create unique index if not exists cvs_pp_uniq on public.cvs (upper(pp)) where pp is not null and pp <> '';
create or replace function public.cvs_public() returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', n, 'co', co, 'age', age, 'ex', ex, 'lg', lg, 'sk', sk, 'sal', sal, 'rel', rel, 'pp', pp, 'photo', photo) order by created_at), '[]')
  from public.cvs;
$$;
grant execute on function public.cvs_public() to anon, authenticated;
