-- العاملة لم تجتز الفحص الطبي: الموظف يسجّل ذلك، فيظهر للعميل في صفحة طلبه تنبيه + العاملات المتاحات
-- من نفس الجنسية والديانة، فيختار بديلة وتُربط بطلبه مباشرة (أو يعطي الموظف رقم جواز العاملة ليغيّرها).
-- بعد اختيار البديلة (أو تغييرها من الموظف) تختفي القائمة.

alter table public.rec_orders add column if not exists med_fail_at timestamptz, add column if not exists med_fail_reason text;

-- الموظف: «لم تجتز الفحص · اطلب من العميل اختيار بديلة»
create or replace function public.rec_medical_fail(p_id uuid, p_reason text default null) returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; who text; why text := coalesce(nullif(trim(p_reason), ''), 'لم تجتز الفحص الطبي');
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null or o.status <> 'paid' then raise exception 'الطلب غير موجود أو لم يُسدَّد'; end if;
  if o.stage not in (2, 3) then raise exception 'متاح في مرحلة «الفحص الطبي» فقط'; end if;
  if not private.can_stage_nat('med_swap', o.nat) then raise exception 'no_perm' using hint = 'ليس لديك صلاحية استبدال العاملة بعد الفحص الطبي' || coalesce(' لجنسية ' || o.nat, ''); end if;
  select name into who from public.staff where id = auth.uid();
  update public.rec_orders set med_fail_at = now(), med_fail_reason = left(why, 150), updated_at = now() where id = p_id;
  insert into public.removed_workers (worker, nat, order_id, reason, by_name, passport) values (o.worker_name, o.nat, o.id, why, who, o.worker_passport) on conflict (worker, nat) do nothing;
  perform private.audit('تعديل', 'متابعة الاستقدام', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name, '') || ' · ' || o.worker_name || ' لم تجتز الفحص الطبي', '—', 'بانتظار اختيار العميل للبديلة');
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;
revoke all on function public.rec_medical_fail(uuid, text) from public, anon;
grant execute on function public.rec_medical_fail(uuid, text) to authenticated;

-- العاملات المتاحات للاستبدال: نفس الجنسية والديانة، غير محجوزات ولا ملغيات
create or replace function private.med_options(o public.rec_orders) returns jsonb language sql stable security definer set search_path to '' as $$
  with old as (select x.rel from public.cvs x where (o.worker_passport is not null and upper(x.pp) = upper(o.worker_passport)) or (x.n = o.worker_name and x.co = o.nat) order by x.created_at desc limit 1)
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'n', c.n, 'co', c.co, 'age', c.age, 'ex', c.ex, 'rel', c.rel, 'sal', c.sal, 'lg', c.lg, 'sk', c.sk, 'pp', c.pp, 'photo', c.photo) order by c.created_at desc), '[]')
  from public.cvs c
  where c.co = o.nat
    and ((select rel from old) is null or c.rel is not distinct from (select rel from old))
    and not (c.n = o.worker_name and c.co = o.nat)
    and not exists (select 1 from asayel_booking.occupied() b where b.worker = c.n and b.nat = c.co)
    and not exists (select 1 from public.removed_workers r where (r.worker = c.n and r.nat = c.co) or (c.pp is not null and r.passport = upper(c.pp)))
    and not exists (select 1 from public.rec_orders x where x.status <> 'cancelled' and ((x.worker_name = c.n and x.nat = c.co) or (c.pp is not null and upper(x.worker_passport) = upper(c.pp))))
$$;
revoke all on function private.med_options(public.rec_orders) from public, anon, authenticated;

-- العميل (بمفتاح حجزه): هل يلزمه اختيار بديلة؟ وما العاملات المتاحات؟
create or replace function public.cust_medical_options(p_id uuid, p_key uuid) returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare o public.rec_orders;
begin
  if not exists (select 1 from asayel_booking.holds h where h.id = p_id::text and h.owner_digest = sha256(uuid_send(p_key))) then raise exception 'تعذّر الوصول إلى الحجز'; end if;
  select * into o from public.rec_orders where id = p_id;
  if o.id is null or o.med_fail_at is null or o.status <> 'paid' or o.stage not in (2, 3) then return jsonb_build_object('failed', false); end if;
  return jsonb_build_object('failed', true, 'old', o.worker_name, 'nat', o.nat, 'reason', o.med_fail_reason, 'options', private.med_options(o));
