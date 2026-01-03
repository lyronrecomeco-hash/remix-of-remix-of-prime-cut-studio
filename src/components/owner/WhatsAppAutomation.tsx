import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWhatsAppStatus } from './whatsapp/hooks/useWhatsAppStatus';
import { 
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Smartphone,
  Send,
  Bot,
  FileText,
  Settings,
  MessageSquare,
  Wifi,
  WifiOff,
  TestTube,
  Zap,
  Shield,
  Webhook,
  Users,
  Contact,
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
  WAQuickReplies,
  WATestMessage,
  WAInstances,
  WABackendConfig,
  WATemplates,
  WAInteractiveTemplates,
  WAButtonActions,
  WAConversationStates,
  WATestSimulator,
  WAExampleFlow
} from './whatsapp';

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
  last_heartbeat_at?: string | null;
  uptime_seconds?: number;
  // Stability fields
  backend_url?: string | null;
  backend_token?: string | null;
  is_active?: boolean | null;
  last_heartbeat?: string | null;
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

// Navigation sections
const NAV_SECTIONS = [
  {
    title: 'Monitoramento',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { id: 'instances', label: 'Instâncias', icon: Smartphone },
      { id: 'send', label: 'Envio Avançado', icon: Send },
      { id: 'test', label: 'Testar Envio', icon: TestTube },
    ]
  },
  {
    title: 'Automação',
    items: [
      { id: 'automations', label: 'Chatbots', icon: Bot },
      { id: 'interactive-templates', label: 'Templates Interativos', icon: FileText },
      { id: 'button-actions', label: 'Motor de Botões', icon: Zap },
      { id: 'conversation-states', label: 'Estados de Conversa', icon: Users },
      { id: 'test-simulator', label: 'Modo Teste', icon: TestTube },
      { id: 'example-flow', label: 'Fluxo de Exemplo', icon: Zap },
      { id: 'templates', label: 'Templates Simples', icon: FileText },
      { id: 'quick-replies', label: 'Respostas Rápidas', icon: Zap },
    ]
  },
  {
    title: 'Recursos',
    items: [
      { id: 'groups', label: 'Grupos', icon: Users },
      { id: 'contacts', label: 'Contatos', icon: Contact },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { id: 'security', label: 'Segurança', icon: Shield },
      { id: 'integrations', label: 'Integrações', icon: Plug },
      { id: 'backend', label: 'Configurações', icon: Settings },
    ]
  },
];

