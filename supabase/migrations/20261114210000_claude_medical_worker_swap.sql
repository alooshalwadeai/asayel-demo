-- Claude · 14 Nov 2026 · تغيير العاملة في مرحلة «الفحص الطبي»
-- البديلة من نفس الجنسية ومتاحة · العاملة السابقة تُلغى نهائيًا من البرنامج (لا تظهر في السير الذاتية) · العميل يرى العاملة الجديدة في صفحته
create table if not exists public.removed_workers (
  worker text not null, nat text not null, order_id uuid, reason text, by_name text, at timestamptz not null default now(),
  primary key (worker, nat));
alter table public.removed_workers enable row level security;
drop policy if exists rmw_read on public.removed_workers;
create policy rmw_read on public.removed_workers for select to anon, authenticated using (true);

alter table public.rec_orders add column if not exists replaced jsonb not null default '[]';

-- القفل بعد العقد يسمح فقط بتغيير الفحص الطبي من الدالة الخاصة به
create or replace function private.recorder_guard() returns trigger
language plpgsql security definer set search_path to '' as $$
declare st jsonb := '{"new":"جديد","paid":"مدفوع","cancelled":"ملغي"}'::jsonb;
  locked boolean := old.contract_at is not null or old.stage >= 2;
  med boolean := coalesce(current_setting('asayel.medswap', true), '') = '1';
begin
  if new.status is distinct from old.status then
    if new.status = 'paid' then new.stage := greatest(new.stage, case when new.contract_at is not null then 2 else 1 end); new.stage_at := now();
    elsif new.status = 'new' then
      if locked then raise exception 'locked' using hint = 'لا يمكن إرجاع الطلب لما قبل السداد بعد العقد في مساند'; end if;
      new.stage := 0;
    end if;
  end if;
  if auth.uid() is null or not exists (select 1 from public.staff s where s.id = auth.uid()) then return new; end if;
  if new.status is distinct from old.status then
    if not private.can_stage_nat('rec_pay', new.nat) then raise exception 'no_perm:rec_pay' using hint = 'ليس لديك صلاحية تغيير حالة السداد' || coalesce(' لجنسية ' || new.nat, ''); end if;
    if new.status = 'cancelled' and locked and not private.is_manager() then raise exception 'locked' using hint = 'إلغاء الطلب بعد العقد في مساند للمدير فقط'; end if;
    perform private.audit('تغيير مرحلة', 'الحجز والسداد', 'طلب #' || new.ref || ' · ' || coalesce(new.cust_name,'') || ' · ' || coalesce(new.nat,''), coalesce(st->>old.status, old.status), coalesce(st->>new.status, new.status));
  end if;
  if (new.base, new.discount, new.ins_name, new.ins_price, new.worker_name, new.nat) is distinct from (old.base, old.discount, old.ins_name, old.ins_price, old.worker_name, old.nat) then
    if med and (new.base, new.discount, new.ins_name, new.ins_price, new.nat) is not distinct from (old.base, old.discount, old.ins_name, old.ins_price, old.nat) then null;
    else
      if locked then raise exception 'locked' using hint = 'لا يمكن تعديل المبلغ أو الخصم أو تغيير العاملة بعد العقد في مساند'; end if;
      if coalesce(current_setting('asayel.swap', true), '') <> '1' then
        if not private.can_stage_nat('rec_adj', new.nat) then raise exception 'no_perm:rec_adj' using hint = 'ليس لديك صلاحية تعديل المبلغ' || coalesce(' لجنسية ' || new.nat, ''); end if;
        perform private.audit('تعديل', 'الحجز والسداد', 'طلب #' || new.ref || ' · ' || coalesce(new.cust_name,''), old.total::text, new.total::text);
      end if;
    end if;
  end if;
  if (new.stage, new.contract_at) is distinct from (old.stage, old.contract_at) and coalesce(current_setting('asayel.stage', true), '') <> '1' and new.status is not distinct from old.status then
    raise exception 'المرحلة تتغيّر من «متابعة الاستقدام» فقط';
  end if;
  return new;
