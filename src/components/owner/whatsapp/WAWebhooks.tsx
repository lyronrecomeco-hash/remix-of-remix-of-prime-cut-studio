import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookConfig {
  id: string;
  instance_id: string | null;
  name: string;
  url: string;
  events: string[];
  secret_key: string | null;
  headers: any;
  is_active: boolean;
  retry_enabled: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  last_triggered_at: string | null;
  last_status_code: number | null;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  attempt_number: number;
  is_success: boolean;
  error_message: string | null;
  latency_ms: number | null;
  created_at: string;
}

interface WAWebhooksProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

const WEBHOOK_EVENTS = [
  { value: 'message_sent', label: 'Mensagem Enviada', description: 'Disparado quando uma mensagem é enviada' },
  { value: 'message_received', label: 'Mensagem Recebida', description: 'Disparado quando uma mensagem é recebida' },
  { value: 'message_read', label: 'Mensagem Lida', description: 'Disparado quando uma mensagem é lida' },
  { value: 'connection', label: 'Conexão', description: 'Disparado quando uma instância conecta' },
  { value: 'disconnection', label: 'Desconexão', description: 'Disparado quando uma instância desconecta' },
  { value: 'qr_generated', label: 'QR Code Gerado', description: 'Disparado quando um QR Code é gerado' },
];

export const WAWebhooks = ({ instances }: WAWebhooksProps) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formSecretKey, setFormSecretKey] = useState('');
  const [formRetryEnabled, setFormRetryEnabled] = useState(true);
  const [formRetryCount, setFormRetryCount] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks((data || []) as WebhookConfig[]);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as WebhookLog[]);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedWebhook) {
      fetchLogs(selectedWebhook);
    }
  }, [selectedWebhook, fetchLogs]);

  const generateSecretKey = () => {
    const key = 'whsec_' + crypto.randomUUID().replace(/-/g, '');
    setFormSecretKey(key);
  };

  const openCreateDialog = () => {
    setEditingWebhook(null);
    setFormName('');
    setFormUrl('');
    setFormEvents([]);
    setFormSecretKey('');
    setFormRetryEnabled(true);
    setFormRetryCount(3);
    generateSecretKey();
    setIsDialogOpen(true);
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormName(webhook.name);
    setFormUrl(webhook.url);
    setFormEvents(webhook.events);
    setFormSecretKey(webhook.secret_key || '');
    setFormRetryEnabled(webhook.retry_enabled);
    setFormRetryCount(webhook.retry_count);
    setIsDialogOpen(true);
  };

  const toggleEvent = (event: string) => {
    setFormEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const saveWebhook = async () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: formName,
        url: formUrl,
        events: formEvents,
        secret_key: formSecretKey || null,
        retry_enabled: formRetryEnabled,
        retry_count: formRetryCount,
        instance_id: instances[0]?.id || null,
      };

      if (editingWebhook) {
        const { error } = await supabase
          .from('whatsapp_webhooks')
          .update(data)
          .eq('id', editingWebhook.id);
        if (error) throw error;
        toast.success('Webhook atualizado!');
      } else {
        const { error } = await supabase
          .from('whatsapp_webhooks')
          .insert(data);
        if (error) throw error;
        toast.success('Webhook criado!');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Erro ao salvar webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWebhook = async (webhook: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from('whatsapp_webhooks')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);
      if (error) throw error;
      toast.success(webhook.is_active ? 'Webhook desativado' : 'Webhook ativado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase.from('whatsapp_webhooks').delete().eq('id', id);
      if (error) throw error;
      toast.success('Webhook removido');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover webhook');
    }
  };

  const copySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast.success('Secret copiado!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhooks Configuráveis
              </CardTitle>
              <CardDescription>
                Receba notificações em tempo real de eventos do WhatsApp
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
                  <DialogDescription>
                    Configure um endpoint para receber eventos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Integração CRM"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      placeholder="https://api.seuservidor.com/webhook"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eventos</Label>
                    <div className="grid gap-2">
                      {WEBHOOK_EVENTS.map(({ value, label, description }) => (
                        <div
                          key={value}
                          className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleEvent(value)}
                        >
                          <Checkbox checked={formEvents.includes(value)} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Secret Key (para assinatura)</Label>
                      <Button variant="ghost" size="sm" onClick={generateSecretKey}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Gerar
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={formSecretKey}
                        onChange={(e) => setFormSecretKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={() => copySecret(formSecretKey)}>
                        {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use esta chave para verificar a assinatura dos webhooks
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Retry Automático</p>
                      <p className="text-xs text-muted-foreground">
                        Reenviar em caso de falha
                      </p>
                    </div>
                    <Switch checked={formRetryEnabled} onCheckedChange={setFormRetryEnabled} />
                  </div>
                  {formRetryEnabled && (
                    <div className="space-y-2">
                      <Label>Número de Tentativas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formRetryCount}
                        onChange={(e) => setFormRetryCount(parseInt(e.target.value) || 3)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={saveWebhook} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum webhook configurado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`p-4 border rounded-lg ${
                    webhook.is_active ? '' : 'opacity-60'
                  } ${selectedWebhook === webhook.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {WEBHOOK_EVENTS.find(e => e.value === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm mr-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {webhook.success_count}
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" />
                          {webhook.failure_count}
                        </div>
                      </div>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => toggleWebhook(webhook)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(webhook)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedWebhook(
                        selectedWebhook === webhook.id ? null : webhook.id
                      )}>
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteWebhook(webhook.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Logs */}
                  {selectedWebhook === webhook.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm">Logs Recentes</h5>
                        <Button variant="ghost" size="sm" onClick={() => fetchLogs(webhook.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px]">
                        {logs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum log disponível
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {logs.map((log) => (
                              <div
                                key={log.id}
                                className={`p-2 rounded text-sm ${
                                  log.is_success ? 'bg-green-500/10' : 'bg-red-500/10'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {log.is_success ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {log.event_type}
                                    </Badge>
                                    {log.response_status && (
                                      <span className="text-xs text-muted-foreground">
                                        HTTP {log.response_status}
                                      </span>
                                    )}
                                    {log.latency_ms && (
                                      <span className="text-xs text-muted-foreground">
                                        {log.latency_ms}ms
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                                {log.error_message && (
                                  <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
