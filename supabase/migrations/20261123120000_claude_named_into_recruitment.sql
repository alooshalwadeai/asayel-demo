-- «المعيّن بالاسم» يُربط بالاستقدام (طلب علي 23/11/2026، باختياره: الحساب عند الوصول للمطار، نفس متابعة الاستقدام، نفس سعر «جديدة»)
-- بعد سداد مساند: الموظف يقرأ بيانات العاملة من جوازها، ويختار الوكيل حسب جنسيتها، ويكتب رقم العقد
-- → يُنشأ طلب استقدام (named = true) يدخل «متابعة الاستقدام» و«بيان الشغل في الدول»
-- → يُحسب على الوكيل عند الوصول للمطار مثل أي بنت استقدام، بسعر «جديدة» لجنسيتها (أو سعر الرجالي للعامل)
-- تسعير الطلب للعميل يبقى كما هو.
alter table public.rec_orders add column if not exists named boolean not null default false;
alter table public.rec_orders add column if not exists src_req uuid references public.cust_requests(id) on delete set null;
alter table public.rec_orders add column if not exists religion text;
alter table public.rec_orders add column if not exists worker_gender text;
alter table public.rec_orders add column if not exists worker_dob date;
create unique index if not exists rec_orders_src_req_uq on public.rec_orders(src_req) where src_req is not null;