end $$;

create or replace function public.rec_medical_swap(p_id uuid, p_worker text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; w text := trim(coalesce(p_worker,'')); who text; why text := coalesce(nullif(trim(p_reason),''), 'لم تجتز الفحص الطبي');
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null or o.status <> 'paid' then raise exception 'الطلب غير موجود أو لم يُسدَّد'; end if;
  if o.stage <> 3 then raise exception 'تغيير العاملة متاح في مرحلة «الفحص الطبي» فقط'; end if;
  if not private.can_stage_nat('med_swap', o.nat) then raise exception 'no_perm' using hint = 'ليس لديك صلاحية استبدال العاملة بعد الفحص الطبي' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if w = '' then raise exception 'اختر العاملة البديلة'; end if;
  if w = o.worker_name then raise exception 'هذه هي العاملة الحالية'; end if;
  if exists (select 1 from public.removed_workers r where r.worker = w and r.nat = o.nat) then raise exception 'هذه العاملة أُلغيت من البرنامج'; end if;
  if exists (select 1 from public.rec_orders x where x.id <> o.id and x.status <> 'cancelled' and x.worker_name = w and x.nat = o.nat) then raise exception 'هذه العاملة محجوزة لعميل آخر'; end if;
  select name into who from public.staff where id = auth.uid();
  insert into public.removed_workers (worker, nat, order_id, reason, by_name) values (o.worker_name, o.nat, o.id, why, who) on conflict (worker, nat) do nothing;
  perform set_config('asayel.medswap', '1', true);
  update public.rec_orders set worker_name = w, updated_at = now(),
    replaced = replaced || jsonb_build_array(jsonb_build_object('from', o.worker_name, 'to', w, 'reason', why, 'by', who, 'at', now())) where id = p_id;
  perform set_config('asayel.medswap', '', true);
  update asayel_booking.holds set worker = w where id = p_id::text;
  perform private.audit('تغيير العاملة', 'متابعة الاستقدام', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name,'') || ' · الفحص الطبي · ' || why || ' · العاملة السابقة أُلغيت من البرنامج', o.worker_name || ' · ' || o.nat, w || ' · ' || o.nat);
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;
revoke execute on function public.rec_medical_swap(uuid, text, text) from public, anon;
grant execute on function public.rec_medical_swap(uuid, text, text) to authenticated;

-- العميل يرى تغيير العاملة في صفحته (بأرقام طلباته المحفوظة في جهازه)
create or replace function public.rec_replacements(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'ref', o.ref, 'worker', o.worker_name, 'nat', o.nat, 'stage', o.stage, 'replaced', o.replaced)), '[]')
  from public.rec_orders o where o.id = any(p_ids[1:20]) and o.status <> 'cancelled' and jsonb_array_length(o.replaced) > 0
$$;
grant execute on function public.rec_replacements(uuid[]) to anon, authenticated;

