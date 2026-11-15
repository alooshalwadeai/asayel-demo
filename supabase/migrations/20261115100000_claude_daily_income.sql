-- Claude · 15 Nov 2026 · قسم «الحسابات»: صلاحية accounts + صفحة «الدخل اليومي» من بيانات حقيقية
create or replace function private.perm_keys() returns text
language sql immutable set search_path to '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch|shelter|transfer|marketing|accounts)$'
$$;
update public.staff set perms = (select array_agg(distinct x) from unnest(perms || array['accounts']) x) where username = 'khaled';

-- تاريخ تأكيد سداد الاستقدام
alter table public.rec_orders add column if not exists paid_at timestamptz;
update public.rec_orders set paid_at = coalesce(stage_at, updated_at) where status = 'paid' and paid_at is null;
create or replace function private.rec_paid_at() returns trigger
language plpgsql set search_path to '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then new.paid_at := now();
  elsif new.status <> 'paid' then new.paid_at := null; end if;
  return new;
end $$;
drop trigger if exists rec_paid_at on public.rec_orders;
create trigger rec_paid_at before update of status on public.rec_orders for each row execute function private.rec_paid_at();

-- حركات الفترة: الداخل (استقدام + إيجار) والخارج (دفعات الوكلاء + الرواتب) بتوقيت السعودية
create or replace function public.daily_income(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not (private.is_manager() or private.can_stage('accounts')) then raise exception 'no_perm' using hint = 'صفحة الدخل اليومي لمن لديه صلاحية «الحسابات»'; end if;
  if p_to < p_from or p_to - p_from > 400 then raise exception 'الفترة غير صحيحة'; end if;
  return (select coalesce(jsonb_agg(m order by m->>'at' desc), '[]') from (
    select jsonb_build_object('at', o.paid_at, 'day', (o.paid_at at time zone 'Asia/Riyadh')::date, 'k', 'rec', 'ref', '#' || o.ref, 'name', o.cust_name, 'det', o.worker_name || ' · ' || o.nat, 'method', 'تحويل', 'amt', o.total) m
      from public.rec_orders o where o.status = 'paid' and o.paid_at is not null and (o.paid_at at time zone 'Asia/Riyadh')::date between p_from and p_to
    union all
    select jsonb_build_object('at', b.paid_at, 'day', (b.paid_at at time zone 'Asia/Riyadh')::date, 'k', 'rent', 'ref', '#' || b.ref, 'name', b.cust_name, 'det', coalesce(b.worker_name,'') || ' · ' || coalesce(b.dur,''), 'method', coalesce(b.paid_method, b.pay_method, ''), 'amt', b.paid)
      from public.rent_bookings b where coalesce(b.paid,0) > 0 and b.paid_at is not null and b.status <> 'cancelled' and (b.paid_at at time zone 'Asia/Riyadh')::date between p_from and p_to
    union all
    select jsonb_build_object('at', e.entry_date::timestamptz, 'day', e.entry_date, 'k', 'agent', 'ref', coalesce(e.ref_no, ''), 'name', a.name, 'det', 'دفعة للوكيل · ' || e.amount || ' ' || a.currency, 'method', coalesce(e.method, ''), 'amt', -coalesce(e.sar_amount, case when a.currency = 'SAR' then e.amount end), 'cur', case when e.sar_amount is null and a.currency <> 'SAR' then a.currency end, 'fx', e.amount)
      from public.agent_entries e join public.agents a on a.id = e.agent_id where e.kind = 'payment' and not e.void and e.entry_date between p_from and p_to
    union all
    select jsonb_build_object('at', p.paid_at, 'day', (p.paid_at at time zone 'Asia/Riyadh')::date, 'k', 'pay', 'ref', p.month, 'name', 'رواتب شهر ' || p.month, 'det', (select count(*) from public.hr_payroll_lines l where l.payroll_id = p.id) || ' موظف', 'method', coalesce(p.pay_method, ''), 'amt', -(select coalesce(sum(l.net), 0) from public.hr_payroll_lines l where l.payroll_id = p.id))
      from public.hr_payroll p where p.status = 'paid' and p.paid_at is not null and (p.paid_at at time zone 'Asia/Riyadh')::date between p_from and p_to
  ) x);
end $$;
revoke execute on function public.daily_income(date, date) from public, anon;
grant execute on function public.daily_income(date, date) to authenticated;
