-- Create email_confirmation_tokens table for custom token-based email confirmation
CREATE TABLE public.email_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Allow system to manage tokens
CREATE POLICY "System can manage confirmation tokens" ON public.email_confirmation_tokens 
FOR ALL USING (true) WITH CHECK (true);

-- Create email_webhook_events table for Resend webhook events
CREATE TABLE public.email_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  email_id TEXT,
  recipient_email TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;

-- Owner can view webhook events
CREATE POLICY "Owner can view webhook events" ON public.email_webhook_events 
FOR SELECT USING (is_owner(auth.uid()));

-- System can insert webhook events
CREATE POLICY "System can insert webhook events" ON public.email_webhook_events 
FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_email_confirmation_tokens_token ON public.email_confirmation_tokens(token);
CREATE INDEX idx_email_confirmation_tokens_user_id ON public.email_confirmation_tokens(user_id);
CREATE INDEX idx_email_webhook_events_created_at ON public.email_webhook_events(created_at DESC);