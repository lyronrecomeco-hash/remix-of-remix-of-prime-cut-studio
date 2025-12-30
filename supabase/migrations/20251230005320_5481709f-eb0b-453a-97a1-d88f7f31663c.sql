-- =========================================================
-- MULTI-TENANT ISOLATION (FINAL CORRIGIDO + BACKFILL SEGURO)
-- 1 USER = 1 TENANT (GARANTIDO)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1) TENANTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 2) USER ↔ TENANT
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_tenants (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_tenants_self ON public.user_tenants;
CREATE POLICY user_tenants_self
ON public.user_tenants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =========================================================
-- 3) CRIAR TENANT ÚNICO PARA CADA USER EXISTENTE (BACKFILL)
-- =========================================================

DO $$
DECLARE
  r record;
  v_tenant uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.admin_settings
      UNION SELECT user_id FROM public.appointments
      UNION SELECT user_id FROM public.barber_availability
      UNION SELECT user_id FROM public.barber_leaves
      UNION SELECT user_id FROM public.barber_performance
      UNION SELECT user_id FROM public.barber_schedules
      UNION SELECT user_id FROM public.barbers
      UNION SELECT user_id FROM public.blocked_slots
      UNION SELECT user_id FROM public.chatpro_config
      UNION SELECT user_id FROM public.feedbacks
      UNION SELECT user_id FROM public.marketing_campaigns
      UNION SELECT user_id FROM public.marketing_contacts
      UNION SELECT user_id FROM public.marketing_settings
      UNION SELECT user_id FROM public.message_templates
      UNION SELECT user_id FROM public.monthly_goals
      UNION SELECT user_id FROM public.push_subscriptions
      UNION SELECT user_id FROM public.queue
      UNION SELECT user_id FROM public.services
      UNION SELECT user_id FROM public.shop_settings
      UNION SELECT user_id FROM public.shop_subscriptions
      UNION SELECT user_id FROM public.site_analytics
      UNION SELECT user_id FROM public.usage_metrics
      UNION SELECT user_id FROM public.user_profiles
      UNION SELECT user_id FROM public.webhook_configs
    ) u
    WHERE user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_tenants ut WHERE ut.user_id = u.user_id
      )
  LOOP
    INSERT INTO public.tenants DEFAULT VALUES
    RETURNING id INTO v_tenant;

    INSERT INTO public.user_tenants (user_id, tenant_id, role)
    VALUES (r.user_id, v_tenant, 'owner');
  END LOOP;
END $$;

-- =========================================================
-- 4) RESOLVER TENANT ATUAL
-- =========================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.tenant_matches(p_tenant uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND p_tenant IS NOT NULL
     AND p_tenant = public.current_tenant_id()
$$;

-- =========================================================
-- 5) TRIGGER DE IMUTABILIDADE
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_tenant_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
      RAISE EXCEPTION 'tenant_id is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =========================================================
-- 6) APLICAR TENANT + BACKFILL NAS TABELAS
-- =========================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'admin_settings',
    'appointments',
    'barber_availability',
    'barber_leaves',
    'barber_performance',
    'barber_schedules',
    'barbers',
    'blocked_slots',
    'chatpro_config',
    'feedbacks',
    'marketing_campaigns',
    'marketing_contacts',
    'marketing_settings',
    'message_templates',
    'monthly_goals',
    'push_subscriptions',
    'queue',
    'services',
    'shop_settings',
    'shop_subscriptions',
    'site_analytics',
    'usage_metrics',
    'user_profiles',
    'webhook_configs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid', t);

    EXECUTE format(
      'UPDATE public.%I
       SET tenant_id = (
         SELECT ut.tenant_id FROM public.user_tenants ut
         WHERE ut.user_id = public.%I.user_id
       )
       WHERE tenant_id IS NULL AND user_id IS NOT NULL',
      t, t
    );

    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id()',
      t
    );

    EXECUTE format('DROP TRIGGER IF EXISTS trg_validate_tenant ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_validate_tenant
       BEFORE UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.validate_tenant_immutable()',
      t
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS tenant_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_delete ON public.%I', t);

    EXECUTE format(
      'CREATE POLICY tenant_select
       ON public.%I
       FOR SELECT TO authenticated
       USING (public.tenant_matches(tenant_id))',
      t
    );

    EXECUTE format(
      'CREATE POLICY tenant_insert
       ON public.%I
       FOR INSERT TO authenticated
       WITH CHECK (public.tenant_matches(tenant_id))',
      t
    );

    EXECUTE format(
      'CREATE POLICY tenant_update
       ON public.%I
       FOR UPDATE TO authenticated
       USING (public.tenant_matches(tenant_id))
       WITH CHECK (public.tenant_matches(tenant_id))',
      t
    );

    EXECUTE format(
      'CREATE POLICY tenant_delete
       ON public.%I
       FOR DELETE TO authenticated
       USING (public.tenant_matches(tenant_id))',
      t
    );
  END LOOP;
END $$;