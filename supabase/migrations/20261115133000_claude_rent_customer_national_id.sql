-- رقم هوية العميل في حجوزات الإيجار (يُدخله الموظف عند «حجز إيجار من المكتب»)
-- 10 أرقام تبدأ بـ 1 (مواطن) أو 2 (مقيم). يُحفظ مع تحديث الحجز بعد إنشائه (صلاحية rent_ok كالعادة).
alter table public.rent_bookings add column if not exists cust_nid text;
alter table public.rent_bookings drop constraint if exists rent_bookings_cust_nid_chk;
alter table public.rent_bookings add constraint rent_bookings_cust_nid_chk check (cust_nid is null or cust_nid ~ '^[12][0-9]{9}$');
