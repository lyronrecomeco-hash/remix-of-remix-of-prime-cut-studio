import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionState {
  isConnecting: boolean;
  isPolling: boolean;
  qrCode: string | null;
  error: string | null;
  attempts: number;
}

export function useWhatsAppConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnecting: false,
    isPolling: false,
    qrCode: null,
    error: null,
    attempts: 0,
  });
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const statusInFlightRef = useRef(false);
  const lastQrRefreshAtRef = useRef<number>(0);

  const maxPollingAttempts = 150; // ~2.5 minutes total (1s * 150)
  const pollingInterval = 1000;
  const qrAutoRefreshMs = 45000;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setConnectionState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const updateInstanceStatus = async (instanceId: string, status: string, phoneNumber?: string) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
        last_seen: new Date().toISOString(),
      };
      
      if (phoneNumber) {
        updateData.phone_number = phoneNumber;
      }

      await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId);
    } catch (error) {
      console.error('Error updating instance status:', error);
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

    if (error) {
      throw new Error(error.message);
    }

    return (data || { ok: false, status: 0, data: null }) as any;
  };

  const checkStatus = async (
    instanceId: string,
    backendUrl: string,
    token: string
  ): Promise<{ connected: boolean; phoneNumber?: string }> => {
    // VPS HTTP em página HTTPS -> usa proxy (evita Mixed Content/CORS)
    if (shouldUseProxy(backendUrl)) {
      try {
        const res = await proxyRequest(`/api/instance/${instanceId}/status`, 'GET');
        if (!res.ok) return { connected: false };

        const result = res.data || {};
        const isConnected =
          result.connected === true || result.status === 'connected' || result.state === 'open';

        return {
          connected: isConnected,
          phoneNumber: result.phone || result.phoneNumber || result.jid?.split('@')[0],
        };
      } catch {
        return { connected: false };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${backendUrl}/api/instance/${instanceId}/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return { connected: false };
      }

      const result = await response.json();

      // Handle different response formats
      const isConnected =
        result.connected === true || result.status === 'connected' || result.state === 'open';

      return {
        connected: isConnected,
        phoneNumber: result.phone || result.phoneNumber || result.jid?.split('@')[0],
      };
    } catch (error: unknown) {
      // Abort due to timeout is expected sometimes; don't spam logs.
      if (error instanceof Error && error.name === 'AbortError') {
        return { connected: false };
      }
      console.log('Status check failed:', error);
      return { connected: false };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const generateQRCode = async (
    instanceId: string,
    backendUrl: string,
    token: string,
    phoneHint?: string
  ): Promise<string | null> => {
    const useProxy = shouldUseProxy(backendUrl);

    const doProxy = async (method: 'GET' | 'POST') => {
      const path = `/api/instance/${instanceId}/qrcode`;
      const res = await proxyRequest(path, method, method === 'POST' ? { phone: phoneHint } : undefined);

      const result = res.data || {};

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'Backend desatualizado: baixe o script novamente e reinicie o serviço.'
          );
        }

        const msg =
          result?.error ||
          result?.message ||
          `Erro ao gerar QR Code (HTTP ${res.status || 'erro'})`;

        throw new Error(msg);
      }

      if (result.connected || result.status === 'connected') {
        return 'CONNECTED';
      }

      const rawQr = result.qrcode || result.qr || result.base64;
      if (typeof rawQr === 'string' && rawQr.length > 0) {
        if (rawQr.startsWith('data:')) return rawQr;
        if (/^[A-Za-z0-9+/=]+$/.test(rawQr.slice(0, 50))) {
          return `data:image/png;base64,${rawQr}`;
        }
        return rawQr;
      }

      throw new Error(result.error || result.message || 'QR Code não disponível');
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const doRequest = async (method: 'GET' | 'POST') => {
      const url = `${backendUrl}/api/instance/${instanceId}/qrcode`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify({ phone: phoneHint }) } : {}),
        signal: controller.signal,
      });

      const rawText = await response.text();
      let result: any = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'Backend local desatualizado: baixe o script novamente na aba Backend e reinicie o serviço.'
          );
        }

        const msg =
          result?.error ||
          result?.message ||
          (rawText && rawText.includes('Cannot') ? 'Endpoint de QR Code não encontrado no backend.' : '') ||
          `Erro ao gerar QR Code (HTTP ${response.status})`;

        throw new Error(msg);
      }

      // If already connected
      if (result.connected || result.status === 'connected') {
        return 'CONNECTED';
      }

      // Return QR code data
      const rawQr = result.qrcode || result.qr || result.base64;
      if (typeof rawQr === 'string' && rawQr.length > 0) {
        // Ensure data URL for base64 payloads
        if (rawQr.startsWith('data:')) return rawQr;
        if (/^[A-Za-z0-9+/=]+$/.test(rawQr.slice(0, 50))) {
          return `data:image/png;base64,${rawQr}`;
        }
        return rawQr;
      }

      throw new Error(result.error || result.message || 'QR Code não disponível');
    };

    try {
      // Prefer GET (evita alguns NetworkError de CORS/preflight em certos browsers)
      try {
        return useProxy ? await doProxy('GET') : await doRequest('GET');
      } catch (e) {
        // fallback para compatibilidade com scripts antigos
        return useProxy ? await doProxy('POST') : await doRequest('POST');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  type BackendHealthResult =
    | { ok: true }
    | { ok: false; reason: 'unauthorized' | 'unreachable' | 'error'; status?: number };

  // Pre-connection health check to prevent ghost connections
  const validateBackendHealth = async (backendUrl: string, token: string): Promise<BackendHealthResult> => {
    if (shouldUseProxy(backendUrl)) {
      try {
        const res = await proxyRequest('/health', 'GET');
        if (res.ok) return { ok: true };
        if (res.status === 401 || res.status === 403) {
          return { ok: false, reason: 'unauthorized', status: res.status };
        }
        return { ok: false, reason: 'error', status: res.status };
      } catch {
        return { ok: false, reason: 'unreachable' };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          // v4 local backend protects /health with the same Bearer token
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (response.ok) {
        // Accept common formats: {status:'ok'} or {success:true}
        const data = await response.json().catch(() => ({} as any));
        if (data?.status === 'ok' || data?.success === true) return { ok: true };
        return { ok: true }; // if it responded 200, it's alive
      }

      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: 'unauthorized', status: response.status };
      }

      return { ok: false, reason: 'error', status: response.status };
    } catch {
      return { ok: false, reason: 'unreachable' };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const startConnection = useCallback(async (
    instanceId: string,
    backendUrl: string,
    token: string,
    phoneHint?: string,
    onConnected?: () => void
  ) => {
    stopPolling();
    
    setConnectionState({
      isConnecting: true,
      isPolling: false,
      qrCode: null,
      error: null,
      attempts: 0,
    });

    try {
      // ANTI-GHOST: Validate backend is actually running before attempting connection
      const health = await validateBackendHealth(backendUrl, token);

      if (health.ok === false) {
        if (health.reason === 'unauthorized') {
          throw new Error('Token do Backend inválido. Verifique o token e reinicie o backend local.');
        }
        throw new Error('Backend não está respondendo. Verifique se o CMD está rodando com o script.');
      }

      // First check if already connected
      const initialStatus = await checkStatus(instanceId, backendUrl, token);
      
      if (initialStatus.connected) {
        await updateInstanceStatus(instanceId, 'connected', initialStatus.phoneNumber);
        toast.success('WhatsApp já está conectado!');
        setConnectionState(prev => ({ ...prev, isConnecting: false }));
        onConnected?.();
        return;
      }

      // Update status to pending
      await updateInstanceStatus(instanceId, 'qr_pending');

      // Generate QR Code
      const qrResult = await generateQRCode(instanceId, backendUrl, token, phoneHint);
      
      if (qrResult === 'CONNECTED') {
        await updateInstanceStatus(instanceId, 'connected');
        toast.success('WhatsApp conectado!');
        setConnectionState(prev => ({ ...prev, isConnecting: false }));
        onConnected?.();
        return;
      }

      if (!qrResult) {
        throw new Error('Não foi possível gerar o QR Code');
      }

      // Show QR and start polling
      lastQrRefreshAtRef.current = Date.now();
      setConnectionState({
        isConnecting: false,
        isPolling: true,
        qrCode: qrResult,
        error: null,
        attempts: 0,
      });

      // Start polling for connection status
      let attempts = 0;

      pollingRef.current = setInterval(async () => {
        // Avoid overlapping network calls (helps prevent AbortError spam)
        if (statusInFlightRef.current) return;
        statusInFlightRef.current = true;

        try {
          attempts++;
          setConnectionState((prev) => ({ ...prev, attempts }));

          if (attempts >= maxPollingAttempts) {
            stopPolling();
            setConnectionState((prev) => ({
              ...prev,
              error: 'Tempo limite excedido. Tente novamente.',
              isPolling: false,
            }));
            await updateInstanceStatus(instanceId, 'disconnected');
            toast.error('Tempo limite para conexão excedido');
            return;
          }

          // Auto-refresh QR (bem menos agressivo) para evitar expiração
          if (Date.now() - lastQrRefreshAtRef.current > qrAutoRefreshMs) {
            try {
              const nextQr = await generateQRCode(instanceId, backendUrl, token, phoneHint);
              if (nextQr && nextQr !== 'CONNECTED') {
                lastQrRefreshAtRef.current = Date.now();
                setConnectionState((prev) => ({ ...prev, qrCode: nextQr }));
              }
            } catch {
              // ignore refresh failures; polling continues
            }
          }

          // Se ficar preso em QR_PENDING por muito tempo, faz um reset limpo (resolve travas comuns)
          if (attempts === 35) {
            try {
              if (shouldUseProxy(backendUrl)) {
                await proxyRequest(`/api/instance/${instanceId}/disconnect`, 'POST', {});
              } else {
                await fetch(`${backendUrl}/api/instance/${instanceId}/disconnect`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
              }

              await updateInstanceStatus(instanceId, 'qr_pending');
              const freshQr = await generateQRCode(instanceId, backendUrl, token, phoneHint);
              if (freshQr && freshQr !== 'CONNECTED') {
                lastQrRefreshAtRef.current = Date.now();
                setConnectionState((prev) => ({ ...prev, qrCode: freshQr }));
              }
              toast.message('Conexão travada — gerando novo QR automaticamente.');
            } catch {
              // se falhar, segue o fluxo normal
            }
          }

          const statusResult = await checkStatus(instanceId, backendUrl, token);

          if (statusResult.connected) {
            stopPolling();
            await updateInstanceStatus(instanceId, 'connected', statusResult.phoneNumber);
            setConnectionState({
              isConnecting: false,
              isPolling: false,
              qrCode: null,
              error: null,
              attempts: 0,
            });
            toast.success('WhatsApp conectado com sucesso!');
            onConnected?.();
          }
        } finally {
          statusInFlightRef.current = false;
        }
      }, pollingInterval);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao conectar';
      console.error('Connection error:', error);
      
      setConnectionState({
        isConnecting: false,
        isPolling: false,
        qrCode: null,
        error: message,
        attempts: 0,
      });
      
      await updateInstanceStatus(instanceId, 'disconnected');
      toast.error(message);
    }
  }, [stopPolling]);

  const refreshQRCode = useCallback(async (
    instanceId: string,
    backendUrl: string,
    token: string,
    phoneHint?: string
  ) => {
    setConnectionState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const qrResult = await generateQRCode(instanceId, backendUrl, token, phoneHint);
      
      if (qrResult === 'CONNECTED') {
        await updateInstanceStatus(instanceId, 'connected');
        toast.success('WhatsApp conectado!');
        setConnectionState(prev => ({ 
          ...prev, 
          isConnecting: false,
          qrCode: null,
        }));
        return true;
      }

      if (qrResult) {
        setConnectionState(prev => ({
          ...prev,
          isConnecting: false,
          qrCode: qrResult,
          attempts: 0,
        }));
        return true;
      }

      throw new Error('Não foi possível atualizar o QR Code');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar QR';
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      toast.error(message);
      return false;
    }
  }, []);

  const disconnect = useCallback(async (
    instanceId: string,
    backendUrl: string,
    token: string
  ) => {
    try {
      if (shouldUseProxy(backendUrl)) {
        const res = await proxyRequest(`/api/instance/${instanceId}/disconnect`, 'POST', {});
        if (!res.ok) throw new Error(`HTTP ${res.status || 'erro'}`);
      } else {
        await fetch(`${backendUrl}/api/instance/${instanceId}/disconnect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      await updateInstanceStatus(instanceId, 'disconnected');
      toast.success('Desconectado');
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Erro ao desconectar');
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    connectionState,
    startConnection,
    refreshQRCode,
    disconnect,
    stopPolling,
    checkStatus,
  };
}
