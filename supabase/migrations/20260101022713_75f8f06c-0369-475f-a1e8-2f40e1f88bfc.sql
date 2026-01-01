
-- =====================================================
-- WHATSAPP ENTERPRISE SYSTEM - FULL DATABASE SCHEMA
-- =====================================================

-- 1. INBOX DE MENSAGENS RECEBIDAS
CREATE TABLE IF NOT EXISTS public.whatsapp_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  message_id TEXT,
  phone_from TEXT NOT NULL,
  phone_to TEXT,
  contact_name TEXT,
  message_type TEXT DEFAULT 'text', -- text, image, video, audio, document, sticker, location, contact
  message_content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  is_from_me BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  replied_to_id UUID REFERENCES public.whatsapp_inbox(id),
  metadata JSONB DEFAULT '{}',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_inbox_instance ON public.whatsapp_inbox(instance_id);
CREATE INDEX idx_whatsapp_inbox_phone ON public.whatsapp_inbox(phone_from);
CREATE INDEX idx_whatsapp_inbox_unread ON public.whatsapp_inbox(instance_id, is_read) WHERE is_read = false;

-- 2. CONVERSAS (AGRUPAMENTO DE MENSAGENS)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  contact_name TEXT,
  profile_picture_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(instance_id, phone)
);

CREATE INDEX idx_whatsapp_conversations_instance ON public.whatsapp_conversations(instance_id);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone);

-- 3. ENVIO AGENDADO DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.whatsapp_scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone_to TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  message_content TEXT,
  media_url TEXT,
  buttons JSONB,
  list_options JSONB,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, cancelled
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_scheduled_pending ON public.whatsapp_scheduled_messages(scheduled_at, status) WHERE status = 'pending';

-- 4. FILA DE ENVIO COM RETRY
CREATE TABLE IF NOT EXISTS public.whatsapp_send_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone_to TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  message_content TEXT,
  media_url TEXT,
  media_caption TEXT,
  buttons JSONB,
  list_options JSONB,
  priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
  status TEXT DEFAULT 'queued', -- queued, processing, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_queue_processing ON public.whatsapp_send_queue(status, next_attempt_at, priority);

-- 5. AUTOMAÇÕES (RESPOSTAS AUTOMÁTICAS E CHATBOT)
CREATE TABLE IF NOT EXISTS public.whatsapp_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- keyword, all, business_hours, first_contact, inactivity
  trigger_keywords TEXT[] DEFAULT '{}',
  trigger_conditions JSONB DEFAULT '{}',
  response_type TEXT DEFAULT 'text', -- text, menu, flow, transfer
  response_content TEXT,
  response_buttons JSONB,
  response_list JSONB,
  next_automation_id UUID REFERENCES public.whatsapp_automations(id),
  delay_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_automations_active ON public.whatsapp_automations(is_active, trigger_type);

-- 6. HORÁRIO DE FUNCIONAMENTO
CREATE TABLE IF NOT EXISTS public.whatsapp_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(instance_id, day_of_week)
);

-- 7. MENSAGEM FORA DO HORÁRIO
CREATE TABLE IF NOT EXISTS public.whatsapp_away_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  send_once_per_contact BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. WEBHOOKS CONFIGURÁVEIS
CREATE TABLE IF NOT EXISTS public.whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- message_sent, message_received, connection, disconnection, qr_generated
  secret_key TEXT,
  headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  retry_enabled BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status_code INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. LOGS DE WEBHOOKS
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.whatsapp_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  is_success BOOLEAN DEFAULT false,
  error_message TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_webhook_logs_webhook ON public.whatsapp_webhook_logs(webhook_id, created_at DESC);

-- 10. GRUPOS
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  group_jid TEXT NOT NULL,
  name TEXT,
  description TEXT,
  owner_jid TEXT,
  picture_url TEXT,
  participant_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(instance_id, group_jid)
);

-- 11. PARTICIPANTES DE GRUPOS
CREATE TABLE IF NOT EXISTS public.whatsapp_group_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, phone)
);

-- 12. CONTATOS
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  push_name TEXT,
  profile_picture_url TEXT,
  about TEXT,
  is_business BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  has_whatsapp BOOLEAN,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(instance_id, phone)
);

CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_tags ON public.whatsapp_contacts USING GIN(tags);

