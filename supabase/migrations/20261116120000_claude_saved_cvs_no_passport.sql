-- طلب المستخدم: لا يُحفظ رقم جواز العاملة مع السيرة في قاعدة البيانات
drop index if exists public.cvs_pp_uniq;
alter table public.cvs drop column if exists pp;
