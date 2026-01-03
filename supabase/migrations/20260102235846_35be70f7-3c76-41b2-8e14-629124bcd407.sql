
-- ============================================
-- WhatsApp Interactive Templates Schema
-- Suporte a templates avançados com botões e listas
-- ============================================

-- Tabela de templates interativos
CREATE TABLE IF NOT EXISTS public.whatsapp_interactive_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'text', -- text, buttons, list, cta
  message_content TEXT NOT NULL,
  header_type TEXT, -- text, image, video, document
  header_content TEXT,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]'::jsonb, -- [{id, text, action, payload}]
  list_sections JSONB DEFAULT '[]'::jsonb, -- [{title, rows: [{id, title, description}]}]
  button_text TEXT, -- Para listas: texto do botão que abre a lista
  variables JSONB DEFAULT '[]'::jsonb, -- Variáveis disponíveis no template
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general', -- general, marketing, support, sales, transactional
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ações de botões
CREATE TABLE IF NOT EXISTS public.whatsapp_button_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.whatsapp_interactive_templates(id) ON DELETE CASCADE,
  button_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- send_template, update_status, call_webhook, transfer_human, create_order, send_payment
  action_config JSONB DEFAULT '{}'::jsonb, -- Configuração específica da ação
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de estado de conversas (CRM Conversacional)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  contact_name TEXT,
  current_state TEXT DEFAULT 'idle', -- idle, browsing, checkout, awaiting_payment, payment_confirmed, followup, support
  last_template_id UUID REFERENCES public.whatsapp_interactive_templates(id),
  last_button_clicked TEXT,
  context_data JSONB DEFAULT '{}'::jsonb, -- order_id, product_id, etc
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instance_id, phone)
);

-- Logs de cliques em botões
CREATE TABLE IF NOT EXISTS public.whatsapp_button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  conversation_state_id UUID REFERENCES public.whatsapp_conversation_states(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_interactive_templates(id) ON DELETE SET NULL,
  button_id TEXT NOT NULL,
  button_text TEXT,
  action_triggered TEXT,
  action_result JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de mensagens enviadas com templates
CREATE TABLE IF NOT EXISTS public.whatsapp_template_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.whatsapp_interactive_templates(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  rendered_content TEXT,
  variables_used JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wa_interactive_templates_type ON public.whatsapp_interactive_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_wa_interactive_templates_active ON public.whatsapp_interactive_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_wa_conv_states_phone ON public.whatsapp_conversation_states(phone);
CREATE INDEX IF NOT EXISTS idx_wa_conv_states_state ON public.whatsapp_conversation_states(current_state);
CREATE INDEX IF NOT EXISTS idx_wa_button_clicks_phone ON public.whatsapp_button_clicks(phone);
CREATE INDEX IF NOT EXISTS idx_wa_button_clicks_created ON public.whatsapp_button_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_template_sends_phone ON public.whatsapp_template_sends(phone);
CREATE INDEX IF NOT EXISTS idx_wa_template_sends_status ON public.whatsapp_template_sends(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_wa_interactive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wa_interactive_templates_updated ON public.whatsapp_interactive_templates;
CREATE TRIGGER trg_wa_interactive_templates_updated
  BEFORE UPDATE ON public.whatsapp_interactive_templates
  FOR EACH ROW EXECUTE FUNCTION update_wa_interactive_updated_at();

DROP TRIGGER IF EXISTS trg_wa_conv_states_updated ON public.whatsapp_conversation_states;
CREATE TRIGGER trg_wa_conv_states_updated
  BEFORE UPDATE ON public.whatsapp_conversation_states
  FOR EACH ROW EXECUTE FUNCTION update_wa_interactive_updated_at();

-- RLS
ALTER TABLE public.whatsapp_interactive_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_button_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_template_sends ENABLE ROW LEVEL SECURITY;

-- Policies - Owner pode gerenciar tudo
CREATE POLICY "Owner can manage interactive templates" ON public.whatsapp_interactive_templates FOR ALL USING (is_owner(auth.uid()));
CREATE POLICY "Owner can manage button actions" ON public.whatsapp_button_actions FOR ALL USING (is_owner(auth.uid()));
CREATE POLICY "Owner can manage conversation states" ON public.whatsapp_conversation_states FOR ALL USING (is_owner(auth.uid()));
CREATE POLICY "Owner can manage button clicks" ON public.whatsapp_button_clicks FOR ALL USING (is_owner(auth.uid()));
CREATE POLICY "Owner can manage template sends" ON public.whatsapp_template_sends FOR ALL USING (is_owner(auth.uid()));

-- Insert template de exemplo
INSERT INTO public.whatsapp_interactive_templates (name, description, template_type, message_content, buttons, category)
VALUES 
  ('Confirmação de Pedido', 'Template com botões para confirmar ou cancelar pedido', 'buttons', 
   '🛒 *Pedido Recebido!*\n\nOlá {{nome}}!\n\nSeu pedido #{{pedido_id}} foi recebido com sucesso.\n\nValor: R$ {{valor}}\n\nO que deseja fazer?',
   '[{"id": "btn_confirmar", "text": "✅ Confirmar Pedido"}, {"id": "btn_falar_vendedor", "text": "💬 Falar com Vendedor"}]',
   'transactional'),
  
  ('Menu de Opções', 'Lista interativa com opções de atendimento', 'list',
   '👋 *Olá, {{nome}}!*\n\nEscolha uma das opções abaixo para continuar:',
   '[]',
   'support'),
   
  ('Link de Pagamento', 'CTA com link para pagamento', 'cta',
   '💳 *Pagamento Pendente*\n\nOlá {{nome}}!\n\nPara finalizar seu pedido #{{pedido_id}}, clique no botão abaixo:',
   '[{"id": "btn_pagar", "text": "Pagar Agora", "action": "url", "payload": "{{link_pagamento}}"}]',
   'transactional');

-- Update list_sections para o template de lista
UPDATE public.whatsapp_interactive_templates 
SET list_sections = '[{"title": "Atendimento", "rows": [{"id": "opt_suporte", "title": "🎧 Suporte Técnico", "description": "Tire dúvidas sobre produtos"}, {"id": "opt_vendas", "title": "🛒 Fazer Pedido", "description": "Conheça nossos produtos"}, {"id": "opt_financeiro", "title": "💰 Financeiro", "description": "Pagamentos e boletos"}]}, {"title": "Outros", "rows": [{"id": "opt_humano", "title": "👤 Falar com Atendente", "description": "Atendimento humano"}]}]',
    button_text = 'Ver Opções'
WHERE name = 'Menu de Opções';
