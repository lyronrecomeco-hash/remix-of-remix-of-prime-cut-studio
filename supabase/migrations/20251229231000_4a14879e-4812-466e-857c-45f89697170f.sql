-- Add user_id column for multi-tenant isolation to all tenant-specific tables

-- 1. shop_settings
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. barbers
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. message_templates
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. chatpro_config
ALTER TABLE public.chatpro_config ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. admin_settings
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. barber_schedules
ALTER TABLE public.barber_schedules ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 9. queue
ALTER TABLE public.queue ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 10. blocked_slots
ALTER TABLE public.blocked_slots ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 11. barber_availability
ALTER TABLE public.barber_availability ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 12. marketing_campaigns
ALTER TABLE public.marketing_campaigns ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 13. marketing_contacts
ALTER TABLE public.marketing_contacts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 14. marketing_settings
ALTER TABLE public.marketing_settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 15. monthly_goals
ALTER TABLE public.monthly_goals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 16. webhook_configs
ALTER TABLE public.webhook_configs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 17. barber_performance
ALTER TABLE public.barber_performance ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 18. barber_leaves
ALTER TABLE public.barber_leaves ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 19. site_analytics
ALTER TABLE public.site_analytics ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create feedbacks table (replacing localStorage)
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL,
  avatar_type text NOT NULL DEFAULT 'male',
  avatar_url text,
  status text NOT NULL DEFAULT 'new',
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on feedbacks
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feedbacks
CREATE POLICY "Users can view own feedbacks" ON public.feedbacks
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own feedbacks" ON public.feedbacks
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can insert feedbacks" ON public.feedbacks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner can view all feedbacks" ON public.feedbacks
FOR SELECT USING (is_owner(auth.uid()));

-- Update RLS policies for multi-tenant tables

-- Drop existing policies and create new tenant-isolated ones
-- shop_settings
DROP POLICY IF EXISTS "Admin can manage shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Anyone can view shop settings" ON public.shop_settings;

CREATE POLICY "Users can manage own shop settings" ON public.shop_settings
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view shop settings" ON public.shop_settings
FOR SELECT USING (true);

-- services
DROP POLICY IF EXISTS "Admin can manage all services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;

CREATE POLICY "Users can manage own services" ON public.services
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view visible services" ON public.services
FOR SELECT USING (visible = true);

-- barbers
DROP POLICY IF EXISTS "Admin can manage barbers" ON public.barbers;
DROP POLICY IF EXISTS "Anyone can view barbers" ON public.barbers;

CREATE POLICY "Users can manage own barbers" ON public.barbers
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view barbers" ON public.barbers
FOR SELECT USING (true);

-- appointments
DROP POLICY IF EXISTS "Admin can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view their appointments by phone" ON public.appointments;

CREATE POLICY "Users can manage own appointments" ON public.appointments
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view appointments" ON public.appointments
FOR SELECT USING (true);

-- message_templates
DROP POLICY IF EXISTS "Admin can manage message templates" ON public.message_templates;
DROP POLICY IF EXISTS "Anyone can view message templates" ON public.message_templates;

CREATE POLICY "Users can manage own templates" ON public.message_templates
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view templates" ON public.message_templates
FOR SELECT USING (true);

-- chatpro_config
DROP POLICY IF EXISTS "Admins can manage chatpro config" ON public.chatpro_config;
DROP POLICY IF EXISTS "Anyone can view chatpro config" ON public.chatpro_config;

CREATE POLICY "Users can manage own chatpro config" ON public.chatpro_config
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view chatpro config" ON public.chatpro_config
FOR SELECT USING (true);

-- admin_settings
DROP POLICY IF EXISTS "Admins can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Anyone can view admin settings" ON public.admin_settings;

CREATE POLICY "Users can manage own admin settings" ON public.admin_settings
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view admin settings" ON public.admin_settings
FOR SELECT USING (true);

-- barber_schedules
DROP POLICY IF EXISTS "Admins can manage barber schedules" ON public.barber_schedules;
DROP POLICY IF EXISTS "Anyone can view barber schedules" ON public.barber_schedules;

CREATE POLICY "Users can manage own barber schedules" ON public.barber_schedules
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view barber schedules" ON public.barber_schedules
FOR SELECT USING (true);

-- queue
DROP POLICY IF EXISTS "Admin can manage queue" ON public.queue;
DROP POLICY IF EXISTS "Anyone can create queue entry" ON public.queue;
DROP POLICY IF EXISTS "Anyone can view queue" ON public.queue;

CREATE POLICY "Users can manage own queue" ON public.queue
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create queue entry" ON public.queue
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view queue" ON public.queue
FOR SELECT USING (true);

-- blocked_slots
DROP POLICY IF EXISTS "Admin can manage blocked slots" ON public.blocked_slots;

CREATE POLICY "Users can manage own blocked slots" ON public.blocked_slots
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view blocked slots" ON public.blocked_slots
FOR SELECT USING (true);

-- barber_availability
DROP POLICY IF EXISTS "Admin can manage barber availability" ON public.barber_availability;
DROP POLICY IF EXISTS "Anyone can view barber availability" ON public.barber_availability;

CREATE POLICY "Users can manage own barber availability" ON public.barber_availability
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view barber availability" ON public.barber_availability
FOR SELECT USING (true);

-- marketing_campaigns
DROP POLICY IF EXISTS "Admin can manage marketing campaigns" ON public.marketing_campaigns;

CREATE POLICY "Users can manage own marketing campaigns" ON public.marketing_campaigns
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

-- marketing_contacts
DROP POLICY IF EXISTS "Admin can manage marketing contacts" ON public.marketing_contacts;

CREATE POLICY "Users can manage own marketing contacts" ON public.marketing_contacts
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

-- marketing_settings
DROP POLICY IF EXISTS "Admin can manage marketing settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Anyone can view marketing settings" ON public.marketing_settings;

CREATE POLICY "Users can manage own marketing settings" ON public.marketing_settings
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own marketing settings" ON public.marketing_settings
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- monthly_goals
DROP POLICY IF EXISTS "Admins can manage monthly goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Anyone can view monthly goals" ON public.monthly_goals;

CREATE POLICY "Users can manage own monthly goals" ON public.monthly_goals
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly goals" ON public.monthly_goals
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- webhook_configs
DROP POLICY IF EXISTS "Admin can manage webhook configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Anyone can view webhook configs" ON public.webhook_configs;

CREATE POLICY "Users can manage own webhook configs" ON public.webhook_configs
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own webhook configs" ON public.webhook_configs
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- barber_performance
DROP POLICY IF EXISTS "Admins can manage barber performance" ON public.barber_performance;
DROP POLICY IF EXISTS "Anyone can view barber performance" ON public.barber_performance;

CREATE POLICY "Users can manage own barber performance" ON public.barber_performance
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own barber performance" ON public.barber_performance
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- barber_leaves
DROP POLICY IF EXISTS "Admins can manage barber leaves" ON public.barber_leaves;
DROP POLICY IF EXISTS "Anyone can view barber leaves" ON public.barber_leaves;

CREATE POLICY "Users can manage own barber leaves" ON public.barber_leaves
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own barber leaves" ON public.barber_leaves
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- site_analytics
DROP POLICY IF EXISTS "Admins can view analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "Anyone can update analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON public.site_analytics;

CREATE POLICY "Users can manage own site analytics" ON public.site_analytics
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own site analytics" ON public.site_analytics
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert analytics" ON public.site_analytics
FOR INSERT WITH CHECK (true);

-- Create trigger for feedbacks updated_at
CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();