-- إضافة البديلة برقم جوازها: من سجل السير إن وُجد، أو بالاسم يدويًا
alter table public.rec_orders add column if not exists worker_passport text;
alter table public.removed_workers add column if not exists passport text;
drop function if exists public.rec_medical_swap(uuid, text, text);
create or replace function public.rec_medical_swap(p_id uuid, p_worker text, p_reason text default null, p_passport text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; w text := trim(coalesce(p_worker,'')); who text; why text := coalesce(nullif(trim(p_reason),''), 'لم تجتز الفحص الطبي');
  pp text := nullif(upper(regexp_replace(coalesce(p_passport,''), '\s', '', 'g')), ''); cv asayel_booking.profiles;
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null or o.status <> 'paid' then raise exception 'الطلب غير موجود أو لم يُسدَّد'; end if;
  if o.stage <> 3 then raise exception 'تغيير العاملة متاح في مرحلة «الفحص الطبي» فقط'; end if;
  if not private.can_stage_nat('med_swap', o.nat) then raise exception 'no_perm' using hint = 'ليس لديك صلاحية استبدال العاملة بعد الفحص الطبي' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if pp is not null then
    if pp !~ '^[A-Z0-9-]{5,20}$' then raise exception 'رقم الجواز غير صحيح'; end if;
    select * into cv from asayel_booking.profiles where passport = pp;
    if found then
      if cv.nat <> o.nat then raise exception 'صاحبة هذا الجواز من جنسية «%» · البديلة يجب أن تكون %', cv.nat, o.nat; end if;
      w := cv.worker;
    end if;
    if exists (select 1 from public.removed_workers r where r.passport = pp) then raise exception 'صاحبة هذا الجواز أُلغيت من البرنامج'; end if;
    if exists (select 1 from public.rec_orders x where x.id <> o.id and x.status <> 'cancelled' and x.worker_passport = pp) then raise exception 'صاحبة هذا الجواز محجوزة لعميل آخر'; end if;
  end if;
  if w = '' then raise exception 'اكتب اسم العاملة البديلة'; end if;
  if w = o.worker_name and pp is not distinct from o.worker_passport then raise exception 'هذه هي العاملة الحالية'; end if;
  if pp is null and exists (select 1 from public.removed_workers r where r.worker = w and r.nat = o.nat) then raise exception 'هذه العاملة أُلغيت من البرنامج'; end if;
  if pp is null and exists (select 1 from public.rec_orders x where x.id <> o.id and x.status <> 'cancelled' and x.worker_name = w and x.nat = o.nat) then raise exception 'هذه العاملة محجوزة لعميل آخر'; end if;
  select name into who from public.staff where id = auth.uid();
  insert into public.removed_workers (worker, nat, order_id, reason, by_name, passport) values (o.worker_name, o.nat, o.id, why, who, o.worker_passport) on conflict (worker, nat) do nothing;
  if o.worker_passport is not null then insert into asayel_booking.rejected values (o.id, o.worker_passport, o.worker_name, o.nat) on conflict do nothing; end if;
  perform set_config('asayel.medswap', '1', true);
  update public.rec_orders set worker_name = w, worker_passport = pp, updated_at = now(),
    replaced = replaced || jsonb_build_array(jsonb_build_object('from', o.worker_name, 'to', w, 'pp', pp, 'reason', why, 'by', who, 'at', now())) where id = p_id;
  perform set_config('asayel.medswap', '', true);
  update asayel_booking.holds set worker = w where id = p_id::text;
  perform private.audit('تغيير العاملة', 'متابعة الاستقدام', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name,'') || ' · الفحص الطبي · ' || why || ' · العاملة السابقة أُلغيت من البرنامج', o.worker_name || ' · ' || o.nat, w || ' · ' || o.nat || coalesce(' · جواز ' || pp, ''));
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;
revoke execute on function public.rec_medical_swap(uuid, text, text, text) from public, anon;
grant execute on function public.rec_medical_swap(uuid, text, text, text) to authenticated;

create or replace function public.rec_cv_by_passport(p_passport text) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare pp text := upper(regexp_replace(coalesce(p_passport,''), '\s', '', 'g')); cv asayel_booking.profiles;
begin
  if not private.is_staff() then raise exception 'للموظفين فقط'; end if;
  select * into cv from asayel_booking.profiles where passport = pp;
  if not found then return null; end if;
  return jsonb_build_object('worker', cv.worker, 'nat', cv.nat, 'details', cv.details,
    'removed', exists (select 1 from public.removed_workers r where r.passport = pp or (r.worker = cv.worker and r.nat = cv.nat)),
    'taken', exists (select 1 from public.rec_orders x where x.status <> 'cancelled' and (x.worker_passport = pp or (x.worker_name = cv.worker and x.nat = cv.nat))));
end $$;
revoke execute on function public.rec_cv_by_passport(text) from public, anon;
grant execute on function public.rec_cv_by_passport(text) to authenticated;
