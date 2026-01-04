import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstanceStatusResult {
  id: string;
  status: string;
  effective_status: string;
  last_heartbeat: string | null;
  phone_number: string | null;
  heartbeat_age_seconds: number;
  is_stale: boolean;
}

// Increased threshold to 180 seconds (3 minutes) for maximum stability
const STALE_THRESHOLD_MS = 180000;

export function useWhatsAppStatus(instanceIds: string[], pollingIntervalMs = 3000) {
  const [statuses, setStatuses] = useState<Record<string, InstanceStatusResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchStatuses = useCallback(async () => {
    if (!instanceIds.length || !mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, status, effective_status, last_heartbeat, phone_number')
        .in('id', instanceIds);

      if (error || !data || !mountedRef.current) return;

      const now = Date.now();
      const newStatuses: Record<string, InstanceStatusResult> = {};

      for (const instance of data) {
        const lastHeartbeat = instance.last_heartbeat 
          ? new Date(instance.last_heartbeat).getTime() 
          : 0;
        const heartbeatAge = lastHeartbeat ? now - lastHeartbeat : Infinity;
        const isStale = heartbeatAge > STALE_THRESHOLD_MS;

        // Determine effective status based on heartbeat
        let finalStatus = instance.effective_status || instance.status;
        
        // If marked as connected but heartbeat is stale, show as disconnected
        if (finalStatus === 'connected' && isStale && lastHeartbeat > 0) {
          finalStatus = 'disconnected';
        }

        newStatuses[instance.id] = {
          id: instance.id,
          status: instance.status,
          effective_status: finalStatus,
          last_heartbeat: instance.last_heartbeat,
          phone_number: instance.phone_number,
          heartbeat_age_seconds: Math.floor(heartbeatAge / 1000),
          is_stale: isStale,
        };
      }

      setStatuses(newStatuses);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching WhatsApp statuses:', error);
    }
  }, [instanceIds]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchStatuses();

    // Start polling at specified interval
    pollingRef.current = setInterval(fetchStatuses, pollingIntervalMs);

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel('whatsapp_instances_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
        },
        () => {
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [fetchStatuses, pollingIntervalMs]);

  const getStatus = useCallback((instanceId: string) => {
    return statuses[instanceId] || null;
  }, [statuses]);

  const isConnected = useCallback((instanceId: string) => {
    const status = statuses[instanceId];
    return status?.effective_status === 'connected' && !status.is_stale;
  }, [statuses]);

  const getHeartbeatAge = useCallback((instanceId: string) => {
    const status = statuses[instanceId];
    return status?.heartbeat_age_seconds ?? Infinity;
  }, [statuses]);

  return {
    statuses,
    isLoading,
    getStatus,
    isConnected,
    getHeartbeatAge,
    refetch: fetchStatuses,
  };
}
