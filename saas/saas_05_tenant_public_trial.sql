-- بيانات المكتب العامة تشمل حالة الاشتراك ونهاية التجربة (لشريط «تجربة · باقي N يوم»)
create or replace function public.tenant_public() returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'logo', t.logo_url, 'phones', t.phones, 'whatsapp', t.whatsapp,
    'address', t.address, 'area', t.service_area, 'plan', t.plan, 'status', t.status, 'trial_ends_at', t.trial_ends_at, 'expires_at', t.expires_at, 'active', private.tenant_active(t.id))
  from public.tenants t where t.id = private.current_tenant_id() $$;
