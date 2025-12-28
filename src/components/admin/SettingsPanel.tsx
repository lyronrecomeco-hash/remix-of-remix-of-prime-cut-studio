import React, { useState, useEffect, forwardRef, useRef } from 'react';
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
  Download,
  Upload,
  FileText,
  Database,
  FileCheck,
  AlertCircle,
  Type,
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
  button_text?: string | null;
  button_url?: string | null;
  image_url?: string | null;
}

interface ChatProConfig {
  id: string;
  api_token: string | null;
  instance_id: string | null;
  base_endpoint: string;
  is_enabled: boolean;
}

interface SiteSectionTexts {
  hero_title: string;
  hero_subtitle: string;
  about_title: string;
  about_description: string;
  services_title: string;
  services_subtitle: string;
  gallery_title: string;
  gallery_subtitle: string;
  location_title: string;
  cta_title: string;
  cta_subtitle: string;
  footer_text: string;
}

interface BackupData {
  version: string;
  timestamp: string;
  shop_settings: any;
  services: any[];
  barbers: any[];
  message_templates: any[];
  chatpro_config: any;
  site_texts?: SiteSectionTexts;
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
  { key: '{{protocolo}}', label: 'Protocolo' },
];

const defaultSiteTexts: SiteSectionTexts = {
  hero_title: 'Sua Barbearia',
  hero_subtitle: 'Tradição e estilo em cada corte',
  about_title: 'Sobre Nós',
  about_description: 'Uma barbearia tradicional com foco em qualidade e atendimento personalizado.',
  services_title: 'Nossos Serviços',
  services_subtitle: 'Conheça nossos serviços especializados',
  gallery_title: 'Galeria',
  gallery_subtitle: 'Veja nossos trabalhos',
  location_title: 'Localização',
  cta_title: 'Agende Agora',
  cta_subtitle: 'Reserve seu horário e venha nos visitar',
  footer_text: 'Todos os direitos reservados',
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = forwardRef<HTMLDivElement, SectionProps>(
  ({ title, icon, children, defaultOpen = false }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div ref={ref} className="glass-card rounded-xl overflow-hidden h-fit">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          {icon}
          {title}
        </h3>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

export default function SettingsPanel() {
  const { notify } = useNotification();
  const { shopSettings, updateShopSettings, theme, setTheme, services, barbers } = useApp();
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
  
  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  
  // Site texts state
  const [siteTexts, setSiteTexts] = useState<SiteSectionTexts>(defaultSiteTexts);
  const [savingSiteTexts, setSavingSiteTexts] = useState(false);

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

  const updateTemplate = async (eventType: string, template: string, buttonText?: string | null, buttonUrl?: string | null, imageUrl?: string | null) => {
    const { error } = await supabase
      .from('message_templates')
      .update({ 
        template,
        button_text: buttonText || null,
        button_url: buttonUrl || null,
        image_url: imageUrl || null,
      })
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

  // ===== BACKUP FUNCTIONS =====
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const [templatesRes, chatproRes] = await Promise.all([
        supabase.from('message_templates').select('*'),
        supabase.from('chatpro_config').select('*').limit(1).maybeSingle(),
      ]);

      const backupData: BackupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        shop_settings: shopSettings,
        services: services,
        barbers: barbers,
        message_templates: templatesRes.data || [],
        chatpro_config: chatproRes.data,
        site_texts: siteTexts,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const encodedBackup = btoa(unescape(encodeURIComponent(jsonStr)));
      const checksum = await generateChecksum(jsonStr);
      
      const finalBackup = {
        data: encodedBackup,
        checksum,
        created_at: new Date().toISOString(),
        app_version: '2.0',
      };

      const blob = new Blob([JSON.stringify(finalBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-barbearia-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      notify.error('Erro ao exportar backup');
    }
    setIsExporting(false);
  };

  const generateChecksum = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyChecksum = async (data: string, checksum: string): Promise<boolean> => {
    const calculatedChecksum = await generateChecksum(data);
    return calculatedChecksum === checksum;
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const fileContent = await file.text();
      const backupFile = JSON.parse(fileContent);

      if (!backupFile.data || !backupFile.checksum) {
        throw new Error('Arquivo de backup inválido - estrutura incorreta');
      }

      const decodedData = decodeURIComponent(escape(atob(backupFile.data)));
      const isValid = await verifyChecksum(decodedData, backupFile.checksum);
      if (!isValid) {
        throw new Error('Arquivo de backup corrompido - checksum inválido');
      }

      const backupData: BackupData = JSON.parse(decodedData);

      if (!backupData.version || !backupData.timestamp) {
        throw new Error('Arquivo de backup inválido - versão não encontrada');
      }

      if (backupData.shop_settings) {
        await updateShopSettings(backupData.shop_settings);
      }

      if (backupData.message_templates && backupData.message_templates.length > 0) {
        for (const template of backupData.message_templates) {
          await supabase
            .from('message_templates')
            .upsert({
              event_type: template.event_type,
              title: template.title,
              template: template.template,
              is_active: template.is_active,
              chatpro_enabled: template.chatpro_enabled,
              button_text: template.button_text,
              button_url: template.button_url,
              image_url: template.image_url,
            }, { onConflict: 'event_type' });
        }
      }

      if (backupData.chatpro_config) {
        await supabase
          .from('chatpro_config')
          .update({
            api_token: backupData.chatpro_config.api_token,
            instance_id: backupData.chatpro_config.instance_id,
            base_endpoint: backupData.chatpro_config.base_endpoint,
            is_enabled: backupData.chatpro_config.is_enabled,
          })
          .eq('id', backupData.chatpro_config.id);
      }

      if (backupData.site_texts) {
        setSiteTexts(backupData.site_texts);
        localStorage.setItem('site_texts', JSON.stringify(backupData.site_texts));
      }

      await fetchTemplates();
      await fetchChatProConfig();

      notify.success('Backup restaurado com sucesso!', `Versão: ${backupData.version} | Data: ${new Date(backupData.timestamp).toLocaleDateString('pt-BR')}`);
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message || 'Erro ao importar backup');
      notify.error('Erro ao importar: ' + (error.message || 'Arquivo inválido'));
    }

    setIsImporting(false);
    if (backupFileInputRef.current) {
      backupFileInputRef.current.value = '';
    }
  };

  const saveSiteTexts = () => {
    setSavingSiteTexts(true);
    try {
      localStorage.setItem('site_texts', JSON.stringify(siteTexts));
      notify.success('Textos do site salvos!');
    } catch (error) {
      notify.error('Erro ao salvar textos');
    }
    setSavingSiteTexts(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem('site_texts');
    if (stored) {
      try {
        setSiteTexts(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading site texts:', e);
      }
    }
  }, []);

  const apiBaseUrl = `https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/appointments-api`;

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>
      
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6">
        {/* Grid layout - seções lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tema Visual */}
          <CollapsibleSection 
            title="Tema Visual" 
            icon={<Palette className="w-4 h-4 text-primary" />}
            defaultOpen
          >
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { id: 'gold', label: 'Black & Gold', colors: ['bg-black', 'bg-amber-500'], isNative: true },
                { id: 'gold-shine', label: 'Gold Brilhante', colors: ['bg-black', 'bg-yellow-400'] },
                { id: 'gold-metallic', label: 'Gold Metálico', colors: ['bg-black', 'bg-amber-300'] },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === t.id ? 'border-primary gold-glow' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex gap-1 mb-1">
                    {t.colors.map((c, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full ${c}`} />
                    ))}
                  </div>
                  <p className="text-xs font-medium">{t.label}</p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Segurança */}
          <CollapsibleSection 
            title="Segurança" 
            icon={<Shield className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium">Alerta de Sobrecarga</span>
                  <p className="text-[10px] text-muted-foreground">Notifica em sobrecarga</p>
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
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    shopSettings.overloadAlertEnabled ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    shopSettings.overloadAlertEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              {shopSettings.overloadAlertEnabled && (
                <div className="pt-2 border-t border-border">
                  <label className="text-xs text-muted-foreground block mb-1">Limite diário</label>
                  <Input
                    type="number"
                    value={shopSettings.dailyAppointmentLimit || 20}
                    onChange={(e) => updateShopSettings({ dailyAppointmentLimit: Number(e.target.value) })}
                    min={1}
                    max={100}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Personalização da Barbearia */}
          <CollapsibleSection 
            title="Barbearia" 
            icon={<Store className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nome</label>
                <Input value={shopSettings.name} onChange={(e) => updateShopSettings({ name: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tagline</label>
                <Input value={shopSettings.tagline} onChange={(e) => updateShopSettings({ tagline: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                  <Input value={shopSettings.phone} onChange={(e) => updateShopSettings({ phone: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">WhatsApp</label>
                  <Input value={shopSettings.whatsapp} onChange={(e) => updateShopSettings({ whatsapp: e.target.value })} placeholder="55..." className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Endereço</label>
                <Input value={shopSettings.address} onChange={(e) => updateShopSettings({ address: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Link do Maps</label>
                <Input value={shopSettings.mapsLink} onChange={(e) => updateShopSettings({ mapsLink: e.target.value })} placeholder="https://maps..." className="h-8 text-sm" />
              </div>
            </div>
          </CollapsibleSection>

          {/* Redes Sociais */}
          <CollapsibleSection 
            title="Redes Sociais" 
            icon={<Instagram className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Instagram
                </label>
                <Input
                  placeholder="@seuperfil"
                  value={shopSettings.social?.instagram || ''}
                  onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, instagram: e.target.value } })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> Facebook
                </label>
                <Input
                  placeholder="nome.da.pagina"
                  value={shopSettings.social?.facebook || ''}
                  onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, facebook: e.target.value } })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Backup e Restauração */}
          <CollapsibleSection
            title="Backup e Restauração" 
            icon={<Database className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-4">
              <div className="bg-secondary/20 rounded-lg p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium mb-0.5">Backup Seguro (SHA-256)</p>
                  <p className="text-muted-foreground text-[10px]">
                    Inclui: configurações, templates, ChatPro e textos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  size="sm"
                  className="w-full"
                >
                  {isExporting ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 mr-1" />
                  )}
                  Exportar
                </Button>
                
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                
                <Button 
                  variant="outline"
                  onClick={() => backupFileInputRef.current?.click()}
                  disabled={isImporting}
                  size="sm"
                  className="w-full"
                >
                  {isImporting ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3 mr-1" />
                  )}
                  Importar
                </Button>
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{importError}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Textos do Site */}
          <CollapsibleSection 
            title="Textos do Site" 
            icon={<Type className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-3">
              <p className="text-[10px] text-muted-foreground">
                Personalize textos das seções do site.
              </p>
              
              <div className="space-y-2">
                <div className="p-2 bg-secondary/20 rounded-lg space-y-2">
                  <h5 className="text-xs font-medium">Hero</h5>
                  <Input 
                    value={siteTexts.hero_title} 
                    onChange={(e) => setSiteTexts(prev => ({ ...prev, hero_title: e.target.value }))}
                    placeholder="Título"
                    className="h-7 text-xs"
                  />
                  <Input 
                    value={siteTexts.hero_subtitle} 
                    onChange={(e) => setSiteTexts(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                    placeholder="Subtítulo"
                    className="h-7 text-xs"
                  />
                </div>

                <div className="p-2 bg-secondary/20 rounded-lg space-y-2">
                  <h5 className="text-xs font-medium">Sobre</h5>
                  <Input 
                    value={siteTexts.about_title} 
                    onChange={(e) => setSiteTexts(prev => ({ ...prev, about_title: e.target.value }))}
                    placeholder="Título"
                    className="h-7 text-xs"
                  />
                  <Textarea 
                    value={siteTexts.about_description} 
                    onChange={(e) => setSiteTexts(prev => ({ ...prev, about_description: e.target.value }))}
                    placeholder="Descrição"
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-secondary/20 rounded-lg space-y-1">
                    <h5 className="text-xs font-medium">Serviços</h5>
                    <Input 
                      value={siteTexts.services_title} 
                      onChange={(e) => setSiteTexts(prev => ({ ...prev, services_title: e.target.value }))}
                      placeholder="Título"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="p-2 bg-secondary/20 rounded-lg space-y-1">
                    <h5 className="text-xs font-medium">Galeria</h5>
                    <Input 
                      value={siteTexts.gallery_title} 
                      onChange={(e) => setSiteTexts(prev => ({ ...prev, gallery_title: e.target.value }))}
                      placeholder="Título"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-secondary/20 rounded-lg space-y-1">
                    <h5 className="text-xs font-medium">CTA</h5>
                    <Input 
                      value={siteTexts.cta_title} 
                      onChange={(e) => setSiteTexts(prev => ({ ...prev, cta_title: e.target.value }))}
                      placeholder="Título"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="p-2 bg-secondary/20 rounded-lg space-y-1">
                    <h5 className="text-xs font-medium">Rodapé</h5>
                    <Input 
                      value={siteTexts.footer_text} 
                      onChange={(e) => setSiteTexts(prev => ({ ...prev, footer_text: e.target.value }))}
                      placeholder="Texto"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={saveSiteTexts}
                disabled={savingSiteTexts}
                size="sm"
                className="w-full"
              >
                {savingSiteTexts ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Salvar Textos
              </Button>
            </div>
          </CollapsibleSection>
        </div>

        {/* Seções maiores - largura total */}
        <div className="space-y-4">
          {/* Integração ChatPro */}
          <CollapsibleSection 
            title="Integração ChatPro (WhatsApp)" 
            icon={<MessageCircle className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium">ChatPro Ativo</span>
                  <p className="text-xs text-muted-foreground">
                    {chatproConfig?.is_enabled ? 'Enviando mensagens via WhatsApp' : 'Desativado'}
                  </p>
                </div>
                <button
                  onClick={() => updateChatProConfig({ is_enabled: !chatproConfig?.is_enabled })}
                  disabled={chatproLoading}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    chatproConfig?.is_enabled ? 'bg-green-500' : 'bg-secondary'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    chatproConfig?.is_enabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Endpoint Base</label>
                  <Input
                    placeholder="https://api.chatpro.com.br"
                    value={chatproConfig?.base_endpoint || ''}
                    onChange={(e) => setChatproConfig(prev => prev ? { ...prev, base_endpoint: e.target.value } : null)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Instance ID</label>
                  <Input
                    placeholder="sua_instancia"
                    value={chatproConfig?.instance_id || ''}
                    onChange={(e) => setChatproConfig(prev => prev ? { ...prev, instance_id: e.target.value } : null)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API Token</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={chatproConfig?.api_token || ''}
                    onChange={(e) => setChatproConfig(prev => prev ? { ...prev, api_token: e.target.value } : null)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <Button
                onClick={() => updateChatProConfig({
                  base_endpoint: chatproConfig?.base_endpoint,
                  instance_id: chatproConfig?.instance_id,
                  api_token: chatproConfig?.api_token,
                })}
                disabled={chatproLoading}
                size="sm"
              >
                {chatproLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Salvar
              </Button>

              {/* Teste */}
              <div className="pt-3 border-t border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-primary" />
                  Testar Conexão
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="5511999999999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    onClick={testChatProConnection}
                    disabled={testingChatPro || !chatproConfig?.is_enabled}
                    variant="outline"
                    size="sm"
                  >
                    {testingChatPro ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Eventos */}
              <div className="pt-3 border-t border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Power className="w-4 h-4 text-primary" />
                  Eventos Automáticos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(eventLabels).map(([eventType, label]) => {
                    const template = getTemplateForEvent(eventType);
                    const isEnabled = template?.chatpro_enabled !== false;

                    return (
                      <div key={eventType} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                        <span className="text-xs font-medium truncate">{label}</span>
                        <button
                          onClick={() => toggleChatProForEvent(eventType, !isEnabled)}
                          className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${
                            isEnabled ? 'bg-green-500' : 'bg-secondary'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                            isEnabled ? 'left-4' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <a 
                  href="https://chatpro.readme.io/reference/introdu%C3%A7%C3%A3o-%C3%A0s-apis-do-chatpro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Documentação ChatPro
                </a>
              </div>
            </div>
          </CollapsibleSection>

          {/* Integrações e API */}
          <CollapsibleSection 
            title="Integrações e API" 
            icon={<Webhook className="w-4 h-4 text-primary" />}
          >
            <div className="mt-3 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  Endpoints para n8n
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(eventLabels).map(([eventType, label]) => (
                    <div key={eventType} className="flex items-center gap-2">
                      <Input
                        value={`${apiBaseUrl}?event=${eventType}`}
                        readOnly
                        className="font-mono text-[10px] flex-1 h-7"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(`${apiBaseUrl}?event=${eventType}`, `URL ${label} copiada!`)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div className="pt-3 border-t border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Templates de Mensagens
                </h4>
                <div className="space-y-2">
                  {Object.entries(eventLabels).map(([eventType, label]) => {
                    const template = getTemplateForEvent(eventType);
                    const isExpanded = expandedTemplate === eventType;
                    const isPreview = previewTemplate === eventType;

                    return (
                      <div key={eventType} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedTemplate(isExpanded ? null : eventType)}
                          className="w-full flex items-center justify-between p-2 hover:bg-secondary/30 transition-colors"
                        >
                          <span className="text-xs font-medium">{label}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="p-3 pt-0 space-y-2 border-t border-border">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setPreviewTemplate(isPreview ? null : eventType)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                {isPreview ? 'Editar' : 'Preview'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => restoreDefaultTemplate(eventType)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restaurar
                              </Button>
                            </div>

                            {isPreview ? (
                              <div className="bg-secondary/50 rounded-lg p-2 text-xs whitespace-pre-wrap">
                                {getPreviewMessage(template?.template || '')}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Textarea
                                  value={template?.template || ''}
                                  onChange={(e) => {
                                    setTemplates(prev => prev.map(t =>
                                      t.event_type === eventType ? { ...t, template: e.target.value } : t
                                    ));
                                  }}
                                  rows={2}
                                  className="font-mono text-xs"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Texto do Botão"
                                    value={template?.button_text || ''}
                                    onChange={(e) => {
                                      setTemplates(prev => prev.map(t =>
                                        t.event_type === eventType ? { ...t, button_text: e.target.value } : t
                                      ));
                                    }}
                                    className="text-xs h-7"
                                  />
                                  <Input
                                    placeholder="URL do Botão"
                                    value={template?.button_url || ''}
                                    onChange={(e) => {
                                      setTemplates(prev => prev.map(t =>
                                        t.event_type === eventType ? { ...t, button_url: e.target.value } : t
                                      ));
                                    }}
                                    className="text-xs h-7"
                                  />
                                </div>

                                <Input
                                  placeholder="URL da Imagem"
                                  value={template?.image_url || ''}
                                  onChange={(e) => {
                                    setTemplates(prev => prev.map(t =>
                                      t.event_type === eventType ? { ...t, image_url: e.target.value } : t
                                    ));
                                  }}
                                  className="text-xs h-7"
                                />
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1">
                              {variables.map((v) => (
                                <button
                                  key={v.key}
                                  onClick={() => copyToClipboard(v.key, `${v.key} copiado!`)}
                                  className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono hover:bg-primary/20"
                                >
                                  {v.key}
                                </button>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => updateTemplate(
                                eventType, 
                                template?.template || '',
                                template?.button_text,
                                template?.button_url,
                                template?.image_url
                              )}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Push */}
              <div className="pt-3 border-t border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notificações Push
                </h4>
                <ul className="text-xs space-y-1">
                  {[
                    'Novo agendamento criado',
                    'Agendamento confirmado',
                    'Cliente chamado',
                    'Atendimento concluído',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </div>
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
