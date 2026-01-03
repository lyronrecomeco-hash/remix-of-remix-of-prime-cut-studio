-- Create enum for GenesisAuto user roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genesis_role') THEN
        CREATE TYPE public.genesis_role AS ENUM ('super_admin', 'admin', 'user');
    END IF;
END$$;

-- Create enum for GenesisAuto subscription plans
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genesis_plan') THEN
        CREATE TYPE public.genesis_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
    END IF;
END$$;

-- Create GenesisAuto users table
CREATE TABLE IF NOT EXISTS public.genesis_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    company_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GenesisAuto user roles table (separate from users for security)
CREATE TABLE IF NOT EXISTS public.genesis_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.genesis_users(id) ON DELETE CASCADE,
    role genesis_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create GenesisAuto credits table
CREATE TABLE IF NOT EXISTS public.genesis_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.genesis_users(id) ON DELETE CASCADE UNIQUE,
    available_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GenesisAuto subscriptions table
CREATE TABLE IF NOT EXISTS public.genesis_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.genesis_users(id) ON DELETE CASCADE UNIQUE,
    plan genesis_plan NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_instances INTEGER NOT NULL DEFAULT 1,
    max_flows INTEGER NOT NULL DEFAULT 5,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GenesisAuto WhatsApp instances table
CREATE TABLE IF NOT EXISTS public.genesis_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.genesis_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    qr_code TEXT,
    session_data JSONB,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_genesis_users_auth_user_id ON public.genesis_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_genesis_instances_user_id ON public.genesis_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_genesis_instances_status ON public.genesis_instances(status);

-- Enable RLS
ALTER TABLE public.genesis_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_instances ENABLE ROW LEVEL SECURITY;

-- Security definer function to check GenesisAuto roles
CREATE OR REPLACE FUNCTION public.has_genesis_role(_user_id UUID, _role genesis_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.genesis_user_roles gr
        JOIN public.genesis_users gu ON gu.id = gr.user_id
        WHERE gu.auth_user_id = _user_id AND gr.role = _role
    )
$$;

-- Function to get genesis user id from auth user
CREATE OR REPLACE FUNCTION public.get_genesis_user_id(_auth_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.genesis_users WHERE auth_user_id = _auth_user_id LIMIT 1
$$;

-- Function to check if user is genesis super admin
CREATE OR REPLACE FUNCTION public.is_genesis_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_genesis_role(_user_id, 'super_admin')
$$;

-- RLS Policies for genesis_users
CREATE POLICY "Users can view own data" ON public.genesis_users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own data" ON public.genesis_users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Super admins can view all users" ON public.genesis_users
    FOR SELECT USING (public.is_genesis_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all users" ON public.genesis_users
    FOR ALL USING (public.is_genesis_super_admin(auth.uid()));

CREATE POLICY "Allow insert during registration" ON public.genesis_users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- RLS Policies for genesis_user_roles
CREATE POLICY "Users can view own roles" ON public.genesis_user_roles
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Super admins can manage roles" ON public.genesis_user_roles
    FOR ALL USING (public.is_genesis_super_admin(auth.uid()));

CREATE POLICY "Allow insert own role during registration" ON public.genesis_user_roles
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

-- RLS Policies for genesis_credits
CREATE POLICY "Users can view own credits" ON public.genesis_credits
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Super admins can manage credits" ON public.genesis_credits
    FOR ALL USING (public.is_genesis_super_admin(auth.uid()));

CREATE POLICY "Allow insert own credits during registration" ON public.genesis_credits
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

-- RLS Policies for genesis_subscriptions
CREATE POLICY "Users can view own subscription" ON public.genesis_subscriptions
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Super admins can manage subscriptions" ON public.genesis_subscriptions
    FOR ALL USING (public.is_genesis_super_admin(auth.uid()));

CREATE POLICY "Allow insert own subscription during registration" ON public.genesis_subscriptions
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

-- RLS Policies for genesis_instances
CREATE POLICY "Users can view own instances" ON public.genesis_instances
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can manage own instances" ON public.genesis_instances
    FOR ALL USING (
        user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Super admins can manage all instances" ON public.genesis_instances
    FOR ALL USING (public.is_genesis_super_admin(auth.uid()));

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_genesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_genesis_users_updated_at ON public.genesis_users;
CREATE TRIGGER update_genesis_users_updated_at
    BEFORE UPDATE ON public.genesis_users
    FOR EACH ROW EXECUTE FUNCTION public.update_genesis_updated_at();

DROP TRIGGER IF EXISTS update_genesis_credits_updated_at ON public.genesis_credits;
CREATE TRIGGER update_genesis_credits_updated_at
    BEFORE UPDATE ON public.genesis_credits
    FOR EACH ROW EXECUTE FUNCTION public.update_genesis_updated_at();

DROP TRIGGER IF EXISTS update_genesis_subscriptions_updated_at ON public.genesis_subscriptions;
CREATE TRIGGER update_genesis_subscriptions_updated_at
    BEFORE UPDATE ON public.genesis_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_genesis_updated_at();

DROP TRIGGER IF EXISTS update_genesis_instances_updated_at ON public.genesis_instances;
CREATE TRIGGER update_genesis_instances_updated_at
    BEFORE UPDATE ON public.genesis_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_genesis_updated_at();