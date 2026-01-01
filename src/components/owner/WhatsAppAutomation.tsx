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
  Activity,
  LayoutDashboard,
  Inbox,
  Send,
  Bot,
  Webhook,
  Users,
  Contact,
  Lock,
  Zap,
  Plug
} from 'lucide-react';
import { 
  WADashboard, 
  WAInbox, 
  WAAdvancedSend, 
  WAAutomations, 
  WAWebhooks, 
  WAGroups, 
  WAContacts, 
  WASecurity, 
  WAIntegrations, 
  WAQuickReplies 
} from './whatsapp';

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
  heartbeat_interval_ms?: number;
  last_heartbeat_at?: string | null;
  uptime_seconds?: number;
}

interface ConsoleLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface AutomationTemplate {
  id: string;
  template_type: string;
  name: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

  // Persist settings locally
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
        // Silent fail
      }
    };

    fetchLogs();
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
    } catch (error) {
      console.error('Error saving WA config:', error);
    }
  };

  useEffect(() => {
    if (isLocalConnected || backendConfig?.is_connected) {
      saveWAConfigToSettings();
    }
  }, [isLocalConnected, backendConfig?.is_connected, backendMode]);

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

        await supabase.from('whatsapp_message_logs').insert({
          instance_id: connectedInstance.id,
          direction: 'outgoing',
          phone_to: formattedPhone,
          message: testMessage,
          status: 'sent',
        });

        fetchMessageLogs();
      } else {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }
    } catch (error: any) {
      addConsoleLog('error', `✗ Erro ao enviar: ${error.message || error}`);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setIsSendingTest(false);
    }
  };

  const testLocalConnection = async () => {
    setIsTestingLocal(true);
    addConsoleLog('info', `Testando conexão com ${localEndpoint}:${localPort}...`);
    
    try {
      const response = await fetch(`${localEndpoint}:${localPort}/health`, {
        headers: {
          'Authorization': `Bearer ${localToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLocalConnected(true);
        addConsoleLog('success', `✓ Backend local conectado! (${data.name || 'WhatsApp Local'})`);
        toast.success('Backend local conectado!');
        saveWAConfigToSettings();
      } else {
        setIsLocalConnected(false);
        addConsoleLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão com o backend local');
      }
    } catch (error: any) {
      setIsLocalConnected(false);
      addConsoleLog('error', `✗ Erro: ${error.message || 'Backend não acessível'}`);
      toast.error('Backend não acessível. Verifique se está rodando.');
    } finally {
      setIsTestingLocal(false);
    }
  };

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
      fetchData();
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

    setIsTestingConnection(true);
    addConsoleLog('info', `Testando conexão com ${backendUrl}...`);

    try {
      const response = await fetch(`${backendUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${masterToken}`,
        },
      });

      if (response.ok) {
        await supabase
          .from('whatsapp_backend_config')
          .update({ 
            is_connected: true,
            last_health_check: new Date().toISOString(),
          })
          .eq('id', backendConfig?.id);

        addConsoleLog('success', '✓ Backend VPS conectado!');
        toast.success('Conexão estabelecida!');
        fetchData();
      } else {
        addConsoleLog('error', `✗ Falha na conexão (status ${response.status})`);
        toast.error('Falha na conexão');
      }
    } catch (error: any) {
      addConsoleLog('error', `✗ Erro: ${error.message || 'Backend não acessível'}`);
      toast.error('Backend não acessível');
    } finally {
      setIsTestingConnection(false);
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
      toast.error('Nome é obrigatório');
      return;
    }

    setIsCreatingInstance(true);
    try {
      const instanceToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          name: newInstanceName,
          instance_token: instanceToken,
          status: 'inactive',
          phone_number: newInstancePhone || null,
          auto_reply_enabled: false,
          message_delay_ms: 1000,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Instância criada!');
      
      if (isBackendActive) {
        setInstanceCreationStep('qrcode');
        await generateQRCode(data.id);
      } else {
        setIsNewInstanceOpen(false);
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
    setQrCodeData(null);
    addConsoleLog('info', `Gerando QR Code para instância ${instanceId}...`);

    try {
      const endpoint = backendMode === 'local'
        ? `${localEndpoint}:${localPort}/api/instance/${instanceId}/qrcode`
        : `${backendUrl}/api/instance/${instanceId}/qrcode`;
      
      const token = backendMode === 'local' ? localToken : masterToken;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: newInstancePhone }),
      });

      const result = await response.json();

      if (result.status === 'connected') {
        addConsoleLog('success', '✓ Instância já conectada!');
        toast.success('Instância já está conectada!');
        setIsNewInstanceOpen(false);
        fetchData();
        return;
      }

      if (result.qrcode) {
        setQrCodeData(result.qrcode);
        addConsoleLog('success', '✓ QR Code gerado! Escaneie com o WhatsApp.');
        
        checkConnectionStatus(instanceId);
      } else {
        throw new Error(result.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      addConsoleLog('error', `✗ Erro: ${error.message || error}`);
      toast.error(error.message || 'Erro ao gerar QR Code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const checkConnectionStatus = (instanceId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    const checkInterval = setInterval(async () => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        addConsoleLog('warning', 'Tempo limite atingido. Tente novamente.');
        return;
      }

      try {
        const endpoint = backendMode === 'local'
          ? `${localEndpoint}:${localPort}/api/instance/${instanceId}/status`
          : `${backendUrl}/api/instance/${instanceId}/status`;
        
        const token = backendMode === 'local' ? localToken : masterToken;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.status === 'connected' || result.connected) {
          clearInterval(checkInterval);
          addConsoleLog('success', '✓ WhatsApp conectado com sucesso!');
          toast.success('WhatsApp conectado!');
          setIsNewInstanceOpen(false);
          fetchData();
        }
      } catch (error) {
        // Silent check
      }
    }, 2000);
  };

  const updateInstance = async () => {
    if (!editingInstance) return;

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          name: editName,
          auto_reply_enabled: editAutoReply,
          auto_reply_message: editAutoReplyMessage,
          message_delay_ms: editMessageDelay,
        })
        .eq('id', editingInstance.id);

      if (error) throw error;

      toast.success('Instância atualizada!');
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

const serverLogs = [];
const pushLog = (type, message) => {
  const payload = { timestamp: new Date().toISOString(), type, message };
  serverLogs.push(payload);
  if (serverLogs.length > 500) serverLogs.shift();
  console.log(\`[\${type.toUpperCase()}] \${message}\`);
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

const authMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const auth = req.headers.authorization;
  if (!auth || auth !== \`Bearer \${TOKEN}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
app.use(authMiddleware);

const connections = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'WhatsApp Local Backend', version: '2.0.0' });
});

app.get('/logs', (req, res) => {
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const logs = since ? serverLogs.filter(l => new Date(l.timestamp) > since) : serverLogs.slice(-100);
  res.json({ logs });
});

app.listen(PORT, () => {
  console.log(\`WhatsApp Backend Local rodando na porta \${PORT}\`);
  pushLog('success', 'Backend iniciado com sucesso!');
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

  const isBackendActive = backendMode === 'vps' ? !!backendConfig?.is_connected : isLocalConnected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">WhatsApp Automação Enterprise</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isBackendActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isBackendActive 
              ? `Backend ${backendMode === 'vps' ? 'VPS' : 'PC Local'} conectado` 
              : 'Backend desconectado'
            }
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Main Tabs - Enterprise Layout */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="gap-1 text-xs px-2 py-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden lg:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="instances" className="gap-1 text-xs px-2 py-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden lg:inline">Instâncias</span>
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1 text-xs px-2 py-2">
            <Inbox className="w-4 h-4" />
            <span className="hidden lg:inline">Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1 text-xs px-2 py-2">
            <Send className="w-4 h-4" />
            <span className="hidden lg:inline">Envio</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-1 text-xs px-2 py-2">
            <Bot className="w-4 h-4" />
            <span className="hidden lg:inline">Automações</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1 text-xs px-2 py-2">
            <Webhook className="w-4 h-4" />
            <span className="hidden lg:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1 text-xs px-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1 text-xs px-2 py-2">
            <Contact className="w-4 h-4" />
            <span className="hidden lg:inline">Contatos</span>
          </TabsTrigger>
          <TabsTrigger value="quick-replies" className="gap-1 text-xs px-2 py-2">
            <Zap className="w-4 h-4" />
            <span className="hidden lg:inline">Respostas</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1 text-xs px-2 py-2">
            <Lock className="w-4 h-4" />
            <span className="hidden lg:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1 text-xs px-2 py-2">
            <Plug className="w-4 h-4" />
            <span className="hidden lg:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="backend" className="gap-1 text-xs px-2 py-2">
            <Server className="w-4 h-4" />
            <span className="hidden lg:inline">Backend</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <WADashboard 
            instances={instances.map(i => ({
              id: i.id,
              name: i.name,
              status: i.status,
              last_heartbeat_at: i.last_heartbeat_at,
              uptime_seconds: i.uptime_seconds,
            }))}
            isBackendActive={isBackendActive}
          />
        </TabsContent>

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

          {/* Instances List */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Instâncias ({instances.length})</h3>
            <Button onClick={openNewInstanceDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          </div>

          <div className="grid gap-4">
            {instances.map((instance) => {
              const statusInfo = statusConfig[instance.status] || statusConfig.inactive;
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={instance.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${statusInfo.color} flex items-center justify-center`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{instance.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {instance.phone_number || 'Sem número'}
                        </p>
                      </div>
                      <Badge variant="secondary">{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(instance.instance_token, instance.id)}
                      >
                        {copiedToken === instance.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      {isBackendActive && instance.status !== 'connected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInstanceCreationStep('qrcode');
                            setIsNewInstanceOpen(true);
                            generateQRCode(instance.id);
                          }}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Conectar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(instance)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Instância</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{instance.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteInstance(instance.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {instances.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma instância criada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox">
          <WAInbox instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} />
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send">
          <WAAdvancedSend 
            instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} 
          />
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations">
          <WAAutomations instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <WAWebhooks instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <WAGroups 
            instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} 
          />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <WAContacts 
            instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} 
          />
        </TabsContent>

        {/* Quick Replies Tab */}
        <TabsContent value="quick-replies">
          <WAQuickReplies instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <WASecurity instances={instances.map(i => ({ id: i.id, name: i.name, status: i.status }))} />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <WAIntegrations />
        </TabsContent>

        {/* Backend Tab */}
        <TabsContent value="backend" className="space-y-6">
          {/* Backend Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Modo de Backend</CardTitle>
              <CardDescription>
                Escolha onde o WhatsApp será executado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={backendMode === 'vps' ? 'default' : 'outline'}
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setBackendMode('vps')}
                >
                  <Server className="w-8 h-8" />
                  <span>VPS / Servidor</span>
                </Button>
                <Button
                  variant={backendMode === 'local' ? 'default' : 'outline'}
                  className="h-24 flex flex-col gap-2"
                  onClick={() => setBackendMode('local')}
                >
                  <Monitor className="w-8 h-8" />
                  <span>PC Local</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VPS Config */}
          {backendMode === 'vps' && (
            <Card>
              <CardHeader>
                <CardTitle>Configuração VPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Backend</Label>
                  <Input
                    placeholder="https://seu-server.com"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                  />
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
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={testVPSConnection} disabled={isTestingConnection} variant="outline">
                    {isTestingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Local Config */}
          {backendMode === 'local' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  PC Local
                  {isLocalConnected && (
                    <Badge variant="default" className="bg-green-500">Conectado</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label>Token</Label>
                  <div className="flex gap-2">
                    <Input value={localToken} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(localToken, 'local')}>
                      {copiedToken === 'local' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={testLocalConnection} disabled={isTestingLocal}>
                    {isTestingLocal && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Link2 className="w-4 h-4 mr-2" />
                    Conectar
                  </Button>
                  <Button onClick={downloadScript} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Script
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Console */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Console
              </CardTitle>
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
        </TabsContent>
      </Tabs>

      {/* New Instance Dialog */}
      <Dialog open={isNewInstanceOpen} onOpenChange={setIsNewInstanceOpen}>
        <DialogContent className="max-w-md">
          {instanceCreationStep === 'choose' && (
            <>
              <DialogHeader>
                <DialogTitle>Escolha o Tipo de Backend</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleBackendTypeSelection('vps')}
                >
                  <Server className="w-8 h-8 text-primary" />
                  <span>VPS / Servidor</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleBackendTypeSelection('local')}
                  disabled={!isLocalConnected}
                >
                  <Monitor className="w-8 h-8 text-primary" />
                  <span>PC Local</span>
                  {!isLocalConnected && (
                    <span className="text-xs text-muted-foreground">Conecte o backend primeiro</span>
                  )}
                </Button>
              </div>
            </>
          )}

          {instanceCreationStep === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>Nova Instância</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Instância *</Label>
                  <Input
                    placeholder="Ex: Atendimento Principal"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone (opcional)</Label>
                  <Input
                    placeholder="5511999999999"
                    value={newInstancePhone}
                    onChange={(e) => setNewInstancePhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInstanceCreationStep('choose')}>
                  Voltar
                </Button>
                <Button onClick={createInstance} disabled={isCreatingInstance}>
                  {isCreatingInstance && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar
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
                  <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                ) : qrCodeData ? (
                  <img src={qrCodeData} alt="QR Code" className="w-64 h-64 rounded-lg" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Abra o WhatsApp no celular, vá em Configurações &gt; Dispositivos Conectados &gt; Conectar Dispositivo
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewInstanceOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Instance Dialog */}
      <Dialog open={!!editingInstance} onOpenChange={(open) => !open && setEditingInstance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Instância</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Resposta Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Responder automaticamente mensagens recebidas
                </p>
              </div>
              <Switch checked={editAutoReply} onCheckedChange={setEditAutoReply} />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInstance(null)}>
              Cancelar
            </Button>
            <Button onClick={updateInstance}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>{editingTemplate?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mensagem do Template</Label>
              <Textarea
                value={templateMessage}
                onChange={(e) => setTemplateMessage(e.target.value)}
                placeholder="Digite a mensagem..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAutomation;
