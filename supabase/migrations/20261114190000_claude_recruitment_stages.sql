-- Claude · 14 Nov 2026
-- صفحتان للاستقدام: «الحجز والسداد» (قبل السداد) و«متابعة الاستقدام» (المراحل بعد السداد)
-- المرحلة تُحفظ في rec_orders.stage وتُسجَّل باسم من غيّرها · بعد العقد في مساند لا تعديل ولا خصم ولا تغيير عاملة
-- stage: 0 حجز · 1 تم السداد · 2 العقد في مساند · 3 الفحص الطبي · 4 التفييز · 5 الباركود · 6 التذكرة · 7 وصلت المطار · 8 وصلت المكتب · 9 تم التسليم

alter table public.rec_orders
  add column if not exists stage smallint not null default 0,
  add column if not exists contract_at timestamptz,
  add column if not exists stage_at timestamptz,
  add column if not exists stage_by text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'rec_orders_stage_check') then
    alter table public.rec_orders add constraint rec_orders_stage_check check (stage between 0 and 9);
  end if;
end $$;

update public.rec_orders o set contract_at = h.linked_at from asayel_booking.holds h where h.id = o.id::text and h.linked_at is not null and o.contract_at is null;
update public.rec_orders set stage = case when contract_at is not null then 2 else 1 end where status = 'paid' and stage = 0;

create or replace function private.stage_name(k int) returns text language sql immutable set search_path to '' as $$
  select (array['حجز','تم السداد','العقد في مساند','الفحص الطبي','التفييز','الباركود','التذكرة','وصلت المطار','وصلت المكتب','تم التسليم'])[k + 1]
$$;

-- حارس الطلب: السداد بصلاحية rec_pay · المبلغ بصلاحية rec_adj · قفل كامل بعد العقد في مساند
create or replace function private.recorder_guard() returns trigger
language plpgsql security definer set search_path to '' as $$
declare st jsonb := '{"new":"جديد","paid":"مدفوع","cancelled":"ملغي"}'::jsonb;
  locked boolean := old.contract_at is not null or old.stage >= 2;
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
    if locked then raise exception 'locked' using hint = 'لا يمكن تعديل المبلغ أو الخصم أو تغيير العاملة بعد العقد في مساند'; end if;
    if coalesce(current_setting('asayel.swap', true), '') <> '1' then
      if not private.can_stage_nat('rec_adj', new.nat) then raise exception 'no_perm:rec_adj' using hint = 'ليس لديك صلاحية تعديل المبلغ' || coalesce(' لجنسية ' || new.nat, ''); end if;
      perform private.audit('تعديل', 'الحجز والسداد', 'طلب #' || new.ref || ' · ' || coalesce(new.cust_name,''), old.total::text, new.total::text);
    end if;
  end if;
  if (new.stage, new.contract_at) is distinct from (old.stage, old.contract_at) and coalesce(current_setting('asayel.stage', true), '') <> '1' and new.status is not distinct from old.status then
    raise exception 'المرحلة تتغيّر من «متابعة الاستقدام» فقط';
  end if;
  return new;
end $$;

-- لوحة الطلبات للموظفين (الطلب + بيانات الحجز ٧٢ ساعة)
create or replace function public.rec_board() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not private.is_staff() then raise exception 'للموظفين فقط'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(o) || jsonb_build_object('expires', h.expires, 'help_at', h.help_at, 'linked_at', h.linked_at, 'hold', h.id is not null) order by o.created_at desc), '[]')
    from public.rec_orders o left join asayel_booking.holds h on h.id = o.id::text
    where o.status <> 'cancelled' or o.updated_at > now() - interval '60 days');
end $$;

-- نقل الطلب للمرحلة التالية (أو رجوع خطوة للمدير لتصحيح خطأ)
create or replace function public.rec_stage(p_id uuid, p_to int) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; who text;
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.status <> 'paid' then raise exception 'الطلب لم يُسدَّد بعد'; end if;
  if p_to = o.stage + 1 and p_to between 2 and 9 then
    if not private.can_stage_nat('v' || p_to, o.nat) then raise exception 'no_perm' using hint = 'مرحلة «' || private.stage_name(p_to) || '» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  elsif p_to = o.stage - 1 and p_to >= 1 then
    if not private.is_manager() then raise exception 'no_perm' using hint = 'الرجوع خطوة للمدير فقط'; end if;
  else raise exception 'انقل الطلب مرحلة واحدة في كل مرة'; end if;
  select name into who from public.staff where id = auth.uid();
  perform set_config('asayel.stage', '1', true);
  update public.rec_orders set stage = p_to, stage_at = now(), stage_by = who,
    contract_at = case when p_to >= 2 then coalesce(contract_at, now()) else contract_at end, updated_at = now() where id = p_id;
  perform set_config('asayel.stage', '', true);
  if p_to = 2 then update asayel_booking.holds set linked_at = coalesce(linked_at, now()) where id = p_id::text; end if;
  perform private.audit('تغيير مرحلة', 'متابعة الاستقدام', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name,'') || ' · ' || coalesce(o.worker_name,'') || ' · ' || coalesce(o.nat,''), private.stage_name(o.stage), private.stage_name(p_to));
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;

