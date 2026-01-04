import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as QRCode from 'qrcode';

interface ConnectionState {
  isConnecting: boolean;
  isPolling: boolean;
  qrCode: string | null;
  error: string | null;
  attempts: number;
  phase: 'idle' | 'validating' | 'generating' | 'waiting' | 'connected' | 'error';
}

interface InstanceStatus {
  status: string;
  phoneNumber?: string;
  lastHeartbeat?: string;
  isStale: boolean;
}

const STALE_THRESHOLD_MS = 180000; // 3 minutes

export function useGenesisWhatsAppConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnecting: false,
    isPolling: false,
    qrCode: null,
    error: null,
    attempts: 0,
    phase: 'idle',
  });
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastQrRefreshAtRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const maxPollingAttempts = 180; // 3 minutes
  const pollingInterval = 1000;
  const qrAutoRefreshMs = 45000;

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((updater: (prev: ConnectionState) => ConnectionState) => {
    if (mountedRef.current) {
      setConnectionState(updater);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    safeSetState(prev => ({ ...prev, isPolling: false }));
  }, [safeSetState]);

  const stopStatusPolling = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      stopStatusPolling();
    };
  }, [stopPolling, stopStatusPolling]);

  const updateInstanceInDB = async (instanceId: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('genesis_instances')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', instanceId);
      
      if (error) {
        console.error('Error updating genesis instance:', error);
      }
    } catch (error) {
      console.error('Error updating genesis instance:', error);
    }
  };

  const shouldUseProxy = (backendUrl: string) => {
    try {
      const u = new URL(backendUrl);
      const isHttp = u.protocol === 'http:';
      const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
      return typeof window !== 'undefined' && window.location.protocol === 'https:' && isHttp && !isLocalhost;
    } catch {
      return false;
    }
  };

  const proxyRequest = async (
    path: string,
    method: 'GET' | 'POST',
    body?: unknown
  ): Promise<{ ok: boolean; status: number; data: any }> => {
    const { data, error } = await supabase.functions.invoke('whatsapp-backend-proxy', {
      body: { path, method, body },
    });

    if (error) throw new Error(error.message);
    return (data || { ok: false, status: 0, data: null }) as any;
  };

  const normalizeQrToDataUrl = useCallback(async (rawQr: string): Promise<string> => {
    if (rawQr.startsWith('data:')) return rawQr;
    if (/^[A-Za-z0-9+/=]+$/.test(rawQr.slice(0, 50))) {
      return `data:image/png;base64,${rawQr}`;
    }
    try {
      return await QRCode.toDataURL(rawQr, { width: 256, margin: 1 });
    } catch {
      throw new Error('QR Code inválido');
    }
  }, []);

  const validateBackendHealth = async (backendUrl: string, token: string): Promise<boolean> => {
    if (shouldUseProxy(backendUrl)) {
      try {
        const res = await proxyRequest('/health', 'GET');
        return res.ok;
      } catch {
        return false;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkStatus = async (
    instanceId: string,
    backendUrl: string,
    token: string
  ): Promise<{ connected: boolean; phoneNumber?: string }> => {
    if (shouldUseProxy(backendUrl)) {
      try {
        const res = await proxyRequest(`/api/instance/${instanceId}/status`, 'GET');
        if (!res.ok) return { connected: false };
        const result = res.data || {};
        return {
          connected: result.connected === true || result.status === 'connected' || result.state === 'open',
          phoneNumber: result.phone || result.phoneNumber || result.jid?.split('@')[0],
        };
      } catch {
        return { connected: false };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${backendUrl}/api/instance/${instanceId}/status`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) return { connected: false };

      const result = await response.json();
      return {
        connected: result.connected === true || result.status === 'connected' || result.state === 'open',
        phoneNumber: result.phone || result.phoneNumber || result.jid?.split('@')[0],
      };
    } catch {
      return { connected: false };
    }
  };

  const generateQRCode = async (
    instanceId: string,
    backendUrl: string,
    token: string
  ): Promise<string | null> => {
    const useProxy = shouldUseProxy(backendUrl);

    const doRequest = async () => {
      if (useProxy) {
        const res = await proxyRequest(`/api/instance/${instanceId}/qrcode`, 'GET');
        if (!res.ok) throw new Error('Erro ao gerar QR Code');
        if (res.data?.connected || res.data?.status === 'connected') return 'CONNECTED';
        const rawQr = res.data?.qrcode || res.data?.qr || res.data?.base64;
        if (typeof rawQr === 'string') return await normalizeQrToDataUrl(rawQr);
        throw new Error('QR Code não disponível');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${backendUrl}/api/instance/${instanceId}/qrcode`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Erro ao gerar QR Code');

      const result = await response.json();
      if (result.connected || result.status === 'connected') return 'CONNECTED';

      const rawQr = result.qrcode || result.qr || result.base64;
      if (typeof rawQr === 'string') return await normalizeQrToDataUrl(rawQr);
      throw new Error('QR Code não disponível');
    };

    return await doRequest();
  };

  const startConnection = useCallback(async (
    instanceId: string,
    backendUrl: string,
    token: string,
    onConnected?: () => void
  ) => {
    stopPolling();
    
    safeSetState(() => ({
      isConnecting: true,
      isPolling: false,
      qrCode: null,
      error: null,
      attempts: 0,
      phase: 'validating',
    }));

    try {
      // Save backend config to instance
      await updateInstanceInDB(instanceId, {
        backend_url: backendUrl,
        backend_token: token,
      });

      // Validate backend health
      const isHealthy = await validateBackendHealth(backendUrl, token);
      if (!isHealthy) {
        throw new Error('Backend não disponível. Verifique se o script local está rodando.');
      }

      safeSetState(prev => ({ ...prev, phase: 'generating' }));

      // Check if already connected
      const initialStatus = await checkStatus(instanceId, backendUrl, token);
      if (initialStatus.connected) {
        await updateInstanceInDB(instanceId, {
          status: 'connected',
          phone_number: initialStatus.phoneNumber,
          last_heartbeat: new Date().toISOString(),
          effective_status: 'connected',
        });
        toast.success('WhatsApp já está conectado!');
        safeSetState(() => ({
          isConnecting: false,
          isPolling: false,
          qrCode: null,
          error: null,
          attempts: 0,
          phase: 'connected',
        }));
        onConnected?.();
        return;
      }

      // Update to pending
      await updateInstanceInDB(instanceId, { status: 'qr_pending' });

      // Generate QR Code
      const qrResult = await generateQRCode(instanceId, backendUrl, token);
      
      if (qrResult === 'CONNECTED') {
        await updateInstanceInDB(instanceId, {
          status: 'connected',
          last_heartbeat: new Date().toISOString(),
          effective_status: 'connected',
        });
        toast.success('WhatsApp conectado!');
        safeSetState(() => ({
          isConnecting: false,
          isPolling: false,
          qrCode: null,
          error: null,
          attempts: 0,
          phase: 'connected',
        }));
        onConnected?.();
        return;
      }

      if (!qrResult) throw new Error('Não foi possível gerar o QR Code');

      // Show QR and start polling
      lastQrRefreshAtRef.current = Date.now();
      safeSetState(() => ({
        isConnecting: false,
        isPolling: true,
        qrCode: qrResult,
        error: null,
        attempts: 0,
        phase: 'waiting',
      }));

      let attempts = 0;
      pollingRef.current = setInterval(async () => {
        if (!mountedRef.current) {
          stopPolling();
          return;
        }

        attempts++;
        safeSetState(prev => ({ ...prev, attempts }));

        if (attempts >= maxPollingAttempts) {
          stopPolling();
          safeSetState(prev => ({
            ...prev,
            error: 'Tempo limite excedido. Tente novamente.',
            isPolling: false,
            phase: 'error',
          }));
          await updateInstanceInDB(instanceId, { status: 'disconnected' });
          toast.error('Tempo limite para conexão excedido');
          return;
        }

        // Auto-refresh QR every 45 seconds
        if (Date.now() - lastQrRefreshAtRef.current > qrAutoRefreshMs) {
          try {
            const nextQr = await generateQRCode(instanceId, backendUrl, token);
            if (nextQr && nextQr !== 'CONNECTED') {
              lastQrRefreshAtRef.current = Date.now();
              safeSetState(prev => ({ ...prev, qrCode: nextQr }));
            }
          } catch {}
        }

        // Check connection status
        const statusResult = await checkStatus(instanceId, backendUrl, token);
        if (statusResult.connected) {
          stopPolling();
          await updateInstanceInDB(instanceId, {
            status: 'connected',
            phone_number: statusResult.phoneNumber,
            last_heartbeat: new Date().toISOString(),
            effective_status: 'connected',
          });
          safeSetState(() => ({
            isConnecting: false,
            isPolling: false,
            qrCode: null,
            error: null,
            attempts: 0,
            phase: 'connected',
          }));
          toast.success('WhatsApp conectado com sucesso!');
          onConnected?.();
        }
      }, pollingInterval);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao conectar';
      safeSetState(() => ({
        isConnecting: false,
        isPolling: false,
        qrCode: null,
        error: message,
        attempts: 0,
        phase: 'error',
      }));
      await updateInstanceInDB(instanceId, { status: 'disconnected' });
      toast.error(message);
    }
  }, [stopPolling, normalizeQrToDataUrl, safeSetState]);

  const disconnect = useCallback(async (
    instanceId: string,
    backendUrl?: string,
    token?: string
  ) => {
    stopPolling();
    
    if (backendUrl && token) {
      try {
        if (shouldUseProxy(backendUrl)) {
          await proxyRequest(`/api/instance/${instanceId}/disconnect`, 'POST', {});
        } else {
          await fetch(`${backendUrl}/api/instance/${instanceId}/disconnect`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {}
    }

    await updateInstanceInDB(instanceId, {
      status: 'disconnected',
      effective_status: 'disconnected',
      qr_code: null,
    });

    safeSetState(() => ({
      isConnecting: false,
      isPolling: false,
      qrCode: null,
      error: null,
      attempts: 0,
      phase: 'idle',
    }));

    toast.success('Desconectado');
  }, [stopPolling, safeSetState]);

  const getInstanceStatus = useCallback(async (instanceId: string): Promise<InstanceStatus> => {
    const { data, error } = await supabase
      .from('genesis_instances')
      .select('status, phone_number, last_heartbeat, effective_status')
      .eq('id', instanceId)
      .single();

    if (error || !data) {
      return { status: 'disconnected', isStale: true };
    }

    const lastHeartbeat = data.last_heartbeat ? new Date(data.last_heartbeat) : null;
    const isStale = !lastHeartbeat || (Date.now() - lastHeartbeat.getTime() > STALE_THRESHOLD_MS);

    return {
      status: isStale ? 'disconnected' : (data.effective_status || data.status),
      phoneNumber: data.phone_number || undefined,
      lastHeartbeat: data.last_heartbeat || undefined,
      isStale,
    };
  }, []);

  const startStatusPolling = useCallback((instanceId: string, onStatusChange: (status: InstanceStatus) => void) => {
    stopStatusPolling();
    
    const poll = async () => {
      if (!mountedRef.current) {
        stopStatusPolling();
        return;
      }
      const status = await getInstanceStatus(instanceId);
      onStatusChange(status);
    };

    poll(); // Initial check
    statusPollingRef.current = setInterval(poll, 3000); // Every 3 seconds
  }, [getInstanceStatus, stopStatusPolling]);

  const resetState = useCallback(() => {
    stopPolling();
    safeSetState(() => ({
      isConnecting: false,
      isPolling: false,
      qrCode: null,
      error: null,
      attempts: 0,
      phase: 'idle',
    }));
  }, [stopPolling, safeSetState]);

  return {
    connectionState,
    startConnection,
    disconnect,
    stopPolling,
    getInstanceStatus,
    startStatusPolling,
    stopStatusPolling,
    resetState,
  };
}
