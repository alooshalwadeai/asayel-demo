-- حساب العميل: صندوق الحجز يعرض المرحلة الحالية للعاملة (من متابعة الاستقدام) مع موعد الرحلة وطريقة الاستلام
create or replace function asayel_booking.view_hold(h asayel_booking.holds) returns jsonb language sql stable set search_path to 'pg_catalog' as $function$
 select (to_jsonb(h)-'owner_digest') || jsonb_build_object('expired',h.expires<=now(),'cancelled',
   exists(select 1 from public.rec_orders o where o.id::text=h.id and o.status='cancelled'))
 || coalesce((select jsonb_build_object('stage', o.stage, 'paid', o.status = 'paid', 'stage_at', o.stage_at,
      'flight_date', o.flight_date, 'flight_city', o.flight_city, 'receipt_method', o.receipt_method)
    from public.rec_orders o where o.id::text = h.id), '{}'::jsonb)
$function$;
