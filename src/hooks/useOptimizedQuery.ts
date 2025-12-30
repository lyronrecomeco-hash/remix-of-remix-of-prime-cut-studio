/**
 * PACK ENTERPRISE: Hooks Otimizados com Lazy Loading
 * Substitui carregamento monolítico por queries sob demanda
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { queryWithRetry } from '@/lib/queryWithRetry';

// Constantes de cache
const STALE_TIME = {
  SHORT: 30 * 1000,      // 30 segundos
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 15 * 60 * 1000,  // 15 minutos
} as const;

/**
 * Hook para buscar serviços com cache otimizado
 */
export function useServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['services', user?.id],
    queryFn: () => queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('visible', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }),
    staleTime: STALE_TIME.MEDIUM,
    gcTime: STALE_TIME.LONG,
    enabled: !!user,
  });
}

/**
 * Hook para buscar barbeiros com cache otimizado
 */
export function useBarbers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['barbers', user?.id],
    queryFn: () => queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }),
    staleTime: STALE_TIME.MEDIUM,
    gcTime: STALE_TIME.LONG,
    enabled: !!user,
  });
}

/**
 * Hook para buscar agendamentos por data com paginação
 */
export function useAppointments(date?: string, options?: { limit?: number; page?: number }) {
  const { user } = useAuth();
  const limit = options?.limit || 100;
  const page = options?.page || 0;

  return useQuery({
    queryKey: ['appointments', user?.id, date, limit, page],
    queryFn: () => queryWithRetry(async () => {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: true })
        .range(page * limit, (page + 1) * limit - 1);

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }),
    staleTime: STALE_TIME.SHORT,
    gcTime: STALE_TIME.MEDIUM,
    enabled: !!user,
  });
}

/**
 * Hook para buscar fila com refresh automático
 */
export function useQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['queue', user?.id],
    queryFn: () => queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('queue')
        .select(`
          *,
          appointments (
            id,
            client_name,
            client_phone,
            time,
            barber_id,
            service_id
          )
        `)
        .order('position', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }),
    staleTime: STALE_TIME.SHORT,
    gcTime: STALE_TIME.MEDIUM,
    refetchInterval: 15000, // Auto-refresh a cada 15s
    enabled: !!user,
  });
}

/**
 * Hook para buscar configurações da loja (cache longo)
 */
export function useShopSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shopSettings', user?.id],
    queryFn: () => queryWithRetry(async () => {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }),
    staleTime: STALE_TIME.LONG,
    gcTime: STALE_TIME.LONG * 2,
    enabled: !!user,
  });
}

/**
 * Hook genérico para queries paginadas
 */
export function usePaginatedQuery<T>(
  key: string[],
  queryFn: (page: number, pageSize: number) => Promise<T[]>,
  options?: {
    pageSize?: number;
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { user } = useAuth();
  const pageSize = options?.pageSize || 50;

  return useQuery({
    queryKey: [...key, user?.id, pageSize],
    queryFn: () => queryWithRetry(() => queryFn(0, pageSize)),
    staleTime: options?.staleTime || STALE_TIME.SHORT,
    enabled: options?.enabled !== false && !!user,
  });
}

/**
 * Hook para invalidar caches relacionados
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAppointments: () => 
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    invalidateQueue: () => 
      queryClient.invalidateQueries({ queryKey: ['queue'] }),
    invalidateServices: () => 
      queryClient.invalidateQueries({ queryKey: ['services'] }),
    invalidateBarbers: () => 
      queryClient.invalidateQueries({ queryKey: ['barbers'] }),
    invalidateAll: () => 
      queryClient.invalidateQueries(),
  };
}
