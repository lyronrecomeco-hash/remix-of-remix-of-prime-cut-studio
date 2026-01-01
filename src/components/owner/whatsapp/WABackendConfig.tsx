import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Monitor, 
  Loader2, 
  Save, 
  Link2, 
  Download, 
  Copy, 
  Check,
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConsoleLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface WABackendConfigProps {
  backendMode: 'vps' | 'local';
  setBackendMode: (mode: 'vps' | 'local') => void;
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  masterToken: string;
  setMasterToken: (token: string) => void;
  localEndpoint: string;
  setLocalEndpoint: (endpoint: string) => void;
  localPort: string;
  setLocalPort: (port: string) => void;
  localToken: string;
  isLocalConnected: boolean;
  setIsLocalConnected: (connected: boolean) => void;
  backendConfig: {
    id: string;
    is_connected: boolean;
  } | null;
  onRefresh: () => void;
}

export const WABackendConfig = ({
  backendMode,
  setBackendMode,
  backendUrl,
  setBackendUrl,
  masterToken,
  setMasterToken,
  localEndpoint,
  setLocalEndpoint,
  localPort,
  setLocalPort,
  localToken,
  isLocalConnected,
  setIsLocalConnected,
  backendConfig,
  onRefresh,
}: WABackendConfigProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingVPS, setIsTestingVPS] = useState(false);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: ConsoleLog['type'], message: string) => {
    setConsoleLogs(prev => [...prev.slice(-99), { timestamp: new Date(), type, message }]);
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Poll logs from local backend
  const lastLogTimestamp = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isLocalConnected || backendMode !== 'local') return;

    const fetchLogs = async () => {
      try {
        const fullUrl = `${localEndpoint}:${localPort}`;
        const url = lastLogTimestamp.current 
          ? `${fullUrl}/logs?since=${encodeURIComponent(lastLogTimestamp.current)}`
          : `${fullUrl}/logs`;
          
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${localToken}` },
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
  }, [isLocalConnected, backendMode, localEndpoint, localPort, localToken, addLog]);

  const saveVPSConfig = async () => {
    setIsSaving(true);
    try {
      if (backendConfig) {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .update({
            backend_url: backendUrl,
            master_token: masterToken,
            is_connected: false,
          })
          .eq('id', backendConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .insert({
            backend_url: backendUrl,
            master_token: masterToken,
            is_connected: false,
          });

        if (error) throw error;
      }

      toast.success('Configuração salva!');
      onRefresh();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const testVPSConnection = async () => {
    if (!backendUrl) {
      toast.error('Configure a URL do backend');
      return;
    }

    setIsTestingVPS(true);
    addLog('info', `Testando conexão com ${backendUrl}...`);

    try {
      const response = await fetch(`${backendUrl}/health`, {
        headers: { 'Authorization': `Bearer ${masterToken}` },
      });

      if (response.ok) {
        await supabase
          .from('whatsapp_backend_config')
          .update({ 
            is_connected: true,
            last_health_check: new Date().toISOString(),
          })
          .eq('id', backendConfig?.id);

        addLog('success', '✓ Backend VPS conectado!');
        toast.success('Conexão estabelecida!');
        onRefresh();
      } else {
        addLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Backend não acessível';
      addLog('error', `✗ Erro: ${errorMessage}`);
      toast.error('Backend não acessível');
    } finally {
      setIsTestingVPS(false);
    }
  };

  const testLocalConnection = async () => {
    setIsTestingLocal(true);
    addLog('info', `Testando conexão com ${localEndpoint}:${localPort}...`);
    
    try {
      const baseUrl = `${localEndpoint}:${localPort}`;
      const headers = { 'Authorization': `Bearer ${localToken}` };

      const response = await fetch(`${baseUrl}/health`, { headers });

      if (response.status === 401) {
        setIsLocalConnected(false);
        addLog('error', '✗ Token inválido! Baixe o script novamente com o token atualizado.');
        toast.error('Token inválido! Baixe o script novamente.');
        return;
      }

      if (!response.ok) {
        setIsLocalConnected(false);
        addLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão com o backend local');
        return;
      }

      const data = await response.json().catch(() => ({}));

      setIsLocalConnected(true);
      addLog('success', `✓ Backend local conectado! (${data.name || 'WhatsApp Local'})`);
      toast.success('Backend local conectado!');
    } catch (error: unknown) {
      setIsLocalConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Backend não acessível';
      addLog('error', `✗ Erro: ${errorMessage}`);
      toast.error('Backend não acessível. Verifique se está rodando.');
    } finally {
      setIsTestingLocal(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success('Token copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const getLocalScript = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const scriptContent = `/*
 * ╔═══════════════════════════════════════════════════════════╗
 * ║           GENESIS HUB - WhatsApp Backend Local            ║
 * ║                      Versão 4.0                           ║
 * ╠═══════════════════════════════════════════════════════════╣
 * ║  • Heartbeat automático para persistência de status       ║
 * ║  • Reconexão automática inteligente                       ║
 * ║  • Persistência de sessão                                 ║
 * ║  • API REST completa                                      ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

// ═══════════════════════════════════════════════════════════
//                      CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════
const PORT = ` + localPort + `;
const TOKEN = '` + localToken + `';
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const SUPABASE_URL = '` + supabaseUrl + `';
const HEARTBEAT_INTERVAL = 30000; // 30 segundos

// ═══════════════════════════════════════════════════════════
//                        EXPRESS APP
// ═══════════════════════════════════════════════════════════
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Auth middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Bearer ' + TOKEN) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
});

// ═══════════════════════════════════════════════════════════
//                    GERENCIADOR DE CONEXÕES
// ═══════════════════════════════════════════════════════════
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const connections = new Map();
const startTime = Date.now();

const log = (icon, msg) => console.log(icon + '  ' + msg);

const getPhone = (sock) => {
  try {
    const id = sock?.user?.id || sock?.authState?.creds?.me?.id;
    return id ? String(id).split('@')[0].split(':')[0] : null;
  } catch { return null; }
};

// ═══════════════════════════════════════════════════════════
//                    SISTEMA DE HEARTBEAT
// ═══════════════════════════════════════════════════════════
const sendHeartbeat = async (instanceId, status, phone) => {
  try {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const response = await fetch(SUPABASE_URL + '/functions/v1/whatsapp-heartbeat/' + instanceId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Instance-Token': TOKEN,
      },
      body: JSON.stringify({
        status: status,
        phone_number: phone,
        uptime_seconds: uptimeSeconds,
      }),
    });
    
    if (response.ok) {
      log('💓', 'Heartbeat enviado: ' + instanceId + ' (' + status + ')');
    } else {
      log('⚠️', 'Heartbeat falhou: ' + response.status);
    }
  } catch (err) {
    log('❌', 'Erro no heartbeat: ' + err.message);
  }
};

// Heartbeat periódico para todas as instâncias
setInterval(() => {
  connections.forEach((conn, instanceId) => {
    const phone = conn.phone || getPhone(conn.sock);
    sendHeartbeat(instanceId, conn.status, phone);
  });
}, HEARTBEAT_INTERVAL);

const createSocket = async (instanceId) => {
  if (connections.has(instanceId)) return connections.get(instanceId);

  const authPath = path.join(SESSIONS_DIR, instanceId);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: ['Genesis Hub', 'Chrome', '4.0'],
  });

  const conn = { sock, status: 'disconnected', qr: null, phone: null, retries: 0 };
  connections.set(instanceId, conn);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      conn.qr = qr;
      conn.status = 'qr_pending';
      log('📱', 'QR Code disponível para ' + instanceId);
    }

    if (connection === 'open') {
      conn.status = 'connected';
      conn.qr = null;
      conn.retries = 0;
      conn.phone = getPhone(sock);
      log('✅', 'Conectado: ' + (conn.phone || instanceId));
      
      // Envia heartbeat imediato ao conectar
      sendHeartbeat(instanceId, 'connected', conn.phone);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      conn.status = 'disconnected';
      conn.qr = null;

      if (code === DisconnectReason.loggedOut || code === 401) {
        log('🔒', 'Sessão encerrada: ' + instanceId);
        sendHeartbeat(instanceId, 'disconnected', null);
        try { sock.end(); } catch {}
        connections.delete(instanceId);
        fs.rmSync(authPath, { recursive: true, force: true });
        return;
      }

      log('⚠️', 'Desconectado (' + (code || '?') + '): ' + instanceId);
      sendHeartbeat(instanceId, 'disconnected', null);

      // Reconexão automática
      if (conn.retries < 5 && [515, 428, 408].includes(code)) {
        conn.retries++;
        const delay = Math.min(15000, 1500 * Math.pow(2, conn.retries - 1));
        log('🔄', 'Reconectando em ' + (delay/1000) + 's...');
        setTimeout(() => {
          try { sock.end(); } catch {}
          connections.delete(instanceId);
          createSocket(instanceId);
        }, delay);
      }
    }
  });

  return conn;
};

// ═══════════════════════════════════════════════════════════
//                          ROTAS
// ═══════════════════════════════════════════════════════════
app.get('/health', (_, res) => {
  res.json({ status: 'ok', version: '4.0.0', name: 'Genesis WhatsApp Backend', uptime: Math.floor((Date.now() - startTime) / 1000) });
});

app.get('/api/instance/:id/status', (req, res) => {
  const conn = connections.get(req.params.id);
  if (!conn) return res.json({ status: 'disconnected', connected: false });

  const phone = conn.phone || getPhone(conn.sock);
  const connected = conn.status === 'connected' || !!phone;

  if (connected && conn.status !== 'connected') {
    conn.status = 'connected';
    conn.phone = phone;
  }

  res.json({ status: connected ? 'connected' : conn.status, connected, phone });
});

const handleQR = async (req, res) => {
  const id = req.params.id;

  try {
    const conn = await createSocket(id);
    const phone = conn.phone || getPhone(conn.sock);

    if (conn.status === 'connected' || phone) {
      conn.status = 'connected';
      conn.phone = phone;
      return res.json({ status: 'connected', connected: true, phone });
    }

    // Aguarda QR (max 15s)
    const start = Date.now();
    while (!conn.qr && Date.now() - start < 15000) {
      await new Promise(r => setTimeout(r, 250));
    }

    if (!conn.qr) {
      return res.status(500).json({ error: 'QR não disponível' });
    }

    const qrDataUrl = await qrcode.toDataURL(conn.qr, { margin: 1, scale: 6 });
    res.json({ status: 'qr_pending', qrcode: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro ao gerar QR' });
  }
};

app.get('/api/instance/:id/qrcode', handleQR);
app.post('/api/instance/:id/qrcode', handleQR);

app.post('/api/instance/:id/disconnect', (req, res) => {
  const id = req.params.id;
  const conn = connections.get(id);

  try {
    if (conn?.sock) {
      try { conn.sock.logout(); } catch {}
      try { conn.sock.end(); } catch {}
    }
  } finally {
    connections.delete(id);
    sendHeartbeat(id, 'disconnected', null);
    const sessionPath = path.join(SESSIONS_DIR, id);
    if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  log('🔌', 'Desconectado: ' + id);
  res.json({ success: true });
});

app.post('/api/instance/:id/send', async (req, res) => {
  const { phone, message } = req.body || {};
  const conn = connections.get(req.params.id);

  if (!conn || conn.status !== 'connected') {
    return res.status(400).json({ error: 'Instância não conectada' });
  }

  const jid = String(phone || '').replace(/\\D/g, '') + '@s.whatsapp.net';
  if (!phone) return res.status(400).json({ error: 'Telefone inválido' });
  if (!message) return res.status(400).json({ error: 'Mensagem vazia' });

  try {
    await conn.sock.sendMessage(jid, { text: String(message) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao enviar' });
  }
});

// ═══════════════════════════════════════════════════════════
//                         INICIAR
// ═══════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🚀 GENESIS HUB - WhatsApp Backend v4.0            ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  Rodando em: http://localhost:' + PORT + '                       ║');
  console.log('║  Status: Pronto para conexões                             ║');
  console.log('║  Heartbeat: A cada 30 segundos                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
});
`;
    return scriptContent;
  };

  const downloadScript = () => {
    const script = getLocalScript();
    const blob = new Blob([script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-local.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script baixado!');
  };

  const clearLogs = () => {
    setConsoleLogs([]);
    lastLogTimestamp.current = null;
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Modo de Backend</CardTitle>
          <CardDescription>
            Escolha onde o WhatsApp será executado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={backendMode} onValueChange={(v) => setBackendMode(v as 'vps' | 'local')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vps" className="gap-2">
                <Server className="w-4 h-4" />
                VPS / Servidor
              </TabsTrigger>
              <TabsTrigger value="local" className="gap-2">
                <Monitor className="w-4 h-4" />
                PC Local
              </TabsTrigger>
            </TabsList>

            {/* VPS Config */}
            <TabsContent value="vps" className="space-y-4 mt-6">
              <div className="flex items-center gap-2 mb-4">
                {backendConfig?.is_connected ? (
                  <Badge className="bg-green-500/10 text-green-500 gap-1">
                    <Wifi className="w-3 h-3" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <WifiOff className="w-3 h-3" />
                    Desconectado
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>URL do Backend</Label>
                <Input
                  placeholder="https://seu-server.com"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: https://whatsapp.seudominio.com
                </p>
              </div>

              <div className="space-y-2">
                <Label>Token Master</Label>
                <Input
                  type="password"
                  placeholder="Token de autenticação"
                  value={masterToken}
                  onChange={(e) => setMasterToken(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveVPSConfig} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
                <Button onClick={testVPSConnection} disabled={isTestingVPS} variant="outline">
                  {isTestingVPS ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </TabsContent>

            {/* Local Config */}
            <TabsContent value="local" className="space-y-4 mt-6">
              <div className="flex items-center gap-2 mb-4">
                {isLocalConnected ? (
                  <Badge className="bg-green-500/10 text-green-500 gap-1">
                    <Wifi className="w-3 h-3" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <WifiOff className="w-3 h-3" />
                    Desconectado
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={localEndpoint}
                    onChange={(e) => setLocalEndpoint(e.target.value)}
                    placeholder="http://localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porta</Label>
                  <Input
                    value={localPort}
                    onChange={(e) => setLocalPort(e.target.value)}
                    placeholder="3001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Token de Autenticação</Label>
                <div className="flex gap-2">
                  <Input value={localToken} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(localToken)}>
                    {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-amber-500 font-medium">
                  ⚠️ Importante: Baixe o script novamente após mudar configurações ou se receber erro 401!
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testLocalConnection} disabled={isTestingLocal}>
                  {isTestingLocal ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Conectar
                </Button>
                <Button onClick={downloadScript} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Script
                </Button>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Como usar:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Baixe o script clicando em "Baixar Script"</li>
                    <li>Instale as dependências: <code className="bg-background px-1 rounded">npm install express cors qrcode @whiskeysockets/baileys @supabase/supabase-js</code></li>
                    <li>Execute: <code className="bg-background px-1 rounded">node whatsapp-local.js</code></li>
                    <li>Clique em "Conectar" para validar</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Console */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <CardTitle>Console</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Limpar
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 rounded-lg border bg-black p-4" ref={consoleRef}>
            {consoleLogs.length === 0 ? (
              <p className="text-gray-500 font-mono text-sm">Aguardando logs...</p>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className="font-mono text-xs mb-1">
                  <span className="text-gray-500">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>{' '}
                  <span className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
