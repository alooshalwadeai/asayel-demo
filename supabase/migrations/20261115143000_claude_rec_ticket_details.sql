-- «✓ حُجزت التذكرة»: الموظف يكتب تاريخ التذكرة (الرحلة) ومدينة الوصول ثم ينتقل الطلب لمرحلة «الوصول للمطار»
alter table public.rec_orders add column if not exists flight_date date;

create or replace function public.rec_ticket(p_id uuid, p_date date, p_city text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; c text := btrim(coalesce(p_city, ''));
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.stage <> 5 then raise exception 'تسجيل التذكرة بعد صدور الباركود فقط'; end if;
  if not private.can_stage_nat('v6', o.nat) then raise exception 'no_perm' using hint = 'مرحلة «التذكرة» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if p_date is null then raise exception 'اكتب تاريخ التذكرة'; end if;
  if char_length(c) < 2 or char_length(c) > 40 then raise exception 'اختر مدينة الوصول'; end if;
  update public.rec_orders set flight_date = p_date, destination = c, updated_at = now() where id = p_id;
  perform private.audit('تعديل', 'متابعة الاستقدام', 'تذكرة طلب #' || o.ref || ' · ' || coalesce(o.cust_name, ''), coalesce(o.destination, '—'), to_char(p_date, 'YYYY-MM-DD') || ' · ' || c);
  return public.rec_stage(p_id, 6);
end $$;
revoke all on function public.rec_ticket(uuid, date, text) from public, anon;
grant execute on function public.rec_ticket(uuid, date, text) to authenticated;
