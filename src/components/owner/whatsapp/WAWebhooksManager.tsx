import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Settings2,
  Play,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  AlertTriangle,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExternalWebhook {
  id: string;
  project_id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
  max_retries: number;
  retry_delay_seconds: number;
  retry_enabled: boolean;
  success_count: number;
  failure_count: number;
  last_triggered_at: string | null;
  last_status_code: number | null;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_number: number;
  is_success: boolean;
  latency_ms: number | null;
  created_at: string;
}

interface APIProject {
  id: string;
  name: string;
}

const AVAILABLE_EVENTS = [
  { value: 'message_sent', label: 'Mensagem Enviada' },
  { value: 'message_delivered', label: 'Mensagem Entregue' },
  { value: 'message_read', label: 'Mensagem Lida' },
  { value: 'message_failed', label: 'Mensagem Falhou' },
  { value: 'message_received', label: 'Mensagem Recebida' },
  { value: 'automation_triggered', label: 'Automação Disparada' },
  { value: 'instance_connected', label: 'Instância Conectada' },
  { value: 'instance_disconnected', label: 'Instância Desconectada' },
];

const WAWebhooksManager = () => {
  const [webhooks, setWebhooks] = useState<ExternalWebhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [projects, setProjects] = useState<APIProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<ExternalWebhook | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    project_id: '',
    events: [] as string[],
    max_retries: 3,
    retry_delay_seconds: 5,
    retry_enabled: true,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [webhooksRes, projectsRes] = await Promise.all([
        supabase.from('whatsapp_external_webhooks').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_api_projects').select('id, name').eq('is_active', true)
      ]);

      setWebhooks((webhooksRes.data || []) as ExternalWebhook[]);
      setProjects((projectsRes.data || []) as APIProject[]);
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      project_id: '',
      events: [],
      max_retries: 3,
      retry_delay_seconds: 5,
      retry_enabled: true,
      is_active: true
    });
  };

  const generateSecretKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'whsec_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createWebhook = async () => {
    if (!formData.name || !formData.url || !formData.project_id || formData.events.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase.from('whatsapp_external_webhooks').insert({
        name: formData.name,
        url: formData.url,
        project_id: formData.project_id,
        events: formData.events,
        max_retries: formData.max_retries,
        retry_delay_seconds: formData.retry_delay_seconds,
        retry_enabled: formData.retry_enabled,
        is_active: formData.is_active,
        secret_key: generateSecretKey()
      });

      if (error) throw error;

      toast.success('Webhook criado com sucesso!');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      toast.error('Erro ao criar webhook');
    }
  };

  const updateWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const { error } = await supabase
        .from('whatsapp_external_webhooks')
        .update({
          name: formData.name,
          url: formData.url,
          events: formData.events,
          max_retries: formData.max_retries,
          retry_delay_seconds: formData.retry_delay_seconds,
          retry_enabled: formData.retry_enabled,
          is_active: formData.is_active
        })
        .eq('id', selectedWebhook.id);

      if (error) throw error;

      toast.success('Webhook atualizado!');
      setShowEditDialog(false);
      setSelectedWebhook(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      toast.error('Erro ao atualizar webhook');
    }
  };

  const deleteWebhook = async (webhook: ExternalWebhook) => {
    if (!confirm(`Excluir webhook "${webhook.name}"?`)) return;

    try {
      const { error } = await supabase.from('whatsapp_external_webhooks').delete().eq('id', webhook.id);
      if (error) throw error;

      toast.success('Webhook excluído!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
      toast.error('Erro ao excluir webhook');
    }
  };

  const toggleWebhookStatus = async (webhook: ExternalWebhook) => {
    try {
      const { error } = await supabase
        .from('whatsapp_external_webhooks')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);

      if (error) throw error;

      toast.success(webhook.is_active ? 'Webhook desativado' : 'Webhook ativado');
      fetchData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const testWebhook = async (webhook: ExternalWebhook) => {
    setTestingWebhook(webhook.id);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Signature': 'sha256=test_signature',
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Teste de webhook Genesis' }
        })
      });

      if (response.ok) {
        toast.success('Webhook respondeu com sucesso!');
      } else {
        toast.error(`Webhook retornou status ${response.status}`);
      }
    } catch (error: any) {
      toast.error(`Erro ao testar: ${error?.message || 'Falha na conexão'}`);
    } finally {
      setTestingWebhook(null);
    }
  };

  const openEditDialog = (webhook: ExternalWebhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      project_id: webhook.project_id,
      events: webhook.events,
      max_retries: webhook.max_retries,
      retry_delay_seconds: webhook.retry_delay_seconds,
      retry_enabled: webhook.retry_enabled,
      is_active: webhook.is_active
    });
    setShowEditDialog(true);
  };

  const viewWebhookLogs = async (webhook: ExternalWebhook) => {
    setSelectedWebhook(webhook);
    
    const { data } = await supabase
      .from('whatsapp_webhook_logs')
      .select('*')
      .eq('webhook_id', webhook.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    setWebhookLogs((data || []) as WebhookLog[]);
    setShowLogsDialog(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const toggleEventSelection = (eventValue: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Projeto desconhecido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks Externos</h3>
          <p className="text-sm text-muted-foreground">
            Receba notificações em tempo real sobre eventos do WhatsApp
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum webhook configurado</h3>
            <p className="text-muted-foreground mb-4">
              Configure webhooks para receber eventos em tempo real.
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={!webhook.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Webhook className="w-4 h-4" />
                      {webhook.name}
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs break-all">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => testWebhook(webhook)}
                      disabled={testingWebhook === webhook.id}
                      title="Testar webhook"
                    >
                      {testingWebhook === webhook.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewWebhookLogs(webhook)}
                      title="Ver histórico"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(webhook)}
                      title="Editar"
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook(webhook)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Events */}
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                    </Badge>
                  ))}
                </div>

                {/* Secret Key */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground min-w-[80px]">Secret:</Label>
                  <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono truncate">
                    {visibleSecrets[webhook.id] ? webhook.secret_key : '•'.repeat(24)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setVisibleSecrets(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}
                  >
                    {visibleSecrets[webhook.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(webhook.secret_key, 'Secret')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Projeto: {getProjectName(webhook.project_id)}</span>
                    <span>Retry: {webhook.max_retries}x ({webhook.retry_delay_seconds}s)</span>
                  </div>
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={() => toggleWebhookStatus(webhook)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber eventos em tempo real.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Notificações CRM"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Webhook *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://seu-servidor.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Projeto *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Eventos *</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.value}
                      checked={formData.events.includes(event.value)}
                      onCheckedChange={() => toggleEventSelection(event.value)}
                    />
                    <label htmlFor={event.value} className="text-sm cursor-pointer">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Tentativas de Retry</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_retries}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) || 3 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delay entre Retries (s)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.retry_delay_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_delay_seconds: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createWebhook}>
              Criar Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${event.value}`}
                      checked={formData.events.includes(event.value)}
                      onCheckedChange={() => toggleEventSelection(event.value)}
                    />
                    <label htmlFor={`edit-${event.value}`} className="text-sm cursor-pointer">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Tentativas de Retry</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_retries}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) || 3 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delay entre Retries (s)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.retry_delay_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, retry_delay_seconds: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateWebhook}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico do Webhook</DialogTitle>
            <DialogDescription>
              Últimas 50 chamadas para {selectedWebhook?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativa</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum log registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  webhookLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.response_status ? (
                          <Badge variant={log.response_status < 400 ? 'default' : 'destructive'}>
                            {log.response_status}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">—</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        #{log.attempt_number}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                        {log.error_message || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WAWebhooksManager;
