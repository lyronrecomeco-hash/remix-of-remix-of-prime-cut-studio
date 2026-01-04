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
      
      // Log status changes to event logs
      if (updates.status) {
        try {
          const eventType = updates.status === 'connected' ? 'connected' : updates.status === 'disconnected' ? 'disconnected' : 'status_change';
          await supabase.from('genesis_event_logs').insert([{
            instance_id: instanceId,
            event_type: eventType,
            severity: 'info',
            message: `Status alterado para: ${updates.status}`,
            details: JSON.parse(JSON.stringify(updates)),
          }]);
        } catch (logError) {
          console.error('Error logging event:', logError);
        }
      }
    } catch (error) {
      console.error('Error updating genesis instance:', error);
    }
  };

  // Make proxy request through genesis-backend-proxy
  const proxyRequest = async (
    instanceId: string,
    path: string,
    method: 'GET' | 'POST',
    body?: unknown
  ): Promise<{ ok: boolean; status: number; data: any; error?: string; needsConfig?: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke('genesis-backend-proxy', {
        body: { instanceId, path, method, body },
      });

      if (error) {
        console.error('Proxy request error:', error);
        return { ok: false, status: 0, data: null, error: error.message };
      }
      
      return (data || { ok: false, status: 0, data: null }) as any;
    } catch (err) {
      console.error('Proxy request exception:', err);
      return { ok: false, status: 0, data: null, error: 'Erro de conexão' };
    }
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

  const validateBackendHealth = async (instanceId: string): Promise<{ healthy: boolean; error?: string }> => {
    const res = await proxyRequest(instanceId, '/health', 'GET');
    
    if (res.needsConfig) {
      return { healthy: false, error: res.error || 'Backend não configurado' };
    }
    
    if (res.error) {
      return { healthy: false, error: res.error };
    }
    
    return { healthy: res.ok };
  };

  const checkStatus = async (instanceId: string): Promise<{ connected: boolean; phoneNumber?: string }> => {
    const res = await proxyRequest(instanceId, `/api/instance/${instanceId}/status`, 'GET');
    
    if (!res.ok) return { connected: false };
    
    const result = res.data || {};
    return {
      connected: result.connected === true || result.status === 'connected' || result.state === 'open',
      phoneNumber: result.phone || result.phoneNumber || result.jid?.split('@')[0],
    };
  };

  const generateQRCode = async (instanceId: string): Promise<string | null> => {
    const res = await proxyRequest(instanceId, `/api/instance/${instanceId}/qrcode`, 'GET');
    
    if (!res.ok) {
      throw new Error(res.error || 'Erro ao gerar QR Code');
    }
    
    if (res.data?.connected || res.data?.status === 'connected') {
      return 'CONNECTED';
    }
    
    const rawQr = res.data?.qrcode || res.data?.qr || res.data?.base64;
    if (typeof rawQr === 'string') {
      return await normalizeQrToDataUrl(rawQr);
    }
    
    throw new Error('QR Code não disponível');
  };

  // Enviar mensagem de boas-vindas automática ao conectar
  const sendWelcomeMessage = async (instanceId: string, phoneNumber: string) => {
    try {
      const message = `✅ *WhatsApp conectado com sucesso!*

🚀 Sua instância Genesis Hub está ativa e pronta para uso.

📱 Sistema: Genesis Auto
⏰ ${new Date().toLocaleString('pt-BR')}

Agora você pode automatizar seu atendimento!`;

      await proxyRequest(instanceId, `/api/instance/${instanceId}/send`, 'POST', {
        phone: phoneNumber,
        message: message,
      });
      
      console.log('Welcome message sent to:', phoneNumber);
    } catch (error) {
      console.error('Error sending welcome message:', error);
      // Não bloqueia o fluxo se falhar
    }
  };

  const startConnection = useCallback(async (
    instanceId: string,
    _backendUrl?: string,
    _token?: string,
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
      // Validate backend health through proxy
      const healthCheck = await validateBackendHealth(instanceId);
      
      if (!healthCheck.healthy) {
        throw new Error(healthCheck.error || 'Backend não está respondendo');
      }

      safeSetState(prev => ({ ...prev, phase: 'generating' }));

      // Check if already connected
      const initialStatus = await checkStatus(instanceId);
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
      const qrResult = await generateQRCode(instanceId);
      
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
          // NÃO altera status no banco aqui: o lifecycle da instância não pode depender do frontend.
          toast.error('Tempo limite para conexão excedido');
          return;
        }

        // Auto-refresh QR every 45 seconds
        if (Date.now() - lastQrRefreshAtRef.current > qrAutoRefreshMs) {
          try {
            const nextQr = await generateQRCode(instanceId);
            if (nextQr && nextQr !== 'CONNECTED') {
              lastQrRefreshAtRef.current = Date.now();
              safeSetState(prev => ({ ...prev, qrCode: nextQr }));
            }
          } catch {}
        }

        // Check connection status
        const statusResult = await checkStatus(instanceId);
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
          
          // Enviar mensagem de teste automática para o próprio número
          if (statusResult.phoneNumber) {
            sendWelcomeMessage(instanceId, statusResult.phoneNumber);
          }
          
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
      // NÃO altera status no banco aqui: evita "desconectar" por erro de tela/reload.
      toast.error(message);
    }
  }, [stopPolling, normalizeQrToDataUrl, safeSetState]);

  const disconnect = useCallback(async (
    instanceId: string,
    _backendUrl?: string,
    _token?: string
  ) => {
    stopPolling();
    
    try {
      await proxyRequest(instanceId, `/api/instance/${instanceId}/disconnect`, 'POST', {});
    } catch {}

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

    const lastHeartbeatMs = data.last_heartbeat ? new Date(data.last_heartbeat).getTime() : 0;
    const isStale = lastHeartbeatMs > 0 && (Date.now() - lastHeartbeatMs > STALE_THRESHOLD_MS);

    return {
      status: (data.effective_status || data.status) as string,
      phoneNumber: data.phone_number || undefined,
      lastHeartbeat: data.last_heartbeat || undefined,
      isStale,
    };
  }, []);

  const startStatusPolling = useCallback((
    instanceId: string,
    onStatusChange: (status: InstanceStatus) => void
  ) => {
    stopStatusPolling();

    const poll = async () => {
      const status = await getInstanceStatus(instanceId);
      onStatusChange(status);
    };

    poll();
    statusPollingRef.current = setInterval(poll, 3000);
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
