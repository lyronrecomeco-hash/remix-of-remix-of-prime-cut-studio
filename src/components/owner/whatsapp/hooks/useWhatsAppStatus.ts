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
        // Use last_heartbeat_at OR last_seen as the freshness indicator
        const lastActivity = inst.last_heartbeat_at || inst.last_seen;
        const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
        const STALE_THRESHOLD_MS = 120000; // 2 minutes
        
        // Only consider stale if we have a timestamp that is old
        // If we have NO timestamp but status is 'connected', trust the database status
        const isStale = lastActivityDate 
          ? (Date.now() - lastActivityDate.getTime()) > STALE_THRESHOLD_MS 
          : false; // If no timestamp, don't assume stale - trust the status field

        // Determine effective status:
        // - If database says 'connected' and activity is recent (or no activity data), trust it
        // - If database says 'connected' but activity is stale, mark as disconnected
        let effectiveStatus = inst.status;
        if (inst.status === 'connected' && isStale) {
          effectiveStatus = 'disconnected';
        }

        return {
          ...inst,
          uptime_seconds: inst.uptime_seconds || 0,
          is_stale: isStale,
          effective_status: effectiveStatus,
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
