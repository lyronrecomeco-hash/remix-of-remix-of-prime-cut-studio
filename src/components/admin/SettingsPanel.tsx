import { useState, useEffect } from 'react';
import { 
  Palette, 
  AlertTriangle, 
  Instagram, 
  Facebook, 
  Store,
  Shield,
  Webhook,
  Bell,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  Save,
  RotateCcw,
  Check,
  Clock,
  MessageCircle,
  Settings,
  TestTube,
  HelpCircle,
  ExternalLink,
  Power,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import OverloadAlertModal from './OverloadAlertModal';

interface MessageTemplate {
  id: string;
  event_type: string;
  title: string;
  template: string;
  is_active: boolean;
  chatpro_enabled?: boolean;
}

interface ChatProConfig {
  id: string;
  api_token: string | null;
  instance_id: string | null;
  base_endpoint: string;
  is_enabled: boolean;
}

const defaultTemplates: Record<string, string> = {
  appointment_created: 'Olá, {{nome_cliente}}! Seu agendamento na {{nome_barbearia}} foi realizado com sucesso para {{data}} às {{hora}} para o serviço de {{serviço}}.',
  appointment_confirmed: 'Agendamento confirmado na {{nome_barbearia}} 🎉\nEstaremos te esperando no dia {{data}} às {{hora}}.',
  client_called: 'Chegou sua vez na {{nome_barbearia}} 💈\nDirija-se ao salão agora.',
  queue_update: 'Atualização da sua fila na {{nome_barbearia}}:\nSua posição atual é: {{posição_fila}}.',
  appointment_reminder: 'Lembrete: você possui um horário hoje na {{nome_barbearia}} às {{hora}}.',
  appointment_completed: 'Obrigado por visitar a {{nome_barbearia}}!\nEsperamos que tenha gostado do serviço. Volte sempre!',
};

const eventLabels: Record<string, string> = {
  appointment_created: 'Agendamento Realizado',
  appointment_confirmed: 'Agendamento Confirmado',
  client_called: 'Cliente Chamado',
  queue_update: 'Atualização da Fila',
  appointment_reminder: 'Lembrete de Horário',
  appointment_completed: 'Atendimento Concluído',
};

const variables = [
  { key: '{{nome_cliente}}', label: 'Nome do Cliente' },
  { key: '{{nome_barbearia}}', label: 'Nome da Barbearia' },
  { key: '{{serviço}}', label: 'Serviço' },
  { key: '{{data}}', label: 'Data' },
  { key: '{{hora}}', label: 'Hora' },
  { key: '{{posição_fila}}', label: 'Posição na Fila' },
];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <h3 className="font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel() {
  const { notify } = useNotification();
  const { shopSettings, updateShopSettings, theme, setTheme } = useApp();
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  
  // ChatPro state
  const [chatproConfig, setChatproConfig] = useState<ChatProConfig | null>(null);
  const [chatproLoading, setChatproLoading] = useState(false);
  const [testingChatPro, setTestingChatPro] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchChatProConfig();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('message_templates').select('*');
    if (data) setTemplates(data as MessageTemplate[]);
  };

  const fetchChatProConfig = async () => {
    const { data } = await supabase.from('chatpro_config').select('*').limit(1).single();
    if (data) setChatproConfig(data as ChatProConfig);
  };

  const updateChatProConfig = async (updates: Partial<ChatProConfig>) => {
    if (!chatproConfig) return;
    
    setChatproLoading(true);
    const { error } = await supabase
      .from('chatpro_config')
      .update(updates)
      .eq('id', chatproConfig.id);
    
    if (error) {
      notify.error('Erro ao salvar configuração');
    } else {
      setChatproConfig({ ...chatproConfig, ...updates });
      notify.success('Configuração salva');
    }
    setChatproLoading(false);
  };

  const testChatProConnection = async () => {
    if (!testPhone.trim()) {
      notify.error('Digite um número para teste');
      return;
    }

    setTestingChatPro(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-chatpro', {
        body: {
          phone: testPhone,
          message: `Teste de integração ChatPro - ${shopSettings.name || 'Barbearia'}`,
        },
      });

      if (error) {
        notify.error('Erro ao testar: ' + error.message);
      } else if (data?.success) {
        notify.success('Mensagem de teste enviada!');
      } else {
        notify.error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      notify.error('Erro ao conectar');
    }
    setTestingChatPro(false);
  };

  const toggleChatProForEvent = async (eventType: string, enabled: boolean) => {
    const { error } = await supabase
      .from('message_templates')
      .update({ chatpro_enabled: enabled })
      .eq('event_type', eventType);
    
    if (error) {
      notify.error('Erro ao atualizar');
    } else {
      setTemplates(prev => prev.map(t => 
        t.event_type === eventType ? { ...t, chatpro_enabled: enabled } : t
      ));
      notify.success(enabled ? 'ChatPro ativado para este evento' : 'ChatPro desativado para este evento');
    }
  };

  const updateTemplate = async (eventType: string, template: string) => {
    const { error } = await supabase
      .from('message_templates')
      .update({ template })
      .eq('event_type', eventType);

    if (error) {
      notify.error('Erro ao salvar template');
    } else {
      notify.success('Template salvo');
      fetchTemplates();
    }
  };

  const restoreDefaultTemplate = async (eventType: string) => {
    const defaultTemplate = defaultTemplates[eventType];
    if (!defaultTemplate) return;

    const { error } = await supabase
      .from('message_templates')
      .update({ template: defaultTemplate })
      .eq('event_type', eventType);

    if (error) {
      notify.error('Erro ao restaurar template');
    } else {
      notify.success('Template restaurado');
      fetchTemplates();
    }
  };

  const getPreviewMessage = (template: string) => {
    let preview = template;
    preview = preview.replace(/\{\{nome_cliente\}\}/g, 'João Silva');
    preview = preview.replace(/\{\{nome_barbearia\}\}/g, shopSettings.name || 'Barbearia');
    preview = preview.replace(/\{\{serviço\}\}/g, 'Corte + Barba');
    preview = preview.replace(/\{\{data\}\}/g, '28/12/2025');
    preview = preview.replace(/\{\{hora\}\}/g, '14:30');
    preview = preview.replace(/\{\{posição_fila\}\}/g, '2');
    return preview;
  };

  const getTemplateForEvent = (eventType: string) => {
    return templates.find(t => t.event_type === eventType);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    notify.success(message);
  };

  const apiBaseUrl = `https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/appointments-api`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>
      
      <div className="space-y-4">
        {/* Tema Visual */}
        <CollapsibleSection 
          title="Tema Visual" 
          icon={<Palette className="w-5 h-5 text-primary" />}
          defaultOpen
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {[
              { id: 'gold', label: 'Black & Gold', colors: ['bg-black', 'bg-amber-500'], isNative: true },
              { id: 'gold-shine', label: 'Gold Brilhante', colors: ['bg-black', 'bg-yellow-400'] },
              { id: 'gold-metallic', label: 'Gold Metálico', colors: ['bg-black', 'bg-amber-300'] },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  theme === t.id ? 'border-primary gold-glow' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {t.colors.map((c, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full ${c}`} />
                  ))}
                </div>
                <p className="text-sm font-medium">{t.label}</p>
                {t.isNative && (
                  <span className="text-[10px] text-primary">Nativo</span>
                )}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Segurança */}
        <CollapsibleSection 
          title="Segurança" 
          icon={<Shield className="w-5 h-5 text-primary" />}
        >
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Alerta de Sobrecarga</span>
                <p className="text-xs text-muted-foreground">Notifica clientes quando há muitos agendamentos</p>
              </div>
              <button
                onClick={() => {
                  if (!shopSettings.overloadAlertEnabled) {
                    setShowOverloadModal(true);
                  } else {
                    updateShopSettings({ overloadAlertEnabled: false });
                    notify.info('Alertas desativados');
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  shopSettings.overloadAlertEnabled ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  shopSettings.overloadAlertEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
            {shopSettings.overloadAlertEnabled && (
              <div className="pt-3 border-t border-border">
                <label className="text-sm text-muted-foreground block mb-1">Limite diário</label>
                <Input
                  type="number"
                  value={shopSettings.dailyAppointmentLimit || 20}
                  onChange={(e) => updateShopSettings({ dailyAppointmentLimit: Number(e.target.value) })}
                  min={1}
                  max={100}
                />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Personalização da Barbearia */}
        <CollapsibleSection 
          title="Personalização da Barbearia" 
          icon={<Store className="w-5 h-5 text-primary" />}
        >
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Nome</label>
              <Input value={shopSettings.name} onChange={(e) => updateShopSettings({ name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Tagline</label>
              <Input value={shopSettings.tagline} onChange={(e) => updateShopSettings({ tagline: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Telefone</label>
              <Input value={shopSettings.phone} onChange={(e) => updateShopSettings({ phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">WhatsApp</label>
              <Input value={shopSettings.whatsapp} onChange={(e) => updateShopSettings({ whatsapp: e.target.value })} placeholder="5511999999999" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Endereço</label>
              <Input value={shopSettings.address} onChange={(e) => updateShopSettings({ address: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Link do Google Maps</label>
              <Input value={shopSettings.mapsLink} onChange={(e) => updateShopSettings({ mapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
            </div>
          </div>
        </CollapsibleSection>

        {/* Redes Sociais */}
        <CollapsibleSection 
          title="Redes Sociais" 
          icon={<Instagram className="w-5 h-5 text-primary" />}
        >
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Instagram
              </label>
              <Input
                placeholder="@seuperfil"
                value={shopSettings.social?.instagram || ''}
                onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, instagram: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </label>
              <Input
                placeholder="nome.da.pagina"
                value={shopSettings.social?.facebook || ''}
                onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, facebook: e.target.value } })}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Integração ChatPro */}
        <CollapsibleSection 
          title="Integração ChatPro (WhatsApp)" 
          icon={<MessageCircle className="w-5 h-5 text-green-500" />}
        >
          <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Status e Toggle */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${chatproConfig?.is_enabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <div>
                  <span className="font-medium">Status da Integração</span>
                  <p className="text-xs text-muted-foreground">
                    {chatproConfig?.is_enabled ? 'Ativado - Mensagens serão enviadas automaticamente' : 'Desativado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateChatProConfig({ is_enabled: !chatproConfig?.is_enabled })}
                disabled={chatproLoading || !chatproConfig?.api_token || !chatproConfig?.instance_id}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  chatproConfig?.is_enabled ? 'bg-green-500' : 'bg-secondary'
                } ${(!chatproConfig?.api_token || !chatproConfig?.instance_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  chatproConfig?.is_enabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Credenciais */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Configuração da API
              </h4>
              
              <div className="bg-secondary/20 rounded-lg p-3 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">Para obter suas credenciais:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acesse <a href="https://painel.chatpro.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">painel.chatpro.com.br</a></li>
                    <li>Vá em "Instâncias" e selecione sua instância</li>
                    <li>Copie o "Token" e o "ID da Instância"</li>
                  </ol>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
                  Token de Autenticação
                  <span className="text-xs text-muted-foreground">(Authorization)</span>
                </label>
                <Input
                  type="password"
                  placeholder="Cole o token obtido no painel ChatPro"
                  value={chatproConfig?.api_token || ''}
                  onChange={(e) => setChatproConfig(prev => prev ? { ...prev, api_token: e.target.value } : prev)}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
                  ID da Instância
                  <span className="text-xs text-muted-foreground">(Instance Token)</span>
                </label>
                <Input
                  placeholder="Ex: 123456-abcd-efgh"
                  value={chatproConfig?.instance_id || ''}
                  onChange={(e) => setChatproConfig(prev => prev ? { ...prev, instance_id: e.target.value } : prev)}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
                  Endpoint Base
                  <span className="text-xs text-muted-foreground">(normalmente não precisa alterar)</span>
                </label>
                <Input
                  placeholder="https://v2.chatpro.com.br"
                  value={chatproConfig?.base_endpoint || 'https://v2.chatpro.com.br'}
                  onChange={(e) => setChatproConfig(prev => prev ? { ...prev, base_endpoint: e.target.value } : prev)}
                />
              </div>

              <Button
                onClick={() => updateChatProConfig({
                  api_token: chatproConfig?.api_token,
                  instance_id: chatproConfig?.instance_id,
                  base_endpoint: chatproConfig?.base_endpoint,
                })}
                disabled={chatproLoading}
              >
                {chatproLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configuração
              </Button>
            </div>

            {/* Teste de Conexão */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-primary" />
                Testar Conexão
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Envie uma mensagem de teste para verificar se a integração está funcionando
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Número para teste (ex: 5511999999999)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
                <Button
                  onClick={testChatProConnection}
                  disabled={testingChatPro || !chatproConfig?.is_enabled}
                  variant="outline"
                >
                  {testingChatPro ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                </Button>
              </div>
              {!chatproConfig?.is_enabled && (
                <p className="text-xs text-yellow-500 mt-2">
                  Ative a integração acima para testar
                </p>
              )}
            </div>

            {/* Eventos Habilitados */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Power className="w-4 h-4 text-primary" />
                Eventos com Envio Automático
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione quais eventos devem enviar mensagem automaticamente via ChatPro
              </p>
              <div className="space-y-2">
                {Object.entries(eventLabels).map(([eventType, label]) => {
                  const template = getTemplateForEvent(eventType);
                  const isEnabled = template?.chatpro_enabled !== false;

                  return (
                    <div key={eventType} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{label}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {template?.template?.substring(0, 50)}...
                        </p>
                      </div>
                      <button
                        onClick={() => toggleChatProForEvent(eventType, !isEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          isEnabled ? 'bg-green-500' : 'bg-secondary'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          isEnabled ? 'left-5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Link para Documentação */}
            <div className="pt-4 border-t border-border">
              <a 
                href="https://chatpro.readme.io/reference/introdu%C3%A7%C3%A3o-%C3%A0s-apis-do-chatpro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Ver documentação completa da API ChatPro
              </a>
            </div>
          </div>
        </CollapsibleSection>

        {/* Integrações e API */}
        <CollapsibleSection 
          title="Integrações e API" 
          icon={<Webhook className="w-5 h-5 text-primary" />}
        >
          <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* API Endpoints */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-primary" />
                Endpoints da API para n8n
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Use estas URLs no n8n para receber dados automaticamente
              </p>
              <div className="space-y-3">
                {Object.entries(eventLabels).map(([eventType, label]) => (
                  <div key={eventType} className="flex items-center gap-2">
                    <Input
                      value={`${apiBaseUrl}?event=${eventType}`}
                      readOnly
                      className="font-mono text-xs flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(`${apiBaseUrl}?event=${eventType}`, `URL ${label} copiada!`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Parâmetros opcionais: <code className="bg-secondary px-1 rounded">?date=2025-12-28</code>
              </p>
            </div>

            {/* Lembrete Automático */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Lembrete Automático
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                O endpoint de lembrete retorna agendamentos dos próximos 30 minutos
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={`${apiBaseUrl}?event=appointment_reminder`}
                  readOnly
                  className="font-mono text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`${apiBaseUrl}?event=appointment_reminder`, 'URL de lembrete copiada!')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Configure no n8n para chamar esta URL a cada minuto
              </p>
            </div>

            {/* Templates de Mensagens */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Templates de Mensagens
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Personalize as mensagens enviadas pela API
              </p>
              <div className="space-y-2">
                {Object.entries(eventLabels).map(([eventType, label]) => {
                  const template = getTemplateForEvent(eventType);
                  const isExpanded = expandedTemplate === eventType;
                  const isPreview = previewTemplate === eventType;

                  return (
                    <div key={eventType} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedTemplate(isExpanded ? null : eventType)}
                        className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
                      >
                        <span className="text-sm font-medium">{label}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="p-3 pt-0 space-y-3 border-t border-border">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewTemplate(isPreview ? null : eventType)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {isPreview ? 'Editar' : 'Preview'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => restoreDefaultTemplate(eventType)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restaurar
                            </Button>
                          </div>

                          {isPreview ? (
                            <div className="bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {getPreviewMessage(template?.template || '')}
                            </div>
                          ) : (
                            <Textarea
                              value={template?.template || ''}
                              onChange={(e) => {
                                setTemplates(prev => prev.map(t =>
                                  t.event_type === eventType ? { ...t, template: e.target.value } : t
                                ));
                              }}
                              rows={3}
                              className="font-mono text-sm"
                            />
                          )}

                          <div className="flex flex-wrap gap-1">
                            {variables.map((v) => (
                              <button
                                key={v.key}
                                onClick={() => copyToClipboard(v.key, `${v.key} copiado!`)}
                                className="px-2 py-1 bg-secondary rounded text-xs font-mono hover:bg-primary/20"
                              >
                                {v.key}
                              </button>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTemplate(eventType, template?.template || '')}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notificações Push */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notificações Push
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Notificações automáticas enviadas em segundo plano:
              </p>
              <ul className="text-sm space-y-1">
                {[
                  'Novo agendamento criado',
                  'Agendamento confirmado',
                  'Cliente chamado',
                  'Atendimento concluído',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <OverloadAlertModal
        isOpen={showOverloadModal}
        onClose={() => setShowOverloadModal(false)}
        type="explanation"
        onConfirm={() => {
          updateShopSettings({ overloadAlertEnabled: true });
          notify.success('Alertas ativados!');
        }}
      />
    </div>
  );
}