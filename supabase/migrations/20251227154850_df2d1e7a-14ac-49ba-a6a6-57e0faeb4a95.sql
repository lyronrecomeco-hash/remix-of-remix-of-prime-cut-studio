-- Create ChatPro configuration table
CREATE TABLE public.chatpro_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_token TEXT,
  instance_id TEXT,
  base_endpoint TEXT DEFAULT 'https://v2.chatpro.com.br',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatpro_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage chatpro config"
ON public.chatpro_config
FOR ALL
USING (true);

CREATE POLICY "Anyone can view chatpro config"
ON public.chatpro_config
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_chatpro_config_updated_at
BEFORE UPDATE ON public.chatpro_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config
INSERT INTO public.chatpro_config (id) VALUES (gen_random_uuid());

-- Add enabled flag to message_templates for ChatPro integration
ALTER TABLE public.message_templates 
ADD COLUMN IF NOT EXISTS chatpro_enabled BOOLEAN DEFAULT true;