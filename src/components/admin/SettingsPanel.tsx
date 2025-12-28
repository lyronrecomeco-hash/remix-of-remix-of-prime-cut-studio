import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Instagram, 
  Facebook, 
  Store,
  Shield,
  Webhook,
  Copy,
  Eye,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageCircle,
  TestTube,
  Loader2,
  Download,
  Upload,
  FileText,
  Database,
  AlertCircle,
  Type,
  X,
  Lock,
  Key,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Sparkles,
  Heart,
  Flower2,
  Moon,
  Sun,
  Zap,
  Plus,
  Bell,
  BellRing,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import OverloadAlertModal from './OverloadAlertModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendPushNotification } from '@/lib/webhooks';

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

interface BackupConfig {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  keepLastBackups: number;
  lastBackupDate?: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  loginAttemptLimit: number;
  requireStrongPassword: boolean;
  auditLog: boolean;
  pushAlertsEnabled: boolean;
  alertOnNewLogin: boolean;
  alertOnFailedLogin: boolean;
  alertOnSettingsChange: boolean;
}

interface BarberSchedule {
  barberId: string;
  barberName: string;
  schedules: { day: string; start: string; end: string; enabled: boolean }[];
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

const allThemes = [
  { id: 'gold', label: 'Black & Gold', colors: ['#000000', '#F59E0B'], icon: Sparkles },
  { id: 'gold-shine', label: 'Gold Brilhante', colors: ['#000000', '#FBBF24'], icon: Sun },
  { id: 'gold-metallic', label: 'Gold Metálico', colors: ['#1A1A1A', '#D97706'], icon: Zap },
  { id: 'dark-elegant', label: 'Dark Elegante', colors: ['#0F0F0F', '#6366F1'], icon: Moon },
  { id: 'classic-wood', label: 'Clássico Madeira', colors: ['#2D1B0E', '#8B4513'], icon: Store },
  { id: 'modern-steel', label: 'Aço Moderno', colors: ['#1F2937', '#9CA3AF'], icon: Shield },
  { id: 'rose-feminine', label: 'Rosé Feminino', colors: ['#FDF2F8', '#EC4899'], icon: Heart },
  { id: 'lavender-soft', label: 'Lavanda Suave', colors: ['#F5F3FF', '#8B5CF6'], icon: Flower2 },
  { id: 'coral-beauty', label: 'Coral Beauty', colors: ['#FFF1F2', '#FB7185'], icon: Sparkles },
];

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: 30,
  ipWhitelist: [],
  loginAttemptLimit: 5,
  requireStrongPassword: true,
  auditLog: true,
  pushAlertsEnabled: false,
  alertOnNewLogin: true,
  alertOnFailedLogin: true,
  alertOnSettingsChange: false,
};

const defaultBackupConfig: BackupConfig = {
  autoBackup: false,
  frequency: 'weekly',
  keepLastBackups: 5,
};

const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

type SettingsSection = 'theme' | 'shop' | 'security' | 'social' | 'backup' | 'texts' | 'chatpro' | 'templates' | 'api';

const settingsSections = [
  { id: 'theme' as SettingsSection, label: 'Tema', icon: Palette },
  { id: 'shop' as SettingsSection, label: 'Barbearia', icon: Store },
  { id: 'security' as SettingsSection, label: 'Segurança', icon: Shield },
  { id: 'social' as SettingsSection, label: 'Redes Sociais', icon: Instagram },
  { id: 'backup' as SettingsSection, label: 'Backup', icon: Database },
  { id: 'texts' as SettingsSection, label: 'Textos do Site', icon: Type },
  { id: 'chatpro' as SettingsSection, label: 'ChatPro', icon: MessageCircle },
  { id: 'templates' as SettingsSection, label: 'Templates', icon: FileText },
  { id: 'api' as SettingsSection, label: 'API', icon: Webhook },
];

