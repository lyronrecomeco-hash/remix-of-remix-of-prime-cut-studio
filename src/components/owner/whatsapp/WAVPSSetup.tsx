import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Copy, 
  Download, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  Terminal,
  Shield,
  Cpu,
  HardDrive,
  Gauge,
  Globe,
  Key,
  Play,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface BackendConfig {
  id: string;
  backend_url: string | null;
  master_token: string | null;
  is_connected: boolean;
  last_health_check: string | null;
}

interface WAVPSSetupProps {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  masterToken: string;
  setMasterToken: (token: string) => void;
  backendConfig: BackendConfig | null;
  onRefresh: () => void;
}

export const WAVPSSetup = ({
  backendUrl,
  setBackendUrl,
  masterToken,
  setMasterToken,
  backendConfig,
  onRefresh
}: WAVPSSetupProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(backendConfig?.is_connected || false);
  const [lastCheck, setLastCheck] = useState<string | null>(backendConfig?.last_health_check || null);

  useEffect(() => {
    setIsConnected(backendConfig?.is_connected || false);
    setLastCheck(backendConfig?.last_health_check || null);
  }, [backendConfig]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const saveConfig = async () => {
    if (!backendUrl || !masterToken) {
      toast.error('Preencha URL e Token');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('whatsapp_backend_config')
        .upsert({
          id: backendConfig?.id || crypto.randomUUID(),
          backend_url: backendUrl.replace(/\/$/, ''),
          master_token: masterToken,
          is_connected: false,
        });

      if (error) throw error;
      toast.success('Configuração salva!');
      onRefresh();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const shouldUseProxy = (url: string) => {
    try {
      const u = new URL(url);
      const isHttp = u.protocol === 'http:';
      const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
      return window.location.protocol === 'https:' && isHttp && !isLocalhost;
    } catch {
      return false;
    }
  };

  const testConnection = async () => {
    const normalizedUrl = backendUrl.replace(/\/$/, '');

    if (!normalizedUrl || !masterToken) {
      toast.error('Preencha URL e Token primeiro');
      return;
    }

    setIsTesting(true);
    try {
      // Sempre salva primeiro para o proxy conseguir ler a configuração atual no backend
      await supabase
        .from('whatsapp_backend_config')
        .upsert({
          id: backendConfig?.id || crypto.randomUUID(),
          backend_url: normalizedUrl,
          master_token: masterToken,
          is_connected: false,
        });

      if (shouldUseProxy(normalizedUrl)) {
        // Em páginas HTTPS, o navegador bloqueia chamadas HTTP diretas (Mixed Content).
        // Usamos um proxy seguro no backend para testar e operar com a VPS.
        const { data, error } = await supabase.functions.invoke('whatsapp-backend-proxy', {
          body: { path: '/health', method: 'GET' },
        });

        if (error) throw new Error(error.message);

        const ok = Boolean((data as any)?.ok);
        const status = Number((data as any)?.status || 0);

        if (!ok) {
          throw new Error(`Status ${status || 'erro'}`);
        }
      } else {
        const response = await fetch(`${normalizedUrl}/health`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${masterToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
      }

      await supabase
        .from('whatsapp_backend_config')
        .upsert({
          id: backendConfig?.id || crypto.randomUUID(),
          backend_url: normalizedUrl,
          master_token: masterToken,
          is_connected: true,
          last_health_check: new Date().toISOString(),
        });

      setIsConnected(true);
      setLastCheck(new Date().toISOString());
      toast.success('VPS conectada com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      toast.error('Falha na conexão. Verifique URL, Token e se a porta 3001 está liberada.');

      await supabase
        .from('whatsapp_backend_config')
        .upsert({
          id: backendConfig?.id || crypto.randomUUID(),
          backend_url: normalizedUrl,
          master_token: masterToken,
          is_connected: false,
          last_health_check: new Date().toISOString(),
        });
    } finally {
      setIsTesting(false);
    }
  };

  const getVPSScript = () => {
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = 'GNS_';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const token = masterToken || generateToken();
    
    return `// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║              GENESIS WHATSAPP BACKEND - v4.2 PROFESSIONAL                     ║
// ║                    Ubuntu 24.04 LTS | Baileys Latest                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const os = require('os');

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                              CONFIGURAÇÃO                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const PORT = process.env.PORT || 3001;
const MASTER_TOKEN = process.env.MASTER_TOKEN || '${token}';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
const HEARTBEAT_INTERVAL = 30000;

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                              INICIALIZAÇÃO                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const logger = pino({ level: 'silent' });

let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let phoneNumber = null;
let startTime = Date.now();
let serverIP = 'localhost';

const AUTH_FOLDER = path.join(__dirname, 'auth_info_' + INSTANCE_ID);

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                           CORES DO TERMINAL                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const c = {
  reset: '\\x1b[0m',
  bold: '\\x1b[1m',
  dim: '\\x1b[2m',
  green: '\\x1b[32m',
  cyan: '\\x1b[36m',
  yellow: '\\x1b[33m',
  red: '\\x1b[31m',
  magenta: '\\x1b[35m',
  blue: '\\x1b[34m',
  white: '\\x1b[37m',
  bgGreen: '\\x1b[42m',
  bgBlue: '\\x1b[44m',
  bgCyan: '\\x1b[46m',
  bgMagenta: '\\x1b[45m'
};

// Detecta IP público da VPS
const getPublicIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }
};

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                         BANNER PROFISSIONAL                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const showBanner = async () => {
  serverIP = await getPublicIP();
  const url = 'http://' + serverIP + ':' + PORT;
  const ram = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  const cpus = os.cpus().length;
  
  console.clear();
  console.log('');
  console.log(c.cyan + '  ╔══════════════════════════════════════════════════════════════════════════╗' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '      ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '     ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '     ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '     ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '     ╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.green + '      ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝              ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.white + '              WhatsApp Backend VPS - v4.2 Professional                   ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╠══════════════════════════════════════════════════════════════════════════╣' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.yellow + '⚡ STATUS:' + c.reset + ' ' + c.bgGreen + c.bold + c.white + ' ONLINE ' + c.reset + '                                                  ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╠══════════════════════════════════════════════════════════════════════════╣' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + c.bold + c.magenta + '  📋 COPIE ESTAS INFORMAÇÕES PARA O PAINEL OWNER:                        ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╠══════════════════════════════════════════════════════════════════════════╣' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.green + '🌐 URL do Backend:' + c.reset + '                                                      ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.bold + c.yellow + url + c.reset + '                                                            ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.green + '🔐 Master Token:' + c.reset + '                                                        ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.bold + c.yellow + MASTER_TOKEN + c.reset + '                                                    ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '                                                                          ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╠══════════════════════════════════════════════════════════════════════════╣' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  ' + c.blue + '📊 Sistema:' + c.reset + ' Porta ' + c.bold + PORT + c.reset + ' | RAM ' + c.bold + ram + 'GB' + c.reset + ' | CPUs ' + c.bold + cpus + c.reset + '                           ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╚══════════════════════════════════════════════════════════════════════════╝' + c.reset);
  console.log('');
  console.log(c.green + '  ✅ Backend iniciado! Aguardando conexão do WhatsApp...' + c.reset);
  console.log('');
};

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                           MIDDLEWARE AUTH                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.headers['x-instance-token'];
  
  if (!token || token !== MASTER_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                         HEARTBEAT AUTOMÁTICO                                   ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const sendHeartbeat = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  
  try {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    await fetch(SUPABASE_URL + '/functions/v1/whatsapp-heartbeat/' + INSTANCE_ID, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-instance-token': MASTER_TOKEN,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({
        status: connectionStatus,
        phone_number: phoneNumber,
        uptime_seconds: uptimeSeconds
      })
    });
    
    console.log(c.blue + '  [Heartbeat]' + c.reset + ' Status: ' + c.green + connectionStatus + c.reset + ' | Uptime: ' + uptimeSeconds + 's');
  } catch (err) {
    console.error(c.red + '  [Heartbeat] Erro:' + c.reset, err.message);
  }
};

setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                          CONEXÃO WHATSAPP                                      ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
const connectWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  
  sock = makeWASocket({
    auth: state,
    logger,
    browser: ['Genesis VPS', 'Chrome', '120.0.0'],
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCode = qr;
      connectionStatus = 'qr_pending';
      console.log(c.yellow + '  [WhatsApp]' + c.reset + ' QR Code gerado - Escaneie via Painel Owner!');
    }
    
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(c.red + '  [WhatsApp]' + c.reset + ' Desconectado. Razão:', reason);
      
      connectionStatus = 'disconnected';
      qrCode = null;
      
      if (reason !== DisconnectReason.loggedOut) {
        console.log(c.yellow + '  [WhatsApp]' + c.reset + ' Reconectando em 5s...');
        setTimeout(connectWhatsApp, 5000);
      }
    } else if (connection === 'open') {
      console.log('');
      console.log(c.bgGreen + c.bold + c.white + '  ✅ WHATSAPP CONECTADO!  ' + c.reset);
      connectionStatus = 'connected';
      qrCode = null;
      phoneNumber = sock.user?.id?.split(':')[0] || null;
      console.log(c.green + '  [WhatsApp]' + c.reset + ' Número: ' + c.bold + phoneNumber + c.reset);
      console.log('');
      sendHeartbeat();
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      
      const from = msg.key.remoteJid;
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || '';
      
      console.log(c.magenta + '  [Msg]' + c.reset + ' ' + from + ': ' + text);
    }
  });
};

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                              ROTAS API                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

app.get('/health', authMiddleware, (req, res) => {
  res.json({ status: 'ok', whatsapp: connectionStatus, phone: phoneNumber, uptime: Math.floor((Date.now() - startTime) / 1000), version: '4.2' });
});

app.get('/status', authMiddleware, (req, res) => {
  res.json({ connected: connectionStatus === 'connected', status: connectionStatus, phone: phoneNumber, qr: qrCode ? true : false });
});

app.get('/qrcode', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ connected: true, phone: phoneNumber });
  if (!qrCode) return res.json({ connected: false, qr: null, message: 'Aguardando QR...' });
  res.json({ connected: false, qr: qrCode });
});

app.post('/connect', authMiddleware, async (req, res) => {
  if (connectionStatus === 'connected') return res.json({ success: true, message: 'Já conectado', phone: phoneNumber });
  try { connectWhatsApp(); res.json({ success: true, message: 'Iniciando conexão...' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    if (sock) await sock.logout();
    if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true });
    connectionStatus = 'disconnected'; qrCode = null; phoneNumber = null;
    res.json({ success: true, message: 'Desconectado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send', authMiddleware, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone e message obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send-buttons', authMiddleware, async (req, res) => {
  const { phone, text, buttons, footer } = req.body;
  if (!phone || !text || !buttons) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    const msg = { text, footer: footer || '', buttons: buttons.map((b, i) => ({ buttonId: b.id || 'btn_' + i, buttonText: { displayText: b.text }, type: 1 })), headerType: 1 };
    await sock.sendMessage(jid, msg);
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send-list', authMiddleware, async (req, res) => {
  const { phone, text, buttonText, sections, footer, title } = req.body;
  if (!phone || !text || !buttonText || !sections) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text, footer: footer || '', title: title || '', buttonText, sections });
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send-media', authMiddleware, async (req, res) => {
  const { phone, mediaUrl, caption, type } = req.body;
  if (!phone || !mediaUrl) return res.status(400).json({ error: 'phone e mediaUrl obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    let msg = {}; const mt = type || 'image';
    if (mt === 'image') msg = { image: { url: mediaUrl }, caption: caption || '' };
    else if (mt === 'video') msg = { video: { url: mediaUrl }, caption: caption || '' };
    else if (mt === 'audio') msg = { audio: { url: mediaUrl }, mimetype: 'audio/mp4' };
    else if (mt === 'document') msg = { document: { url: mediaUrl }, fileName: caption || 'file' };
    await sock.sendMessage(jid, msg);
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                           INICIAR SERVIDOR                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝
app.listen(PORT, '0.0.0.0', async () => {
  await showBanner();
  connectWhatsApp();
});
`;
  };

  const downloadScript = () => {
    const script = getVPSScript();
    const blob = new Blob([script], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-vps.js';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script baixado!');
  };

  const setupSteps = [
    {
      id: '1',
      title: '1. Conectar via SSH',
      content: `ssh root@SEU_IP_DA_VPS

# Ou se criou usuário:
ssh usuario@SEU_IP_DA_VPS`
    },
    {
      id: '2',
      title: '2. Atualizar sistema',
      content: `sudo apt update && sudo apt upgrade -y`
    },
    {
      id: '3',
      title: '3. Instalar Node.js 20 LTS',
      content: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Deve mostrar v20.x.x`
    },
    {
      id: '4',
      title: '4. Instalar PM2 (gerenciador de processos)',
      content: `sudo npm install -g pm2
pm2 --version`
    },
    {
      id: '5',
      title: '5. Criar pasta do projeto',
      content: `mkdir -p ~/whatsapp-backend
cd ~/whatsapp-backend`
    },
    {
      id: '6',
      title: '6. Criar package.json',
      content: `cat > package.json << 'EOF'
{
  "name": "whatsapp-backend-vps",
  "version": "4.0.0",
  "main": "whatsapp-vps.js",
  "scripts": {
    "start": "node whatsapp-vps.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.16",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "pino": "^9.6.0"
  }
}
EOF`
    },
    {
      id: '7',
      title: '7. Instalar dependências',
      content: `npm install`
    },
    {
      id: '8',
      title: '8. Upload do script',
      content: `# Opção 1: Baixe o script do painel e faça upload via SCP:
scp whatsapp-vps.js root@SEU_IP:~/whatsapp-backend/

# Opção 2: Cole o conteúdo diretamente:
nano whatsapp-vps.js
# Cole o código e salve (Ctrl+X, Y, Enter)`
    },
    {
      id: '9',
      title: '9. Configurar variáveis de ambiente',
      content: `cat > .env << 'EOF'
PORT=3001
MASTER_TOKEN=${masterToken || 'SEU_TOKEN_AQUI'}
SUPABASE_URL=https://wvnszzrvrrueuycrpgyc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnN6enJ2cnJ1ZXV5Y3JwZ3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE4MjYsImV4cCI6MjA4MjM4NzgyNn0.mHs-vau3qsSRLqZ9AmWMsFB5ZLMmd1s003MxdLhBPw0
INSTANCE_ID=principal
EOF

# Instalar dotenv para carregar .env
npm install dotenv

# Adicionar no início do whatsapp-vps.js:
# require('dotenv').config();`
    },
    {
      id: '10',
      title: '10. Configurar Firewall',
      content: `sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # WhatsApp Backend
sudo ufw enable
sudo ufw status`
    },
    {
      id: '11',
      title: '11. Iniciar com PM2',
      content: `cd ~/whatsapp-backend
pm2 start whatsapp-vps.js --name whatsapp

# Configurar auto-start no boot
pm2 startup
pm2 save`
    },
    {
      id: '12',
      title: '12. Testar conexão',
      content: `# Na VPS, verificar logs:
pm2 logs whatsapp

# Testar endpoint de saúde:
curl http://localhost:3001/health -H "Authorization: Bearer ${masterToken || 'SEU_TOKEN'}"`
    }
  ];

  const pmCommands = [
    { cmd: 'pm2 status', desc: 'Ver status de todos os processos' },
    { cmd: 'pm2 logs whatsapp', desc: 'Ver logs em tempo real' },
    { cmd: 'pm2 restart whatsapp', desc: 'Reiniciar o serviço' },
    { cmd: 'pm2 stop whatsapp', desc: 'Parar o serviço' },
    { cmd: 'pm2 delete whatsapp', desc: 'Remover o serviço' },
    { cmd: 'pm2 monit', desc: 'Monitor de recursos (CPU/RAM)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6" />
            Configuração VPS/Servidor
          </h2>
          <p className="text-muted-foreground">
            Configure sua VPS Ubuntu 24.04 LTS para rodar o WhatsApp 24/7
          </p>
        </div>
        <Badge className={isConnected ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 mr-1" />
              VPS Conectada
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 mr-1" />
              VPS Pendente
            </>
          )}
        </Badge>
      </div>

      {/* VPS Specs Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Especificações da VPS Recomendadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <Cpu className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">vCPU</p>
                <p className="font-bold">2 núcleos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <HardDrive className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">RAM</p>
                <p className="font-bold">8 GB</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <HardDrive className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">NVMe</p>
                <p className="font-bold">100 GB</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <Globe className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Bandwidth</p>
                <p className="font-bold">8 TB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">🔗 Conexão</TabsTrigger>
          <TabsTrigger value="setup">📋 Setup VPS</TabsTrigger>
          <TabsTrigger value="script">📄 Script</TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conectar VPS ao Painel</CardTitle>
              <CardDescription>
                Configure a URL e o token de autenticação da sua VPS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vps-url" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL do Backend VPS
                  </Label>
                  <Input
                    id="vps-url"
                    placeholder="http://SEU_IP_VPS:3001"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemplo: http://123.456.789.0:3001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="master-token" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Master Token
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="master-token"
                      type="password"
                      placeholder="Token de autenticação"
                      value={masterToken}
                      onChange={(e) => setMasterToken(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(masterToken, 'Token')}
                      disabled={!masterToken}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deve ser o mesmo token configurado no arquivo .env da VPS
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configuração'
                  )}
                </Button>
                <Button onClick={testConnection} disabled={isTesting} variant="secondary">
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </div>

              {isConnected && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600">VPS Conectada!</p>
                    {lastCheck && (
                      <p className="text-xs text-muted-foreground">
                        Última verificação: {new Date(lastCheck).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Guia de Configuração Ubuntu 24.04 LTS
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo para configurar sua VPS do zero
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {setupSteps.map((step) => (
                  <AccordionItem key={step.id} value={step.id}>
                    <AccordionTrigger className="text-left">
                      {step.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{step.content}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(step.content, 'Comando')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* PM2 Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comandos PM2 Úteis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {pmCommands.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <code className="bg-background px-2 py-1 rounded text-sm font-mono">
                        {item.cmd}
                      </code>
                      <span className="text-sm text-muted-foreground">{item.desc}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.cmd, 'Comando')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-500" />
                Dicas de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Use um token forte e único para MASTER_TOKEN</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Configure o firewall (UFW) para permitir apenas portas necessárias</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Use HTTPS com SSL/TLS em produção (Nginx + Let's Encrypt)</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Mantenha o sistema atualizado: sudo apt update && sudo apt upgrade</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📄 Script whatsapp-vps.js
              </CardTitle>
              <CardDescription>
                Código completo do backend para rodar na VPS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={downloadScript} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Script
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(getVPSScript(), 'Script')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <pre className="p-4 text-xs font-mono">
                  <code>{getVPSScript()}</code>
                </pre>
              </ScrollArea>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Endpoints disponíveis:</h4>
                <div className="grid gap-1 text-sm font-mono">
                  <div><span className="text-green-500">GET</span> /health - Status do servidor</div>
                  <div><span className="text-green-500">GET</span> /status - Status da conexão WhatsApp</div>
                  <div><span className="text-green-500">GET</span> /qrcode - Obter QR Code</div>
                  <div><span className="text-blue-500">POST</span> /connect - Iniciar conexão</div>
                  <div><span className="text-blue-500">POST</span> /disconnect - Desconectar</div>
                  <div><span className="text-blue-500">POST</span> /send - Enviar texto</div>
                  <div><span className="text-blue-500">POST</span> /send-buttons - Enviar botões</div>
                  <div><span className="text-blue-500">POST</span> /send-list - Enviar lista</div>
                  <div><span className="text-blue-500">POST</span> /send-media - Enviar mídia</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
