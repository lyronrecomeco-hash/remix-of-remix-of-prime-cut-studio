-- Tabela de planos disponíveis
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  limits jsonb NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de assinaturas das barbearias
CREATE TABLE public.shop_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de métricas de uso mensal
CREATE TABLE public.usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  appointments_count integer NOT NULL DEFAULT 0,
  clients_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Tabela de proteção anti-fraude
CREATE TABLE public.fraud_protection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  fingerprint text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  user_agent text,
  attempt_type text NOT NULL DEFAULT 'registration',
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_protection ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_plans (todos podem ver, apenas owner gerencia)
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Owner can manage plans"
ON public.subscription_plans FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Políticas para shop_subscriptions
CREATE POLICY "Users can view own subscription"
ON public.shop_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owner can view all subscriptions"
ON public.shop_subscriptions FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Owner can manage all subscriptions"
ON public.shop_subscriptions FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "System can create subscriptions"
ON public.shop_subscriptions FOR INSERT
WITH CHECK (true);

-- Políticas para usage_metrics
CREATE POLICY "Users can view own metrics"
ON public.usage_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
ON public.usage_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can manage metrics"
ON public.usage_metrics FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Owner can view all metrics"
ON public.usage_metrics FOR SELECT
USING (is_owner(auth.uid()));

-- Políticas para fraud_protection
CREATE POLICY "Owner can view fraud logs"
ON public.fraud_protection FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "System can insert fraud logs"
ON public.fraud_protection FOR INSERT
WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_subscriptions_updated_at
BEFORE UPDATE ON public.shop_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
BEFORE UPDATE ON public.usage_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir planos padrão
INSERT INTO public.subscription_plans (name, display_name, price, billing_cycle, limits, features) VALUES
(
  'free',
  'Gratuito',
  0,
  'monthly',
  '{"appointments_per_month": 50, "barbers": 1, "clients": 100}',
  '["dashboard", "agenda", "schedules", "feedbacks", "direct_booking", "basic_templates", "users_view", "audit_logs"]'
),
(
  'premium',
  'Premium',
  49,
  'monthly',
  '{"appointments_per_month": -1, "barbers": -1, "clients": -1}',
  '["all"]'
),
(
  'lifetime',
  'Vitalício',
  600,
  'lifetime',
  '{"appointments_per_month": -1, "barbers": -1, "clients": -1}',
  '["all"]'
);

-- Função para verificar limite de IP (anti-fraude)
CREATE OR REPLACE FUNCTION public.check_ip_fraud(check_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fraud_protection
    WHERE ip_address = check_ip
      AND attempt_type = 'registration'
      AND is_blocked = false
      AND created_at > now() - interval '24 hours'
  )
$$;

-- Função para obter plano do usuário
CREATE OR REPLACE FUNCTION public.get_user_plan(check_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.name
  FROM public.shop_subscriptions ss
  JOIN public.subscription_plans sp ON ss.plan_id = sp.id
  WHERE ss.user_id = check_user_id
    AND ss.status = 'active'
  LIMIT 1
$$;

-- Função para verificar se feature é permitida
CREATE OR REPLACE FUNCTION public.is_feature_allowed(check_user_id uuid, feature_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_features jsonb;
BEGIN
  SELECT sp.features INTO plan_features
  FROM public.shop_subscriptions ss
  JOIN public.subscription_plans sp ON ss.plan_id = sp.id
  WHERE ss.user_id = check_user_id
    AND ss.status = 'active'
  LIMIT 1;
  
  IF plan_features IS NULL THEN
    RETURN false;
  END IF;
  
  IF plan_features ? 'all' THEN
    RETURN true;
  END IF;
  
  RETURN plan_features ? feature_name;
END;
$$;