export default function SettingsPanel() {
  const { notify } = useNotification();
  const { shopSettings, updateShopSettings, theme, setTheme, services, barbers } = useApp();
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('theme');
  const [textsModalOpen, setTextsModalOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  
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
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(defaultBackupConfig);
  
  // Site texts state
  const [siteTexts, setSiteTexts] = useState<SiteSectionTexts>(defaultSiteTexts);
  const [savingSiteTexts, setSavingSiteTexts] = useState(false);

  // Security state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [savingTheme, setSavingTheme] = useState(false);
  const [themePreviewOpen, setThemePreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string>('');

  // Barber schedules state
  const [barberSchedules, setBarberSchedules] = useState<BarberSchedule[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
    fetchChatProConfig();
    loadSecuritySettings();
    loadBackupConfig();
    loadBarberSchedules();
  }, []);

  useEffect(() => {
    loadBarberSchedules();
  }, [barbers]);

  const loadSecuritySettings = () => {
    const stored = localStorage.getItem('security_settings');
    if (stored) {
      try {
        setSecuritySettings(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading security settings:', e);
      }
    }
  };

  const loadBackupConfig = () => {
    const stored = localStorage.getItem('backup_config');
    if (stored) {
      try {
        setBackupConfig(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading backup config:', e);
      }
    }
  };

  const loadBarberSchedules = () => {
    const stored = localStorage.getItem('barber_schedules');
    if (stored) {
      try {
        setBarberSchedules(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading barber schedules:', e);
      }
    } else if (barbers && barbers.length > 0) {
      const initialSchedules: BarberSchedule[] = barbers.map(b => ({
        barberId: b.id,
        barberName: b.name,
        schedules: daysOfWeek.map((day, idx) => ({
          day,
          start: '09:00',
          end: '18:00',
          enabled: idx < 6,
        })),
      }));
      setBarberSchedules(initialSchedules);
    }
  };

  const saveSecuritySettings = (settings: SecuritySettings) => {
    setSecuritySettings(settings);
    localStorage.setItem('security_settings', JSON.stringify(settings));
    notify.success('Configurações de segurança salvas!');
  };

  const saveBackupConfig = (config: BackupConfig) => {
    setBackupConfig(config);
    localStorage.setItem('backup_config', JSON.stringify(config));
    notify.success('Configuração de backup salva!');
  };

  const saveBarberSchedules = () => {
    localStorage.setItem('barber_schedules', JSON.stringify(barberSchedules));
    notify.success('Horários salvos!');
    setHoursModalOpen(false);
  };

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

      // Update last backup date
      const updatedConfig = { ...backupConfig, lastBackupDate: new Date().toISOString() };
      setBackupConfig(updatedConfig);
      localStorage.setItem('backup_config', JSON.stringify(updatedConfig));

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
      setTextsModalOpen(false);
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

  const handleSaveTheme = () => {
    setSavingTheme(true);
    // Aplicar tema globalmente via localStorage para persistir
    localStorage.setItem('app_theme', theme);
    document.documentElement.className = document.documentElement.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    if (theme !== 'gold') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
    setTimeout(() => {
      notify.success('Tema salvo e aplicado ao site!');
      setSavingTheme(false);
    }, 500);
  };

  const handlePreviewTheme = (themeId: string) => {
    setPreviewTheme(themeId);
    setThemePreviewOpen(true);
  };

  const sendSecurityAlert = async (alertType: string, message: string) => {
    if (!securitySettings.pushAlertsEnabled) return;
    
    await sendPushNotification(
      `🔒 Alerta de Segurança: ${alertType}`,
      message,
      'admin'
    );
  };

  const addIpToWhitelist = () => {
    if (!newIpAddress.trim()) return;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(newIpAddress)) {
      notify.error('IP inválido. Use formato: 192.168.1.1');
      return;
    }
    if (securitySettings.ipWhitelist.includes(newIpAddress)) {
      notify.error('IP já está na lista');
      return;
    }
    const updated = { ...securitySettings, ipWhitelist: [...securitySettings.ipWhitelist, newIpAddress] };
    saveSecuritySettings(updated);
    setNewIpAddress('');
  };

  const removeIpFromWhitelist = (ip: string) => {
    const updated = { ...securitySettings, ipWhitelist: securitySettings.ipWhitelist.filter(i => i !== ip) };
    saveSecuritySettings(updated);
  };

  const apiBaseUrl = `https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/appointments-api`;

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'theme':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Tema Visual</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handlePreviewTheme(theme)} size="default">
                  <Monitor className="w-4 h-4 mr-2" />
                  Preview Site
                </Button>
                <Button onClick={handleSaveTheme} disabled={savingTheme} size="default">
                  {savingTheme ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Tema
                </Button>
              </div>
            </div>
            <p className="text-base text-muted-foreground">Escolha o tema que combina com seu estabelecimento.</p>
            <div className="grid grid-cols-3 gap-4">
              {allThemes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === t.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex gap-1.5">
                        {t.colors.map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-left">{t.label}</p>
                    {theme === t.id && (
                      <p className="text-xs text-primary mt-1">✓ Selecionado</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'shop':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Dados da Barbearia</h3>
              <Button variant="outline" size="sm" onClick={() => setHoursModalOpen(true)}>
                <Clock className="w-4 h-4 mr-2" />
                Horários
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Nome</label>
                <Input value={shopSettings.name} onChange={(e) => updateShopSettings({ name: e.target.value })} className="h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tagline</label>
                <Input value={shopSettings.tagline} onChange={(e) => updateShopSettings({ tagline: e.target.value })} className="h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Telefone</label>
                <Input value={shopSettings.phone} onChange={(e) => updateShopSettings({ phone: e.target.value })} className="h-10" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp</label>
                <Input value={shopSettings.whatsapp} onChange={(e) => updateShopSettings({ whatsapp: e.target.value })} placeholder="55..." className="h-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Endereço</label>
              <Input value={shopSettings.address} onChange={(e) => updateShopSettings({ address: e.target.value })} className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Link Google Maps</label>
              <Input value={shopSettings.mapsLink} onChange={(e) => updateShopSettings({ mapsLink: e.target.value })} placeholder="https://maps.google.com/..." className="h-10" />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-bold">Segurança Avançada</h3>
            
            {/* Push Alerts de Segurança */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-base font-semibold">Alertas Push de Segurança</span>
                    <p className="text-sm text-muted-foreground">Receba notificações em tempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newValue = !securitySettings.pushAlertsEnabled;
                    saveSecuritySettings({ ...securitySettings, pushAlertsEnabled: newValue });
                    if (newValue) {
                      sendSecurityAlert('Ativação', 'Alertas de segurança push foram ativados');
                    }
                  }}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    securitySettings.pushAlertsEnabled ? 'bg-blue-500' : 'bg-secondary'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                    securitySettings.pushAlertsEnabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              {securitySettings.pushAlertsEnabled && (
                <div className="space-y-3 pl-8 border-l-2 border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alertar novo login</span>
                    <button
                      onClick={() => saveSecuritySettings({ ...securitySettings, alertOnNewLogin: !securitySettings.alertOnNewLogin })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        securitySettings.alertOnNewLogin ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        securitySettings.alertOnNewLogin ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alertar tentativas falhas</span>
                    <button
                      onClick={() => saveSecuritySettings({ ...securitySettings, alertOnFailedLogin: !securitySettings.alertOnFailedLogin })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        securitySettings.alertOnFailedLogin ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        securitySettings.alertOnFailedLogin ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alertar mudanças de config</span>
                    <button
                      onClick={() => saveSecuritySettings({ ...securitySettings, alertOnSettingsChange: !securitySettings.alertOnSettingsChange })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        securitySettings.alertOnSettingsChange ? 'bg-primary' : 'bg-secondary'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        securitySettings.alertOnSettingsChange ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Alerta de Sobrecarga */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="text-base font-medium">Alerta de Sobrecarga</span>
                  <p className="text-sm text-muted-foreground">Notifica ao atingir limite diário</p>
                </div>
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
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  shopSettings.overloadAlertEnabled ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  shopSettings.overloadAlertEnabled ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {shopSettings.overloadAlertEnabled && (
              <div className="pl-8 pb-2">
                <label className="text-sm text-muted-foreground block mb-2">Limite diário de agendamentos</label>
                <Input
                  type="number"
                  value={shopSettings.dailyAppointmentLimit || 20}
                  onChange={(e) => updateShopSettings({ dailyAppointmentLimit: Number(e.target.value) })}
                  min={1}
                  max={100}
                  className="h-11 max-w-[140px]"
                />
              </div>
            )}

            {/* Autenticação em Duas Etapas */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="text-base font-medium">Autenticação 2 Fatores</span>
                  <p className="text-sm text-muted-foreground">Proteção extra no login</p>
                </div>
              </div>
              <button
                onClick={() => saveSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  securitySettings.twoFactorAuth ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  securitySettings.twoFactorAuth ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Senha Forte */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-500" />
                <div>
                  <span className="text-base font-medium">Exigir Senha Forte</span>
                  <p className="text-sm text-muted-foreground">Mín. 8 caracteres, maiúscula, número</p>
                </div>
              </div>
              <button
                onClick={() => saveSecuritySettings({ ...securitySettings, requireStrongPassword: !securitySettings.requireStrongPassword })}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  securitySettings.requireStrongPassword ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  securitySettings.requireStrongPassword ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Log de Auditoria */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                <div>
                  <span className="text-base font-medium">Log de Auditoria</span>
                  <p className="text-sm text-muted-foreground">Registra todas as ações do admin</p>
                </div>
              </div>
              <button
                onClick={() => saveSecuritySettings({ ...securitySettings, auditLog: !securitySettings.auditLog })}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  securitySettings.auditLog ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  securitySettings.auditLog ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Timeout de Sessão */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Timeout Sessão (min)</label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => saveSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })}
                  min={5}
                  max={120}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Limite Tentativas Login</label>
                <Input
                  type="number"
                  value={securitySettings.loginAttemptLimit}
                  onChange={(e) => saveSecuritySettings({ ...securitySettings, loginAttemptLimit: Number(e.target.value) })}
                  min={3}
                  max={10}
                  className="h-11"
                />
              </div>
            </div>

            {/* IP Whitelist */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Lista de IPs Permitidos</label>
              <div className="flex gap-3">
                <Input
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  placeholder="192.168.1.1"
                  className="h-11 flex-1"
                />
                <Button onClick={addIpToWhitelist} className="h-11 px-4">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              {securitySettings.ipWhitelist.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {securitySettings.ipWhitelist.map((ip) => (
                    <span key={ip} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full">
                      {ip}
                      <button onClick={() => removeIpFromWhitelist(ip)} className="hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-bold">Redes Sociais</h3>
            <p className="text-base text-muted-foreground">Configure seus perfis nas redes sociais.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Instagram className="w-4 h-4" /> Instagram
                </label>
                <Input
                  placeholder="@seuperfil"
                  value={shopSettings.social?.instagram || ''}
                  onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, instagram: e.target.value } })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Facebook className="w-4 h-4" /> Facebook
                </label>
                <Input
                  placeholder="nome.da.pagina"
                  value={shopSettings.social?.facebook || ''}
                  onChange={(e) => updateShopSettings({ social: { ...shopSettings.social, facebook: e.target.value } })}
                  className="h-11"
                />
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-bold">Backup e Restauração</h3>
            
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-4">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-base font-medium">Backup Seguro SHA-256</p>
                <p className="text-sm text-muted-foreground">
                  Inclui: configurações, templates, ChatPro e textos.
                </p>
              </div>
            </div>

            {/* Configuração de Backup Automático */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base font-medium">Backup Automático</span>
                </div>
                <button
                  onClick={() => saveBackupConfig({ ...backupConfig, autoBackup: !backupConfig.autoBackup })}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    backupConfig.autoBackup ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                    backupConfig.autoBackup ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
              
              {backupConfig.autoBackup && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Frequência</label>
                    <select
                      value={backupConfig.frequency}
                      onChange={(e) => saveBackupConfig({ ...backupConfig, frequency: e.target.value as any })}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-base"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Manter últimos</label>
                    <select
                      value={backupConfig.keepLastBackups}
                      onChange={(e) => saveBackupConfig({ ...backupConfig, keepLastBackups: Number(e.target.value) })}
                      className="w-full h-11 px-3 bg-background border border-input rounded-lg text-base"
                    >
                      <option value={3}>3 backups</option>
                      <option value={5}>5 backups</option>
                      <option value={10}>10 backups</option>
                    </select>
                  </div>
                </div>
              )}

              {backupConfig.lastBackupDate && (
                <p className="text-sm text-muted-foreground pt-1">
                  Último backup: {new Date(backupConfig.lastBackupDate).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleExportBackup} disabled={isExporting} className="h-11">
                {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Exportar
              </Button>
              
              <input ref={backupFileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              
              <Button variant="outline" onClick={() => backupFileInputRef.current?.click()} disabled={isImporting} className="h-11">
                {isImporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
                Importar
              </Button>
            </div>

            {importError && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{importError}</p>
              </div>
            )}
          </div>
        );

      case 'texts':
        return (
          <div className="space-y-5">
            <h3 className="text-xl font-bold">Textos do Site</h3>
            <p className="text-base text-muted-foreground">
              Personalize os textos que aparecem no site público.
            </p>
            
            <div className="bg-muted/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Type className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-base font-medium">Seções Editáveis</p>
                  <p className="text-sm text-muted-foreground">Hero, Sobre, Serviços, Galeria, CTA, Rodapé</p>
                </div>
              </div>
              <Button onClick={() => setTextsModalOpen(true)} className="w-full h-11">
                <Type className="w-5 h-5 mr-2" />
                Abrir Editor de Textos
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <strong>Dica:</strong> Use textos curtos e diretos para melhor experiência do usuário.
            </div>
          </div>
        );

      case 'chatpro':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Integração ChatPro</h3>
              <button
                onClick={() => chatproConfig && updateChatProConfig({ is_enabled: !chatproConfig.is_enabled })}
                disabled={chatproLoading}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  chatproConfig?.is_enabled ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  chatproConfig?.is_enabled ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {chatproConfig?.is_enabled && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">API Token</label>
                  <Input
                    type="password"
                    value={chatproConfig?.api_token || ''}
                    onChange={(e) => updateChatProConfig({ api_token: e.target.value })}
                    placeholder="Seu token..."
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Instance ID</label>
                    <Input
                      value={chatproConfig?.instance_id || ''}
                      onChange={(e) => updateChatProConfig({ instance_id: e.target.value })}
                      placeholder="ID..."
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Endpoint</label>
                    <Input
                      value={chatproConfig?.base_endpoint || ''}
                      onChange={(e) => updateChatProConfig({ base_endpoint: e.target.value })}
                      placeholder="https://..."
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5511999999999"
                    className="h-11 flex-1"
                  />
                  <Button variant="outline" onClick={testChatProConnection} disabled={testingChatPro} className="h-11 px-4">
                    {testingChatPro ? <Loader2 className="w-5 h-5 animate-spin" /> : <TestTube className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
            <div className="space-y-2">
              {Object.entries(eventLabels).map(([eventType, label]) => {
                const template = getTemplateForEvent(eventType);
                const isExpanded = expandedTemplate === eventType;

                return (
                  <div key={eventType} className="bg-secondary/30 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedTemplate(isExpanded ? null : eventType)}
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${template?.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && template && (
                      <div className="p-3 pt-0 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <span className="text-xs text-muted-foreground">ChatPro:</span>
                          <button
                            onClick={() => toggleChatProForEvent(eventType, !template.chatpro_enabled)}
                            className={`w-8 h-4 rounded-full transition-colors relative ${
                              template.chatpro_enabled ? 'bg-primary' : 'bg-secondary'
                            }`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                              template.chatpro_enabled ? 'left-4' : 'left-0.5'
                            }`} />
                          </button>
                        </div>

                        <Textarea
                          value={template.template}
                          onChange={(e) => {
                            const updated = templates.map(t =>
                              t.event_type === eventType ? { ...t, template: e.target.value } : t
                            );
                            setTemplates(updated);
                          }}
                          rows={3}
                          className="text-sm"
                        />

                        <div className="flex flex-wrap gap-1">
                          {variables.map((v) => (
                            <button
                              key={v.key}
                              onClick={() => {
                                const textarea = document.querySelector(`textarea`) as HTMLTextAreaElement;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const newTemplate = template.template.substring(0, start) + v.key + template.template.substring(end);
                                const updated = templates.map(t =>
                                  t.event_type === eventType ? { ...t, template: newTemplate } : t
                                );
                                setTemplates(updated);
                              }}
                              className="px-2 py-1 bg-primary/20 text-primary rounded text-[10px] font-mono hover:bg-primary/30 transition-colors"
                            >
                              {v.key}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateTemplate(eventType, template.template)} className="h-8 text-xs">
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => restoreDefaultTemplate(eventType)} className="h-8 text-xs">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restaurar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setPreviewTemplate(previewTemplate === eventType ? null : eventType)} className="h-8 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>

                        {previewTemplate === eventType && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <p className="text-[10px] text-green-400 mb-1 font-medium">Pré-visualização:</p>
                            <p className="text-xs whitespace-pre-wrap">{getPreviewMessage(template.template)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">API de Integração</h3>
            <p className="text-sm text-muted-foreground">
              Use esta URL para integrar com sistemas externos.
            </p>
            
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-xs break-all flex-1">{apiBaseUrl}</code>
                <button
                  onClick={() => copyToClipboard(apiBaseUrl, 'URL copiada!')}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium">Endpoints disponíveis:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px]">GET</span>
                  /appointments
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded text-[10px]">POST</span>
                  /appointments
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[10px]">PUT</span>
                  /appointments/:id
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-2xl font-bold mb-4">Configurações</h2>
      
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Menu lateral de categorias */}
        <div className="w-44 flex-shrink-0 space-y-1.5 overflow-y-auto">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted/50 border border-border'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Área de conteúdo */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-card border border-border rounded-xl p-5">
          {renderSectionContent()}
        </div>
      </div>

      {/* Modal de Textos do Site */}
      <Dialog open={textsModalOpen} onOpenChange={setTextsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              Editar Textos do Site
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <h5 className="font-semibold">Hero (Topo)</h5>
              <Input 
                value={siteTexts.hero_title} 
                onChange={(e) => setSiteTexts(prev => ({ ...prev, hero_title: e.target.value }))}
                placeholder="Título principal"
                className="h-11"
              />
              <Input 
                value={siteTexts.hero_subtitle} 
                onChange={(e) => setSiteTexts(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                placeholder="Subtítulo"
                className="h-11"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <h5 className="font-semibold">Sobre Nós</h5>
              <Input 
                value={siteTexts.about_title} 
                onChange={(e) => setSiteTexts(prev => ({ ...prev, about_title: e.target.value }))}
                placeholder="Título"
                className="h-11"
              />
              <Textarea 
                value={siteTexts.about_description} 
                onChange={(e) => setSiteTexts(prev => ({ ...prev, about_description: e.target.value }))}
                placeholder="Descrição"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                <h5 className="font-semibold">Serviços</h5>
                <Input 
                  value={siteTexts.services_title} 
                  onChange={(e) => setSiteTexts(prev => ({ ...prev, services_title: e.target.value }))}
                  placeholder="Título"
                  className="h-11"
                />
              </div>
              <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                <h5 className="font-semibold">Galeria</h5>
                <Input 
                  value={siteTexts.gallery_title} 
                  onChange={(e) => setSiteTexts(prev => ({ ...prev, gallery_title: e.target.value }))}
                  placeholder="Título"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                <h5 className="font-semibold">CTA</h5>
                <Input 
                  value={siteTexts.cta_title} 
                  onChange={(e) => setSiteTexts(prev => ({ ...prev, cta_title: e.target.value }))}
                  placeholder="Título"
                  className="h-11"
                />
              </div>
              <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                <h5 className="font-semibold">Rodapé</h5>
                <Input 
                  value={siteTexts.footer_text} 
                  onChange={(e) => setSiteTexts(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Texto"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setTextsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSiteTexts} disabled={savingSiteTexts}>
              {savingSiteTexts ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Horários */}
      <Dialog open={hoursModalOpen} onOpenChange={setHoursModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Configurar Horários
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Horários Gerais */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <h5 className="font-semibold">Horários Gerais da Barbearia</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Horário Semana</label>
                  <Input 
                    value={shopSettings.hours?.weekdays || '09:00 - 18:00'}
                    onChange={(e) => updateShopSettings({ hours: { ...shopSettings.hours, weekdays: e.target.value }})}
                    placeholder="09:00 - 18:00"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Sábado</label>
                  <Input 
                    value={shopSettings.hours?.saturday || '09:00 - 14:00'}
                    onChange={(e) => updateShopSettings({ hours: { ...shopSettings.hours, saturday: e.target.value }})}
                    placeholder="09:00 - 14:00"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Intervalo Início</label>
                  <Input 
                    value={shopSettings.lunchBreak?.start || '12:00'}
                    onChange={(e) => updateShopSettings({ lunchBreak: { ...shopSettings.lunchBreak, start: e.target.value } })}
                    placeholder="12:00"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Intervalo Fim</label>
                  <Input 
                    value={shopSettings.lunchBreak?.end || '13:00'}
                    onChange={(e) => updateShopSettings({ lunchBreak: { ...shopSettings.lunchBreak, end: e.target.value } })}
                    placeholder="13:00"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Horários por Barbeiro */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <h5 className="font-semibold flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Horários por Barbeiro
              </h5>
              
              {barbers && barbers.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="">Selecione um barbeiro</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>

                  {selectedBarberId && (
                    <div className="space-y-2">
                      {daysOfWeek.map((day, idx) => {
                        const schedule = barberSchedules.find(bs => bs.barberId === selectedBarberId);
                        const daySchedule = schedule?.schedules.find(s => s.day === day);
                        
                        return (
                          <div key={day} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                            <button
                              onClick={() => {
                                setBarberSchedules(prev => prev.map(bs => {
                                  if (bs.barberId !== selectedBarberId) return bs;
                                  return {
                                    ...bs,
                                    schedules: bs.schedules.map(s => 
                                      s.day === day ? { ...s, enabled: !s.enabled } : s
                                    )
                                  };
                                }));
                              }}
                              className={`w-8 h-4 rounded-full transition-colors relative ${
                                daySchedule?.enabled ? 'bg-primary' : 'bg-secondary'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                                daySchedule?.enabled ? 'left-4' : 'left-0.5'
                              }`} />
                            </button>
                            <span className="text-sm w-20">{day}</span>
                            <Input
                              value={daySchedule?.start || '09:00'}
                              onChange={(e) => {
                                setBarberSchedules(prev => prev.map(bs => {
                                  if (bs.barberId !== selectedBarberId) return bs;
                                  return {
                                    ...bs,
                                    schedules: bs.schedules.map(s => 
                                      s.day === day ? { ...s, start: e.target.value } : s
                                    )
                                  };
                                }));
                              }}
                              className="h-8 w-24"
                              disabled={!daySchedule?.enabled}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              value={daySchedule?.end || '18:00'}
                              onChange={(e) => {
                                setBarberSchedules(prev => prev.map(bs => {
                                  if (bs.barberId !== selectedBarberId) return bs;
                                  return {
                                    ...bs,
                                    schedules: bs.schedules.map(s => 
                                      s.day === day ? { ...s, end: e.target.value } : s
                                    )
                                  };
                                }));
                              }}
                              className="h-8 w-24"
                              disabled={!daySchedule?.enabled}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setHoursModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveBarberSchedules}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Horários
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OverloadAlertModal
        isOpen={showOverloadModal}
        onClose={() => setShowOverloadModal(false)}
        type="explanation"
        onConfirm={() => {
          updateShopSettings({ overloadAlertEnabled: true });
          setShowOverloadModal(false);
          notify.success('Alertas de sobrecarga ativados');
        }}
      />

      {/* Modal de Preview do Tema */}
      <Dialog open={themePreviewOpen} onOpenChange={setThemePreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Preview do Tema: {allThemes.find(t => t.id === previewTheme)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 rounded-lg overflow-hidden border border-border">
            <iframe
              src={`/?theme=${previewTheme}`}
              className="w-full h-full"
              title="Preview do Tema"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setThemePreviewOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setTheme(previewTheme as any);
              handleSaveTheme();
              setThemePreviewOpen(false);
            }}>
              <Save className="w-4 h-4 mr-2" />
              Aplicar Este Tema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