create or replace function public.named_to_rec(p_id uuid, p_agent uuid, p_worker text, p_passport text, p_nat text,
  p_rel text default null, p_mno text default null, p_dob date default null, p_gender text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.cust_requests; p jsonb; a public.agents; o public.rec_orders; who text; mno text; ph text; base numeric; nat text := btrim(coalesce(p_nat, ''));
begin
  if not exists (select 1 from public.staff s where s.id = auth.uid() and s.active) then raise exception 'للموظفين فقط'; end if;
  if not private.can_stage_nat('nm_paid', nat) then raise exception 'no_perm:nm_paid' using hint = 'ليس لديك صلاحية تسجيل سداد مساند للمعيّن بالاسم'; end if;
  select * into r from public.cust_requests where id = p_id for update;
  if r.id is null or r.kind <> 'named' then raise exception 'الطلب غير موجود'; end if;
  if r.status = 'cancelled' then raise exception 'الطلب ملغي'; end if;
  if exists (select 1 from public.rec_orders x where x.src_req = p_id) then raise exception 'تم نقل هذا الطلب للاستقدام من قبل'; end if;
  if btrim(coalesce(p_worker, '')) = '' then raise exception 'اكتب اسم العاملة كما في الجواز'; end if;
  if btrim(coalesce(p_passport, '')) = '' then raise exception 'اكتب رقم الجواز'; end if;
  if nat = '' then raise exception 'اختر الجنسية'; end if;
  select * into a from public.agents where id = p_agent and active;
  if a.id is null then raise exception 'اختر الوكيل الخارجي'; end if;
  mno := translate(btrim(coalesce(p_mno, '')), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  if mno !~ '^[0-9]{8,9}$' then raise exception 'رقم العقد في مساند من 8 إلى 9 أرقام'; end if;
  p := coalesce(r.pricing, '{}'::jsonb);
  ph := coalesce(nullif(r.data->>'account', ''), nullif(r.data->>'phone', ''), '');
  base := coalesce(nullif(p->>'base', '')::numeric, 0) + coalesce(nullif(p->>'fee', '')::numeric, 0);
  select name into who from public.staff where id = auth.uid();
  perform set_config('asayel.stage', '1', true);
  insert into public.rec_orders(cust_name, cust_phone, visa, worker_name, nat, base, list_base, ins_name, ins_price, vat_rate, vat, total,
      status, stage, contract_at, stage_at, stage_by, destination, worker_passport, musaned_no, agent_name, named, src_req, religion, worker_gender, worker_dob)
  values (coalesce(nullif(r.data->>'name', ''), 'عميل'), ph, nullif(r.data->>'visa', ''), upper(btrim(p_worker)), nat, base, base,
      nullif(p->>'ins_name', ''), coalesce(nullif(p->>'ins_price', '')::numeric, 0), coalesce(nullif(p->>'vat_rate', '')::numeric, 15),
      coalesce(nullif(p->>'vat', '')::numeric, 0), coalesce(nullif(p->>'total', '')::numeric, 0),
      'paid', 2, now(), now(), who, nullif(r.data->>'dest', ''), upper(btrim(p_passport)), mno, a.name, true, p_id,
      nullif(btrim(coalesce(p_rel, '')), ''), coalesce(nullif(p_gender, ''), p->>'g', r.data->>'gender'), p_dob)
  returning * into o;
  update public.cust_requests set status = 'done',
    track = jsonb_build_object('ag', a.name, 'no', mno, 'at', now(), 'by', who, 'st', 2, 'rec', o.id, 'ref', o.ref),
    staff_note = left('نُقل للاستقدام · طلب #' || o.ref || ' · الوكيل: ' || a.name || ' · عقد ' || mno, 300), updated_at = now()
  where id = p_id;
  perform private.audit('اعتماد', 'المعاينة باسم', 'طلب ' || coalesce(r.data->>'name', '') || ' · العاملة ' || o.worker_name || ' · الوكيل ' || a.name, 'بانتظار السداد', 'متابعة الاستقدام #' || o.ref);
  return jsonb_build_object('ok', true, 'ref', o.ref, 'id', o.id);
end $$;
revoke all on function public.named_to_rec(uuid, uuid, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.named_to_rec(uuid, uuid, text, text, text, text, text, date, text) to authenticated;

-- لم يعد المعيّن بالاسم يُحسب على الوكيل وقت التسعير؛ يُحسب عند الوصول للمطار من طلب الاستقدام
create or replace function private.named_to_agent()
returns trigger language plpgsql security definer set search_path = '' as $$
declare e public.agent_entries;
begin
  if new.kind <> 'named' then return new; end if;
  select * into e from public.agent_entries where src_req = new.id;
  if e.id is not null and not e.void and e.by_name = 'تلقائي' then
    update public.agent_entries set void = true, void_reason = 'يُحسب على الوكيل عند الوصول للمطار مع طلب الاستقدام', voided_by = 'تلقائي', voided_at = now() where id = e.id;
  end if;
  return new;
end $$;

-- الوكيل المختار في الطلب أولًا، والعامل الذكر بسعر الرجالي
create or replace function private.rec_to_agent()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare cv public.cvs; ag text; a public.agents; e public.agent_entries; c text; amt numeric; v_pp text; td date := (now() at time zone 'Asia/Riyadh')::date;
begin
  select * into e from public.agent_entries where src_order = new.id;
  if new.status <> 'paid' or new.stage < 7 then
    if e.id is not null and not e.void and e.by_name = 'تلقائي' then
      update public.agent_entries set void = true, void_reason = case when new.status = 'cancelled' then 'أُلغي طلب الاستقدام' else 'رجع الطلب لما قبل الوصول للمطار' end,
        voided_by = 'تلقائي', voided_at = now() where id = e.id;
    end if;
    return new;
  end if;
  if old.stage >= 7 and old.status = 'paid' then return new; end if;
  v_pp := nullif(upper(trim(coalesce(new.worker_passport, ''))), '');
  select * into cv from public.cvs x
   where (v_pp is not null and upper(x.pp) = v_pp) or (x.n = new.worker_name and x.co = new.nat)
   order by (v_pp is not null and upper(x.pp) = v_pp) desc, x.created_at desc limit 1;
  ag := nullif(trim(coalesce(new.agent_name, '')), '');
  if ag is null then ag := nullif(nullif(trim(coalesce(cv.ag, '')), '—'), ''); end if;
  if ag is null then
    select nullif(nullif(trim(p.details->>'ag'), '—'), '') into ag from asayel_booking.profiles p
     where (v_pp is not null and p.passport = v_pp) or (p.worker = new.worker_name and p.nat = new.nat) limit 1;
  end if;
  if ag is null then return new; end if;
  select * into a from public.agents x where x.name = ag;
  if a.id is null then select * into a from public.agents x where private.nat_norm(x.name) = private.nat_norm(ag) order by x.active desc limit 1; end if;
  if a.id is null then return new; end if;
  c := case when new.worker_gender = 'ذكر' then 'male' when coalesce(cv.ex, 0) > 0 then 'exp' else 'new' end;
  amt := private.agent_rate(a.rates, a.male_rates, new.nat, c);
  v_pp := coalesce(v_pp, nullif(upper(trim(coalesce(cv.pp, ''))), ''));
  if e.id is null then
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
      case when new.named then 'معيّن-#' else 'استقدام-#' end || new.ref, new.cust_name, coalesce(nullif(new.flight_city, ''), new.destination), td,
      'أُضيف تلقائيًا عند الوصول للمطار · طلب #' || new.ref || case when new.named then ' (معيّن بالاسم)' else '' end, 'تلقائي', new.id);
  else
    update public.agent_entries set void = false, void_reason = null, voided_by = null, voided_at = null,
      arrival_date = coalesce(arrival_date, td), updated_by = 'تلقائي', updated_at = now() where id = e.id;
  end if;
  return new;
end $function$;

-- «بيان الشغل في الدول»: الخبرة «معيّن باسم» والديانة من الطلب
create or replace function public.rec_sheet()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.is_manager() or exists (select 1 from public.staff s where s.id = auth.uid() and s.active and s.perms && array['v1','v2','v3','v4','v5','v6','v7','v8','v9','rec_pay','rec_adj']::text[])) then
    raise exception 'no_perm' using hint = 'لمن لديه صلاحية مراحل الاستقدام';
  end if;
  return coalesce((select jsonb_agg(x order by x->>'agent', x->>'cdate', (x->>'ref')::int) from (
    select jsonb_build_object(
      'ref', o.ref, 'agent', coalesce(nullif(o.agent_name, ''), nullif(c.ag, ''), 'بدون وكيل'),
      'name', o.cust_name, 'visa', o.visa, 'nid', a.nid, 'ph', o.cust_phone, 'dob', a.dob,
      'mno', o.musaned_no, 'cdate', (o.contract_at at time zone 'Asia/Riyadh')::date,
      'stage', o.stage, 'status', o.status, 'med_fail', o.med_fail_at is not null,
      'rel', coalesce(o.religion, c.rel), 'ex', c.ex, 'named', o.named, 'ins', o.ins_name, 'worker', o.worker_name, 'pp', coalesce(o.worker_passport, c.pp),
      'stamp', o.stamp_date, 'city', coalesce(o.destination, o.flight_city), 'arrival', o.arrival_date, 'flight', o.flight_date,
      'legacy', o.legacy, 'nat', o.nat) x
    from public.rec_orders o
    left join public.cust_accounts a on a.ph = o.cust_phone
    left join lateral (select v.ag, v.rel, v.ex, v.pp from public.cvs v
      where (o.worker_passport is not null and v.pp = o.worker_passport) or v.n = o.worker_name
      order by (v.pp = o.worker_passport) desc nulls last limit 1) c on true
    where o.status <> 'cancelled' and (o.contract_at is not null or o.musaned_no is not null or o.stage >= 2)) q), '[]'::jsonb);
end $$;
