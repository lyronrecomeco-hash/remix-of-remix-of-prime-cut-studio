-- Create table for CRM collaborator tokens
CREATE TABLE IF NOT EXISTS public.crm_collaborator_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crm_tenant_id UUID NOT NULL REFERENCES public.crm_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'full' CHECK (access_level IN ('full', 'whatsapp_only')),
  token TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.crm_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.crm_collaborator_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for crm_collaborator_tokens
CREATE POLICY "CRM users can manage tokens in their tenant" 
ON public.crm_collaborator_tokens 
FOR ALL 
USING (crm_tenant_id = get_crm_tenant_id(auth.uid()))
WITH CHECK (crm_tenant_id = get_crm_tenant_id(auth.uid()));

CREATE POLICY "Anyone can validate tokens" 
ON public.crm_collaborator_tokens 
FOR SELECT 
USING (true);

-- Add logo_url column to crm_tenants if not exists
ALTER TABLE public.crm_tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add company_data column to crm_tenants for additional company information
ALTER TABLE public.crm_tenants ADD COLUMN IF NOT EXISTS company_data JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for CRM company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm-logos', 'crm-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for CRM logos
CREATE POLICY "CRM users can upload their company logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crm-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "CRM users can update their company logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crm-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view CRM logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm-logos');

-- Update RLS policy for crm_tenants to allow authenticated users to insert (for owner panel)
DROP POLICY IF EXISTS "Owner can manage all tenants" ON public.crm_tenants;

CREATE POLICY "Authenticated users can create tenants" 
ON public.crm_tenants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can manage all tenants" 
ON public.crm_tenants 
FOR ALL 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Update RLS policy for crm_users to allow authenticated users to insert
DROP POLICY IF EXISTS "Owner can manage all CRM users" ON public.crm_users;

CREATE POLICY "Authenticated users can create CRM users" 
ON public.crm_users 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can manage all CRM users" 
ON public.crm_users 
FOR ALL 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Create crm_notifications table
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crm_tenant_id UUID NOT NULL REFERENCES public.crm_tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.crm_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can view their notifications" 
ON public.crm_notifications 
FOR SELECT 
USING (crm_tenant_id = get_crm_tenant_id(auth.uid()));

CREATE POLICY "CRM users can update their notifications" 
ON public.crm_notifications 
FOR UPDATE 
USING (crm_tenant_id = get_crm_tenant_id(auth.uid()));

CREATE POLICY "System can insert notifications" 
ON public.crm_notifications 
FOR INSERT 
WITH CHECK (true);