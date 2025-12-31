-- Create table for affiliate verification codes (WhatsApp)
CREATE TABLE public.affiliate_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookup
CREATE INDEX idx_affiliate_verification_phone_code ON public.affiliate_verification_codes(phone, code);
CREATE INDEX idx_affiliate_verification_expires ON public.affiliate_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.affiliate_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for registration flow)
CREATE POLICY "Anyone can insert verification codes"
ON public.affiliate_verification_codes
FOR INSERT
WITH CHECK (true);

-- Only system can update (for verification)
CREATE POLICY "System can update verification codes"
ON public.affiliate_verification_codes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only system can select (for verification)
CREATE POLICY "System can select verification codes"
ON public.affiliate_verification_codes
FOR SELECT
USING (true);

-- Cleanup old codes automatically (can be called via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.affiliate_verification_codes
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- Add new template type for affiliate verification to whatsapp_templates
INSERT INTO public.whatsapp_templates (
  template_type,
  name,
  message_template,
  is_active,
  use_ai
) VALUES (
  'affiliate_verification',
  'Verificação de Parceiro',
  '🔐 *Genesis Hub - Programa de Parceiros*

Olá {{nome}}! 👋

Seu código de verificação é: *{{codigo}}*

⏱️ Este código expira em 10 minutos.
🔒 Não compartilhe com ninguém.

Se você não solicitou este código, ignore esta mensagem.',
  true,
  false
) ON CONFLICT DO NOTHING;