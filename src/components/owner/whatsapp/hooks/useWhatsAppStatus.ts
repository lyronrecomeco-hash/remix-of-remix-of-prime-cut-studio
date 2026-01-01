import { useState, useEffect, useCallback } from 'react';
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
}

export const useWhatsAppStatus = (pollInterval = 30000) => {
  const [instances, setInstances] = useState<InstanceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      // Fetch from database directly - this is the source of truth
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, name, status, phone_number, last_heartbeat_at, uptime_seconds, last_seen')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process instances - check for stale heartbeats
      const enriched = (data || []).map(inst => {
        const lastHeartbeat = inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at) : null;
        const isStale = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) > 120000 : true; // 2 minutes

        return {
          ...inst,
          uptime_seconds: inst.uptime_seconds || 0,
          is_stale: isStale,
          // If connected but no heartbeat for 2+ minutes, consider disconnected
          effective_status: isStale && inst.status === 'connected' ? 'disconnected' : inst.status,
        };
      });

      setInstances(enriched);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_instances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
        },
        (payload) => {
          console.log('WhatsApp instance changed:', payload);
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
  };
};
