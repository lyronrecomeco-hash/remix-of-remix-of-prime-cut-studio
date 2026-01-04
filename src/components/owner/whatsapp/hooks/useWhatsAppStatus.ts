import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstanceStatus {
  id: string;
  name: string;
  status: string;
  phone_number: string | null;
  last_heartbeat_at: string | null;
  uptime_seconds: number;
  last_seen: string | null;
  is_stale: boolean;
  effective_status: string;
  heartbeat_age_seconds: number;
}

// Threshold mais seguro: 120s (evita “desconectou sozinho” por jitter de rede)
const STALE_THRESHOLD_MS = 120000; // 2 minutos
export const useWhatsAppStatus = (pollInterval = 15000) => {
  const [instances, setInstances] = useState<InstanceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const isMountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, name, status, phone_number, last_heartbeat_at, uptime_seconds, last_seen')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!isMountedRef.current) return;

      const now = Date.now();
      const enriched = (data || []).map(inst => {
        // Prioriza last_heartbeat_at, depois last_seen
        const lastActivity = inst.last_heartbeat_at || inst.last_seen;
        const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
        const heartbeatAgeMs = lastActivityDate ? (now - lastActivityDate.getTime()) : Infinity;
        const heartbeatAgeSeconds = Math.floor(heartbeatAgeMs / 1000);
        
        // Considera stale se:
        // 1. Tem timestamp e está velho (> 60s)
        // 2. Não tem timestamp nenhum E status diz conectado (inconsistente)
        const isStale = lastActivityDate 
          ? heartbeatAgeMs > STALE_THRESHOLD_MS 
          : inst.status === 'connected'; // Se não tem timestamp mas diz conectado, é stale

        // Effective status baseado em heartbeat real
        let effectiveStatus = inst.status;
        if (inst.status === 'connected' && isStale) {
          effectiveStatus = 'disconnected';
        }
        // Se tem heartbeat recente mas status diz disconnected, confia no heartbeat
        if (inst.status === 'disconnected' && lastActivityDate && heartbeatAgeMs < STALE_THRESHOLD_MS) {
          // Verifica se o último heartbeat tinha status conectado
          // Neste caso mantém o status do banco pois o heartbeat pode ter enviado 'disconnected'
        }

        return {
          ...inst,
          uptime_seconds: inst.uptime_seconds || 0,
          is_stale: isStale,
          effective_status: effectiveStatus,
          heartbeat_age_seconds: heartbeatAgeSeconds,
        };
      });

      setInstances(enriched);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchStatus();
    return () => { isMountedRef.current = false; };
  }, [fetchStatus]);

  // Polling mais frequente (15s padrão)
  useEffect(() => {
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  // Subscribe to realtime changes - reage instantaneamente
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_instances_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
        },
        () => {
          // Fetch imediato quando banco atualiza
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  return {
    instances,
    isLoading,
    lastUpdate,
    refresh: fetchStatus,
    getEffectiveStatus: (instanceId: string) => {
      const inst = instances.find(i => i.id === instanceId);
      return inst?.effective_status || 'disconnected';
    },
    isConnected: (instanceId: string) => {
      const inst = instances.find(i => i.id === instanceId);
      return inst?.effective_status === 'connected';
    },
    getHeartbeatAge: (instanceId: string) => {
      const inst = instances.find(i => i.id === instanceId);
      return inst?.heartbeat_age_seconds || Infinity;
    },
  };
};
