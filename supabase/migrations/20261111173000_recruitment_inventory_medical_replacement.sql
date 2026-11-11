create table asayel_booking.medical_permissions(employee uuid primary key references public.staff(id) on delete cascade);
create table asayel_booking.profiles(passport text primary key, worker text not null, nat text not null, details jsonb not null);
create table asayel_booking.medical(order_id uuid primary key references public.rec_orders(id), stage text not null check(stage in ('medical','rejected','visa')), passport text, changed_at timestamptz not null default now());
create table asayel_booking.rejected(order_id uuid not null references public.rec_orders(id), passport text not null, worker text not null, nat text not null, primary key(order_id,passport));
revoke all on asayel_booking.medical_permissions,asayel_booking.profiles,asayel_booking.medical,asayel_booking.rejected from public,anon,authenticated;

create function asayel_booking.occupied() returns table(worker text,nat text) language sql stable set search_path='' as $$
select o.worker_name,o.nat from public.rec_orders o left join asayel_booking.holds h on h.id=o.id::text where o.status<>'cancelled' and (o.status='paid' or h.linked_at is not null or coalesce(h.expires,o.created_at+interval '72 hours')>now())
union select r.worker,r.nat from asayel_booking.rejected r
$$;
create function public.asayel_availability() returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('recruitment',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from asayel_booking.occupied() b),
'rent',(select coalesce(jsonb_agg(to_jsonb(b) order by b.start_date),'[]') from
(select w.id,w.name,w.nat,r.start_date,r.end_date,r.dur,r.hours from public.rent_bookings r join public.rent_workers w on w.id=r.worker_id where r.status in ('approved','active','new') and r.end_date >=(now() at time zone 'Asia/Riyadh')::date) b))
$$;
create function asayel_booking.guard_order() returns trigger language plpgsql set search_path='' as $$
declare v text;
begin
 if new.status='cancelled' then return new; end if;
 if tg_op='INSERT' or (old.worker_name,old.nat,old.status='cancelled') is distinct from (new.worker_name,new.nat,false) then
   perform pg_advisory_xact_lock(2,hashtext(new.worker_name||'/'||new.nat));
   if exists(select 1 from asayel_booking.occupied() b where b.worker=new.worker_name and b.nat=new.nat) then raise exception 'هذه العاملة غير متاحة للحجز'; end if;
 end if;
 v:=translate(trim(new.visa),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789');
 if coalesce(v,'') ~ '^[0-9]+$' and (tg_op='INSERT' or old.visa is distinct from new.visa or old.status='cancelled') then
  perform pg_advisory_xact_lock(3,hashtext(v));
  if exists(select 1 from public.rec_orders o left join asayel_booking.holds h on h.id=o.id::text where o.id<>new.id and o.status<>'cancelled' and (translate(trim(o.visa),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789')=v or h.visa=v)) then
    raise exception 'رقم التأشيرة مستخدم في حجز آخر. الاستبدال يتم من المتابعة بعد رفض الفحص.'; end if;
  new.visa:=v;
 end if;
 return new;
end $$;
create trigger guard_recruitment_order before insert or update of worker_name,nat,visa,status on public.rec_orders for each row execute function asayel_booking.guard_order();
CREATE OR REPLACE FUNCTION public.asayel_reserve(p_key uuid, p_customer text, p_phone text, p_worker text, p_nat text, p_dest text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
declare h asayel_booking.holds; q record; digest bytea:=sha256(uuid_send(p_key));
begin
 if p_key is null or coalesce(p_phone,'') !~ '^[0-9]{10}$' or coalesce(trim(p_worker),'')='' or coalesce(trim(p_customer),'')='' or coalesce(trim(p_nat),'')='' or coalesce(trim(p_dest),'')='' then raise exception 'بيانات الحجز غير مكتملة'; end if;
 perform pg_advisory_xact_lock(1,hashtext(p_phone));
 perform pg_advisory_xact_lock(2,hashtext(p_worker||'/'||p_nat));
 select b.* into h from asayel_booking.holds b join public.rec_orders o on o.id::text=b.id
 where b.owner_digest=digest and b.phone=p_phone and b.worker=p_worker and b.nationality=p_nat and b.expires>now() and o.status<>'cancelled' order by b.expires desc limit 1;
 if found then return asayel_booking.view_hold(h); end if;
 select * into strict q from public.rec_quote(p_name=>p_customer,p_phone=>p_phone,p_visa=>'',p_worker=>p_worker,p_nat=>p_nat,p_ins=>null,p_dest=>p_dest);
 insert into asayel_booking.holds(id,ref,worker,nationality,customer,phone,owner_digest)
 select o.id::text,o.ref::text,p_worker,p_nat,p_customer,p_phone,digest from public.rec_orders o where o.id=q.id returning * into strict h;
 return asayel_booking.view_hold(h);
end $function$;
CREATE OR REPLACE FUNCTION public.asayel_visa(p_action text, p_id text, p_key uuid DEFAULT NULL::uuid, p_number text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare h asayel_booking.holds; a record; owner_ok boolean; number text; staff_write boolean;
begin
 select * into h from asayel_booking.holds where id=p_id for update;
 select * into a from asayel_booking.actor();
 owner_ok:=coalesce(h.owner_digest=sha256(uuid_send(p_key)),false);
 if h.id is null or not (owner_ok or coalesce(a.manager or a.recruiter or (a.allowed and h.help_at is not null),false)) then raise exception 'تعذّر الوصول إلى الحجز'; end if;
 if p_action='read' then return asayel_booking.view_hold(h); end if;
 if exists(select 1 from public.rec_orders o where o.id::text=h.id and o.status='cancelled') then raise exception 'أُلغي الحجز'; end if;
 if p_action='help' and owner_ok then
   if h.visa is null and h.expires>now() then update asayel_booking.holds set help_at=coalesce(help_at,now()) where id=p_id returning * into h;
   elsif h.visa is null then raise exception 'انتهت مهلة الحجز'; end if;
 elsif p_action='save' then
   staff_write:=not owner_ok;
   if staff_write then
     perform 1 from asayel_booking.permissions where employee=a.id for share;
     if not found or h.help_at is null then raise exception 'ليست لديك صلاحية إضافة رقم التأشيرة لهذا الحجز'; end if;
   end if;
   number:=translate(trim(p_number),'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789');
   if coalesce(number,'') !~ '^[0-9]+$' then raise exception 'أدخل رقم التأشيرة بالأرقام'; end if;
   if h.visa is not null then return asayel_booking.view_hold(h)||jsonb_build_object('conflict',h.visa<>number); end if;
   if h.expires<=now() then raise exception 'انتهت مهلة الحجز'; end if;
   update public.rec_orders set visa=number where id=p_id::uuid;
   update asayel_booking.holds set visa=number,added_by=case when staff_write then a.name end,added_at=now() where id=p_id returning * into h;
   if staff_write then insert into asayel_booking.audit(booking,action,actor,employee) values(p_id,'إضافة رقم التأشيرة',a.id,a.name); end if;
 elsif p_action='link' and not owner_ok and coalesce(a.recruiter or a.manager,false) and h.visa is not null then
   if h.linked_at is null then
     update asayel_booking.holds set linked_at=now() where id=p_id returning * into h;
     insert into asayel_booking.audit(booking,action,actor,employee) values(p_id,'اكتمال الربط في مساند',a.id,a.name);
   end if;
 else raise exception 'الإجراء غير مسموح'; end if;
 return asayel_booking.view_hold(h);
end $function$;
CREATE OR REPLACE FUNCTION public.rent_book(p_worker uuid, p_name text, p_phone text, p_account text, p_dur text, p_hours integer, p_date date, p_district text, p_service text, p_extras text[], p_pay text)
 RETURNS TABLE(id uuid, ref integer, total numeric, priced boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w public.rent_workers; pr jsonb; base numeric := 0; ex jsonb := '[]'; ext numeric := 0; e jsonb; endd date; r public.rent_bookings;
begin
  select * into w from public.rent_workers rw where rw.id = p_worker for update;
  if w.id is null or w.status <> 'available' then raise exception 'worker_unavailable'; end if;
  if p_dur not in ('h','d','w','m') then raise exception 'bad_duration'; end if;
  if p_date is null or p_date < (now() at time zone 'Asia/Riyadh')::date then raise exception 'bad_date'; end if;
  if char_length(coalesce(p_name,'')) < 3 or coalesce(p_phone,'') !~ '^05[0-9]{8}$' or char_length(coalesce(p_district,'')) < 2 then raise exception 'bad_input'; end if;
  if p_dur = 'h' and (p_hours is null or p_hours < 2 or p_hours > 7) then raise exception 'bad_hours'; end if;
  endd := p_date + case p_dur when 'w' then 6 when 'm' then 29 else 0 end;
  if exists (select 1 from public.rent_bookings b where b.worker_id = p_worker and b.status in ('new','approved','active') and b.start_date <= endd and b.end_date >= p_date) then raise exception 'worker_busy'; end if;
  select s.value into pr from public.site_settings s where s.key = 'rent_prices';
  base := case p_dur when 'h' then coalesce((pr->>'hour')::numeric,0) * p_hours when 'd' then coalesce((pr->>'day')::numeric,0) when 'w' then coalesce((pr->>'week')::numeric,0) else coalesce((pr->>'month')::numeric,0) end;
  for e in select * from jsonb_array_elements(coalesce(pr->'extras','[]')) loop
    if (e->>'n') = any(coalesce(p_extras,'{}')) then ex := ex || jsonb_build_array(jsonb_build_object('n', e->>'n', 'p', coalesce((e->>'p')::numeric,0))); ext := ext + coalesce((e->>'p')::numeric,0); end if;
  end loop;
  insert into public.rent_bookings(worker_id, worker_name, cust_name, cust_phone, account, dur, hours, start_date, end_date, district, service, extras, base_price, extras_total, total, pay_method)
  values (w.id, w.name || ' · ' || w.nat, left(p_name,60), p_phone, left(p_account,20), p_dur, case when p_dur='h' then p_hours end, p_date, endd, left(p_district,40), left(p_service,40), ex, base, ext, base + ext, left(p_pay,30))
  returning * into r;
  return query select r.id, r.ref, r.total, (base > 0);
end $function$;
create function public.asayel_medical(p_action text,p_id uuid default null,p_passport text default null,p_data jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 s public.staff; o public.rec_orders; m asayel_booking.medical; cv asayel_booking.profiles; item jsonb;
 mgr boolean; delegated boolean; examiner boolean; pp text:=upper(trim(p_passport)); result text;
begin
 select * into strict s from public.staff where id=auth.uid();
 mgr:=coalesce(s.is_manager,false);
 select exists(select 1 from asayel_booking.medical_permissions where employee=s.id) into delegated;
 examiner:=mgr or 'v4'=any(coalesce(s.perms,'{}'));
 if p_action in ('permissions','grant','catalog') then
  if not mgr then raise exception 'يتطلب صلاحية المدير'; end if;
  if p_action='grant' then
   if p_data='true'::jsonb then insert into asayel_booking.medical_permissions values(p_id) on conflict do nothing;
   else delete from asayel_booking.medical_permissions where employee=p_id; end if;
  end if;
  if p_action='catalog' then
   for item in select value from jsonb_array_elements(p_data) loop
    if upper(trim(item->>'pp')) ~ '^[A-Z0-9-]{4,24}$' and length(item->>'n')>0 and length(item->>'co')>0 then
     insert into asayel_booking.profiles values(upper(trim(item->>'pp')),item->>'n',item->>'co',item)
     on conflict(passport) do update set details=excluded.details where profiles.worker=excluded.worker and profiles.nat=excluded.nat;
    end if;
   end loop;
   return 'true';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'enabled',p.employee is not null) order by a.name),'[]') from public.staff a left join asayel_booking.medical_permissions p on p.employee=a.id);
 end if;
 if not (examiner or delegated or mgr) then raise exception 'ليست لديك صلاحية المتابعة'; end if;
 if p_action='queue' then
  return jsonb_build_object('examine',examiner,'replace',delegated,'rows',(select coalesce(jsonb_agg(to_jsonb(q) order by ref desc),'[]') from
  (select o1.id,o1.ref,o1.worker_name,o1.nat,coalesce(m1.stage,'medical') stage,m1.passport from public.rec_orders o1 left join asayel_booking.holds h on h.id=o1.id::text left join asayel_booking.medical m1 on m1.order_id=o1.id where o1.status<>'cancelled' and (o1.status='paid' or h.linked_at is not null) and (examiner or m1.stage='rejected')) q));
 end if;
 select * into strict o from public.rec_orders where id=p_id and status<>'cancelled' for update;
 if o.status<>'paid' and not exists(select 1 from asayel_booking.holds where id=o.id::text and linked_at is not null) then raise exception 'الحجز لم يصل إلى المتابعة'; end if;
 select * into m from asayel_booking.medical where order_id=p_id;
 if p_action in ('pass','reject') then
  if not examiner or coalesce(m.stage,'medical')<>'medical' then raise exception 'تعذّر تسجيل نتيجة الفحص'; end if;
  if p_action='reject' then
   if coalesce(pp,'') !~ '^[A-Z0-9-]{4,24}$' or (m.passport is not null and m.passport<>pp) or exists(select 1 from asayel_booking.profiles p where p.passport=pp and (p.worker,p.nat)<>(o.worker_name,o.nat)) then raise exception 'راجع رقم جواز العاملة المرفوضة'; end if;
   insert into asayel_booking.rejected values(o.id,pp,o.worker_name,o.nat);
   result:='rejected';
  else result:='visa'; end if;
  insert into asayel_booking.medical(order_id,stage,passport) values(p_id,result,coalesce(m.passport,pp)) on conflict(order_id) do update set stage=excluded.stage,passport=excluded.passport,changed_at=now();
 elsif p_action in ('lookup','replace') then
  perform 1 from asayel_booking.medical_permissions where employee=s.id for share;
  if not found or m.stage is distinct from 'rejected' then raise exception 'الاستبدال متاح للمخوّل بعد رفض الفحص فقط'; end if;
  select * into cv from asayel_booking.profiles where passport=pp;
  if not found then raise exception 'الجواز غير موجود في سجل السير المعتمدة'; end if;
  if cv.details->>'s' is distinct from 'متاحة' then raise exception 'السيرة غير متاحة للاستبدال'; end if;
  if cv.nat<>o.nat then raise exception 'يجب اختيار بديلة من نفس الجنسية'; end if;
  if exists(select 1 from asayel_booking.occupied() b where b.worker=cv.worker and b.nat=cv.nat) then raise exception 'العاملة غير متاحة للاستبدال'; end if;
  if p_action='lookup' then return cv.details; end if;
  update public.rec_orders set worker_name=cv.worker,updated_at=now() where id=p_id;
  update asayel_booking.holds set worker=cv.worker where id=p_id::text;
  update asayel_booking.medical set stage='medical',passport=pp,changed_at=now() where order_id=p_id;
 else raise exception 'إجراء غير معروف'; end if;
 insert into asayel_booking.audit(booking,action,actor,employee) values(p_id::text,case p_action when 'pass' then 'اجتازت الفحص · إلى التفييز' when 'reject' then 'رُفض الفحص · إحالة للمتابعة' else 'استبدال '||o.worker_name||' بـ '||cv.worker end,s.id,s.name);
 return 'true';
end $$;
revoke all on function public.asayel_medical(text,uuid,text,jsonb) from public,anon;
grant execute on function public.asayel_medical(text,uuid,text,jsonb) to authenticated;
grant execute on function public.asayel_availability() to anon,authenticated;
create function public.asayel_my_bookings(p_key uuid) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'ref',h.ref,'worker',h.worker) order by h.expires desc),'[]') from asayel_booking.holds h join public.rec_orders o on o.id::text=h.id where h.owner_digest=sha256(uuid_send(p_key)) and o.status<>'cancelled' and (h.expires>now() or h.visa is not null)
$$;
grant execute on function public.asayel_my_bookings(uuid) to authenticated,anon;
