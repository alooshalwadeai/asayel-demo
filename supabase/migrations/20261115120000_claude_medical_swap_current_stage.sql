-- Claude · 15 Nov 2026 · «متابعة الاستقدام» تعرض المرحلة «الحالية»: تغيير العاملة متاح أثناء الفحص الطبي (stage 2) وبعد تسجيله (stage 3)
do $$
declare d text;
begin
  select pg_get_functiondef('public.rec_medical_swap(uuid,text,text,text)'::regprocedure) into d;
  d := replace(d, 'if o.stage <> 3 then', 'if o.stage not in (2, 3) then');
  execute d;
end $$;
