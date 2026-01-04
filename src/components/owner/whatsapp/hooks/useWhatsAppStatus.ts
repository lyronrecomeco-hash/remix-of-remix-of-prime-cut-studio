import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstanceStatus {
  id: string;
  status: string;
  effective_status: string;
  last_heartbeat: string | null;
  phone_number: string | null;
  heartbeat_age_seconds: number;
  is_stale: boolean;
}

// Threshold: 180 seconds (3 minutes) for maximum stability
const STALE_THRESHOLD_MS = 180000;

export function useWhatsAppStatus(pollingIntervalMs = 3000) {
  const [instances, setInstances] = useState<InstanceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, name, status, last_heartbeat, phone_number, backend_url, backend_token')
        .order('created_at', { ascending: false });

      if (error || !data || !mountedRef.current) return;

      const now = Date.now();
      const processed: InstanceStatus[] = data.map((instance: any) => {
        const lastHeartbeat = instance.last_heartbeat 
          ? new Date(instance.last_heartbeat).getTime() 
          : 0;
        const heartbeatAge = lastHeartbeat ? now - lastHeartbeat : Infinity;
        const isStale = heartbeatAge > STALE_THRESHOLD_MS;

        // Determine effective status based on heartbeat freshness
        let effectiveStatus = instance.status;
        
        // Only mark as disconnected if:
        // 1. There was a heartbeat before (not a new instance)
        // 2. The heartbeat is stale
        // 3. The status was connected
        if (effectiveStatus === 'connected' && isStale && lastHeartbeat > 0) {
          effectiveStatus = 'disconnected';
        }

        return {
          id: instance.id,
          status: instance.status,
          effective_status: effectiveStatus,
          last_heartbeat: instance.last_heartbeat,
          phone_number: instance.phone_number,
          heartbeat_age_seconds: Math.floor(heartbeatAge / 1000),
          is_stale: isStale,
        };
      });

      setInstances(processed);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching WhatsApp statuses:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchStatus();

    // Start polling
    pollingRef.current = setInterval(fetchStatus, pollingIntervalMs);

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel('whatsapp_instances_status_v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
        },
        () => {
          fetchStatus();
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
  }, [fetchStatus, pollingIntervalMs]);

  const getEffectiveStatus = useCallback((instanceId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    return inst?.effective_status || 'disconnected';
  }, [instances]);

  const isConnected = useCallback((instanceId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    return inst?.effective_status === 'connected' && !inst.is_stale;
  }, [instances]);

  const getHeartbeatAge = useCallback((instanceId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    return inst?.heartbeat_age_seconds ?? Infinity;
  }, [instances]);

  return {
    instances,
    isLoading,
    lastUpdate,
    refresh: fetchStatus,
    getEffectiveStatus,
    isConnected,
    getHeartbeatAge,
  };
}
