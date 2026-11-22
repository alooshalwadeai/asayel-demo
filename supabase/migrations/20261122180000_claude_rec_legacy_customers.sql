-- عملاء الاستقدام قبل البرنامج (طلب علي 22/11/2026)
-- يُضافون من شيت المكتب: حساب عميل لكل واحد + طلب في مرحلة الفحص الطبي (مدفوع، بعد العقد في مساند)
-- legacy = طلب أُضيف من الشيت قبل تشغيل البرنامج · musaned_no = رقم العقد في مساند
alter table public.rec_orders add column if not exists legacy boolean not null default false;
alter table public.rec_orders add column if not exists musaned_no text;

-- تقرير «عملاء الاستقدام (قبل البرنامج)»: للمدير ومن لديه صلاحية مراحل الاستقدام أو السداد
create or replace function public.rec_legacy_report()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.is_manager() or exists (select 1 from public.staff s where s.id = auth.uid() and s.active and s.perms && array['v1','v2','v3','v4','v5','v6','v7','v8','v9','rec_pay','rec_adj']::text[])) then
    raise exception 'no_perm' using hint = 'لمن لديه صلاحية مراحل الاستقدام';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'ref', r.ref, 'name', r.cust_name, 'ph', r.cust_phone, 'nid', a.nid, 'dob', a.dob, 'visa', r.visa,
      'mno', r.musaned_no, 'worker', r.worker_name, 'pp', r.worker_passport, 'nat', r.nat, 'stage', r.stage,
      'status', r.status, 'at', r.created_at) order by r.ref)
    from public.rec_orders r left join public.cust_accounts a on a.ph = r.cust_phone
    where r.legacy), '[]'::jsonb);
end $$;
revoke all on function public.rec_legacy_report() from public, anon;
grant execute on function public.rec_legacy_report() to authenticated;
