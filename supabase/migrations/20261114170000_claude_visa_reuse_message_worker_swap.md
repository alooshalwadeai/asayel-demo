# تعديلات Claude على قاعدة Supabase (مطبّقة مباشرة على المشروع rmhkmutxptwdvcorcfyy)

## ١٤ نوفمبر ٢٠٢٦ — `visa_reuse_message_and_worker_swap`
- `asayel_booking.guard_order()`: عند استخدام رقم تأشيرة محجوز على عاملة أخرى، تذكر الرسالة اسم العاملة وجنسيتها ورقم جوازها (إن وُجد في `medical` أو `profiles`) ورقم الحجز، وتوجّه العميل للتواصل مع أصايل لتغيير العاملة.
- مفتاح صلاحية جديد `rec_swap` في `public.set_stage_perms` (تغيير العاملة المحجوزة قبل السداد في مساند).
- `private.recorder_guard()`: يسمح بإعادة التسعير الناتجة عن تبديل مصرّح (`asayel.swap`).
- دالة جديدة `public.asayel_swap_worker(p_id, p_worker, p_nat, p_reason)`: للموظف الذي لديه `rec_swap` لدولة الطلب، قبل السداد وقبل الربط في مساند؛ تحدّث `rec_orders` و`asayel_booking.holds` وتعيد التسعير عند تغيّر الجنسية وتسجّل في `audit_log`.

## أعمال سابقة لـ Claude (١٠–١٤ نوفمبر) — للاطلاع
- صلاحيات المراحل والدول: `staff.perms`, `staff.countries`, `private.can_stage_nat`, `public.my_access`, `public.stage_perms`, `public.set_stage_perms`، وحرّاس `private.creq_guard` على `cust_requests` و`private.recorder_guard` على `rec_orders`.
- سجل الحركة: جدول `public.audit_log` + `private.audit`.
- حسابات الوكلاء: `agents.male_rates`، أعمدة `agent_entries` (cat, pending, src_req, stamp_date, destination, cust_name, cust_id, musaned_no, contract_date, contract_by)، ودوال `private.named_to_agent`, `private.agent_rate`, `private.agent_find`, `public.agent_set_info`.
- الرواتب والحوافز: جداول `hr_*`، `hr_bonus_events`، `public.hr_access`, `public.hr_my`.
- مكان الوصول: `rec_orders.destination` و`public.rec_quote(..., p_dest)`.
- ملفات الواجهة لهذه الأقسام (z13–z17) تُخدم من Supabase Storage (`site/js/`) وتُحمَّل من `p.js`.
