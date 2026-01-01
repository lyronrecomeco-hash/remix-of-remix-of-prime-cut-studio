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

  const maxPollingAttempts = 150; // ~5 minutes total (2s * 150)
  const pollingInterval = 2000;
  const qrAutoRefreshMs = 25000;

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
          'Content-Type': 'application/json',
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

    try {
      const response = await fetch(`${backendUrl}/api/instance/${instanceId}/qrcode`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneHint }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || result?.message || 'Erro ao gerar QR Code');
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(message);
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

          // Auto-refresh QR to avoid scanning expired codes (WhatsApp often expires QR ~30s)
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
