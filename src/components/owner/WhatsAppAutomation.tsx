import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Server, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  Copy, 
  Check,
  RefreshCw,
  Settings2,
  MessageSquare,
  Clock,
  Shield,
  Link2,
  AlertTriangle,
  Power,
  PowerOff,
  Monitor,
  Terminal,
  Play,
  Pause,
  Circle,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';

// Types
interface BackendConfig {
  id: string;
  backend_url: string | null;
  master_token: string | null;
  is_connected: boolean;
  last_health_check: string | null;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  instance_token: string;
  status: 'inactive' | 'awaiting_backend' | 'connected' | 'disconnected' | 'qr_pending';
  phone_number: string | null;
  last_seen: string | null;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  message_delay_ms: number;
  created_at: string;
}

interface ConsoleLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

type BackendMode = 'vps' | 'local';

const statusConfig = {
  inactive: { label: 'Inativo', color: 'bg-gray-500', icon: PowerOff },
  awaiting_backend: { label: 'Aguardando Backend', color: 'bg-yellow-500', icon: Clock },
  connected: { label: 'Conectado', color: 'bg-green-500', icon: Wifi },
  disconnected: { label: 'Desconectado', color: 'bg-red-500', icon: WifiOff },
  qr_pending: { label: 'QR Code Pendente', color: 'bg-blue-500', icon: QrCode },
};

