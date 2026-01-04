-- Add heartbeat and effective_status columns to whatsapp_instances for stability monitoring
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS effective_status TEXT DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS heartbeat_age_seconds INTEGER DEFAULT 0;

-- Create index for efficient heartbeat queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_heartbeat 
ON public.whatsapp_instances(last_heartbeat) 
WHERE last_heartbeat IS NOT NULL;