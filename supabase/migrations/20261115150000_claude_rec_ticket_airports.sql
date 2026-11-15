-- تذكرة العاملة: مطار الوصول من خمسة مطارات فقط (الرياض، جدة، الدمام، أبها، نجران)
-- يُحفظ في عمود مستقل flight_city، ولا يغيّر مدينة العميل (destination)
alter table public.rec_orders add column if not exists flight_city text;
alter table public.rec_orders drop constraint if exists rec_orders_flight_city_chk;
alter table public.rec_orders add constraint rec_orders_flight_city_chk check (flight_city is null or flight_city in ('الرياض','جدة','الدمام','أبها','نجران'));

create or replace function public.rec_ticket(p_id uuid, p_date date, p_city text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; c text := btrim(coalesce(p_city, ''));
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.stage <> 5 then raise exception 'تسجيل التذكرة بعد صدور الباركود فقط'; end if;
  if not private.can_stage_nat('v6', o.nat) then raise exception 'no_perm' using hint = 'مرحلة «التذكرة» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if p_date is null then raise exception 'اكتب تاريخ الرحلة'; end if;
  if c not in ('الرياض','جدة','الدمام','أبها','نجران') then raise exception 'اختر مطار الوصول: الرياض أو جدة أو الدمام أو أبها أو نجران'; end if;
  update public.rec_orders set flight_date = p_date, flight_city = c, updated_at = now() where id = p_id;
  perform private.audit('تعديل', 'متابعة الاستقدام', 'تذكرة طلب #' || o.ref || ' · ' || coalesce(o.cust_name, ''), '—', to_char(p_date, 'YYYY-MM-DD') || ' · مطار ' || c);
  return public.rec_stage(p_id, 6);
end $$;
revoke all on function public.rec_ticket(uuid, date, text) from public, anon;
grant execute on function public.rec_ticket(uuid, date, text) to authenticated;

-- تصحيح بيانات (نُفّذ مرة واحدة): الطلبان #5022 و#5029 سُجّلت تذكرتهما بالنسخة السابقة التي كتبت المطار مكان مدينة العميل
-- update public.rec_orders set flight_city = destination, destination = 'نجران' where ref in (5022, 5029) and flight_date is not null and flight_city is null;
