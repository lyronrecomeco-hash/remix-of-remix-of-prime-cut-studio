-- =============================================
-- WHATSAPP AUTOMATION CORE - API LAYER
-- =============================================

-- 1. PROJETOS DE API (Multi-tenant isolation)
CREATE TABLE IF NOT EXISTS public.whatsapp_api_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Credenciais
  api_key TEXT UNIQUE NOT NULL DEFAULT ('wac_' || encode(gen_random_bytes(24), 'hex')),
  api_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Owner
  owner_user_id UUID NOT NULL,
  
  -- Limites de Rate Limiting
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  max_instances INTEGER NOT NULL DEFAULT 3,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  environment TEXT NOT NULL DEFAULT 'production', -- production, sandbox
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_projects_api_key ON public.whatsapp_api_projects(api_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_projects_owner ON public.whatsapp_api_projects(owner_user_id);

-- 2. INSTÂNCIAS POR PROJETO (Link entre projetos e instâncias)
CREATE TABLE IF NOT EXISTS public.whatsapp_project_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.whatsapp_api_projects(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  
  -- Permissões específicas
  can_send BOOLEAN NOT NULL DEFAULT true,
  can_receive BOOLEAN NOT NULL DEFAULT true,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, instance_id)
);

-- 3. REGRAS DE AUTOMAÇÃO (Engine de automação desacoplado)
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.whatsapp_api_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Gatilho
  trigger_type TEXT NOT NULL, -- external_event, webhook, schedule, message_received
  trigger_config JSONB NOT NULL DEFAULT '{}',
  
  -- Condições (opcional)
  conditions JSONB DEFAULT '[]',
  
  -- Ações a executar
  actions JSONB NOT NULL DEFAULT '[]',
  
  -- Configurações
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Métricas
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_rules_project ON public.whatsapp_automation_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_rules_trigger ON public.whatsapp_automation_rules(trigger_type, is_active);

-- 4. WEBHOOKS EXTERNOS (Para notificar sistemas externos)
CREATE TABLE IF NOT EXISTS public.whatsapp_external_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.whatsapp_api_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  
  -- Eventos que disparam este webhook
  events TEXT[] NOT NULL DEFAULT '{}',
  
  -- Segurança
  secret_key TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  headers JSONB DEFAULT '{}',
  
  -- Retry
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_enabled BOOLEAN NOT NULL DEFAULT true,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 30,
  
  -- Métricas
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_external_webhooks_project ON public.whatsapp_external_webhooks(project_id);

-- 5. LOGS DE API (Auditoria de chamadas)
CREATE TABLE IF NOT EXISTS public.whatsapp_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.whatsapp_api_projects(id) ON DELETE SET NULL,
  
  -- Request
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  request_headers JSONB,
  
  -- Response
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  idempotency_key TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_project ON public.whatsapp_api_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_created ON public.whatsapp_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_idempotency ON public.whatsapp_api_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 6. RATE LIMITS TRACKING
CREATE TABLE IF NOT EXISTS public.whatsapp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.whatsapp_api_projects(id) ON DELETE CASCADE,
  
  -- Contadores
  minute_count INTEGER NOT NULL DEFAULT 0,
  minute_window TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  hour_count INTEGER NOT NULL DEFAULT 0,
  hour_window TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  day_count INTEGER NOT NULL DEFAULT 0,
  day_window DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id)
);

-- 7. FILA DE EVENTOS (Para processamento assíncrono)
CREATE TABLE IF NOT EXISTS public.whatsapp_event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.whatsapp_api_projects(id) ON DELETE SET NULL,
  
  -- Evento
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  -- Erro
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_event_queue_status ON public.whatsapp_event_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_whatsapp_event_queue_project ON public.whatsapp_event_queue(project_id);

-- Enable RLS
ALTER TABLE public.whatsapp_api_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_project_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_external_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_event_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Owner can manage all)
CREATE POLICY "Owner can manage api projects" ON public.whatsapp_api_projects
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner can manage project instances" ON public.whatsapp_project_instances
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner can manage automation rules" ON public.whatsapp_automation_rules
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner can manage external webhooks" ON public.whatsapp_external_webhooks
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner can view api logs" ON public.whatsapp_api_logs
  FOR SELECT USING (is_owner(auth.uid()));

CREATE POLICY "Anyone can insert api logs" ON public.whatsapp_api_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner can manage rate limits" ON public.whatsapp_rate_limits
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owner can manage event queue" ON public.whatsapp_event_queue
  FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_api_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_api_projects_updated_at
  BEFORE UPDATE ON public.whatsapp_api_projects
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_api_updated_at();

CREATE TRIGGER update_whatsapp_automation_rules_updated_at
  BEFORE UPDATE ON public.whatsapp_automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_api_updated_at();

CREATE TRIGGER update_whatsapp_external_webhooks_updated_at
  BEFORE UPDATE ON public.whatsapp_external_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_api_updated_at();