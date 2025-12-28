-- Create table for barber leaves/vacations (Folgas/Férias)
CREATE TABLE public.barber_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'dayoff', -- 'dayoff', 'vacation', 'medical', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.barber_leaves ENABLE ROW LEVEL SECURITY;

-- RLS policies for barber_leaves
CREATE POLICY "Admins can manage barber leaves"
ON public.barber_leaves
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view barber leaves"
ON public.barber_leaves
FOR SELECT
USING (true);

-- Create table for monthly goals (Metas Mensais)
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE, -- NULL means shop-wide goal
  goal_type TEXT NOT NULL DEFAULT 'revenue', -- 'revenue', 'appointments', 'new_clients', 'avg_rating'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  bonus_amount NUMERIC DEFAULT 0, -- Bonus for reaching goal
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, goal_type, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_goals
CREATE POLICY "Admins can manage monthly goals"
ON public.monthly_goals
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view monthly goals"
ON public.monthly_goals
FOR SELECT
USING (true);

-- Create table for barber performance metrics (cached/aggregated)
CREATE TABLE public.barber_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  completed_appointments INTEGER NOT NULL DEFAULT 0,
  cancelled_appointments INTEGER NOT NULL DEFAULT 0,
  no_show_appointments INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  avg_rating NUMERIC DEFAULT NULL,
  new_clients INTEGER NOT NULL DEFAULT 0,
  returning_clients INTEGER NOT NULL DEFAULT 0,
  avg_service_time INTEGER DEFAULT NULL, -- in minutes
  most_popular_service_id UUID REFERENCES public.services(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barber_id, period_type, period_start)
);

-- Enable RLS
ALTER TABLE public.barber_performance ENABLE ROW LEVEL SECURITY;

-- RLS policies for barber_performance
CREATE POLICY "Admins can manage barber performance"
ON public.barber_performance
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view barber performance"
ON public.barber_performance
FOR SELECT
USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_barber_leaves_updated_at
  BEFORE UPDATE ON public.barber_leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_goals_updated_at
  BEFORE UPDATE ON public.monthly_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_barber_performance_updated_at
  BEFORE UPDATE ON public.barber_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();