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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('message_templates').select('*');
    if (data) setTemplates(data);
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

        {/* Integrações e API */}
        <CollapsibleSection 
          title="Integrações e API" 
          icon={<Webhook className="w-5 h-5 text-primary" />}
        >
          <div className="mt-4 space-y-6">
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