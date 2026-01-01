import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Zap,
  MessageSquare,
  Clock,
  Hash,
  Users,
  AlertTriangle,
  Play,
  Pause,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';

interface Automation {
  id: string;
  instance_id: string | null;
  name: string;
  trigger_type: string;
  trigger_keywords: string[];
  response_type: string;
  response_content: string | null;
  response_buttons: any;
  response_list: any;
  delay_seconds: number;
  is_active: boolean;
  priority: number;
  match_count: number;
  created_at: string;
}

interface BusinessHours {
  id: string;
  instance_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AwayMessage {
  id: string;
  instance_id: string;
  message_text: string;
  is_active: boolean;
  send_once_per_contact: boolean;
}

interface WAAutomationsProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

const TRIGGER_TYPES = [
  { value: 'keyword', label: 'Palavra-chave', icon: Hash },
  { value: 'all', label: 'Todas as mensagens', icon: MessageSquare },
  { value: 'first_contact', label: 'Primeiro contato', icon: Users },
  { value: 'business_hours', label: 'Horário comercial', icon: Clock },
  { value: 'inactivity', label: 'Inatividade', icon: AlertTriangle },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const WAAutomations = ({ instances }: WAAutomationsProps) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [awayMessage, setAwayMessage] = useState<AwayMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formTriggerType, setFormTriggerType] = useState('keyword');
  const [formKeywords, setFormKeywords] = useState('');
  const [formResponse, setFormResponse] = useState('');
  const [formDelay, setFormDelay] = useState(0);
  const [formInstance, setFormInstance] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Away message form
  const [awayText, setAwayText] = useState('');
  const [awayActive, setAwayActive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [automationsRes, hoursRes, awayRes] = await Promise.all([
        supabase.from('whatsapp_automations').select('*').order('priority', { ascending: true }),
        supabase.from('whatsapp_business_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('whatsapp_away_messages').select('*').limit(1).maybeSingle(),
      ]);

      if (automationsRes.error) throw automationsRes.error;
      if (hoursRes.error) throw hoursRes.error;

      setAutomations((automationsRes.data || []) as Automation[]);
      setBusinessHours((hoursRes.data || []) as BusinessHours[]);
      
      if (awayRes.data) {
        setAwayMessage(awayRes.data as AwayMessage);
        setAwayText(awayRes.data.message_text);
        setAwayActive(awayRes.data.is_active);
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setEditingAutomation(null);
    setFormName('');
    setFormTriggerType('keyword');
    setFormKeywords('');
    setFormResponse('');
    setFormDelay(0);
    setFormInstance('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormName(automation.name);
    setFormTriggerType(automation.trigger_type);
    setFormKeywords(automation.trigger_keywords.join(', '));
    setFormResponse(automation.response_content || '');
    setFormDelay(automation.delay_seconds);
    setFormInstance(automation.instance_id || '');
    setIsDialogOpen(true);
  };

  const saveAutomation = async () => {
    if (!formName.trim() || !formResponse.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: formName,
        trigger_type: formTriggerType,
        trigger_keywords: formKeywords.split(',').map(k => k.trim()).filter(Boolean),
        response_type: 'text',
        response_content: formResponse,
        delay_seconds: formDelay,
        instance_id: formInstance || null,
      };

      if (editingAutomation) {
        const { error } = await supabase
          .from('whatsapp_automations')
          .update(data)
          .eq('id', editingAutomation.id);
        if (error) throw error;
        toast.success('Automação atualizada!');
      } else {
        const { error } = await supabase
          .from('whatsapp_automations')
          .insert(data);
        if (error) throw error;
        toast.success('Automação criada!');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving automation:', error);
      toast.error('Erro ao salvar automação');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutomation = async (automation: Automation) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automations')
        .update({ is_active: !automation.is_active })
        .eq('id', automation.id);
      if (error) throw error;
      toast.success(automation.is_active ? 'Automação desativada' : 'Automação ativada');
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar automação');
    }
  };

  const deleteAutomation = async (id: string) => {
    try {
      const { error } = await supabase.from('whatsapp_automations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Automação removida');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover automação');
    }
  };

  const saveAwayMessage = async () => {
    try {
      if (awayMessage) {
        await supabase
          .from('whatsapp_away_messages')
          .update({ message_text: awayText, is_active: awayActive })
          .eq('id', awayMessage.id);
      } else {
        await supabase
          .from('whatsapp_away_messages')
          .insert({
            instance_id: instances[0]?.id,
            message_text: awayText,
            is_active: awayActive,
          });
      }
      toast.success('Mensagem de ausência salva!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const updateBusinessHours = async (dayOfWeek: number, field: string, value: any) => {
    const existing = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    try {
      if (existing) {
        await supabase
          .from('whatsapp_business_hours')
          .update({ [field]: value })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('whatsapp_business_hours')
          .insert({
            instance_id: instances[0]?.id,
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '18:00',
            [field]: value,
          });
      }
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar horário');
    }
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
      {/* Automations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Respostas Automáticas
              </CardTitle>
              <CardDescription>
                Configure respostas automáticas por palavra-chave ou evento
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Automação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingAutomation ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
                  <DialogDescription>
                    Configure quando e como responder automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Boas-vindas"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gatilho</Label>
                    <Select value={formTriggerType} onValueChange={setFormTriggerType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formTriggerType === 'keyword' && (
                    <div className="space-y-2">
                      <Label>Palavras-chave (separadas por vírgula)</Label>
                      <Input
                        placeholder="oi, olá, bom dia, boa tarde"
                        value={formKeywords}
                        onChange={(e) => setFormKeywords(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Resposta</Label>
                    <Textarea
                      placeholder="Olá! Como posso ajudar?"
                      value={formResponse}
                      onChange={(e) => setFormResponse(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delay (segundos)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formDelay}
                      onChange={(e) => setFormDelay(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo de espera antes de enviar a resposta
                    </p>
                  </div>
                  {instances.length > 1 && (
                    <div className="space-y-2">
                      <Label>Instância (opcional)</Label>
                      <Select value={formInstance} onValueChange={setFormInstance}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as instâncias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas</SelectItem>
                          {instances.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={saveAutomation} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma automação configurada</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {automations.map((auto) => {
                  const triggerInfo = TRIGGER_TYPES.find(t => t.value === auto.trigger_type);
                  const TriggerIcon = triggerInfo?.icon || Zap;
                  
                  return (
                    <div
                      key={auto.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        auto.is_active ? '' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          auto.is_active ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <TriggerIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{auto.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {triggerInfo?.label}
                            </Badge>
                            {auto.trigger_keywords.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {auto.trigger_keywords.slice(0, 3).join(', ')}
                                {auto.trigger_keywords.length > 3 && '...'}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              • {auto.match_count} matches
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleAutomation(auto)}>
                          {auto.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(auto)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAutomation(auto.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Defina quando o atendimento está disponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(({ value, label }) => {
                const hours = businessHours.find(h => h.day_of_week === value);
                return (
                  <div key={value} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={hours?.is_active ?? false}
                        onCheckedChange={(checked) => updateBusinessHours(value, 'is_active', checked)}
                      />
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours?.start_time || '09:00'}
                        onChange={(e) => updateBusinessHours(value, 'start_time', e.target.value)}
                        className="w-28"
                        disabled={!hours?.is_active}
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={hours?.end_time || '18:00'}
                        onChange={(e) => updateBusinessHours(value, 'end_time', e.target.value)}
                        className="w-28"
                        disabled={!hours?.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Away Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Mensagem de Ausência
            </CardTitle>
            <CardDescription>
              Enviada fora do horário de funcionamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ativar mensagem de ausência</Label>
              <Switch checked={awayActive} onCheckedChange={setAwayActive} />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá! No momento estamos fora do horário de atendimento..."
                value={awayText}
                onChange={(e) => setAwayText(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={saveAwayMessage} className="w-full">
              Salvar Mensagem
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
