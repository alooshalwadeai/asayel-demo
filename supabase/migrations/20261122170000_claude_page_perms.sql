-- صلاحيات فتح الصفحات من القائمة الجانبية — طلب علي 22/11/2026
-- كل الأقسام تظهر بالاسم لكل الموظفين، ولا يفتح الصفحة إلا من منحته الإدارة صلاحيتها.
-- مفاتيح جديدة يقدر المدير يمنحها من «الموظفون والصلاحيات»:
--   pg_customers سجل العملاء · pg_reports التقارير والطباعة · pg_insights التنبيهات والإحصاءات
--   pg_chat التواصل الداخلي والتنويهات · pg_guarantee فترة الضمان · pg_leaves إجازات العاملات
create or replace function private.perm_keys()
returns text language sql immutable set search_path = '' as $$
  select '^(v[1-9]|nm_price|nm_paid|rec_pay|rec_adj|rec_swap|visa_assist|med_swap|ag_entry|taf_edit|rent_ok|rent_workers|payroll|audit|chat_full|chat_arch|shelter|transfer|marketing|cv_edit|pg_customers|pg_reports|pg_insights|pg_chat|pg_guarantee|pg_leaves)$'
$$;
