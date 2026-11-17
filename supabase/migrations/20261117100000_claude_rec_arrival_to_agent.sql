-- عند «✓ وصلت المطار» تُضاف العاملة تلقائيًا لحساب مكتبها الخارجي («+ عاملة (مستحق له)»)
-- المكتب = اسم الوكيل في سيرتها (cvs.ag) مطابقًا لاسمه في «حسابات الوكلاء»، والمبلغ = سعره المتفق عليه لجنسيتها.
-- إن لم يكن له سعر لهذه الجنسية: يُضاف «بانتظار تحديد المبلغ» (ويُملأ تلقائيًا عند إضافة السعر).
-- إن رجع الطلب لما قبل الوصول أو أُلغي: يُلغى القيد التلقائي بسبب.

alter table public.agent_entries add column if not exists src_order uuid unique references public.rec_orders(id) on delete set null;

create or replace function private.rec_to_agent() returns trigger language plpgsql security definer set search_path to '' as $$
declare cv public.cvs; ag text; a public.agents; e public.agent_entries; c text; amt numeric; v_pp text; td date := (now() at time zone 'Asia/Riyadh')::date;
begin
  select * into e from public.agent_entries where src_order = new.id;
  -- رجوع لما قبل الوصول أو إلغاء الطلب: إلغاء القيد التلقائي
  if new.status <> 'paid' or new.stage < 7 then
    if e.id is not null and not e.void and e.by_name = 'تلقائي' then
      update public.agent_entries set void = true, void_reason = case when new.status = 'cancelled' then 'أُلغي طلب الاستقدام' else 'رجع الطلب لما قبل الوصول للمطار' end,
        voided_by = 'تلقائي', voided_at = now() where id = e.id;
    end if;
    return new;
  end if;
  if old.stage >= 7 and old.status = 'paid' then return new; end if;   -- كانت واصلة من قبل
  v_pp := nullif(upper(trim(coalesce(new.worker_passport, ''))), '');
  select * into cv from public.cvs x
   where (v_pp is not null and upper(x.pp) = v_pp) or (x.n = new.worker_name and x.co = new.nat)
   order by (v_pp is not null and upper(x.pp) = v_pp) desc, x.created_at desc limit 1;
  ag := nullif(nullif(trim(coalesce(cv.ag, '')), '—'), '');
  if ag is null then
    select nullif(nullif(trim(p.details->>'ag'), '—'), '') into ag from asayel_booking.profiles p
     where (v_pp is not null and p.passport = v_pp) or (p.worker = new.worker_name and p.nat = new.nat) limit 1;
  end if;
  if ag is null then return new; end if;
  select * into a from public.agents x where x.name = ag;
  if a.id is null then select * into a from public.agents x where private.nat_norm(x.name) = private.nat_norm(ag) order by x.active desc limit 1; end if;
  if a.id is null then return new; end if;            -- المكتب غير موجود في حسابات الوكلاء: تُضاف يدويًا
  c := case when coalesce(cv.ex, 0) > 0 then 'exp' else 'new' end;
  amt := private.agent_rate(a.rates, a.male_rates, new.nat, c);
  v_pp := coalesce(v_pp, nullif(upper(trim(coalesce(cv.pp, ''))), ''));
  if e.id is null then
    -- قيد يدوي سابق لنفس العاملة عند نفس المكتب: يُربط بدل التكرار
    select * into e from public.agent_entries x
     where x.agent_id = a.id and x.kind = 'charge' and not x.void and x.src_order is null and x.src_req is null
       and ((v_pp is not null and upper(x.passport) = v_pp) or (x.worker = new.worker_name and private.nat_norm(x.nat) = private.nat_norm(new.nat)))
     order by x.created_at desc limit 1;
    if e.id is not null then
      update public.agent_entries set src_order = new.id, arrival_date = coalesce(arrival_date, td), updated_at = now() where id = e.id;
      return new;
    end if;
    insert into public.agent_entries(agent_id, kind, cat, entry_date, amount, pending, worker, nat, passport, visa, req_ref, cust_name, destination, arrival_date, note, by_name, src_order)
    values (a.id, 'charge', c, td, coalesce(amt, 0), amt is null, new.worker_name, new.nat, v_pp, nullif(new.visa, ''),
      'استقدام-#' || new.ref, new.cust_name, coalesce(nullif(new.flight_city, ''), new.destination), td,
      'أُضيف تلقائيًا عند الوصول للمطار · طلب #' || new.ref, 'تلقائي', new.id);
  else
    update public.agent_entries set void = false, void_reason = null, voided_by = null, voided_at = null,
      arrival_date = coalesce(arrival_date, td), updated_by = 'تلقائي', updated_at = now() where id = e.id;
  end if;
  return new;
end $$;

drop trigger if exists rec_to_agent on public.rec_orders;
create trigger rec_to_agent after update of stage, status on public.rec_orders for each row execute function private.rec_to_agent();

-- «✓ وصلت المطار» يرجّع معه ما أُضيف لحساب الوكيل، لتعرضه الواجهة للموظف
create or replace function public.rec_arrived(p_id uuid, p_method text) returns jsonb language plpgsql security definer set search_path to '' as $function$
declare o public.rec_orders; r jsonb; ae jsonb; nm jsonb := '{"delivery":"شركة التسليم","office":"الاستلام من المكتب","sat":"الإرسال عن طريق النقل SAT"}'::jsonb;
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.stage <> 6 then raise exception 'تأكيد الوصول للمطار بعد حجز التذكرة فقط'; end if;
  if not private.can_stage_nat('v7', o.nat) then raise exception 'no_perm' using hint = 'مرحلة «الوصول للمطار» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if p_method is null or not (nm ? p_method) then raise exception 'اختر طريقة الاستلام'; end if;
  update public.rec_orders set receipt_method = p_method, updated_at = now() where id = p_id;
  perform private.audit('تعديل', 'متابعة الاستقدام', 'طريقة الاستلام · طلب #' || o.ref || ' · ' || coalesce(o.cust_name, ''), '—', nm->>p_method);
  r := public.rec_stage(p_id, 7);
  select jsonb_build_object('agent', a.name, 'amount', e.amount, 'currency', a.currency, 'pending', e.pending, 'nat', e.nat) into ae
    from public.agent_entries e join public.agents a on a.id = e.agent_id where e.src_order = p_id and not e.void;
  return r || jsonb_build_object('agent_entry', coalesce(ae, '{"missing":true}'::jsonb));
end $function$;

-- بيانات (بموافقة المستخدم 17/11/2026): اسم المكتب المقروء من السير «ALFARUQ» = «الفاروق» في حسابات الوكلاء
update public.cvs set ag = 'الفاروق', updated_at = now() where upper(trim(ag)) in ('ALFARUQ', 'REF. NO. ALFARUQ');
update asayel_booking.profiles set details = jsonb_set(details, '{ag}', '"الفاروق"') where upper(trim(details->>'ag')) in ('ALFARUQ', 'REF. NO. ALFARUQ');
