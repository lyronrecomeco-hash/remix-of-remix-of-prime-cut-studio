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
  Download,
  FileText,
  Save,
  Activity
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

const PC_LOCAL_STORAGE = {
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
  const [backendMode, setBackendMode] = useState<BackendMode>(() => {
    const saved = readStorage(PC_LOCAL_STORAGE.backendMode);
    return saved === 'local' || saved === 'vps' ? saved : 'vps';
  });
  
  // VPS Form states
  const [backendUrl, setBackendUrl] = useState('');
  const [masterToken, setMasterToken] = useState('');
  
  // PC Local Form states
  const [localEndpoint, setLocalEndpoint] = useState(() => readStorage(PC_LOCAL_STORAGE.endpoint) ?? 'http://localhost');
  const [localPort, setLocalPort] = useState(() => readStorage(PC_LOCAL_STORAGE.port) ?? '3001');
  const [localToken, setLocalToken] = useState(() => readStorage(PC_LOCAL_STORAGE.token) ?? '');
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
  
  // Templates state
  interface AutomationTemplate {
    id: string;
    template_type: string;
    name: string;
    message_template: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<AutomationTemplate | null>(null);
  const [templateMessage, setTemplateMessage] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  
  // Test send state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('🔔 Teste de envio via WhatsApp Automação!\n\nEsta é uma mensagem de teste para verificar se o sistema está funcionando corretamente.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [messageLogs, setMessageLogs] = useState<{ id: string; phone_to: string; message: string; status: string; created_at: string; error_message: string | null }[]>([]);

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

  // Persist settings locally (prevents token mismatch after refresh)
  useEffect(() => {
    writeStorage(PC_LOCAL_STORAGE.backendMode, backendMode);
  }, [backendMode]);

  useEffect(() => {
    writeStorage(PC_LOCAL_STORAGE.endpoint, localEndpoint);
  }, [localEndpoint]);

  useEffect(() => {
    writeStorage(PC_LOCAL_STORAGE.port, localPort);
  }, [localPort]);

  useEffect(() => {
    if (localToken) writeStorage(PC_LOCAL_STORAGE.token, localToken);
  }, [localToken]);

  // Generate a token if not exists
  useEffect(() => {
    if (!localToken) {
      setLocalToken(crypto.randomUUID());
    }
  }, [localToken]);

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
    fetchMessageLogs();
  }, []);

  // Polling for local backend logs
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
          headers: {
            'Authorization': `Bearer ${localToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.logs && data.logs.length > 0) {
            data.logs.forEach((log: { timestamp: string; type: string; message: string }) => {
              addConsoleLog(log.type as ConsoleLog['type'], log.message);
            });
            lastLogTimestamp.current = data.logs[data.logs.length - 1].timestamp;
          }
        }
      } catch (error) {
        // Silent fail - backend might be temporarily unavailable
      }
    };

    // Initial fetch
    fetchLogs();
    
    // Poll every 2 seconds
    const interval = setInterval(fetchLogs, 2000);
    
    return () => {
      clearInterval(interval);
      lastLogTimestamp.current = null;
    };
  }, [isLocalConnected, backendMode, localEndpoint, localPort, localToken, addConsoleLog]);

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
      
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('whatsapp_automation_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (templatesError) throw templatesError;
      setTemplates((templatesData || []) as AutomationTemplate[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates((data || []) as AutomationTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  const openEditTemplate = (template: AutomationTemplate) => {
    setEditingTemplate(template);
    setTemplateMessage(template.message_template);
  };
  
  const saveTemplate = async () => {
    if (!editingTemplate) return;
    
    setIsSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('whatsapp_automation_templates')
        .update({
          message_template: templateMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      
      toast.success('Template salvo com sucesso!');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setIsSavingTemplate(false);
    }
  };
  
  const toggleTemplateActive = async (template: AutomationTemplate) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      
      toast.success(`Template ${template.is_active ? 'desativado' : 'ativado'}!`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao alterar template');
    }
  };

  // Fetch message logs
  const fetchMessageLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMessageLogs(data || []);
    } catch (error) {
      console.error('Error fetching message logs:', error);
    }
  };

  // Save WA config to owner_settings for edge function use
  const saveWAConfigToSettings = async () => {
    try {
      const configData = {
        mode: backendMode,
        endpoint: backendMode === 'local' ? `${localEndpoint}:${localPort}` : backendUrl,
        token: backendMode === 'local' ? localToken : masterToken,
        is_connected: backendMode === 'local' ? isLocalConnected : (backendConfig?.is_connected || false),
      };

      const { data: existing } = await supabase
        .from('owner_settings')
        .select('id')
        .eq('setting_key', 'whatsapp_automation')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('owner_settings')
          .update({ setting_value: configData, updated_at: new Date().toISOString() })
          .eq('setting_key', 'whatsapp_automation');
      } else {
        await supabase
          .from('owner_settings')
          .insert({
            setting_key: 'whatsapp_automation',
            setting_value: configData,
            description: 'WhatsApp Automation configuration',
          });
      }
      
      console.log('WA config saved to owner_settings:', configData);
    } catch (error) {
      console.error('Error saving WA config:', error);
    }
  };

  // Update config when connection state changes
  useEffect(() => {
    if (isLocalConnected || backendConfig?.is_connected) {
      saveWAConfigToSettings();
    }
  }, [isLocalConnected, backendConfig?.is_connected, backendMode]);

  // Send test message
  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite o número de telefone');
      return;
    }

    if (!isBackendActive) {
      toast.error('Backend não conectado');
      return;
    }

    setIsSendingTest(true);
    addConsoleLog('info', `Enviando mensagem de teste para ${testPhone}...`);

    try {
      let formattedPhone = testPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const endpoint = backendMode === 'local'
        ? `${localEndpoint}:${localPort}/api/instance`
        : backendUrl;
      
      const token = backendMode === 'local' ? localToken : masterToken;

      // Get first connected instance
      const connectedInstance = instances.find(i => i.status === 'connected');
      if (!connectedInstance) {
        throw new Error('Nenhuma instância conectada. Conecte uma instância primeiro.');
      }

      const response = await fetch(`${endpoint}/${connectedInstance.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: testMessage,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        addConsoleLog('success', `✓ Mensagem enviada com sucesso para ${testPhone}!`);
        toast.success('Mensagem de teste enviada!');

        // Log to database
        await supabase.from('whatsapp_message_logs').insert({
          instance_id: connectedInstance.id,
          direction: 'outgoing',
          phone_to: formattedPhone,
          message: testMessage,
          status: 'sent',
        });

        fetchMessageLogs();
      } else {
        throw new Error(result.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addConsoleLog('error', `✗ Falha ao enviar: ${errorMessage}`);
      toast.error(errorMessage);

      // Log error
      const connectedInstance = instances.find(i => i.status === 'connected');
      if (connectedInstance) {
        await supabase.from('whatsapp_message_logs').insert({
          instance_id: connectedInstance.id,
          direction: 'outgoing',
          phone_to: testPhone.replace(/\D/g, ''),
          message: testMessage,
          status: 'failed',
          error_message: errorMessage,
        });
        fetchMessageLogs();
      }
    } finally {
      setIsSendingTest(false);
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
      } else if (response.status === 401) {
        setIsLocalConnected(false);
        addConsoleLog(
          'error',
          `Token inválido (401). O token do painel NÃO é o mesmo do whatsapp-local.js. Baixe o script novamente para sincronizar o token.`
        );
        toast.error('Token do PC Local inválido. Baixe o script novamente.');
        return;
      } else {
        throw new Error(`Backend local respondeu com status ${response.status}`);
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
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Falha ao gerar QR Code');
      }

      const data = await response.json();

      // If the instance is already authenticated, backend may return connected without QR.
      if (data?.status === 'connected') {
        addConsoleLog('success', `WhatsApp conectado! Número: ${data.phone || newInstancePhone}`);
        toast.success('WhatsApp conectado com sucesso!');
        setIsNewInstanceOpen(false);
        fetchData();
        return;
      }

      if (!data?.qrcode) {
        throw new Error('QR Code não gerado (tente novamente)');
      }

      setQrCodeData(data.qrcode);
      addConsoleLog('success', 'QR Code gerado com sucesso! Escaneie com seu WhatsApp');

      // Start polling for connection status
      pollConnectionStatus(instanceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar QR Code';
      addConsoleLog('error', message);
      toast.error(message);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const pollConnectionStatus = async (instanceId: string) => {
    const fullUrl = `${localEndpoint}:${localPort}`;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes with 2 second intervals

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
            addConsoleLog('success', `✓ WhatsApp conectado! Número: ${data.phone || newInstancePhone}`);

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
            setQrCodeData(null);
            fetchData();
            return;
          }

          // Se ainda está em qr_pending, pode ter um novo QR (expirado)
          if (data.status === 'qr_pending' && attempts > 0 && attempts % 20 === 0) {
            addConsoleLog('info', 'Atualizando QR Code...');
            try {
              const qrResponse = await fetch(`${fullUrl}/api/instance/${instanceId}/qrcode`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: newInstancePhone }),
              });
              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                if (qrData.qrcode) {
                  setQrCodeData(qrData.qrcode);
                  addConsoleLog('info', 'Novo QR Code gerado.');
                }
              }
            } catch {}
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          addConsoleLog('warning', 'Tempo limite para conexão atingido (3 min). Tente novamente.');
          toast.warning('Tempo limite atingido. Tente gerar o QR novamente.');
        }
      } catch {
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
// WhatsApp Backend Local (PC Local) v2.0
// ===============================================
// Corrige: QR via painel, reconnect automático,
// backoff exponencial para erro 515, logs em /logs
// ===============================================
// INSTALAR: npm install express cors qrcode @whiskeysockets/baileys @supabase/supabase-js
// EXECUTAR: node whatsapp-local.js
// ===============================================

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = ${localPort};
const TOKEN = '${localToken}';

const supabase = createClient('${supabaseUrl}', '${supabaseKey}');

// ===== LOGS =====
const serverLogs = [];
const pushLog = (type, message) => {
  const payload = { timestamp: new Date().toISOString(), type, message };
  serverLogs.push(payload);
  if (serverLogs.length > 500) serverLogs.shift();
  const colors = { success: '\\x1b[32m', error: '\\x1b[31m', warning: '\\x1b[33m', info: '\\x1b[36m' };
  const reset = '\\x1b[0m';
  console.log(\`\${colors[type] || ''}[\${type.toUpperCase()}]\${reset} \${message}\`);
};

// ===== MIDDLEWARES =====
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '5mb' }));

const authMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const auth = req.headers.authorization;
  if (!auth || auth !== \`Bearer \${TOKEN}\`) {
    pushLog('warning', \`Requisição não autorizada: \${req.method} \${req.path}\`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
app.use(authMiddleware);

// ===== ESTADO DAS CONEXÕES =====
const connections = new Map();

const setConn = (id, patch) => {
  const prev = connections.get(id) || {
    sock: null,
    status: 'disconnected',
    phone: null,
    me: null,
    qrDataUrl: null,
    updatedAt: new Date().toISOString(),
    reconnecting: false,
    reconnectAttempts: 0,
  };
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  connections.set(id, next);
  return next;
};

const safeDbUpdate = async (id, patch) => {
  try {
    await supabase.from('whatsapp_instances').update(patch).eq('id', id);
  } catch (e) {
    pushLog('warning', \`Falha ao atualizar DB para \${id}: \${e?.message || e}\`);
  }
};

// Aguarda condição com timeout
const waitFor = async (fn, timeoutMs = 35000, intervalMs = 300) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
};

// ===== INICIAR INSTÂNCIA (com reconnect automático) =====
const startInstance = async (id, phone) => {
  const existing = connections.get(id);

  // Fecha socket anterior se existir
  if (existing?.sock) {
    try { existing.sock.end?.(new Error('Restarting')); } catch {}
  }

  setConn(id, {
    status: 'starting',
    phone: phone ?? existing?.phone ?? null,
    qrDataUrl: null,
    reconnecting: false,
  });

  pushLog('info', \`Iniciando instância \${id}...\`);

  const sessionsDir = path.join(process.cwd(), 'sessions', id);
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // QR vai pro painel, não pro terminal
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  setConn(id, { sock });

  sock.ev.on('creds.update', async () => {
    await saveCreds();
    pushLog('info', \`Credenciais salvas para \${id}\`);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR Code gerado
    if (qr) {
      try {
        const qrDataUrl = await qrcode.toDataURL(qr, { margin: 1, width: 300 });
        setConn(id, { status: 'qr_pending', qrDataUrl });
        pushLog('info', \`QR Code gerado para \${id}. Escaneie no WhatsApp.\`);
      } catch (e) {
        pushLog('error', \`Erro ao gerar QR: \${e?.message || e}\`);
      }
      return;
    }

    // Conexão aberta
    if (connection === 'open') {
      const me = sock.user?.id || null;
      setConn(id, { status: 'connected', me, qrDataUrl: null, reconnectAttempts: 0 });
      pushLog('success', \`✓ Instância \${id} conectada! \${me ? \`(\${me})\` : ''}\`);
      
      await safeDbUpdate(id, {
        status: 'connected',
        phone_number: phone ?? me ?? null,
        last_seen: new Date().toISOString(),
      });
      return;
    }

    // Conexão fechada
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = code === DisconnectReason.loggedOut;

      setConn(id, { status: 'disconnected' });
      pushLog('warning', \`Instância \${id} desconectou (code=\${code ?? 'n/a'})\`);

      if (isLoggedOut) {
        pushLog('error', \`Instância \${id} fez logout. Gere o QR novamente.\`);
        await safeDbUpdate(id, { status: 'disconnected' });
        // Limpa sessão para novo QR
        try {
          fs.rmSync(sessionsDir, { recursive: true, force: true });
          pushLog('info', \`Sessão limpa para \${id}\`);
        } catch {}
        return;
      }

      // Reconnect automático com backoff (resolve erro 515)
      const cur = connections.get(id);
      if (!cur || cur.reconnecting) return;

      const attempt = (cur.reconnectAttempts ?? 0) + 1;
      setConn(id, { reconnecting: true, reconnectAttempts: attempt });

      const delay = Math.min(30000, 1500 * attempt);
      pushLog('info', \`Reconectando \${id} em \${delay}ms (tentativa \${attempt})...\`);

      setTimeout(async () => {
        try {
          setConn(id, { reconnecting: false });
          await startInstance(id, phone);
        } catch (e) {
          setConn(id, { reconnecting: false });
          pushLog('error', \`Falha ao reconectar \${id}: \${e?.message || e}\`);
        }
      }, delay);
    }
  });

  sock.ev.on('messages.upsert', (m) => {
    if (!m?.messages?.length) return;
    const msg = m.messages[0];
    const from = msg.key?.remoteJid || 'desconhecido';
    pushLog('info', \`Mensagem recebida de \${from} na instância \${id}\`);
  });

  return sock;
};

// ===== ROTAS =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WhatsApp Local Backend',
    version: '2.0.0',
    instances: connections.size,
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
  });
});

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return \`\${h}h \${m}m \${s}s\`;
}

// Gerar QR Code (ou retornar se já conectado)
app.post('/api/instance/:id/qrcode', async (req, res) => {
  const { id } = req.params;
  const { phone } = req.body || {};

  try {
    await startInstance(id, phone);

    // Aguarda QR ou conexão
    const result = await waitFor(() => {
      const c = connections.get(id);
      if (!c) return null;
      if (c.status === 'connected') {
        return { status: 'connected', phone: c.me || c.phone || phone || null };
      }
      if (c.qrDataUrl) {
        return { status: 'qr_pending', qrcode: c.qrDataUrl, phone: c.phone || phone || null };
      }
      return null;
    }, 35000, 300);

    if (!result) {
      pushLog('warning', \`Timeout ao gerar QR para \${id}\`);
      return res.status(504).json({ error: 'Timeout ao gerar QR (tente novamente)' });
    }

    return res.json(result);
  } catch (e) {
    pushLog('error', \`Erro ao iniciar instância \${id}: \${e?.message || e}\`);
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Status da instância
app.get('/api/instance/:id/status', (req, res) => {
  const { id } = req.params;
  const c = connections.get(id);

  res.json({
    status: c?.status || 'inactive',
    phone: c?.me || c?.phone || null,
    connected: c?.status === 'connected',
    updatedAt: c?.updatedAt || null,
    reconnectAttempts: c?.reconnectAttempts || 0,
  });
});

// Enviar mensagem
app.post('/api/instance/:id/send', async (req, res) => {
  const { id } = req.params;
  const { phone, message, imageUrl, buttons } = req.body || {};

  const c = connections.get(id);
  if (!c || c.status !== 'connected' || !c.sock) {
    return res.status(400).json({ error: 'Instância não conectada' });
  }
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone e message são obrigatórios' });
  }

  try {
    const jid = String(phone).includes('@s.whatsapp.net') 
      ? String(phone) 
      : \`\${String(phone).replace(/\\D/g, '')}@s.whatsapp.net\`;

    if (imageUrl) {
      await c.sock.sendMessage(jid, { image: { url: imageUrl }, caption: message });
    } else {
      await c.sock.sendMessage(jid, { text: message });
    }

    pushLog('success', \`Mensagem enviada para \${phone} via \${id}\`);

    // Log no banco
    try {
      await supabase.from('whatsapp_message_logs').insert({
        instance_id: id,
        direction: 'outgoing',
        phone_to: phone,
        message: message,
        status: 'sent'
      });
    } catch {}

    return res.json({ success: true });
  } catch (e) {
    pushLog('error', \`Erro ao enviar mensagem: \${e?.message || e}\`);
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Desconectar instância
app.post('/api/instance/:id/disconnect', async (req, res) => {
  const { id } = req.params;
  const c = connections.get(id);

  try {
    if (c?.sock) {
      await c.sock.logout?.();
    }
  } catch {}

  connections.delete(id);
  pushLog('warning', \`Instância \${id} desconectada (logout)\`);

  await safeDbUpdate(id, { status: 'disconnected' });

  // Limpa sessão
  const sessionsDir = path.join(process.cwd(), 'sessions', id);
  try {
    fs.rmSync(sessionsDir, { recursive: true, force: true });
  } catch {}

  res.json({ success: true });
});

// Logs para o painel
app.get('/logs', (req, res) => {
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const logs = since
    ? serverLogs.filter(l => new Date(l.timestamp) > since)
    : serverLogs.slice(-100);
  res.json({ logs });
});

// Limpar logs
app.delete('/logs', (req, res) => {
  serverLogs.length = 0;
  pushLog('info', 'Logs limpos');
  res.json({ success: true });
});

// Lista de instâncias ativas
app.get('/api/instances', (req, res) => {
  const list = [];
  connections.forEach((c, id) => {
    list.push({
      id,
      status: c.status,
      phone: c.me || c.phone,
      connected: c.status === 'connected',
      reconnectAttempts: c.reconnectAttempts,
    });
  });
  res.json({ instances: list });
});

// ===== START =====
app.listen(PORT, () => {
  console.log('');
  console.log('\\x1b[36m' + '='.repeat(56) + '\\x1b[0m');
  console.log('\\x1b[36m   WhatsApp Backend Local (PC Local) v2.0\\x1b[0m');
  console.log('\\x1b[36m' + '='.repeat(56) + '\\x1b[0m');
  console.log(\`   Porta: \\x1b[33m\${PORT}\\x1b[0m\`);
  console.log(\`   Token: \\x1b[33m\${TOKEN}\\x1b[0m\`);
  console.log('\\x1b[36m' + '='.repeat(56) + '\\x1b[0m');
  console.log('   \\x1b[32m✓ Backend ONLINE e pronto!\\x1b[0m');
  console.log('\\x1b[36m' + '='.repeat(56) + '\\x1b[0m');
  console.log('');

  pushLog('success', 'Backend iniciado com sucesso!');
  pushLog('info', \`Servidor rodando em http://localhost:\${PORT}\`);
  pushLog('info', 'Aguardando conexões do painel...');
});
`;
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Testar
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
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

        {/* Test Send Tab */}
        <TabsContent value="test" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Send Test Message Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Enviar Mensagem de Teste
                </CardTitle>
                <CardDescription>
                  Teste o envio de mensagens pela instância conectada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isBackendActive ? (
                  <div className="py-8 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                      Backend não conectado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configure e conecte o backend primeiro
                    </p>
                  </div>
                ) : instances.filter(i => i.status === 'connected').length === 0 ? (
                  <div className="py-8 text-center">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">Nenhuma instância conectada</p>
                    <p className="text-sm text-muted-foreground">
                      Conecte uma instância via QR Code para enviar mensagens
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Número de Telefone</Label>
                      <Input
                        placeholder="Ex: 11999999999"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        DDD + número (sem +55)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        placeholder="Digite a mensagem de teste..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      onClick={sendTestMessage} 
                      disabled={isSendingTest || !testPhone.trim()}
                      className="w-full"
                    >
                      {isSendingTest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Enviar Teste
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Message Logs Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Logs de Mensagens
                    </CardTitle>
                    <CardDescription>
                      Histórico de envios recentes
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchMessageLogs}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  {messageLogs.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum log encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messageLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-lg border ${
                            log.status === 'sent' 
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-red-500/30 bg-red-500/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm">{log.phone_to}</span>
                            <Badge 
                              variant={log.status === 'sent' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {log.message.slice(0, 50)}{log.message.length > 50 ? '...' : ''}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-500 mt-1">{log.error_message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates de Mensagem
              </CardTitle>
              <CardDescription>
                Configure templates usados para envio automático via WhatsApp Automação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template configurado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">
                              Tipo: {template.template_type}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                              {template.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Switch
                              checked={template.is_active}
                              onCheckedChange={() => toggleTemplateActive(template)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Preview */}
                        <div className="p-4 bg-[#0b141a] rounded-lg border border-border">
                          <div className="bg-[#005c4b] text-white p-3 rounded-lg max-w-[90%] ml-auto">
                            <p className="text-sm whitespace-pre-wrap font-mono">
                              {template.message_template
                                .replace(/\{\{empresa\}\}/g, 'Minha Empresa')
                                .replace(/\{\{nome\}\}/g, 'João Silva')
                                .replace(/\{\{token\}\}/g, 'crm@genesishub-token-ABC123')
                                .replace(/\{\{link\}\}/g, window.location.origin + '/crm/token')
                                .slice(0, 300)}
                              {template.message_template.length > 300 && '...'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => openEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-medium text-sm mb-2">Variáveis Disponíveis</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span><code className="bg-muted px-1 rounded">{'{{nome}}'}</code> - Nome do colaborador</span>
                  <span><code className="bg-muted px-1 rounded">{'{{empresa}}'}</code> - Nome da empresa</span>
                  <span><code className="bg-muted px-1 rounded">{'{{token}}'}</code> - Token de acesso</span>
                  <span><code className="bg-muted px-1 rounded">{'{{link}}'}</code> - Link de acesso</span>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              {editingTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mensagem do Template</Label>
              <Textarea
                value={templateMessage}
                onChange={(e) => setTemplateMessage(e.target.value)}
                placeholder="Digite a mensagem..."
                className="min-h-[250px] font-mono text-sm"
              />
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-2">Variáveis Disponíveis</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span><code className="bg-muted px-1 rounded">{'{{nome}}'}</code> - Nome do colaborador</span>
                <span><code className="bg-muted px-1 rounded">{'{{empresa}}'}</code> - Nome da empresa</span>
                <span><code className="bg-muted px-1 rounded">{'{{token}}'}</code> - Token de acesso</span>
                <span><code className="bg-muted px-1 rounded">{'{{link}}'}</code> - Link de acesso</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 bg-[#0b141a] rounded-lg border border-border">
                <div className="bg-[#005c4b] text-white p-3 rounded-lg max-w-[90%] ml-auto">
                  <p className="text-sm whitespace-pre-wrap">
                    {templateMessage
                      .replace(/\{\{empresa\}\}/g, 'Minha Empresa')
                      .replace(/\{\{nome\}\}/g, 'João Silva')
                      .replace(/\{\{token\}\}/g, 'crm@genesishub-token-ABC123')
                      .replace(/\{\{link\}\}/g, window.location.origin + '/crm/token')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAutomation;
