-- «✓ وصلت المطار»: الموظف يحدد طريقة استلام العميل للعاملة ثم ينتقل الطلب لمرحلة «الوصول للمطار»
--   delivery = شركة التسليم (العميل في نفس مدينة المطار)
--   office   = يستلمها العميل من المكتب في نجران
--   sat      = إرسالها للعميل عن طريق النقل SAT
alter table public.rec_orders add column if not exists receipt_method text;
alter table public.rec_orders drop constraint if exists rec_orders_receipt_method_chk;
alter table public.rec_orders add constraint rec_orders_receipt_method_chk check (receipt_method is null or receipt_method in ('delivery','office','sat'));

create or replace function public.rec_arrived(p_id uuid, p_method text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; nm jsonb := '{"delivery":"شركة التسليم","office":"الاستلام من المكتب","sat":"الإرسال عن طريق النقل SAT"}'::jsonb;
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.stage <> 6 then raise exception 'تأكيد الوصول للمطار بعد حجز التذكرة فقط'; end if;
  if not private.can_stage_nat('v7', o.nat) then raise exception 'no_perm' using hint = 'مرحلة «الوصول للمطار» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if p_method is null or not (nm ? p_method) then raise exception 'اختر طريقة الاستلام'; end if;
  update public.rec_orders set receipt_method = p_method, updated_at = now() where id = p_id;
  perform private.audit('تعديل', 'متابعة الاستقدام', 'طريقة الاستلام · طلب #' || o.ref || ' · ' || coalesce(o.cust_name, ''), '—', nm->>p_method);
  return public.rec_stage(p_id, 7);
end $$;
revoke all on function public.rec_arrived(uuid, text) from public, anon;
grant execute on function public.rec_arrived(uuid, text) to authenticated;