-- 13. MÉTRICAS E ESTATÍSTICAS
CREATE TABLE IF NOT EXISTS public.whatsapp_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  media_sent INTEGER DEFAULT 0,
  media_received INTEGER DEFAULT 0,
  unique_contacts INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  uptime_seconds INTEGER DEFAULT 0,
  disconnection_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(instance_id, metric_date)
);

CREATE INDEX idx_whatsapp_metrics_date ON public.whatsapp_metrics(instance_id, metric_date DESC);

-- 14. HEALTH CHECK E MONITORAMENTO
CREATE TABLE IF NOT EXISTS public.whatsapp_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- healthy, degraded, unhealthy
  latency_ms INTEGER,
  last_message_at TIMESTAMP WITH TIME ZONE,
  memory_usage_mb INTEGER,
  connection_state TEXT,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_health_instance ON public.whatsapp_health_checks(instance_id, checked_at DESC);

-- 15. ALERTAS
CREATE TABLE IF NOT EXISTS public.whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- disconnection, high_failure_rate, slow_response, quota_exceeded
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  title TEXT NOT NULL,
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_alerts_unresolved ON public.whatsapp_alerts(instance_id, is_resolved) WHERE is_resolved = false;

-- 16. CONFIGURAÇÕES DE SEGURANÇA
CREATE TABLE IF NOT EXISTS public.whatsapp_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE UNIQUE,
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 500,
  message_delay_min_ms INTEGER DEFAULT 1000,
  message_delay_max_ms INTEGER DEFAULT 3000,
  typing_simulation BOOLEAN DEFAULT true,
  typing_duration_ms INTEGER DEFAULT 2000,
  warmup_enabled BOOLEAN DEFAULT false,
  warmup_day INTEGER DEFAULT 1,
  warmup_messages_per_day INTEGER DEFAULT 10,
  ip_whitelist TEXT[] DEFAULT '{}',
  blocked_keywords TEXT[] DEFAULT '{}',
  require_2fa BOOLEAN DEFAULT false,
  audit_log_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 17. LOGS DE AUDITORIA WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_type TEXT DEFAULT 'system', -- system, user, api
  actor_id TEXT,
  target_type TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_audit_instance ON public.whatsapp_audit_logs(instance_id, created_at DESC);
CREATE INDEX idx_whatsapp_audit_action ON public.whatsapp_audit_logs(action, created_at DESC);

-- 18. LABELS/TAGS
CREATE TABLE IF NOT EXISTS public.whatsapp_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 19. API KEYS
CREATE TABLE IF NOT EXISTS public.whatsapp_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- first 8 chars for identification
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT '{}', -- send, receive, read, admin
  rate_limit_per_minute INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_whatsapp_api_keys_prefix ON public.whatsapp_api_keys(key_prefix);

-- 20. QUICK REPLIES (RESPOSTAS RÁPIDAS)
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.whatsapp_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_away_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Owner can manage all
CREATE POLICY "Owner can manage whatsapp_inbox" ON public.whatsapp_inbox FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_conversations" ON public.whatsapp_conversations FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_scheduled_messages" ON public.whatsapp_scheduled_messages FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_send_queue" ON public.whatsapp_send_queue FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_automations" ON public.whatsapp_automations FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_business_hours" ON public.whatsapp_business_hours FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_away_messages" ON public.whatsapp_away_messages FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_webhooks" ON public.whatsapp_webhooks FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_webhook_logs" ON public.whatsapp_webhook_logs FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_groups" ON public.whatsapp_groups FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_group_participants" ON public.whatsapp_group_participants FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_contacts" ON public.whatsapp_contacts FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_metrics" ON public.whatsapp_metrics FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_health_checks" ON public.whatsapp_health_checks FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_alerts" ON public.whatsapp_alerts FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_security_settings" ON public.whatsapp_security_settings FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_audit_logs" ON public.whatsapp_audit_logs FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_labels" ON public.whatsapp_labels FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_api_keys" ON public.whatsapp_api_keys FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owner can manage whatsapp_quick_replies" ON public.whatsapp_quick_replies FOR ALL USING (is_owner(auth.uid())) WITH CHECK (is_owner(auth.uid()));

-- Add new columns to existing whatsapp_instances table
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS heartbeat_interval_ms INTEGER DEFAULT 30000,
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS uptime_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reconnect_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_reconnect_attempts INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS auto_reconnect BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS session_backup JSONB,
ADD COLUMN IF NOT EXISTS proxy_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT;
