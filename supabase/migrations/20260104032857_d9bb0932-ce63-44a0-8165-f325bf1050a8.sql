-- Tabela para logs de eventos Genesis (conexão, desconexão, erros)
CREATE TABLE IF NOT EXISTS public.genesis_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.genesis_instances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.genesis_users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'connected', 'disconnected', 'error', 'heartbeat', 'message_sent', 'qr_generated'
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para consumo de créditos por instância
CREATE TABLE IF NOT EXISTS public.genesis_credit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.genesis_users(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.genesis_instances(id) ON DELETE SET NULL,
    credits_used INTEGER NOT NULL DEFAULT 0,
    usage_type TEXT NOT NULL, -- 'instance_daily', 'message_sent', 'api_call', 'ai_usage'
    description TEXT,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para webhooks de eventos Genesis
CREATE TABLE IF NOT EXISTS public.genesis_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.genesis_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret_key TEXT,
    events TEXT[] DEFAULT ARRAY['connected', 'disconnected', 'message_received'],
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_genesis_event_logs_instance ON public.genesis_event_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_genesis_event_logs_user ON public.genesis_event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_genesis_event_logs_created ON public.genesis_event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_genesis_event_logs_type ON public.genesis_event_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_genesis_credit_usage_user ON public.genesis_credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_genesis_credit_usage_date ON public.genesis_credit_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_genesis_credit_usage_instance ON public.genesis_credit_usage(instance_id);

CREATE INDEX IF NOT EXISTS idx_genesis_webhooks_user ON public.genesis_webhooks(user_id);

-- RLS
ALTER TABLE public.genesis_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas para genesis_event_logs
CREATE POLICY "genesis_event_logs_select" ON public.genesis_event_logs
    FOR SELECT USING (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
        OR public.is_owner(auth.uid())
    );

CREATE POLICY "genesis_event_logs_insert" ON public.genesis_event_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para genesis_credit_usage
CREATE POLICY "genesis_credit_usage_select" ON public.genesis_credit_usage
    FOR SELECT USING (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
        OR public.is_owner(auth.uid())
    );

CREATE POLICY "genesis_credit_usage_insert" ON public.genesis_credit_usage
    FOR INSERT WITH CHECK (true);

-- Políticas para genesis_webhooks
CREATE POLICY "genesis_webhooks_select" ON public.genesis_webhooks
    FOR SELECT USING (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
        OR public.is_owner(auth.uid())
    );

CREATE POLICY "genesis_webhooks_insert" ON public.genesis_webhooks
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "genesis_webhooks_update" ON public.genesis_webhooks
    FOR UPDATE USING (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "genesis_webhooks_delete" ON public.genesis_webhooks
    FOR DELETE USING (
        user_id IN (SELECT id FROM genesis_users WHERE auth_user_id = auth.uid())
    );

-- Trigger para updated_at nos webhooks
CREATE TRIGGER genesis_webhooks_updated_at
    BEFORE UPDATE ON public.genesis_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_genesis_updated_at();

-- Habilitar realtime para logs de eventos
ALTER PUBLICATION supabase_realtime ADD TABLE public.genesis_event_logs;