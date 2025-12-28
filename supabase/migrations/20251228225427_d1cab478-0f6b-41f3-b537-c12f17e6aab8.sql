-- Create admin_settings table to store security, backup, and other admin configurations
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_setting_type UNIQUE (setting_type)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view admin settings
CREATE POLICY "Anyone can view admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Only admins can manage admin settings
CREATE POLICY "Admins can manage admin settings"
ON public.admin_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.admin_settings (setting_type, settings) VALUES
('security', '{
  "twoFactorAuth": false,
  "sessionTimeout": 30,
  "ipWhitelist": [],
  "loginAttemptLimit": 5,
  "requireStrongPassword": true,
  "auditLog": true,
  "pushAlertsEnabled": false,
  "alertOnNewLogin": true,
  "alertOnFailedLogin": true,
  "alertOnSettingsChange": false
}'::jsonb),
('backup', '{
  "autoBackup": false,
  "frequency": "weekly",
  "keepLastBackups": 5
}'::jsonb);

-- Create barber_schedules table to store per-barber schedules
CREATE TABLE public.barber_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_barber_day UNIQUE (barber_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;

-- Anyone can view barber schedules
CREATE POLICY "Anyone can view barber schedules"
ON public.barber_schedules
FOR SELECT
USING (true);

-- Admins can manage barber schedules
CREATE POLICY "Admins can manage barber schedules"
ON public.barber_schedules
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_barber_schedules_updated_at
BEFORE UPDATE ON public.barber_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();