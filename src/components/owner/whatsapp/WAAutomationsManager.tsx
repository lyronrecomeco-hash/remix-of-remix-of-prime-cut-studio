import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Settings2,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Check,
  X,
  Clock,
  MessageSquare,
  Webhook,
  Timer,
  ArrowRight,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomationRule {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: any;
  conditions: any[];
  actions: any[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface APIProject {
  id: string;
  name: string;
}

interface WhatsAppInstance {
  id: string;
  name: string;
}

const TRIGGER_TYPES = [
  { value: 'external_event', label: 'Evento Externo (API)', icon: Webhook },
  { value: 'message_received', label: 'Mensagem Recebida', icon: MessageSquare },
  { value: 'schedule', label: 'Agendamento', icon: Clock },
  { value: 'webhook', label: 'Webhook Recebido', icon: Zap },
];

const ACTION_TYPES = [
  { value: 'send_message', label: 'Enviar Mensagem', icon: MessageSquare },
  { value: 'call_webhook', label: 'Chamar Webhook', icon: Webhook },
  { value: 'delay', label: 'Aguardar', icon: Timer },
  { value: 'update_status', label: 'Atualizar Status', icon: RefreshCw },
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
];

const WAAutomationsManager = () => {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [projects, setProjects] = useState<APIProject[]>([]);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    trigger_type: 'external_event',
    trigger_config: {} as any,
    conditions: [] as any[],
    actions: [] as any[],
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [automationsRes, projectsRes, instancesRes] = await Promise.all([
        supabase.from('whatsapp_automation_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_api_projects').select('id, name').eq('is_active', true),
        supabase.from('whatsapp_instances').select('id, name')
      ]);

      setAutomations((automationsRes.data || []) as AutomationRule[]);
      setProjects((projectsRes.data || []) as APIProject[]);
      setInstances((instancesRes.data || []) as WhatsAppInstance[]);
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      project_id: '',
      trigger_type: 'external_event',
      trigger_config: {},
      conditions: [],
      actions: [],
      is_active: true
    });
  };

  const createAutomation = async () => {
    if (!formData.name || !formData.project_id || formData.actions.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e adicione pelo menos uma ação');
      return;
    }

    try {
      const { error } = await supabase.from('whatsapp_automation_rules').insert({
        name: formData.name,
        description: formData.description || null,
        project_id: formData.project_id,
        trigger_type: formData.trigger_type,
        trigger_config: formData.trigger_config,
        conditions: formData.conditions,
        actions: formData.actions,
        is_active: formData.is_active
      });

      if (error) throw error;

      toast.success('Automação criada com sucesso!');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      toast.error('Erro ao criar automação');
    }
  };

  const updateAutomation = async () => {
    if (!selectedAutomation) return;

    try {
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({
          name: formData.name,
          description: formData.description || null,
          trigger_type: formData.trigger_type,
          trigger_config: formData.trigger_config,
          conditions: formData.conditions,
          actions: formData.actions,
          is_active: formData.is_active
        })
        .eq('id', selectedAutomation.id);

      if (error) throw error;

      toast.success('Automação atualizada!');
      setShowEditDialog(false);
      setSelectedAutomation(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar automação:', error);
      toast.error('Erro ao atualizar automação');
    }
  };

  const deleteAutomation = async (automation: AutomationRule) => {
    if (!confirm(`Excluir automação "${automation.name}"?`)) return;

    try {
      const { error } = await supabase.from('whatsapp_automation_rules').delete().eq('id', automation.id);
      if (error) throw error;

      toast.success('Automação excluída!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      toast.error('Erro ao excluir automação');
    }
  };

  const toggleAutomationStatus = async (automation: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({ is_active: !automation.is_active })
        .eq('id', automation.id);

      if (error) throw error;

      toast.success(automation.is_active ? 'Automação pausada' : 'Automação ativada');
      fetchData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const openEditDialog = (automation: AutomationRule) => {
    setSelectedAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || '',
      project_id: automation.project_id,
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config || {},
      conditions: automation.conditions || [],
      actions: automation.actions || [],
      is_active: automation.is_active
    });
    setShowEditDialog(true);
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'send_message', config: {} }]
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, config: { ...action.config, [key]: value } } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Projeto desconhecido';
  };

  const getTriggerLabel = (triggerType: string) => {
    return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType;
  };

  const getTriggerIcon = (triggerType: string) => {
    const TriggerIcon = TRIGGER_TYPES.find(t => t.value === triggerType)?.icon || Zap;
    return TriggerIcon;
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
          <h3 className="text-lg font-semibold">Automações</h3>
          <p className="text-sm text-muted-foreground">
            Crie fluxos automáticos baseados em eventos
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma automação configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie automações para executar ações automaticamente.
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation) => {
            const TriggerIcon = getTriggerIcon(automation.trigger_type);
            return (
              <Card key={automation.id} className={!automation.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {automation.name}
                        <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                          {automation.is_active ? 'Ativa' : 'Pausada'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {automation.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAutomationStatus(automation)}
                        title={automation.is_active ? 'Pausar' : 'Ativar'}
                      >
                        {automation.is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(automation)}
                        title="Editar"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAutomation(automation)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Flow visualization */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="gap-1">
                      <TriggerIcon className="w-3 h-3" />
                      {getTriggerLabel(automation.trigger_type)}
                    </Badge>
                    {automation.conditions?.length > 0 && (
                      <>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="secondary" className="gap-1">
                          <Layers className="w-3 h-3" />
                          {automation.conditions.length} condição(ões)
                        </Badge>
                      </>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="w-3 h-3" />
                      {automation.actions?.length || 0} ação(ões)
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Projeto: {getProjectName(automation.project_id)}</span>
                      <span>Execuções: {automation.execution_count}</span>
                      {automation.last_executed_at && (
                        <span>
                          Última: {format(new Date(automation.last_executed_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={() => toggleAutomationStatus(automation)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedAutomation(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAutomation ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
            <DialogDescription>
              Configure o gatilho, condições e ações da automação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Resposta automática"
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
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que essa automação faz..."
                rows={2}
              />
            </div>

            {/* Trigger */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Gatilho
              </Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, trigger_type: v, trigger_config: {} }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div className="flex items-center gap-2">
                        <trigger.icon className="w-4 h-4" />
                        {trigger.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.trigger_type === 'external_event' && (
                <div className="space-y-2">
                  <Label className="text-xs">Nome do Evento (opcional)</Label>
                  <Input
                    value={formData.trigger_config.eventType || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trigger_config: { ...prev.trigger_config, eventType: e.target.value } 
                    }))}
                    placeholder="Ex: new_order, payment_received"
                  />
                </div>
              )}

              {formData.trigger_type === 'message_received' && (
                <div className="space-y-2">
                  <Label className="text-xs">Palavra-chave (opcional)</Label>
                  <Input
                    value={formData.trigger_config.keyword || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trigger_config: { ...prev.trigger_config, keyword: e.target.value } 
                    }))}
                    placeholder="Ex: oi, menu, ajuda"
                  />
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Condições (opcional)
                </Label>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {formData.conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma condição. A automação executará sempre que o gatilho ocorrer.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        placeholder="Campo"
                        className="flex-1"
                      />
                      <Select
                        value={condition.operator}
                        onValueChange={(v) => updateCondition(index, 'operator', v)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Valor"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  Ações *
                </Label>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Adicione pelo menos uma ação para a automação executar.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Ação #{index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Select
                        value={action.type}
                        onValueChange={(v) => updateAction(index, 'type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((actionType) => (
                            <SelectItem key={actionType.value} value={actionType.value}>
                              <div className="flex items-center gap-2">
                                <actionType.icon className="w-4 h-4" />
                                {actionType.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {action.type === 'send_message' && (
                        <div className="space-y-2">
                          <Select
                            value={action.config?.instanceId || ''}
                            onValueChange={(v) => updateActionConfig(index, 'instanceId', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a instância" />
                            </SelectTrigger>
                            <SelectContent>
                              {instances.map((instance) => (
                                <SelectItem key={instance.id} value={instance.id}>
                                  {instance.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={action.config?.to || ''}
                            onChange={(e) => updateActionConfig(index, 'to', e.target.value)}
                            placeholder="Destinatário (ou {{from}} para responder)"
                          />
                          <Textarea
                            value={action.config?.message || ''}
                            onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                            placeholder="Mensagem (use {{campo}} para variáveis)"
                            rows={2}
                          />
                        </div>
                      )}

                      {action.type === 'call_webhook' && (
                        <div className="space-y-2">
                          <Input
                            value={action.config?.url || ''}
                            onChange={(e) => updateActionConfig(index, 'url', e.target.value)}
                            placeholder="URL do webhook"
                          />
                          <Select
                            value={action.config?.method || 'POST'}
                            onValueChange={(v) => updateActionConfig(index, 'method', v)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {action.type === 'delay' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Segundos de espera</Label>
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={action.config?.seconds || 5}
                            onChange={(e) => updateActionConfig(index, 'seconds', parseInt(e.target.value) || 5)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              setSelectedAutomation(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={selectedAutomation ? updateAutomation : createAutomation}>
              {selectedAutomation ? 'Salvar' : 'Criar Automação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WAAutomationsManager;
