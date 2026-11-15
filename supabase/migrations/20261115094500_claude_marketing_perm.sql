-- Claude · 15 Nov 2026 · صلاحية «الرد الآلي والدعاية» (الإعلانات والعروض، الواتساب الآلي، جيجي، أرشيف المحادثات)
create or replace function private.perm_keys() returns text
language sql immutable set search_path to '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch|shelter|transfer|marketing)$'
$$;
update public.staff set perms = (select array_agg(distinct x) from unnest(perms || array['marketing']) x) where username = 'sara';
