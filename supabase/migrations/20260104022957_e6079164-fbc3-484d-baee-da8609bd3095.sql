-- Add backend connection fields to genesis_instances for WhatsApp connection
ALTER TABLE public.genesis_instances 
ADD COLUMN IF NOT EXISTS backend_url TEXT,
ADD COLUMN IF NOT EXISTS backend_token TEXT,
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS effective_status TEXT DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS heartbeat_age_seconds INTEGER DEFAULT 0;

-- Create index for heartbeat monitoring
CREATE INDEX IF NOT EXISTS idx_genesis_instances_heartbeat 
ON public.genesis_instances(last_heartbeat) 
WHERE last_heartbeat IS NOT NULL;

-- Create trigger to update updated_at
CREATE OR REPLACE TRIGGER update_genesis_instances_updated_at
BEFORE UPDATE ON public.genesis_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_genesis_updated_at();