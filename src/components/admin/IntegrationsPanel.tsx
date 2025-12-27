import { useState, useEffect } from 'react';
import { 
  Webhook, 
  MessageSquare, 
  Eye, 
  Save, 
  RotateCcw,
  Check,
  Copy,
  Bell,
  Link as LinkIcon,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/contexts/NotificationContext';
import { useApp } from '@/contexts/AppContext';

interface MessageTemplate {
  id: string;
  event_type: string;
  title: string;
  template: string;
  is_active: boolean;
}

interface WebhookConfig {
  id: string;
  event_type: string;
  webhook_url: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
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

export default function IntegrationsPanel() {
  const { notify } = useNotification();
  const { shopSettings } = useApp();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [previewEvent, setPreviewEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, webhooksRes] = await Promise.all([
        supabase.from('message_templates').select('*'),
        supabase.from('webhook_configs').select('*'),
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (webhooksRes.data) setWebhooks(webhooksRes.data);
    } catch (error) {
      console.error('Error fetching integrations data:', error);
    }
    setLoading(false);
  };

  const updateTemplate = async (eventType: string, template: string) => {
    const { error } = await supabase
      .from('message_templates')
      .update({ template })
      .eq('event_type', eventType);

    if (error) {
      notify.error('Erro ao salvar template');
    } else {
      notify.success('Template salvo com sucesso');
      fetchData();
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
      notify.success('Template restaurado para o padrão');
      fetchData();
    }
  };

  const updateWebhookUrl = async (eventType: string, url: string) => {
    const { error } = await supabase
      .from('webhook_configs')
      .update({ webhook_url: url })
      .eq('event_type', eventType);

    if (error) {
      notify.error('Erro ao salvar webhook');
    } else {
      notify.success('Webhook salvo');
      fetchData();
    }
  };

  const toggleWebhook = async (eventType: string, isActive: boolean) => {
    const { error } = await supabase
      .from('webhook_configs')
      .update({ is_active: isActive })
      .eq('event_type', eventType);

    if (error) {
      notify.error('Erro ao atualizar webhook');
    } else {
      notify.success(isActive ? 'Webhook ativado' : 'Webhook desativado');
      fetchData();
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

  const copyApiEndpoint = () => {
    const endpoint = `${window.location.origin}/api/webhook-trigger`;
    navigator.clipboard.writeText(endpoint);
    notify.success('Endpoint copiado!');
  };

  const getWebhookForEvent = (eventType: string) => {
    return webhooks.find(w => w.event_type === eventType);
  };

  const getTemplateForEvent = (eventType: string) => {
    return templates.find(t => t.event_type === eventType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrações e API</h2>
        <p className="text-sm text-muted-foreground">
          Configure webhooks para automação com n8n e personalize mensagens automáticas
        </p>
      </div>

      {/* API Info */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          Informações da API
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Domínio do Sistema</label>
            <div className="flex gap-2">
              <Input value={window.location.origin} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  notify.success('Domínio copiado!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use este domínio como base para suas integrações com n8n
          </p>
        </div>
      </div>

      {/* Webhooks & Templates */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          Webhooks e Templates de Mensagens
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure URLs de webhook do n8n e personalize as mensagens para cada evento
        </p>

        <div className="space-y-3">
          {Object.keys(eventLabels).map((eventType) => {
            const webhook = getWebhookForEvent(eventType);
            const template = getTemplateForEvent(eventType);
            const isExpanded = expandedEvent === eventType;
            const isPreview = previewEvent === eventType;

            return (
              <div key={eventType} className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : eventType)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${webhook?.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                    <span className="font-medium">{eventLabels[eventType]}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-4 border-t border-border">
                    {/* Webhook URL */}
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">
                        Webhook URL (n8n)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://seu-n8n.com/webhook/..."
                          value={webhook?.webhook_url || ''}
                          onChange={(e) => {
                            const updated = webhooks.map(w => 
                              w.event_type === eventType 
                                ? { ...w, webhook_url: e.target.value }
                                : w
                            );
                            setWebhooks(updated);
                          }}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateWebhookUrl(eventType, webhook?.webhook_url || '')}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Toggle Active */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Webhook Ativo</span>
                      <button
                        onClick={() => toggleWebhook(eventType, !webhook?.is_active)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          webhook?.is_active ? 'bg-primary' : 'bg-secondary'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          webhook?.is_active ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Message Template */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-muted-foreground">Template da Mensagem</label>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewEvent(isPreview ? null : eventType)}
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
                      </div>

                      {isPreview ? (
                        <div className="bg-secondary/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                          {getPreviewMessage(template?.template || '')}
                        </div>
                      ) : (
                        <Textarea
                          value={template?.template || ''}
                          onChange={(e) => {
                            const updated = templates.map(t => 
                              t.event_type === eventType 
                                ? { ...t, template: e.target.value }
                                : t
                            );
                            setTemplates(updated);
                          }}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => updateTemplate(eventType, template?.template || '')}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Salvar Template
                      </Button>
                    </div>

                    {/* Variables */}
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Variáveis Disponíveis</label>
                      <div className="flex flex-wrap gap-2">
                        {variables.map((v) => (
                          <button
                            key={v.key}
                            onClick={() => {
                              navigator.clipboard.writeText(v.key);
                              notify.success(`${v.key} copiado!`);
                            }}
                            className="px-2 py-1 bg-secondary rounded text-xs font-mono hover:bg-primary/20 transition-colors"
                          >
                            {v.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Last Triggered */}
                    {webhook?.last_triggered_at && (
                      <p className="text-xs text-muted-foreground">
                        Último disparo: {new Date(webhook.last_triggered_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Push Notifications Info */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notificações Push
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          O sistema envia notificações push automaticamente para clientes e barbeiros nos seguintes eventos:
        </p>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Novo agendamento criado
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Agendamento confirmado pelo barbeiro
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Cliente chamado para atendimento
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Posição na fila atualizada
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Atendimento concluído
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          As notificações funcionam em segundo plano, mesmo com o app fechado
        </p>
      </div>
    </div>
  );
}