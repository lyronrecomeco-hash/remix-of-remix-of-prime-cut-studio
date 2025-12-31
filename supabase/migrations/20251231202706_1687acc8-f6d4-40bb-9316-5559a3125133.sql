-- Create table for WhatsApp Automation templates (for collaborator tokens, etc.)
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_type)
);

-- Enable RLS
ALTER TABLE public.whatsapp_automation_templates ENABLE ROW LEVEL SECURITY;

-- Only owner can manage templates
CREATE POLICY "Owner can manage automation templates"
ON public.whatsapp_automation_templates
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Insert default template for collaborator token
INSERT INTO public.whatsapp_automation_templates (template_type, name, message_template)
VALUES (
  'collaborator_token',
  'Token de Acesso Colaborador',
  '🔐 *Acesso CRM - {{empresa}}*

Olá, *{{nome}}*! 👋

Você foi adicionado como colaborador no CRM da empresa *{{empresa}}*.

🔑 *Seu token de acesso:*
```
{{token}}
```

📲 *Para acessar o sistema:*
1. Acesse: {{link}}
2. Cole o token acima
3. Pronto! Você terá acesso ao CRM

⚠️ *Importante:*
- Este token é pessoal e intransferível
- Válido por 7 dias
- Use apenas uma vez

Em caso de dúvidas, entre em contato com a empresa.'
) ON CONFLICT (template_type) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_automation_templates_updated_at
BEFORE UPDATE ON public.whatsapp_automation_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();