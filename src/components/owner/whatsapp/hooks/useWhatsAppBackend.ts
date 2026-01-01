import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { ConsoleLog, BackendMode } from '../types';

const STORAGE_KEYS = {
  backendMode: 'wa_whatsapp_backend_mode',
  endpoint: 'wa_pc_local_endpoint',
  port: 'wa_pc_local_port',
  token: 'wa_pc_local_token',
} as const;

const readStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export function useWhatsAppBackend() {
  const [backendMode, setBackendMode] = useState<BackendMode>(() => {
    const saved = readStorage(STORAGE_KEYS.backendMode);
    return saved === 'local' || saved === 'vps' ? saved : 'vps';
  });
  
  const [localEndpoint, setLocalEndpoint] = useState(() => 
    readStorage(STORAGE_KEYS.endpoint) ?? 'http://localhost'
  );
  const [localPort, setLocalPort] = useState(() => 
    readStorage(STORAGE_KEYS.port) ?? '3001'
  );
  const [localToken, setLocalToken] = useState(() => 
    readStorage(STORAGE_KEYS.token) ?? ''
  );
  
  const [isLocalConnected, setIsLocalConnected] = useState(false);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const lastLogTimestamp = useRef<string | null>(null);

  // Initialize local token if empty
  useEffect(() => {
    if (!localToken) {
      const newToken = crypto.randomUUID();
      setLocalToken(newToken);
      writeStorage(STORAGE_KEYS.token, newToken);
    }
  }, [localToken]);

  // Persist settings
  useEffect(() => {
    writeStorage(STORAGE_KEYS.backendMode, backendMode);
  }, [backendMode]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.endpoint, localEndpoint);
  }, [localEndpoint]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.port, localPort);
  }, [localPort]);

  const addLog = useCallback((type: ConsoleLog['type'], message: string) => {
    setConsoleLogs(prev => [...prev.slice(-99), { 
      timestamp: new Date(), 
      type, 
      message 
    }]);
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const clearLogs = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  const getLocalUrl = useCallback(() => {
    return `${localEndpoint}:${localPort}`;
  }, [localEndpoint, localPort]);

  const testLocalConnection = async () => {
    setIsTestingLocal(true);
    addLog('info', `Testando conexão com ${getLocalUrl()}...`);
    
    try {
      const response = await fetch(`${getLocalUrl()}/health`, {
        headers: {
          'Authorization': `Bearer ${localToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLocalConnected(true);
        addLog('success', `✓ Backend local conectado! (${data.name || 'WhatsApp Local'})`);
        toast.success('Backend local conectado!');
        return true;
      } else {
        setIsLocalConnected(false);
        addLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão com o backend local');
        return false;
      }
    } catch (error: unknown) {
      setIsLocalConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Backend não acessível';
      addLog('error', `✗ Erro: ${errorMessage}`);
      toast.error('Backend não acessível. Verifique se está rodando.');
      return false;
    } finally {
      setIsTestingLocal(false);
    }
  };

  const testVPSConnection = async (url: string, token: string) => {
    addLog('info', `Testando conexão com ${url}...`);
    
    try {
      const response = await fetch(`${url}/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        addLog('success', '✓ Backend VPS conectado!');
        toast.success('Conexão estabelecida!');
        return true;
      } else {
        addLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Backend não acessível';
      addLog('error', `✗ Erro: ${errorMessage}`);
      toast.error('Backend não acessível');
      return false;
    }
  };

  const sendMessage = async (
    instanceId: string, 
    phone: string, 
    message: string,
    vpsUrl?: string,
    vpsToken?: string
  ) => {
    const endpoint = backendMode === 'local'
      ? `${getLocalUrl()}/api/instance/${instanceId}/send`
      : `${vpsUrl}/api/instance/${instanceId}/send`;
    
    const token = backendMode === 'local' ? localToken : vpsToken;

    addLog('info', `Enviando mensagem para ${phone}...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, message }),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        addLog('success', `✓ Mensagem enviada para ${phone}!`);
        return { success: true, data: result };
      } else {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `✗ Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

  const generateQRCode = async (
    instanceId: string,
    phone?: string,
    vpsUrl?: string,
    vpsToken?: string
  ) => {
    const endpoint = backendMode === 'local'
      ? `${getLocalUrl()}/api/instance/${instanceId}/qrcode`
      : `${vpsUrl}/api/instance/${instanceId}/qrcode`;
    
    const token = backendMode === 'local' ? localToken : vpsToken;

    addLog('info', `Gerando QR Code para instância ${instanceId}...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (result.status === 'connected') {
        addLog('success', '✓ Instância já conectada!');
        return { success: true, connected: true };
      }

      if (result.qrcode) {
        addLog('success', '✓ QR Code gerado! Escaneie com o WhatsApp.');
        return { success: true, qrcode: result.qrcode };
      }

      throw new Error(result.error || 'Erro ao gerar QR Code');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog('error', `✗ Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

  const checkInstanceStatus = async (
    instanceId: string,
    vpsUrl?: string,
    vpsToken?: string
  ) => {
    const endpoint = backendMode === 'local'
      ? `${getLocalUrl()}/api/instance/${instanceId}/status`
      : `${vpsUrl}/api/instance/${instanceId}/status`;
    
    const token = backendMode === 'local' ? localToken : vpsToken;

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result.status === 'connected' || result.connected;
    } catch {
      return false;
    }
  };

  // Poll for local backend logs
  useEffect(() => {
    if (!isLocalConnected || backendMode !== 'local') return;

    const fetchLogs = async () => {
      try {
        const url = lastLogTimestamp.current 
          ? `${getLocalUrl()}/logs?since=${encodeURIComponent(lastLogTimestamp.current)}`
          : `${getLocalUrl()}/logs`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logs && data.logs.length > 0) {
            data.logs.forEach((log: { timestamp: string; type: string; message: string }) => {
              addLog(log.type as ConsoleLog['type'], log.message);
            });
            lastLogTimestamp.current = data.logs[data.logs.length - 1].timestamp;
          }
        }
      } catch {
        // Silent fail
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    
    return () => {
      clearInterval(interval);
      lastLogTimestamp.current = null;
    };
  }, [isLocalConnected, backendMode, getLocalUrl, localToken, addLog]);

  return {
    // State
    backendMode,
    setBackendMode,
    localEndpoint,
    setLocalEndpoint,
    localPort,
    setLocalPort,
    localToken,
    isLocalConnected,
    isTestingLocal,
    consoleLogs,
    consoleRef,
    
    // Actions
    addLog,
    clearLogs,
    getLocalUrl,
    testLocalConnection,
    testVPSConnection,
    sendMessage,
    generateQRCode,
    checkInstanceStatus,
  };
}
