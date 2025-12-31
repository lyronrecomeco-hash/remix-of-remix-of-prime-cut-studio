-- Create owner ChatPro config in owner_settings if not exists
INSERT INTO public.owner_settings (setting_key, setting_value, description)
VALUES (
  'affiliate_chatpro_config',
  '{"base_endpoint": "https://v2.chatpro.com.br", "instance_id": "", "api_token": "", "is_enabled": false}'::jsonb,
  'Configuração do ChatPro para verificação de afiliados'
)
ON CONFLICT (setting_key) DO NOTHING;