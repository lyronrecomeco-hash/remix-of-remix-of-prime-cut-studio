-- =====================================================
-- PACK ENTERPRISE: FASE 1 - SEGURANÇA CRÍTICA
-- =====================================================

-- 1.1 CORRIGIR RLS DA TABELA email_confirmation_tokens
-- Remover policy permissiva atual (CRÍTICO - expõe tokens)
DROP POLICY IF EXISTS "System can manage confirmation tokens" ON public.email_confirmation_tokens;

-- Criar function SECURITY DEFINER para validação de owner
CREATE OR REPLACE FUNCTION public.validate_token_owner(token_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT token_user_id = auth.uid() OR is_owner(auth.uid())
$$;

-- Policy restritiva para SELECT (usuário só vê próprios tokens)
CREATE POLICY "Users can only view own tokens" ON public.email_confirmation_tokens
FOR SELECT USING (public.validate_token_owner(user_id));

-- Policy para INSERT via sistema (Edge Functions com service role)
CREATE POLICY "System can insert tokens" ON public.email_confirmation_tokens
FOR INSERT WITH CHECK (true);

-- 1.2 CRIAR TABELA DE RATE LIMITING
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

-- Index para performance de rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint 
ON public.rate_limits(identifier, endpoint, window_start);

-- Habilitar RLS na tabela rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy permissiva para sistema gerenciar rate limits
CREATE POLICY "System manages rate limits" ON public.rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FASE 2: ÍNDICES COMPOSTOS PARA ESCALABILIDADE
-- =====================================================

-- Appointments por data + barbeiro + tenant (query mais comum)
CREATE INDEX IF NOT EXISTS idx_appointments_date_barber_tenant 
ON public.appointments(date, barber_id, tenant_id);

-- Appointments por tenant + status (dashboard)
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status 
ON public.appointments(tenant_id, status);

-- Queue por tenant + position (ordenação de fila)
CREATE INDEX IF NOT EXISTS idx_queue_tenant_position 
ON public.queue(tenant_id, position);

-- Audit logs por ação + data (relatórios de segurança)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date 
ON public.audit_logs(action, created_at DESC);

-- Feedbacks por tenant + status (moderação)
CREATE INDEX IF NOT EXISTS idx_feedbacks_tenant_status
ON public.feedbacks(tenant_id, status);

-- Barbers por tenant + available (listagem)
CREATE INDEX IF NOT EXISTS idx_barbers_tenant_available
ON public.barbers(tenant_id, available);

-- Services por tenant + visible (listagem pública)
CREATE INDEX IF NOT EXISTS idx_services_tenant_visible
ON public.services(tenant_id, visible);