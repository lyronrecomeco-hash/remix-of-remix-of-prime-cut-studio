import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Phone,
  Building,
  DollarSign,
  Clock,
  Tag,
  MapPin,
  History,
  MessageSquare,
  CheckSquare,
  Edit,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  origin?: string | null;
  value?: number;
  status?: string;
  notes?: string | null;
  stage_id?: string | null;
  funnel_id?: string | null;
  responsible_id?: string | null;
  stage_entered_at?: string;
  created_at: string;
  updated_at?: string;
  stage?: { name: string; color: string } | null;
  responsible?: { name: string } | null;
  tags?: { id: string; name: string; color: string }[];
}

interface LeadHistory {
  id: string;
  action: string;
  created_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  notes: string | null;
  user?: { name: string } | null;
}

interface LeadTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface CRMLeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
}

export default function CRMLeadDetailModal({
  lead,
  isOpen,
  onClose,
  onEdit,
}: CRMLeadDetailModalProps) {
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      fetchHistory();
      fetchTasks();
    }
  }, [lead, isOpen]);

  const fetchHistory = async () => {
    if (!lead) return;
    setIsLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('crm_lead_history')
        .select(`
          id, action, created_at, old_value, new_value, notes,
          user:crm_users(name)
        `)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setHistory((data || []) as LeadHistory[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchTasks = async () => {
    if (!lead) return;
    setIsLoadingTasks(true);
    try {
      const { data } = await supabase
        .from('crm_tasks')
        .select('id, title, description, status, due_date, created_at')
        .eq('lead_id', lead.id)
        .order('due_date', { ascending: true })
        .limit(10);
      setTasks((data || []) as LeadTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      stage_changed: 'Movido de etapa',
      created: 'Lead criado',
      updated: 'Lead atualizado',
      note_added: 'Nota adicionada',
      task_created: 'Tarefa criada',
    };
    return labels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      new: { label: 'Novo', className: 'bg-blue-500/20 text-blue-400' },
      active: { label: 'Ativo', className: 'bg-green-500/20 text-green-400' },
      won: { label: 'Ganho', className: 'bg-emerald-500/20 text-emerald-400' },
      lost: { label: 'Perdido', className: 'bg-red-500/20 text-red-400' },
    };
    const cfg = config[status] || { label: status, className: '' };
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{lead.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(lead.status)}
                {lead.stage && (
                  <Badge
                    variant="outline"
                    style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                  >
                    {lead.stage.name}
                  </Badge>
                )}
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start px-6 pt-2 bg-transparent border-b rounded-none">
            <TabsTrigger value="info" className="gap-2">
              <User className="w-4 h-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Tarefas
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[60vh]">
            <TabsContent value="info" className="p-6 pt-4 space-y-4 m-0">
              {/* Contact Info */}
              <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{lead.company}</span>
                    </div>
                  )}
                  {lead.origin && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{lead.origin}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Value & Responsible */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      Valor
                    </div>
                    <p className="text-xl font-semibold text-primary">
                      {formatCurrency(Number(lead.value) || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <User className="w-4 h-4" />
                      Responsável
                    </div>
                    <p className="font-medium">{lead.responsible?.name || 'Não atribuído'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {lead.notes && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Notas
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Criado: {formatDate(lead.created_at)}
                </div>
                {lead.updated_at && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <div>Atualizado: {formatDate(lead.updated_at)}</div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6 pt-4 m-0">
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getActionLabel(item.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {item.action === 'stage_changed' && item.old_value && item.new_value && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            {(item.old_value as { stage_name?: string }).stage_name || 'Entrada'}
                          </span>
                          {' → '}
                          <span className="font-medium">
                            {(item.new_value as { stage_name?: string }).stage_name}
                          </span>
                        </p>
                      )}
                      {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
                      {item.user && (
                        <p className="text-xs text-muted-foreground mt-1">por {item.user.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum histórico encontrado</p>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="p-6 pt-4 m-0">
              {isLoadingTasks ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.status === 'pending'
                            ? 'Pendente'
                            : task.status === 'in_progress'
                            ? 'Em andamento'
                            : 'Concluída'}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Prazo: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma tarefa vinculada</p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
