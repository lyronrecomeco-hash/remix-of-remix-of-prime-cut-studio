-- Create message templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view message templates" 
ON public.message_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage message templates" 
ON public.message_templates 
FOR ALL 
USING (true);

-- Create webhook configurations table
CREATE TABLE public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view webhook configs" 
ON public.webhook_configs 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage webhook configs" 
ON public.webhook_configs 
FOR ALL 
USING (true);

-- Create push subscriptions table for real notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'client',
  client_phone TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create push subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view own subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can delete own subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
USING (true);

-- Insert default message templates
INSERT INTO public.message_templates (event_type, title, template) VALUES
('appointment_created', 'Agendamento Realizado', 'Olá, {{nome_cliente}}! Seu agendamento na {{nome_barbearia}} foi realizado com sucesso para {{data}} às {{hora}} para o serviço de {{serviço}}.'),
('appointment_confirmed', 'Agendamento Confirmado', 'Agendamento confirmado na {{nome_barbearia}} 🎉
Estaremos te esperando no dia {{data}} às {{hora}}.'),
('client_called', 'Cliente Chamado', 'Chegou sua vez na {{nome_barbearia}} 💈
Dirija-se ao salão agora.'),
('queue_update', 'Atualização da Fila', 'Atualização da sua fila na {{nome_barbearia}}:
Sua posição atual é: {{posição_fila}}.'),
('appointment_reminder', 'Lembrete de Horário', 'Lembrete: você possui um horário hoje na {{nome_barbearia}} às {{hora}}.'),
('appointment_completed', 'Atendimento Concluído', 'Obrigado por visitar a {{nome_barbearia}}! 
Esperamos que tenha gostado do serviço. Volte sempre!');

-- Insert default webhook configs
INSERT INTO public.webhook_configs (event_type) VALUES
('appointment_created'),
('appointment_confirmed'),
('client_called'),
('queue_update'),
('appointment_reminder'),
('appointment_completed');

-- Trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at
BEFORE UPDATE ON public.webhook_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();