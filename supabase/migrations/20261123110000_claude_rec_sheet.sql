-- «بيان الشغل في الدول»: كل من عمل عقدًا في مساند، كل وكيل خارجي في صفحة مستقلة (طلب علي 23/11/2026، وافق عليه 10:40)
-- تاريخ التفييز وتاريخ الوصول يُسجَّلان تلقائيًا عند تحريك المرحلة في «متابعة الاستقدام»
alter table public.rec_orders add column if not exists stamp_date date;
alter table public.rec_orders add column if not exists arrival_date date;
alter table public.rec_orders add column if not exists agent_name text;

create or replace function private.rec_dates() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.stage >= 4 and coalesce(old.stage, 0) < 4 and new.stamp_date is null then new.stamp_date := (now() at time zone 'Asia/Riyadh')::date; end if;
  if new.stage >= 7 and coalesce(old.stage, 0) < 7 and new.arrival_date is null then new.arrival_date := (now() at time zone 'Asia/Riyadh')::date; end if;
  return new;
end $$;
drop trigger if exists rec_dates on public.rec_orders;
create trigger rec_dates before update of stage on public.rec_orders for each row execute function private.rec_dates();

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
      'rel', c.rel, 'ex', c.ex, 'ins', o.ins_name, 'worker', o.worker_name, 'pp', coalesce(o.worker_passport, c.pp),
      'stamp', o.stamp_date, 'city', coalesce(o.destination, o.flight_city), 'arrival', o.arrival_date, 'flight', o.flight_date,
      'legacy', o.legacy, 'nat', o.nat) x
    from public.rec_orders o
    left join public.cust_accounts a on a.ph = o.cust_phone
    left join lateral (select v.ag, v.rel, v.ex, v.pp from public.cvs v
      where (o.worker_passport is not null and v.pp = o.worker_passport) or v.n = o.worker_name
      order by (v.pp = o.worker_passport) desc nulls last limit 1) c on true
    where o.status <> 'cancelled' and (o.contract_at is not null or o.musaned_no is not null or o.stage >= 2)) q), '[]'::jsonb);
end $$;
revoke all on function public.rec_sheet() from public, anon;
grant execute on function public.rec_sheet() to authenticated;
