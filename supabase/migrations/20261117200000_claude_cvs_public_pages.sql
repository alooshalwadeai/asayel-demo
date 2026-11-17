-- بطلب المستخدم: العميل يرى السيرة الذاتية الأصلية كما أُسقطت (بصورها) ليختار بالطريقة الصحيحة، بدل النسخة المولّدة
create or replace function public.cvs_public() returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', n, 'co', co, 'age', age, 'ex', ex, 'lg', lg, 'sk', sk, 'sal', sal, 'rel', rel, 'pp', pp, 'photo', photo, 'pages', pages) order by created_at), '[]')
  from public.cvs;
$$;