-- تأكيد العقد في مساند قبل السداد (يقفل المبلغ والعاملة)
create or replace function public.rec_contract(p_id uuid) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; who text;
begin
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if o.status = 'cancelled' then raise exception 'الطلب ملغي'; end if;
  if o.contract_at is not null then return to_jsonb(o); end if;
  if not private.can_stage_nat('v2', o.nat) then raise exception 'no_perm' using hint = 'مرحلة «العقد في مساند» ليست من صلاحياتك' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if coalesce(o.visa, '') = '' then raise exception 'أضف رقم التأشيرة قبل العقد في مساند'; end if;
  select name into who from public.staff where id = auth.uid();
  perform set_config('asayel.stage', '1', true);
  update public.rec_orders set contract_at = now(), stage = case when status = 'paid' then greatest(stage, 2) else stage end, stage_at = now(), stage_by = who, updated_at = now() where id = p_id;
  perform set_config('asayel.stage', '', true);
  update asayel_booking.holds set linked_at = coalesce(linked_at, now()) where id = p_id::text;
  perform private.audit('تغيير مرحلة', 'الحجز والسداد', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name,''), 'بانتظار العقد', 'العقد في مساند');
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;

-- ربط مساند من شاشة الحجز القديمة يُحدِّث الطلب أيضًا
create or replace function private.hold_linked_sync() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if new.linked_at is not null and old.linked_at is null then
    perform set_config('asayel.stage', '1', true);
    update public.rec_orders set contract_at = coalesce(contract_at, new.linked_at), stage = case when status = 'paid' then greatest(stage, 2) else stage end where id::text = new.id;
    perform set_config('asayel.stage', '', true);
  end if;
  return null;
end $$;
drop trigger if exists hold_linked_sync on asayel_booking.holds;
create trigger hold_linked_sync after update of linked_at on asayel_booking.holds for each row execute function private.hold_linked_sync();

-- تغيير العاملة: مسموح حتى العقد في مساند (حتى بعد السداد)
create or replace function public.asayel_swap_worker(p_id uuid, p_worker text, p_nat text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare o public.rec_orders; h asayel_booking.holds; pr jsonb; e jsonb; b numeric := null; v numeric; w text := trim(coalesce(p_worker,'')); n text := trim(coalesce(p_nat,''));
begin
  if not private.is_staff() then raise exception 'للموظفين فقط'; end if;
  select * into o from public.rec_orders where id = p_id for update;
  if o.id is null then raise exception 'الطلب غير موجود'; end if;
  if not private.can_stage_nat('rec_swap', o.nat) then raise exception 'no_perm:rec_swap' using hint = 'ليس لديك صلاحية تغيير العاملة المحجوزة' || coalesce(' لجنسية ' || o.nat, ''); end if;
  if w = '' or n = '' then raise exception 'اختر العاملة الجديدة'; end if;
  if o.status = 'cancelled' then raise exception 'الطلب ملغي'; end if;
  select * into h from asayel_booking.holds where id = o.id::text;
  if o.contract_at is not null or o.stage >= 2 or h.linked_at is not null then raise exception 'لا يمكن تغيير العاملة بعد العقد في مساند'; end if;
  if w = o.worker_name and n = o.nat then raise exception 'هذه هي العاملة المحجوزة حاليًا'; end if;
  if n is distinct from o.nat then
    select s.value into pr from public.site_settings s where s.key = 'rec_prices';
    for e in select * from jsonb_array_elements(coalesce(pr->'nats','[]')) loop if (e->>'nat') = n then b := coalesce((e->>'price')::numeric, 0); end if; end loop;
  end if;
  perform set_config('asayel.swap', '1', true);
  if b is null then
    update public.rec_orders set worker_name = w, nat = n, updated_at = now() where id = p_id;
  else
    v := round((b - coalesce(o.discount,0) + case when o.vat_on_ins then coalesce(o.ins_price,0) else 0 end) * coalesce(o.vat_rate,15) / 100, 2);
    update public.rec_orders set worker_name = w, nat = n, base = b, list_base = b, vat = v, total = b - coalesce(o.discount,0) + coalesce(o.ins_price,0) + v, updated_at = now() where id = p_id;
  end if;
  perform set_config('asayel.swap', '', true);
  update asayel_booking.holds set worker = w, nationality = n where id = o.id::text;
  perform private.audit('تغيير العاملة', 'الحجز والسداد', 'طلب #' || o.ref || ' · ' || coalesce(o.cust_name,'') || coalesce(' · السبب: ' || nullif(trim(p_reason),''), ''), o.worker_name || ' · ' || o.nat, w || ' · ' || n);
  select * into o from public.rec_orders where id = p_id;
  return to_jsonb(o);
end $$;

revoke execute on function public.rec_board(), public.rec_stage(uuid, int), public.rec_contract(uuid) from public, anon;
grant execute on function public.rec_board(), public.rec_stage(uuid, int), public.rec_contract(uuid) to authenticated;