end $$;

-- العميل يختار البديلة: تُربط بطلبه مباشرة
create or replace function public.cust_medical_pick(p_id uuid, p_key uuid, p_cv uuid) returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; cv public.cvs; pp text;
begin
  if not exists (select 1 from asayel_booking.holds h where h.id = p_id::text and h.owner_digest = sha256(uuid_send(p_key))) then raise exception 'تعذّر الوصول إلى الحجز'; end if;
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null or o.med_fail_at is null or o.status <> 'paid' or o.stage not in (2, 3) then raise exception 'لا يوجد طلب استبدال على هذا الحجز'; end if;
  if not exists (select 1 from jsonb_array_elements(private.med_options(o)) e where (e->>'id')::uuid = p_cv) then raise exception 'هذه العاملة لم تعد متاحة · اختر غيرها'; end if;
  select * into cv from public.cvs where id = p_cv;
  pp := nullif(upper(trim(coalesce(cv.pp, ''))), '');
  perform pg_advisory_xact_lock(2, hashtext(cv.n || '/' || cv.co));
  if o.worker_passport is not null then insert into asayel_booking.rejected values (o.id, o.worker_passport, o.worker_name, o.nat) on conflict do nothing; end if;
  perform set_config('asayel.medswap', '1', true);
  update public.rec_orders set worker_name = cv.n, worker_passport = pp, med_fail_at = null, updated_at = now(),
    replaced = replaced || jsonb_build_array(jsonb_build_object('from', o.worker_name, 'to', cv.n, 'pp', pp, 'reason', coalesce(o.med_fail_reason, 'لم تجتز الفحص الطبي'), 'by', 'اختيار العميل', 'at', now()))
  where id = p_id;
  perform set_config('asayel.medswap', '', true);
  update asayel_booking.holds set worker = cv.n where id = p_id::text;
  insert into public.audit_log(actor, action, section, details, before, after)
  values ('العميل', 'تغيير العاملة', 'متابعة الاستقدام', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name, '') || ' · اختار العميل البديلة بعد الفحص الطبي', o.worker_name || ' · ' || o.nat, cv.n || ' · ' || cv.co || coalesce(' · جواز ' || pp, ''));
  return jsonb_build_object('ok', true, 'worker', cv.n);
end $$;
revoke all on function public.cust_medical_options(uuid, uuid), public.cust_medical_pick(uuid, uuid, uuid) from public;
grant execute on function public.cust_medical_options(uuid, uuid), public.cust_medical_pick(uuid, uuid, uuid) to anon, authenticated;

-- تغيير الموظف للعاملة (برقم الجواز الذي أعطاه العميل) يُنهي طلب الاستبدال أيضًا
do $$ declare d text; begin
  select pg_get_functiondef('public.rec_medical_swap(uuid,text,text,text)'::regprocedure) into d;
  d := replace(d, 'update public.rec_orders set worker_name = w, worker_passport = pp, updated_at = now(),', 'update public.rec_orders set worker_name = w, worker_passport = pp, med_fail_at = null, updated_at = now(),');
  if position('med_fail_at = null' in d) = 0 then raise exception 'rec_medical_swap pattern not found'; end if;
  execute d;
end $$;

-- حساب العميل يعرف أن هناك طلب استبدال
create or replace function asayel_booking.view_hold(h asayel_booking.holds) returns jsonb language sql stable set search_path to 'pg_catalog' as $function$
 select (to_jsonb(h)-'owner_digest') || jsonb_build_object('expired',h.expires<=now(),'cancelled',
   exists(select 1 from public.rec_orders o where o.id::text=h.id and o.status='cancelled'))
 || coalesce((select jsonb_build_object('stage', o.stage, 'paid', o.status = 'paid', 'stage_at', o.stage_at,
      'flight_date', o.flight_date, 'flight_city', o.flight_city, 'receipt_method', o.receipt_method,
      'contract', o.contract_at is not null or o.stage >= 2, 'med_fail', o.med_fail_at is not null, 'worker_now', o.worker_name)
    from public.rec_orders o where o.id::text = h.id), '{}'::jsonb)
$function$;
