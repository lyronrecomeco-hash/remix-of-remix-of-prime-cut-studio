-- Create email_templates table for managing email designs
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create owner_settings table for system-wide configurations
CREATE TABLE public.owner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_logs table for global system monitoring
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is owner (super_admin with specific email)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    WHERE ur.user_id = _user_id
      AND ur.role = 'super_admin'
      AND au.email = 'lyronrp@gmail.com'
  )
$$;

-- RLS Policies for email_templates (only owner can access)
CREATE POLICY "Owner can manage email templates"
ON public.email_templates
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- RLS Policies for email_logs (only owner can access)
CREATE POLICY "Owner can view email logs"
ON public.email_logs
FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Owner can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (is_owner(auth.uid()));

-- RLS Policies for owner_settings (only owner can access)
CREATE POLICY "Owner can manage owner settings"
ON public.owner_settings
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- RLS Policies for system_logs (only owner can access)
CREATE POLICY "Owner can view system logs"
ON public.system_logs
FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Owner can insert system logs"
ON public.system_logs
FOR INSERT
WITH CHECK (is_owner(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_settings_updated_at
BEFORE UPDATE ON public.owner_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_type, name, subject, html_content, variables) VALUES
('confirmation', 'Confirmação de Agendamento', 'Seu agendamento foi confirmado!', '<html><body><h1>Olá {{nome}}!</h1><p>Seu agendamento para {{data}} às {{horario}} foi confirmado.</p><p>Serviço: {{servico}}</p><p>Barbeiro: {{barbeiro}}</p></body></html>', '["nome", "data", "horario", "servico", "barbeiro"]'),
('welcome', 'Boas-vindas', 'Bem-vindo à nossa barbearia!', '<html><body><h1>Bem-vindo, {{nome}}!</h1><p>É um prazer ter você conosco.</p></body></html>', '["nome"]'),
('reminder', 'Lembrete de Agendamento', 'Lembrete: Seu agendamento é amanhã!', '<html><body><h1>Olá {{nome}}!</h1><p>Lembrando que seu agendamento é amanhã, {{data}} às {{horario}}.</p></body></html>', '["nome", "data", "horario"]'),
('cancellation', 'Cancelamento', 'Seu agendamento foi cancelado', '<html><body><h1>Olá {{nome}}</h1><p>Seu agendamento para {{data}} às {{horario}} foi cancelado.</p></body></html>', '["nome", "data", "horario"]');

-- Insert default owner settings
INSERT INTO public.owner_settings (setting_key, setting_value, description) VALUES
('email_provider', '{"provider": "resend", "configured": false}', 'Configurações do provedor de email'),
('system_limits', '{"max_appointments_per_day": 50, "max_barbers": 10, "max_services": 20}', 'Limites do sistema'),
('notifications', '{"critical_errors": true, "login_alerts": true, "daily_summary": false}', 'Configurações de notificações do owner');