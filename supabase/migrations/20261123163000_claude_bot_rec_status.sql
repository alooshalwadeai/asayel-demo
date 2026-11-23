-- الرد الآلي (جيجي): «وين وصلت عاملتي؟» (طلب علي 23/11/2026)
-- العميل المسجّل: يُعرف من جلسته (رقم جواله) وتظهر له مرحلة عاملته ورقم عقده.
-- غير المسجّل: يكتب رقم هوية الكفيل فتظهر له المرحلة الحالية فقط (بدون أسماء أو أرقام).
create or replace function public.bot_rec_status(p_token text default null, p_nid text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare ph text; v_nid text := translate(btrim(coalesce(p_nid, '')), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'); full_info boolean := false;
begin
  if coalesce(p_token, '') <> '' then
    select s.ph into ph from private.cust_sessions s where s.token_hash = extensions.digest(p_token, 'sha256') and s.expires_at > now();
    full_info := ph is not null;
  end if;
  if ph is null and v_nid <> '' then
    if v_nid !~ '^[12][0-9]{9}$' then return jsonb_build_object('error', 'nid'); end if;
    select a.ph into ph from public.cust_accounts a where a.nid = v_nid;
  end if;
  if ph is null then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'orders', coalesce((select jsonb_agg(jsonb_build_object(
      'stage', o.stage, 'status', o.status, 'med_fail', o.med_fail_at is not null,
      'ref', case when full_info then o.ref end, 'worker', case when full_info then o.worker_name end,
      'mno', case when full_info then o.musaned_no end, 'flight', case when full_info then o.flight_date end) order by o.created_at desc)
    from (select * from public.rec_orders x where x.cust_phone = ph and x.status <> 'cancelled' order by x.created_at desc limit 5) o), '[]'::jsonb));
end $$;
revoke all on function public.bot_rec_status(text, text) from public;
grant execute on function public.bot_rec_status(text, text) to anon, authenticated;
