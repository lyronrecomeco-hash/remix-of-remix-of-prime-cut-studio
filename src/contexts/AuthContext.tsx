import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AppRole = 'super_admin' | 'admin' | 'barber';

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AppRole | null;
  adminUsers: AdminUser[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createAdminUser: (email: string, password: string, name: string, role: AppRole, expiresAt?: string) => Promise<{ error: Error | null }>;
  updateAdminUser: (userId: string, updates: Partial<AdminUser>) => Promise<{ error: Error | null }>;
  deleteAdminUser: (userId: string) => Promise<{ error: Error | null }>;
  refreshAdminUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const checkUserRole = useCallback(async (userId: string) => {
    try {
      // Use direct query to user_roles table with type casting
      const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { role: string } | null; error: unknown }> } } } };
      
      const { data, error } = await client.from('user_roles').select('role').eq('user_id', userId).single();

      if (error || !data) {
        setRole(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const userRole = data.role as AppRole;
      setRole(userRole);
      setIsAdmin(userRole === 'admin' || userRole === 'super_admin');
      setIsSuperAdmin(userRole === 'super_admin');
    } catch {
      setRole(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  }, []);

  const refreshAdminUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }> } } };
      
      const { data, error } = await client.from('admin_users').select('*').order('created_at', { ascending: false });

      if (error) throw error;

      setAdminUsers(
        (data || []).map((u) => ({
          id: u.id as string,
          userId: u.user_id as string,
          email: u.email as string,
          name: u.name as string,
          expiresAt: u.expires_at as string | null,
          isActive: u.is_active as boolean,
          createdAt: u.created_at as string,
        }))
      );
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole]);

  useEffect(() => {
    if (isAdmin) {
      refreshAdminUsers();
    }
  }, [isAdmin, refreshAdminUsers]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error };
      }

      // Check if user has a role
      const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: { role: string } | null; error: unknown }> } } } };
      
      const { data: roleData } = await client.from('user_roles').select('role').eq('user_id', data.user.id).single();

      if (!roleData) {
        await supabase.auth.signOut();
        return { error: new Error('Acesso não autorizado. Contate o administrador.') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminUsers([]);
  }, []);

  const createAdminUser = useCallback(async (
    email: string,
    password: string,
    name: string,
    userRole: AppRole,
    expiresAt?: string
  ): Promise<{ error: Error | null }> => {
    if (!isSuperAdmin) {
      return { error: new Error('Apenas super admins podem criar usuários.') };
    }

    try {
      const { data: authData, error: authError } = await supabase.functions.invoke('create-admin-user', {
        body: { email, password, name, role: userRole, expiresAt },
      });

      if (authError || authData?.error) {
        return { error: new Error(authData?.error || authError?.message || 'Erro ao criar usuário') };
      }

      await refreshAdminUsers();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [isSuperAdmin, refreshAdminUsers]);

  const updateAdminUser = useCallback(async (
    userId: string,
    updates: Partial<AdminUser>
  ): Promise<{ error: Error | null }> => {
    if (!isSuperAdmin) {
      return { error: new Error('Apenas super admins podem atualizar usuários.') };
    }

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const client = supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } } };
      
      const { error } = await client.from('admin_users').update(dbUpdates).eq('user_id', userId);

      if (error) throw error;

      await refreshAdminUsers();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [isSuperAdmin, refreshAdminUsers]);

  const deleteAdminUser = useCallback(async (userId: string): Promise<{ error: Error | null }> => {
    if (!isSuperAdmin) {
      return { error: new Error('Apenas super admins podem excluir usuários.') };
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-admin-user', {
        body: { userId },
      });

      if (error || data?.error) {
        return { error: new Error(data?.error || error?.message || 'Erro ao excluir usuário') };
      }

      await refreshAdminUsers();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [isSuperAdmin, refreshAdminUsers]);

  const value: AuthState = {
    user,
    session,
    isLoading,
    isAdmin,
    isSuperAdmin,
    role,
    adminUsers,
    signIn,
    signOut,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    refreshAdminUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
