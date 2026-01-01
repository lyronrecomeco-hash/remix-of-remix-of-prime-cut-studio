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

  const checkStatus = async (
    instanceId: string,
    backendUrl: string,
    token: string
  ): Promise<{ connected: boolean; phoneNumber?: string }> => {
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
        return await doRequest('GET');
      } catch (e) {
        // fallback para compatibilidade com scripts antigos
        return await doRequest('POST');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Pre-connection health check to prevent ghost connections
  const validateBackendHealth = async (backendUrl: string): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.status === 'ok' || data.success === true;
    } catch {
      return false;
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
      const isBackendHealthy = await validateBackendHealth(backendUrl);
      
      if (!isBackendHealthy) {
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
              await fetch(`${backendUrl}/api/instance/${instanceId}/disconnect`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
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
      await fetch(`${backendUrl}/api/instance/${instanceId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
