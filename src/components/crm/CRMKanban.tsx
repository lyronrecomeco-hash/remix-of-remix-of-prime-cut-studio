import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  User,
  DollarSign,
  Clock,
  Edit,
  Eye,
  AlertTriangle,
  TrendingUp,
  History,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  value: number;
  stage_id: string | null;
  funnel_id: string | null;
  responsible_id: string | null;
  stage_entered_at: string;
  created_at: string;
  priority?: number;
  responsible?: { name: string } | null;
  tags?: { id: string; name: string; color: string }[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_final: boolean;
  is_won: boolean;
  funnel_id: string;
}

interface Funnel {
  id: string;
  name: string;
  color: string;
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

const SLA_WARNING_DAYS = 3;
const SLA_CRITICAL_DAYS = 7;

export default function CRMKanban() {
  const { crmTenant, crmUser } = useCRM();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedLeadHistory, setSelectedLeadHistory] = useState<Lead | null>(null);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Real-time subscription
  useEffect(() => {
    if (!crmTenant || !selectedFunnel) return;

    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_leads',
          filter: `crm_tenant_id=eq.${crmTenant.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLead = payload.new as Lead;
            if (newLead.funnel_id === selectedFunnel) {
              setLeads((prev) => [...prev, { ...newLead, tags: [] }]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) =>
                l.id === payload.new.id ? { ...l, ...payload.new } : l
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crmTenant, selectedFunnel]);

  useEffect(() => {
    if (crmTenant) {
      fetchFunnels();
    }
  }, [crmTenant]);

  useEffect(() => {
    if (selectedFunnel) {
      fetchStagesAndLeads();
    }
  }, [selectedFunnel]);

  const fetchFunnels = async () => {
    if (!crmTenant) return;

    try {
      const { data } = await supabase
        .from('crm_funnels')
        .select('id, name, color')
        .eq('crm_tenant_id', crmTenant.id)
        .eq('is_active', true)
        .order('position');

      setFunnels(data || []);
      if (data && data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching funnels:', error);
    }
  };

  const fetchStagesAndLeads = async () => {
    if (!crmTenant || !selectedFunnel) return;

    try {
      setIsLoading(true);

      const { data: stagesData } = await supabase
        .from('crm_funnel_stages')
        .select('*')
        .eq('crm_tenant_id', crmTenant.id)
        .eq('funnel_id', selectedFunnel)
        .order('position');

      setStages(stagesData || []);

      const { data: leadsData } = await supabase
        .from('crm_leads')
        .select(`
          id, name, email, phone, value, stage_id, funnel_id, responsible_id, stage_entered_at, created_at,
          responsible:crm_users!crm_leads_responsible_id_fkey(name)
        `)
        .eq('crm_tenant_id', crmTenant.id)
        .eq('funnel_id', selectedFunnel)
        .in('status', ['new', 'active']);

      if (leadsData) {
        const leadIds = leadsData.map((l) => l.id);
        const { data: leadTagsData } = await supabase
          .from('crm_lead_tags')
          .select('lead_id, tag:crm_tags(id, name, color)')
          .in('lead_id', leadIds);

        const leadsWithTags = leadsData.map((lead) => ({
          ...lead,
          tags: leadTagsData
            ?.filter((lt) => lt.lead_id === lead.id)
            .map((lt) => lt.tag as unknown as { id: string; name: string; color: string })
            .filter(Boolean) || [],
        }));

        setLeads(leadsWithTags as Lead[]);
      }
    } catch (error) {
      console.error('Error fetching kanban data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStagesAndLeads();
    setIsRefreshing(false);
    toast({ title: 'Kanban atualizado' });
  };

  const fetchLeadHistory = async (lead: Lead) => {
    setSelectedLeadHistory(lead);
    setIsHistoryLoading(true);
    
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

      setLeadHistory((data || []) as LeadHistory[]);
    } catch (error) {
      console.error('Error fetching lead history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedLead || draggedLead.stage_id === stageId) {
      setDraggedLead(null);
      return;
    }

    const stage = stages.find((s) => s.id === stageId);
    const oldStage = stages.find((s) => s.id === draggedLead.stage_id);
    if (!stage) return;

    try {
      const updateData: Record<string, unknown> = {
        stage_id: stageId,
        stage_entered_at: new Date().toISOString(),
      };

      if (stage.is_final) {
        updateData.status = stage.is_won ? 'won' : 'lost';
        if (stage.is_won) {
          updateData.won_at = new Date().toISOString();
        } else {
          updateData.lost_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('crm_leads')
        .update(updateData)
        .eq('id', draggedLead.id);

      if (error) throw error;

      await supabase.from('crm_lead_history').insert({
        crm_tenant_id: crmTenant?.id,
        lead_id: draggedLead.id,
        user_id: crmUser?.id,
        action: 'stage_changed',
        old_value: { stage_id: draggedLead.stage_id, stage_name: oldStage?.name },
        new_value: { stage_id: stageId, stage_name: stage.name },
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === draggedLead.id
            ? { ...l, stage_id: stageId, stage_entered_at: new Date().toISOString() }
            : l
        ).filter((l) => !stage.is_final || l.id !== draggedLead.id)
      );

      toast({
        title: 'Lead movido',
        description: `${draggedLead.name} → ${stage.name}`,
      });
    } catch (error) {
      console.error('Error moving lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível mover o lead',
        variant: 'destructive',
      });
    } finally {
      setDraggedLead(null);
    }
  };

  const getLeadsForStage = (stageId: string) => {
    return leads.filter((l) => l.stage_id === stageId);
  };

  const getTotalValue = (stageId: string) => {
    return getLeadsForStage(stageId).reduce(
      (sum, l) => sum + (Number(l.value) || 0),
      0
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const getDaysInStage = (enteredAt: string) => {
    const now = new Date();
    const entered = new Date(enteredAt);
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTimeInStage = (enteredAt: string) => {
    const diffDays = getDaysInStage(enteredAt);
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia';
    return `${diffDays} dias`;
  };

  const getSLAStatus = (enteredAt: string) => {
    const days = getDaysInStage(enteredAt);
    if (days >= SLA_CRITICAL_DAYS) return 'critical';
    if (days >= SLA_WARNING_DAYS) return 'warning';
    return 'ok';
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-muted-foreground';
    }
  };

  const getStageProgress = (stageIndex: number) => {
    return ((stageIndex + 1) / stages.length) * 100;
  };

  const totalKanbanValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-60" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} leads • {formatCurrency(totalKanbanValue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8 p-0">
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: funnel.color }} />
                    {funnel.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Summary - More compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stages.slice(0, 4).map((stage) => {
          const stageLeads = getLeadsForStage(stage.id);
          const stageValue = getTotalValue(stage.id);
          return (
            <Card key={stage.id} className="border-l-2" style={{ borderLeftColor: stage.color }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground truncate">{stage.name}</span>
                  <Badge variant="secondary" className="h-5 text-xs">{stageLeads.length}</Badge>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(stageValue)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      {stages.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-3 min-h-[450px]">
          {stages.map((stage, stageIndex) => {
            const stageLeads = getLeadsForStage(stage.id);
            const totalValue = getTotalValue(stage.id);
            const criticalLeads = stageLeads.filter(l => getSLAStatus(l.stage_entered_at) === 'critical').length;

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0"
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <Card
                  className={cn(
                    'h-full transition-all duration-200',
                    dragOverStage === stage.id && 'ring-2 ring-primary shadow-lg scale-[1.02]'
                  )}
                >
                  <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <CardTitle className="text-base">{stage.name}</CardTitle>
                        <Badge variant="secondary">{stageLeads.length}</Badge>
                        {criticalLeads > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">
                            {criticalLeads} atrasados
                          </Badge>
                        )}
                      </div>
                      {stage.is_final && (
                        <Badge variant={stage.is_won ? "default" : "destructive"} className="text-[10px]">
                          {stage.is_won ? 'Ganho' : 'Perdido'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valor total</span>
                        <span className="font-semibold text-primary">{formatCurrency(totalValue)}</span>
                      </div>
                      <Progress value={getStageProgress(stageIndex)} className="h-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                    <AnimatePresence>
                      {stageLeads.map((lead) => {
                        const slaStatus = getSLAStatus(lead.stage_entered_at);
                        return (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, lead)}
                            className={cn(
                              'p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing',
                              'hover:shadow-md transition-all',
                              draggedLead?.id === lead.id && 'opacity-50 scale-95',
                              slaStatus === 'critical' && 'border-red-500/50',
                              slaStatus === 'warning' && 'border-amber-500/50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{lead.name}</p>
                                {lead.email && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lead.email}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => fetchLeadHistory(lead)}>
                                    <History className="w-4 h-4 mr-2" />
                                    Ver histórico
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between mt-3 text-xs">
                              <div className="flex items-center gap-1 text-primary font-medium">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(Number(lead.value) || 0)}
                              </div>
                              <div className={cn(
                                'flex items-center gap-1 px-1.5 py-0.5 rounded',
                                getSLAColor(slaStatus)
                              )}>
                                {slaStatus === 'critical' && <AlertTriangle className="w-3 h-3" />}
                                <Clock className="w-3 h-3" />
                                {getTimeInStage(lead.stage_entered_at)}
                              </div>
                            </div>

                            {lead.responsible && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {lead.responsible.name}
                              </div>
                            )}

                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {lead.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                    style={{
                                      borderColor: tag.color,
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {lead.tags.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    +{lead.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Arraste leads para cá
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma etapa configurada neste funil
            </p>
            <Button variant="outline">Configurar Funil</Button>
          </CardContent>
        </Card>
      )}

      {/* Lead History Dialog */}
      <Dialog open={!!selectedLeadHistory} onOpenChange={() => setSelectedLeadHistory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico: {selectedLeadHistory?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {isHistoryLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : leadHistory.length > 0 ? (
              <div className="space-y-3">
                {leadHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.action === 'stage_changed' ? 'Movido' : item.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
                    {item.user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        por {item.user.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico encontrado
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
