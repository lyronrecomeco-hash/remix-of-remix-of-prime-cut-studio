import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenesisUser {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  company_name?: string;
  is_active: boolean;
}

interface GenesisRole {
  role: 'super_admin' | 'admin' | 'user';
}

interface GenesisCredits {
  available_credits: number;
  used_credits: number;
  total_purchased: number;
}

interface GenesisSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: string;
  max_instances: number;
  max_flows: number;
}

interface GenesisAuthState {
  user: User | null;
  session: Session | null;
  genesisUser: GenesisUser | null;
  roles: GenesisRole[];
  credits: GenesisCredits | null;
  subscription: GenesisSubscription | null;
  loading: boolean;
  isSuperAdmin: boolean;
  needsRegistration: boolean;
  googleUserData: { email: string; name: string; avatarUrl?: string } | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, phone?: string, companyName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  createGenesisAccountForGoogleUser: (name: string, phone?: string, companyName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const GenesisAuthContext = createContext<GenesisAuthState | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'lyronrp@gmail.com';

export function GenesisAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [genesisUser, setGenesisUser] = useState<GenesisUser | null>(null);
  const [roles, setRoles] = useState<GenesisRole[]>([]);
  const [credits, setCredits] = useState<GenesisCredits | null>(null);
  const [subscription, setSubscription] = useState<GenesisSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<{ email: string; name: string; avatarUrl?: string } | null>(null);

  const isSuperAdmin = roles.some(r => r.role === 'super_admin');

  const fetchGenesisData = useCallback(async (authUserId: string, authUser?: User) => {
    try {
      // Fetch genesis user
      const { data: userData, error: userError } = await supabase
        .from('genesis_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (userError || !userData) {
        console.log('No genesis user found');
        setGenesisUser(null);
        setRoles([]);
        setCredits(null);
        setSubscription(null);
        
        // Check if this is a Google user that needs registration
        if (authUser?.app_metadata?.provider === 'google' || authUser?.user_metadata?.full_name) {
          setNeedsRegistration(true);
          setGoogleUserData({
            email: authUser.email || '',
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            avatarUrl: authUser.user_metadata?.avatar_url,
          });
        }
        return;
      }

      setNeedsRegistration(false);
      setGoogleUserData(null);
      setGenesisUser(userData as GenesisUser);

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('genesis_user_roles')
        .select('role')
        .eq('user_id', userData.id);

      setRoles((rolesData || []) as GenesisRole[]);

      // Fetch credits
      const { data: creditsData } = await supabase
        .from('genesis_credits')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      setCredits(creditsData as GenesisCredits | null);

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('genesis_subscriptions')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      setSubscription(subscriptionData as GenesisSubscription | null);

    } catch (error) {
      console.error('Error fetching genesis data:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      await fetchGenesisData(user.id);
    }
  }, [user?.id, fetchGenesisData]);

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setTimeout(() => {
            fetchGenesisData(newSession.user.id, newSession.user);
          }, 0);
        } else {
          setGenesisUser(null);
          setRoles([]);
          setCredits(null);
          setSubscription(null);
          setNeedsRegistration(false);
          setGoogleUserData(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchGenesisData(existingSession.user.id, existingSession.user);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, [fetchGenesisData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check if user has genesis account
      if (data.user) {
        const { data: genesisData } = await supabase
          .from('genesis_users')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .single();

        if (!genesisData) {
          await supabase.auth.signOut();
          return { error: { message: 'Conta não encontrada no Genesis Hub. Crie uma conta primeiro.' } };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string, companyName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/genesis`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
            company_name: companyName,
          }
        }
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Create genesis user
        const { data: newUser, error: userError } = await supabase
          .from('genesis_users')
          .insert({
            auth_user_id: data.user.id,
            email,
            name,
            phone,
            company_name: companyName,
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating genesis user:', userError);
          return { error: userError };
        }

        if (newUser) {
          // Determine role based on email
          const role = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';

          // Create role
          await supabase
            .from('genesis_user_roles')
            .insert({
              user_id: newUser.id,
              role,
            });

          // Create initial credits
          await supabase
            .from('genesis_credits')
            .insert({
              user_id: newUser.id,
              available_credits: role === 'super_admin' ? 999999 : 10,
            });

          // Create initial subscription
          await supabase
            .from('genesis_subscriptions')
            .insert({
              user_id: newUser.id,
              plan: role === 'super_admin' ? 'enterprise' : 'free',
              max_instances: role === 'super_admin' ? 100 : 1,
              max_flows: role === 'super_admin' ? 1000 : 5,
            });
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/genesis/login?google_callback=true`,
        }
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // Create genesis account for Google user
  const createGenesisAccountForGoogleUser = async (authUser: User, name: string, phone?: string, companyName?: string) => {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('genesis_users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (existing) {
        return { error: null, alreadyExists: true };
      }

      const email = authUser.email || '';
      
      // Create genesis user
      const { data: newUser, error: userError } = await supabase
        .from('genesis_users')
        .insert({
          auth_user_id: authUser.id,
          email,
          name,
          phone,
          company_name: companyName,
          avatar_url: authUser.user_metadata?.avatar_url,
        })
        .select()
        .single();

      if (userError) {
        return { error: userError };
      }

      if (newUser) {
        const role = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';

        await supabase
          .from('genesis_user_roles')
          .insert({ user_id: newUser.id, role });

        await supabase
          .from('genesis_credits')
          .insert({
            user_id: newUser.id,
            available_credits: role === 'super_admin' ? 999999 : 10,
          });

        await supabase
          .from('genesis_subscriptions')
          .insert({
            user_id: newUser.id,
            plan: role === 'super_admin' ? 'enterprise' : 'free',
            max_instances: role === 'super_admin' ? 100 : 1,
            max_flows: role === 'super_admin' ? 1000 : 5,
          });

        // Refresh data
        await fetchGenesisData(authUser.id);
      }

      return { error: null, alreadyExists: false };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGenesisUser(null);
    setRoles([]);
    setCredits(null);
    setSubscription(null);
    setNeedsRegistration(false);
    setGoogleUserData(null);
  };

  const handleCreateGenesisAccountForGoogleUser = async (name: string, phone?: string, companyName?: string) => {
    if (!user) {
      return { error: { message: 'Usuário não autenticado' } };
    }
    const result = await createGenesisAccountForGoogleUser(user, name, phone, companyName);
    if (!result.error) {
      setNeedsRegistration(false);
      setGoogleUserData(null);
    }
    return result;
  };

  return (
    <GenesisAuthContext.Provider
      value={{
        user,
        session,
        genesisUser,
        roles,
        credits,
        subscription,
        loading,
        isSuperAdmin,
        needsRegistration,
        googleUserData,
        signIn,
        signUp,
        signInWithGoogle,
        createGenesisAccountForGoogleUser: handleCreateGenesisAccountForGoogleUser,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </GenesisAuthContext.Provider>
  );
}

export function useGenesisAuth() {
  const context = useContext(GenesisAuthContext);
  if (!context) {
    throw new Error('useGenesisAuth must be used within a GenesisAuthProvider');
  }
  return context;
}
