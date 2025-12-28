-- Create marketing_campaigns table for mass messaging
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  image_url TEXT,
  button_text TEXT,
  button_url TEXT,
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  use_ai BOOLEAN NOT NULL DEFAULT false,
  ai_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create marketing_contacts table for campaign targets
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_settings table
CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  max_contacts INTEGER NOT NULL DEFAULT 100,
  delay_between_messages INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default marketing settings
INSERT INTO public.marketing_settings (is_enabled, max_contacts, delay_between_messages)
VALUES (false, 100, 3)
ON CONFLICT DO NOTHING;

-- Create storage bucket for marketing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-images', 'marketing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_campaigns
CREATE POLICY "Admin can manage marketing campaigns" ON public.marketing_campaigns
FOR ALL USING (true);

-- RLS policies for marketing_contacts
CREATE POLICY "Admin can manage marketing contacts" ON public.marketing_contacts
FOR ALL USING (true);

-- RLS policies for marketing_settings
CREATE POLICY "Admin can manage marketing settings" ON public.marketing_settings
FOR ALL USING (true);

CREATE POLICY "Anyone can view marketing settings" ON public.marketing_settings
FOR SELECT USING (true);

-- Storage policies for marketing-images bucket
CREATE POLICY "Anyone can view marketing images" ON storage.objects
FOR SELECT USING (bucket_id = 'marketing-images');

CREATE POLICY "Admins can upload marketing images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'marketing-images');

CREATE POLICY "Admins can update marketing images" ON storage.objects
FOR UPDATE USING (bucket_id = 'marketing-images');

CREATE POLICY "Admins can delete marketing images" ON storage.objects
FOR DELETE USING (bucket_id = 'marketing-images');

-- Storage policies for gallery-images bucket
CREATE POLICY "Anyone can view gallery images" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery-images');

CREATE POLICY "Admins can upload gallery images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery-images');

CREATE POLICY "Admins can update gallery images" ON storage.objects
FOR UPDATE USING (bucket_id = 'gallery-images');

CREATE POLICY "Admins can delete gallery images" ON storage.objects
FOR DELETE USING (bucket_id = 'gallery-images');

-- Add updated_at trigger
CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_settings_updated_at
BEFORE UPDATE ON public.marketing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();