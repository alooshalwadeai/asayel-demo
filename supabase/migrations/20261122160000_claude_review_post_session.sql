-- آراء العملاء: لا يُسجَّل رأي إلا من عميل له حساب ومسجّل دخوله (جلسة صحيحة) — طلب علي 22/11/2026
-- كانت review_add تقبل أي رقم جوال بدون تحقق، فيمكن لأي أحد كتابة رأي باسم رقم آخر.
-- الدالة الجديدة review_post تأخذ رمز الجلسة، وتأخذ الاسم والجوال من حساب العميل نفسه.
create or replace function public.review_post(p_token text, p_rating integer, p_comment text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s private.cust_sessions; a public.cust_accounts; c text := left(trim(coalesce(p_comment, '')), 500); r public.reviews; nm text;
begin
  select * into s from private.cust_sessions where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256') and expires_at > now();
  if s.ph is null then raise exception 'سجّل الدخول بحسابك أولًا لكتابة رأيك'; end if;
  select * into a from public.cust_accounts where ph = s.ph;
  if a.ph is null then raise exception 'سجّل الدخول بحسابك أولًا لكتابة رأيك'; end if;
  nm := left(coalesce(nullif(trim(a.name), ''), 'عميل'), 60);
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'اختر عدد النجوم'; end if;
  if char_length(c) < 3 then raise exception 'اكتب تعليقك'; end if;
  select * into r from public.reviews where phone = a.ph;
  if r.id is not null and r.updated_at > now() - interval '2 minutes' then raise exception 'انتظر قليلًا قبل تعديل رأيك'; end if;
  if (select count(*) from public.reviews where created_at > now() - interval '1 hour') > 60 then raise exception 'حاول لاحقًا'; end if;
  insert into public.reviews (phone, name, rating, comment) values (a.ph, nm, p_rating, c)
  on conflict (phone) do update set name = excluded.name, rating = excluded.rating, comment = excluded.comment, updated_at = now(), hidden = public.reviews.hidden and public.reviews.hidden_by is not null;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.review_post(text, integer, text) from public;
grant execute on function public.review_post(text, integer, text) to anon, authenticated;
-- الطريقة القديمة (بدون تحقق) تُقفل
revoke execute on function public.review_add(text, text, integer, text) from public, anon, authenticated;
