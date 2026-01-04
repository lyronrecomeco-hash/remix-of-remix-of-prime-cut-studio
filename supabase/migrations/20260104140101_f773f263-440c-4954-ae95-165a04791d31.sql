-- Add commercial and test WhatsApp numbers to genesis_users
ALTER TABLE public.genesis_users 
ADD COLUMN IF NOT EXISTS whatsapp_commercial TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_test TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;