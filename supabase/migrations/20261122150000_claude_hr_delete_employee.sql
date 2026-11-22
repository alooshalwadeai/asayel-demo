-- حذف موظف من قسم الرواتب (للمدير فقط) — طلب علي 22/11/2026
-- يُسمح بالحذف فقط إذا لم يكن للموظف رواتب في مسيرات معتمدة ولا سلفة قائمة،
-- حتى لا يضيع سجل رواتب صُرفت فعلًا. غير ذلك يُستخدم «إيقاف الموظف».
-- عند الحذف: تُحذف بنوده غير المعتمدة (حوافز/خصومات الشهر) وسلفه الملغاة،
-- وحوافز العقود المسجلة باسمه تبقى مربوطة بحساب الموظف في البرنامج (staff_id) فقط.
create or replace function public.hr_delete_employee(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if not private.is_manager() then raise exception 'حذف الموظف للمدير فقط'; end if;
  select name into v_name from public.hr_employees where id = p_id;
  if v_name is null then raise exception 'الموظف غير موجود'; end if;
  if exists (select 1 from public.hr_payroll_lines where emp_id = p_id) then
    raise exception 'لا يمكن حذف «%» لأن له رواتب في مسيرات معتمدة. استخدم «إيقاف الموظف» ليختفي من المسيرات القادمة ويبقى سجله.', v_name;
  end if;
  if exists (select 1 from public.hr_advances where emp_id = p_id and not void) then
    raise exception 'لا يمكن حذف «%» لأن عليه سلفة قائمة. ألغِ السلفة أولًا أو استخدم «إيقاف الموظف».', v_name;
  end if;
  update public.hr_bonus_events set emp_id = null where emp_id = p_id;
  delete from public.hr_advances where emp_id = p_id;
  delete from public.hr_items where emp_id = p_id;
  delete from public.hr_employees where id = p_id;
  return jsonb_build_object('ok', true, 'name', v_name);
end $$;
revoke all on function public.hr_delete_employee(uuid) from public, anon;
grant execute on function public.hr_delete_employee(uuid) to authenticated;
