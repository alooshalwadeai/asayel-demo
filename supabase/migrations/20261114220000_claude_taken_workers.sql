-- Claude · 14 Nov 2026 · العاملات المرتبطة بطلب استقدام قائم لا تظهر متاحة في السير الذاتية (ومنها البديلة بعد الفحص الطبي)
create or replace function public.rec_taken() returns table(worker text, nat text)
language sql stable security definer set search_path to '' as $$
  select distinct o.worker_name, o.nat from public.rec_orders o where o.status <> 'cancelled' and coalesce(o.worker_name, '') <> ''
$$;
grant execute on function public.rec_taken() to anon, authenticated;