const WhatsAppAutomation = () => {
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Backend mode
  const [backendMode, setBackendMode] = useState<BackendMode>('vps');
  
  // VPS Form states
  const [backendUrl, setBackendUrl] = useState('');
  const [masterToken, setMasterToken] = useState('');
  
  // PC Local Form states
  const [localEndpoint, setLocalEndpoint] = useState('http://localhost');
  const [localPort, setLocalPort] = useState('3001');
  const [localToken, setLocalToken] = useState('');
  const [isLocalConnected, setIsLocalConnected] = useState(false);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  
  // Console logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  
  // New instance dialog
  const [isNewInstanceOpen, setIsNewInstanceOpen] = useState(false);
  const [instanceCreationStep, setInstanceCreationStep] = useState<'choose' | 'form' | 'qrcode'>('choose');
  const [selectedBackendType, setSelectedBackendType] = useState<'vps' | 'local' | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstancePhone, setNewInstancePhone] = useState('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  
  // Edit instance dialog
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [editName, setEditName] = useState('');
  const [editAutoReply, setEditAutoReply] = useState(false);
  const [editAutoReplyMessage, setEditAutoReplyMessage] = useState('');
  const [editMessageDelay, setEditMessageDelay] = useState(1000);

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

  // Generate a token if not exists
  useEffect(() => {
    if (!localToken) {
      setLocalToken(crypto.randomUUID());
    }
  }, []);

  // Console log helper
  const addConsoleLog = useCallback((type: ConsoleLog['type'], message: string) => {
    setConsoleLogs(prev => [...prev.slice(-99), { timestamp: new Date(), type, message }]);
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: configData, error: configError } = await supabase
        .from('whatsapp_backend_config')
        .select('*')
        .maybeSingle();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (configData) {
        setBackendConfig(configData);
        setBackendUrl(configData.backend_url || '');
        setMasterToken(configData.master_token || '');
      }

      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;
      setInstances((instancesData || []) as WhatsAppInstance[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBackendConfig = async () => {
    setIsSaving(true);
    try {
      if (backendConfig?.id) {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .update({
            backend_url: backendUrl || null,
            master_token: masterToken || null,
          })
          .eq('id', backendConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .insert({
            backend_url: backendUrl || null,
            master_token: masterToken || null,
          });

        if (error) throw error;
      }

      toast.success('Configuração salva com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const testBackendConnection = async () => {
    if (!backendUrl) {
      toast.error('Configure a URL do backend primeiro');
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${masterToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (backendConfig?.id) {
          await supabase
            .from('whatsapp_backend_config')
            .update({
              is_connected: true,
              last_health_check: new Date().toISOString(),
            })
            .eq('id', backendConfig.id);
        }
        toast.success('Backend conectado com sucesso!');
        fetchData();
      } else {
        throw new Error('Backend não respondeu corretamente');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      if (backendConfig?.id) {
        await supabase
          .from('whatsapp_backend_config')
          .update({
            is_connected: false,
          })
          .eq('id', backendConfig.id);
      }
      toast.error('Falha na conexão com o backend. Verifique se está online.');
      fetchData();
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testLocalConnection = async () => {
    const fullUrl = `${localEndpoint}:${localPort}`;
    setIsTestingLocal(true);
    addConsoleLog('info', `Testando conexão com ${fullUrl}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${fullUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setIsLocalConnected(true);
        addConsoleLog('success', `Conectado! Backend: ${data.name || 'WhatsApp Local'} v${data.version || '1.0.0'}`);
        toast.success('PC Local conectado com sucesso!');
        
        // Reset instances state when connecting to local
        await resetInstancesState();
      } else {
        throw new Error('Backend local não respondeu corretamente');
      }
    } catch (error: unknown) {
      setIsLocalConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('abort')) {
        addConsoleLog('error', 'Timeout: Backend local não respondeu em 5 segundos');
      } else {
        addConsoleLog('error', `Falha na conexão: ${errorMessage}`);
      }
      
      toast.error('PC Local não está respondendo. Verifique se o script está rodando.');
    } finally {
      setIsTestingLocal(false);
    }
  };

  const disconnectLocal = () => {
    setIsLocalConnected(false);
    addConsoleLog('warning', 'Desconectado do backend local');
    toast.info('PC Local desconectado');
  };

  const resetInstancesState = async () => {
    addConsoleLog('info', 'Resetando estado das instâncias...');
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ status: 'inactive', phone_number: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      addConsoleLog('success', 'Instâncias resetadas com sucesso');
      fetchData();
    } catch (error) {
      addConsoleLog('error', 'Erro ao resetar instâncias');
    }
  };

  const openNewInstanceDialog = () => {
    setInstanceCreationStep('choose');
    setSelectedBackendType(null);
    setNewInstanceName('');
    setNewInstancePhone('');
    setQrCodeData(null);
    setIsNewInstanceOpen(true);
  };

  const handleBackendTypeSelection = (type: 'vps' | 'local') => {
    setSelectedBackendType(type);
    setInstanceCreationStep('form');
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    if (selectedBackendType === 'local' && !newInstancePhone.trim()) {
      toast.error('Digite o número para conexão');
      return;
    }

    setIsCreatingInstance(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          name: newInstanceName.trim(),
          phone_number: selectedBackendType === 'local' ? newInstancePhone.trim() : null,
          status: selectedBackendType === 'local' ? 'qr_pending' : (backendConfig?.is_connected ? 'awaiting_backend' : 'inactive'),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Instância criada com sucesso');
      
      if (selectedBackendType === 'local' && isLocalConnected) {
        // Generate QR Code
        setInstanceCreationStep('qrcode');
        await generateQRCode(data.id);
      } else {
        setIsNewInstanceOpen(false);
        setNewInstanceName('');
        setNewInstancePhone('');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const generateQRCode = async (instanceId: string) => {
    setIsGeneratingQR(true);
    addConsoleLog('info', `Gerando QR Code para instância ${instanceId}...`);
    
    try {
      const fullUrl = `${localEndpoint}:${localPort}`;
      const response = await fetch(`${fullUrl}/api/instance/${instanceId}/qrcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: newInstancePhone }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar QR Code');
      }

      const data = await response.json();
      setQrCodeData(data.qrcode);
      addConsoleLog('success', 'QR Code gerado com sucesso! Escaneie com seu WhatsApp');
      
      // Start polling for connection status
      pollConnectionStatus(instanceId);
    } catch (error) {
      addConsoleLog('error', 'Erro ao gerar QR Code. Verifique se o backend local está rodando.');
      toast.error('Erro ao gerar QR Code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const pollConnectionStatus = async (instanceId: string) => {
    const fullUrl = `${localEndpoint}:${localPort}`;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes with 2 second intervals

    const checkStatus = async () => {
      try {
        const response = await fetch(`${fullUrl}/api/instance/${instanceId}/status`, {
          headers: {
            'Authorization': `Bearer ${localToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'connected') {
            addConsoleLog('success', `WhatsApp conectado! Número: ${data.phone || newInstancePhone}`);
            
            // Update instance in database
            await supabase
              .from('whatsapp_instances')
              .update({
                status: 'connected',
                phone_number: data.phone || newInstancePhone,
                last_seen: new Date().toISOString(),
              })
              .eq('id', instanceId);

            toast.success('WhatsApp conectado com sucesso!');
            setIsNewInstanceOpen(false);
            fetchData();
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          addConsoleLog('warning', 'Tempo limite para conexão atingido');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        }
      }
    };

    checkStatus();
  };

  const updateInstance = async () => {
    if (!editingInstance) return;

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          name: editName,
          auto_reply_enabled: editAutoReply,
          auto_reply_message: editAutoReplyMessage || null,
          message_delay_ms: editMessageDelay,
        })
        .eq('id', editingInstance.id);

      if (error) throw error;

      toast.success('Instância atualizada');
      setEditingInstance(null);
      fetchData();
    } catch (error) {
      console.error('Error updating instance:', error);
      toast.error('Erro ao atualizar instância');
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Instância removida');
      fetchData();
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao remover instância');
    }
  };

  const copyToClipboard = async (text: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(tokenId);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success('Copiado para a área de transferência');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const openEditDialog = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setEditName(instance.name);
    setEditAutoReply(instance.auto_reply_enabled);
    setEditAutoReplyMessage(instance.auto_reply_message || '');
    setEditMessageDelay(instance.message_delay_ms);
  };

  const getInstanceEndpoint = (instanceId: string) => {
    if (backendMode === 'local' && isLocalConnected) {
      return `${localEndpoint}:${localPort}/api/instance/${instanceId}`;
    }
    if (backendUrl) {
      return `${backendUrl}/api/instance/${instanceId}`;
    }
    return `${currentDomain}/api/whatsapp/${instanceId}`;
  };

  const getLocalScript = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'YOUR_SUPABASE_KEY';
    
    return `// ===============================================
// WhatsApp Backend Local - Script para PC
// ===============================================
// Execute no Terminal/CMD: node whatsapp-local.js
// ===============================================

const express = require('express');
const cors = require('cors');
const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = ${localPort};
const TOKEN = '${localToken}';

// Supabase client
const supabase = createClient(
  '${supabaseUrl}',
  '${supabaseKey}'
);

app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== \`Bearer \${TOKEN}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use(authMiddleware);

// Store connections
const connections = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WhatsApp Local Backend',
    version: '1.0.0',
    instances: connections.size,
    uptime: process.uptime()
  });
});

// Generate QR Code
app.post('/api/instance/:id/qrcode', async (req, res) => {
  const { id } = req.params;
  const { phone } = req.body;
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(\`./sessions/\${id}\`);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        const qrDataUrl = await qrcode.toDataURL(qr);
        connections.set(id, { sock, qr: qrDataUrl, status: 'qr_pending', phone });
      }
      
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          console.log('Reconectando...');
        }
      } else if (connection === 'open') {
        console.log('Conectado!');
        connections.set(id, { sock, status: 'connected', phone });
        
        // Update database
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            phone_number: phone,
            last_seen: new Date().toISOString()
          })
          .eq('id', id);
      }
    });

    // Wait for QR generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conn = connections.get(id);
    if (conn?.qr) {
      res.json({ qrcode: conn.qr });
    } else {
      res.status(500).json({ error: 'QR Code não gerado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get instance status
app.get('/api/instance/:id/status', (req, res) => {
  const { id } = req.params;
  const conn = connections.get(id);
  
  res.json({
    status: conn?.status || 'inactive',
    phone: conn?.phone || null,
    connected: conn?.status === 'connected'
  });
});

// Send message
app.post('/api/instance/:id/send', async (req, res) => {
  const { id } = req.params;
  const { phone, message } = req.body;
  
  const conn = connections.get(id);
  if (!conn || conn.status !== 'connected') {
    return res.status(400).json({ error: 'Instância não conectada' });
  }
  
  try {
    const jid = phone.includes('@s.whatsapp.net') ? phone : \`\${phone}@s.whatsapp.net\`;
    await conn.sock.sendMessage(jid, { text: message });
    
    // Log message
    await supabase
      .from('whatsapp_message_logs')
      .insert({
        instance_id: id,
        direction: 'outgoing',
        phone_to: phone,
        message: message,
        status: 'sent'
      });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect instance
app.post('/api/instance/:id/disconnect', async (req, res) => {
  const { id } = req.params;
  const conn = connections.get(id);
  
  if (conn?.sock) {
    await conn.sock.logout();
    connections.delete(id);
  }
  
  await supabase
    .from('whatsapp_instances')
    .update({ status: 'disconnected' })
    .eq('id', id);
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  WhatsApp Local Backend');
  console.log('='.repeat(50));
  console.log(\`  Porta: \${PORT}\`);
  console.log(\`  Token: \${TOKEN.substring(0, 8)}...\`);
  console.log('='.repeat(50));
  console.log('  Status: ONLINE');
  console.log('='.repeat(50));
});`;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBackendActive = backendMode === 'vps' ? backendConfig?.is_connected : isLocalConnected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">WhatsApp Automação</h2>
          <p className="text-muted-foreground">
            Gerencie instâncias e configure o backend de automação
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="instances" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="backend" className="gap-2">
            <Server className="w-4 h-4" />
            Backend
          </TabsTrigger>
        </TabsList>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-6">
          {/* Backend Status Alert */}
          {!isBackendActive && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">
                    Backend não configurado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configure o backend na aba "Backend" para ativar as automações
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Backend Indicator */}
          {isBackendActive && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="flex items-center gap-4 py-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-600 dark:text-green-400">
                    Backend Ativo: {backendMode === 'vps' ? 'VPS' : 'PC Local'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {backendMode === 'vps' ? backendUrl : `${localEndpoint}:${localPort}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Instance Button */}
          <div className="flex justify-end">
            <Dialog open={isNewInstanceOpen} onOpenChange={setIsNewInstanceOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewInstanceDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                {instanceCreationStep === 'choose' && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Escolha o Tipo de Backend</DialogTitle>
                      <DialogDescription>
                        Selecione onde a instância será executada
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2"
                        onClick={() => handleBackendTypeSelection('vps')}
                      >
                        <Server className="w-8 h-8 text-primary" />
                        <span className="font-medium">VPS / Servidor</span>
                        <span className="text-xs text-muted-foreground">Servidor remoto Node.js</span>
                      </Button>
                      <Button
                        variant="outline"
                        className={`h-24 flex flex-col items-center justify-center gap-2 ${isLocalConnected ? 'border-green-500' : ''}`}
                        onClick={() => handleBackendTypeSelection('local')}
                        disabled={!isLocalConnected}
                      >
                        <Monitor className="w-8 h-8 text-primary" />
                        <span className="font-medium">PC Local</span>
                        <span className="text-xs text-muted-foreground">
                          {isLocalConnected ? 'Conectado' : 'Conecte primeiro na aba Backend'}
                        </span>
                      </Button>
                    </div>
                  </>
                )}

                {instanceCreationStep === 'form' && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Instância</DialogTitle>
                      <DialogDescription>
                        {selectedBackendType === 'local' 
                          ? 'Configure a instância para conexão via PC Local'
                          : 'Configure a instância para o servidor VPS'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome da Instância</Label>
                        <Input
                          placeholder="Ex: WhatsApp Principal"
                          value={newInstanceName}
                          onChange={(e) => setNewInstanceName(e.target.value)}
                        />
                      </div>
                      
                      {selectedBackendType === 'local' && (
                        <div className="space-y-2">
                          <Label>Número para Conexão</Label>
                          <Input
                            placeholder="Ex: 5511999999999"
                            value={newInstancePhone}
                            onChange={(e) => setNewInstancePhone(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Número com DDD e código do país (sem + ou espaços)
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setInstanceCreationStep('choose')}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={createInstance}
                        disabled={isCreatingInstance}
                      >
                        {isCreatingInstance && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {selectedBackendType === 'local' ? 'Gerar QR Code' : 'Criar Instância'}
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {instanceCreationStep === 'qrcode' && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Conectar WhatsApp</DialogTitle>
                      <DialogDescription>
                        Escaneie o QR Code com seu WhatsApp
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-6">
                      {isGeneratingQR ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-12 h-12 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                        </div>
                      ) : qrCodeData ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-white rounded-lg">
                            <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Abra o WhatsApp no seu celular, vá em<br />
                            <strong>Configurações → Aparelhos Conectados → Conectar</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <XCircle className="w-12 h-12 text-destructive" />
                          <p className="text-sm text-muted-foreground">Erro ao gerar QR Code</p>
                          <Button onClick={() => generateQRCode(instances[0]?.id || '')} variant="outline">
                            Tentar Novamente
                          </Button>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsNewInstanceOpen(false)}
                      >
                        Fechar
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Instances List */}
          {instances.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma instância criada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira instância para começar
                </p>
                <Button onClick={openNewInstanceDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Instância
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {instances.map((instance) => {
                const statusInfo = statusConfig[instance.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={instance.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${statusInfo.color}/20 flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{instance.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {statusInfo.label}
                              </Badge>
                              {instance.phone_number && (
                                <span className="text-xs">{instance.phone_number}</span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(instance)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover instância?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A instância "{instance.name}" será removida permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInstance(instance.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Separator />
                      
                      {/* Token & Endpoint */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Token de Autenticação
                          </Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                              {instance.instance_token.substring(0, 20)}...
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(instance.instance_token, `token-${instance.id}`)}
                            >
                              {copiedToken === `token-${instance.id}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            Endpoint da API
                          </Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                              {getInstanceEndpoint(instance.id)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getInstanceEndpoint(instance.id), `endpoint-${instance.id}`)}
                            >
                              {copiedToken === `endpoint-${instance.id}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Last Seen */}
                      {instance.last_seen && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Última Atividade</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(instance.last_seen).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}

                      {/* Auto Reply Status */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Resposta Automática</span>
                        </div>
                        <Badge variant={instance.auto_reply_enabled ? 'default' : 'secondary'}>
                          {instance.auto_reply_enabled ? 'Ativo' : 'Desativado'}
                        </Badge>
                      </div>

                      {/* Actions */}
                      {!isBackendActive && (
                        <p className="text-xs text-muted-foreground text-center">
                          Configure o backend para ativar ações de conexão e QR Code
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Backend Tab */}
        <TabsContent value="backend" className="space-y-6">
          {/* Backend Mode Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Modo de Backend</CardTitle>
              <CardDescription>
                Escolha entre usar um servidor VPS ou seu PC local
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={backendMode === 'vps' ? 'default' : 'outline'}
                  className="flex-1 h-20 flex flex-col gap-2"
                  onClick={() => setBackendMode('vps')}
                >
                  <Server className="w-6 h-6" />
                  <span>VPS / Servidor</span>
                </Button>
                <Button
                  variant={backendMode === 'local' ? 'default' : 'outline'}
                  className="flex-1 h-20 flex flex-col gap-2"
                  onClick={() => setBackendMode('local')}
                >
                  <Monitor className="w-6 h-6" />
                  <span>PC Local</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {backendMode === 'vps' ? (
            /* VPS Configuration */
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Configuração VPS
                  </CardTitle>
                  <CardDescription>
                    Configure a conexão com seu servidor Node.js de automação WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Connection Status */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className={`w-3 h-3 rounded-full ${backendConfig?.is_connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <p className="font-medium">
                        {backendConfig?.is_connected ? 'Backend Conectado' : 'Backend Desconectado'}
                      </p>
                      {backendConfig?.last_health_check && (
                        <p className="text-xs text-muted-foreground">
                          Última verificação: {new Date(backendConfig.last_health_check).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testBackendConnection}
                      disabled={isTestingConnection || !backendUrl}
                    >
                      {isTestingConnection ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <Separator />

                  {/* Backend URL */}
                  <div className="space-y-2">
                    <Label>URL do Backend (VPS)</Label>
                    <Input
                      placeholder="https://seu-servidor.com"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL do seu servidor Node.js com WhatsApp Web (Baileys)
                    </p>
                  </div>

                  {/* Master Token */}
                  <div className="space-y-2">
                    <Label>Token Master</Label>
                    <Input
                      type="password"
                      placeholder="Token de autenticação do backend"
                      value={masterToken}
                      onChange={(e) => setMasterToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Token para autenticar requisições ao backend
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={testBackendConnection}
                      disabled={isTestingConnection || !backendUrl}
                    >
                      {isTestingConnection && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Testar Conexão
                    </Button>
                    <Button onClick={saveBackendConfig} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Salvar Configuração
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Endpoints da API
                  </CardTitle>
                  <CardDescription>
                    Endpoints que seu backend deve implementar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {[
                        { method: 'GET', path: '/health', desc: 'Health check do backend' },
                        { method: 'GET', path: '/api/instance/:id/status', desc: 'Status da instância' },
                        { method: 'POST', path: '/api/instance/:id/qrcode', desc: 'Gerar QR Code' },
                        { method: 'POST', path: '/api/instance/:id/send', desc: 'Enviar mensagem' },
                        { method: 'POST', path: '/api/instance/:id/disconnect', desc: 'Desconectar instância' },
                      ].map((endpoint, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Badge
                            variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                            className="font-mono text-xs"
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="flex-1 text-sm font-mono">{endpoint.path}</code>
                          <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            /* PC Local Configuration */
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Configuração PC Local
                  </CardTitle>
                  <CardDescription>
                    Execute o script no seu computador para conectar como backend
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Connection Status */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className={`w-3 h-3 rounded-full ${isLocalConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <p className="font-medium">
                        {isLocalConnected ? 'PC Local Conectado' : 'PC Local Desconectado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLocalConnected ? `${localEndpoint}:${localPort}` : 'Execute o script para conectar'}
                      </p>
                    </div>
                    {isLocalConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={disconnectLocal}
                        className="text-destructive"
                      >
                        <PowerOff className="w-4 h-4 mr-1" />
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testLocalConnection}
                        disabled={isTestingLocal}
                      >
                        {isTestingLocal ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4 mr-1" />
                        )}
                        Conectar
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Local Settings */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Endpoint Local</Label>
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
                    <div className="space-y-2">
                      <Label>Token</Label>
                      <div className="flex gap-2">
                        <Input
                          value={localToken}
                          onChange={(e) => setLocalToken(e.target.value)}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(localToken, 'local-token')}
                        >
                          {copiedToken === 'local-token' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={testLocalConnection}
                      disabled={isTestingLocal}
                    >
                      {isTestingLocal && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Script Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Script de Execução
                  </CardTitle>
                  <CardDescription>
                    Baixe e execute este script no seu PC para iniciar o backend local
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full border">1</span>
                        <span className="text-sm">Instale as dependências:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background p-2 rounded font-mono overflow-x-auto">
                          npm install express cors @whiskeysockets/baileys qrcode @supabase/supabase-js
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => copyToClipboard('npm install express cors @whiskeysockets/baileys qrcode @supabase/supabase-js', 'cmd-install')}
                        >
                          {copiedToken === 'cmd-install' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full border">2</span>
                        <span className="text-sm">Baixe o script e execute:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background p-2 rounded font-mono">
                          node whatsapp-local.js
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => copyToClipboard('node whatsapp-local.js', 'cmd-run')}
                        >
                          {copiedToken === 'cmd-run' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button onClick={downloadScript} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Script
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] rounded-lg border">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                      {getLocalScript()}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Console */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Console
                  </CardTitle>
                  <CardDescription>
                    Logs em tempo real da conexão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={consoleRef}
                    className="h-[200px] rounded-lg bg-black p-4 overflow-y-auto font-mono text-xs"
                  >
                    {consoleLogs.length === 0 ? (
                      <div className="text-gray-500">
                        Aguardando conexão...
                      </div>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-gray-500">
                            [{log.timestamp.toLocaleTimeString('pt-BR')}]
                          </span>
                          <span className={
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                          }>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-1 mt-2 text-green-400">
                      <Circle className="w-2 h-2 fill-current animate-pulse" />
                      <span>_</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Instance Dialog */}
      <Dialog open={!!editingInstance} onOpenChange={(open) => !open && setEditingInstance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Instância</DialogTitle>
            <DialogDescription>
              Configure as opções da instância "{editingInstance?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Resposta Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Responder automaticamente mensagens recebidas
                </p>
              </div>
              <Switch
                checked={editAutoReply}
                onCheckedChange={setEditAutoReply}
              />
            </div>

            {editAutoReply && (
              <div className="space-y-2">
                <Label>Mensagem de Resposta</Label>
                <Textarea
                  placeholder="Digite a mensagem automática..."
                  value={editAutoReplyMessage}
                  onChange={(e) => setEditAutoReplyMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Delay entre Mensagens (ms)</Label>
              <Input
                type="number"
                min={500}
                max={10000}
                value={editMessageDelay}
                onChange={(e) => setEditMessageDelay(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Tempo de espera entre mensagens consecutivas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInstance(null)}>
              Cancelar
            </Button>
            <Button onClick={updateInstance}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAutomation;
