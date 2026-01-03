-- Add AI and working hours columns to whatsapp_automations
ALTER TABLE public.whatsapp_automations 
ADD COLUMN IF NOT EXISTS ai_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_model text,
ADD COLUMN IF NOT EXISTS ai_temperature numeric DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS ai_max_tokens integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS ai_system_prompt text,
ADD COLUMN IF NOT EXISTS working_hours_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trigger_conditions jsonb;