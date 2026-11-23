-- رقم العقد في مساند عند «تم السداد في مساند» (طلب علي 23/11/2026)
-- الموظف لا يقدر يؤكد السداد إلا بعد كتابة رقم العقد (8 إلى 9 أرقام)، ويظهر الرقم للعميل في صفحته.
create or replace function private.recorder_guard()
returns trigger language plpgsql security definer set search_path to '' as $function$
declare st jsonb := '{"new":"جديد","paid":"مدفوع","cancelled":"ملغي"}'::jsonb;
  locked boolean := old.contract_at is not null or old.stage >= 2;
  med boolean := coalesce(current_setting('asayel.medswap', true), '') = '1';
begin
  if new.musaned_no is not null then
    new.musaned_no := translate(btrim(new.musaned_no), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
    if new.musaned_no = '' then new.musaned_no := null;
    elsif new.musaned_no !~ '^[0-9]{8,9}$' then raise exception 'musaned_no' using hint = 'رقم العقد في مساند من 8 إلى 9 أرقام'; end if;
  end if;
  if new.status is distinct from old.status then
    if new.status = 'paid' then new.stage := greatest(new.stage, case when new.contract_at is not null then 2 else 1 end); new.stage_at := now();
    elsif new.status = 'new' then
      if locked then raise exception 'locked' using hint = 'لا يمكن إرجاع الطلب لما قبل السداد بعد العقد في مساند'; end if;
      new.stage := 0;
    end if;
  end if;
  if auth.uid() is null or not exists (select 1 from public.staff s where s.id = auth.uid()) then return new; end if;
  if new.status = 'paid' and old.status is distinct from 'paid' and new.musaned_no is null then
    raise exception 'musaned_no' using hint = 'اكتب رقم العقد في مساند (8 إلى 9 أرقام) قبل تأكيد السداد';
  end if;
  if new.musaned_no is distinct from old.musaned_no then
    if not private.can_stage_nat('rec_pay', new.nat) then raise exception 'no_perm:rec_pay' using hint = 'ليس لديك صلاحية تسجيل رقم العقد في مساند' || coalesce(' لجنسية ' || new.nat, ''); end if;
    perform private.audit('تعديل', 'الحجز والسداد', 'رقم العقد في مساند · طلب #' || new.ref || ' · ' || coalesce(new.cust_name,''), coalesce(old.musaned_no, '—'), coalesce(new.musaned_no, '—'));
  end if;
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
end $function$;

-- يظهر للعميل في بطاقة حجزه
create or replace function asayel_booking.view_hold(h asayel_booking.holds)
returns jsonb language sql stable set search_path to 'pg_catalog' as $function$
 select (to_jsonb(h)-'owner_digest') || jsonb_build_object('expired',h.expires<=now(),'cancelled',
   exists(select 1 from public.rec_orders o where o.id::text=h.id and o.status='cancelled'))
 || coalesce((select jsonb_build_object('stage', o.stage, 'paid', o.status = 'paid', 'stage_at', o.stage_at,
      'flight_date', o.flight_date, 'flight_city', o.flight_city, 'receipt_method', o.receipt_method,
      'contract', o.contract_at is not null or o.stage >= 2, 'med_fail', o.med_fail_at is not null, 'worker_now', o.worker_name,
      'musaned_no', o.musaned_no)
    from public.rec_orders o where o.id::text = h.id), '{}'::jsonb)
$function$;