const WhatsAppAutomation = () => {
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Heartbeat-based status source of truth
  const { instances: hbInstances } = useWhatsAppStatus(30000);
  
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

      let nextInstances = (instancesData || []) as WhatsAppInstance[];

      // Auto-provisiona uma instância padrão para o usuário não precisar "criar instância" manualmente
      if (nextInstances.length === 0) {
        const { data: created, error: createError } = await supabase
          .from('whatsapp_instances')
          .insert({
            name: 'Principal',
            instance_token: crypto.randomUUID(),
            status: 'inactive',
            phone_number: null,
            auto_reply_enabled: false,
            message_delay_ms: 1000,
          })
          .select('*')
          .single();

        if (!createError && created) {
          nextInstances = [created as WhatsAppInstance];
        }
      }

      setInstances(nextInstances);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Merge heartbeat effective_status into full instances payload
  const mergedInstances: WhatsAppInstance[] = instances.map((inst) => {
    const hb = hbInstances.find((h) => h.id === inst.id);
    if (!hb) return inst;

    return {
      ...inst,
      status: (hb.effective_status as WhatsAppInstance['status']) || inst.status,
      phone_number: hb.phone_number ?? inst.phone_number,
      last_seen: hb.last_seen ?? inst.last_seen,
      last_heartbeat_at: hb.last_heartbeat_at ?? inst.last_heartbeat_at,
      uptime_seconds: hb.uptime_seconds ?? inst.uptime_seconds,
    };
  });

  // Ensure local backend token is stored on instances so heartbeats keep working even if user logs out
  useEffect(() => {
    if (backendMode !== 'local') return;
    if (!localToken) return;
    if (instances.length === 0) return;

    const desiredBackendUrl = `${localEndpoint}:${localPort}`;
    const needsSync = instances.some((i) => i.backend_token !== localToken || i.backend_url !== desiredBackendUrl);
    if (!needsSync) return;

    supabase
      .from('whatsapp_instances')
      .update({ backend_token: localToken, backend_url: desiredBackendUrl, is_active: true })
      .in('id', instances.map((i) => i.id))
      .then(({ error }) => {
        if (error) console.error('[WhatsApp] Failed syncing local backend token:', error);
      });
  }, [backendMode, localToken, localEndpoint, localPort, instances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBackendActive = backendMode === 'vps' ? !!backendConfig?.is_connected : isLocalConnected;
  const connectedInstances = mergedInstances.filter(i => i.status === 'connected').length;

  const renderContent = () => {
    const instancesProps = mergedInstances.map(i => ({ id: i.id, name: i.name, status: i.status }));
    
    switch (activeSection) {
      case 'dashboard':
        return <WADashboard instances={mergedInstances.map(i => ({ id: i.id, name: i.name, status: i.status, last_heartbeat_at: i.last_heartbeat_at, uptime_seconds: i.uptime_seconds }))} isBackendActive={isBackendActive} />;
      case 'inbox':
        return <WAInbox instances={instancesProps} />;
      case 'instances':
        return <WAInstances instances={mergedInstances} isBackendActive={isBackendActive} backendMode={backendMode} backendUrl={backendUrl} localEndpoint={localEndpoint} localPort={localPort} localToken={localToken} masterToken={masterToken} isLocalConnected={isLocalConnected} onRefresh={fetchData} />;
      case 'send':
        return <WAAdvancedSend instances={instancesProps} />;
      case 'test':
        return <WATestMessage instances={instancesProps} backendMode={backendMode} backendUrl={backendUrl} localEndpoint={localEndpoint} localPort={localPort} localToken={localToken} masterToken={masterToken} isBackendActive={isBackendActive} />;
      case 'automations':
        return <WAAutomations instances={instancesProps} />;
      case 'interactive-templates':
        return <WAInteractiveTemplates />;
      case 'button-actions':
        return <WAButtonActions />;
      case 'conversation-states':
        return <WAConversationStates />;
      case 'test-simulator':
        return <WATestSimulator />;
      case 'example-flow':
        return <WAExampleFlow />;
      case 'templates':
        return <WATemplates />;
      case 'quick-replies':
        return <WAQuickReplies instances={instancesProps} />;
      case 'groups':
        return <WAGroups instances={instancesProps} />;
      case 'contacts':
        return <WAContacts instances={instancesProps} />;
      case 'webhooks':
        return <WAWebhooks instances={instancesProps} />;
      case 'security':
        return <WASecurity instances={instancesProps} />;
      case 'integrations':
        return <WAIntegrations />;
      case 'backend':
        return <WABackendConfig backendMode={backendMode} setBackendMode={setBackendMode} backendUrl={backendUrl} setBackendUrl={setBackendUrl} masterToken={masterToken} setMasterToken={setMasterToken} localEndpoint={localEndpoint} setLocalEndpoint={setLocalEndpoint} localPort={localPort} setLocalPort={setLocalPort} localToken={localToken} isLocalConnected={isLocalConnected} setIsLocalConnected={setIsLocalConnected} backendConfig={backendConfig} onRefresh={fetchData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="bg-card rounded-xl border h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">WhatsApp Automação</h2>
            <div className="flex items-center gap-2 mt-2">
              {isBackendActive ? (
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
              <Badge variant="outline">{connectedInstances}/{instances.length}</Badge>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {NAV_SECTIONS.flatMap(s => s.items).slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default WhatsAppAutomation;
