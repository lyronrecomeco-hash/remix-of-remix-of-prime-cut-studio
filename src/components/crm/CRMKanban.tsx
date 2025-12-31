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
  Search,
  ChevronDown,
  Phone,
  Kanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CRMLeadDetailModal from './CRMLeadDetailModal';
import CRMLeadEditModal from './CRMLeadEditModal';
import CRMPageHeader from './CRMPageHeader';

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
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          id, name, email, phone, company, value, stage_id, funnel_id, responsible_id, stage_entered_at, created_at,
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
    toast({ title: 'Atualizado' });
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
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
    return leads.filter((l) => {
      const matchesStage = l.stage_id === stageId;
      const matchesSearch = searchTerm
        ? l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.phone?.includes(searchTerm)
        : true;
      return matchesStage && matchesSearch;
    });
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
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  const getSLAStatus = (enteredAt: string) => {
    const days = getDaysInStage(enteredAt);
    if (days >= SLA_CRITICAL_DAYS) return 'critical';
    if (days >= SLA_WARNING_DAYS) return 'warning';
    return 'ok';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (str: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const totalKanbanValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const currentFunnel = funnels.find(f => f.id === selectedFunnel);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <CRMPageHeader
        title="Pipeline de Vendas"
        icon={Kanban}
        actions={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentFunnel?.color }} />
                  {currentFunnel?.name || 'Pipeline'}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                {funnels.map((funnel) => (
                  <Button
                    key={funnel.id}
                    variant={funnel.id === selectedFunnel ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2 h-8 text-sm"
                    onClick={() => setSelectedFunnel(funnel.id)}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: funnel.color }} />
                    {funnel.name}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
            <Badge variant="secondary" className="h-6 text-xs">{leads.length} leads</Badge>
            <Badge variant="outline" className="h-6 text-xs text-primary">{formatCurrency(totalKanbanValue)}</Badge>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 w-40 text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8">
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        }
      />

      {/* Kanban Board - Auto-fit Grid (no horizontal scroll) */}
      {stages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 flex-1">
          {stages.map((stage) => {
            const stageLeads = getLeadsForStage(stage.id);
            const totalValue = getTotalValue(stage.id);

            return (
              <div
                key={stage.id}
                className="flex flex-col min-h-[400px] max-h-[calc(100vh-200px)]"
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                data-allow-drag="true"
              >
                {/* Column Header */}
                <div className={cn(
                  "p-2.5 rounded-t-lg border border-b-0 bg-card transition-all",
                  dragOverStage === stage.id && "ring-2 ring-primary bg-primary/5"
                )}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-medium text-xs truncate">{stage.name}</span>
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        {stageLeads.length}
                      </Badge>
                    </div>
                    {stage.is_final && (
                      <Badge variant={stage.is_won ? "default" : "destructive"} className="text-[10px] h-4 px-1">
                        {stage.is_won ? 'Ganho' : 'Perdido'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-primary">{formatCurrency(totalValue)}</p>
                </div>

                {/* Cards Container with internal scroll */}
                <ScrollArea className="flex-1 border border-t-0 rounded-b-lg bg-muted/20">
                  <div className="p-2 space-y-2">
                    <AnimatePresence>
                      {stageLeads.map((lead) => {
                        const slaStatus = getSLAStatus(lead.stage_entered_at || lead.created_at);
                        return (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, lead)}
                            className={cn(
                              'p-2.5 rounded-lg border bg-card cursor-grab active:cursor-grabbing',
                              'hover:shadow-md transition-all group',
                              draggedLead?.id === lead.id && 'opacity-50 scale-95',
                              slaStatus === 'critical' && 'border-l-2 border-l-red-500',
                              slaStatus === 'warning' && 'border-l-2 border-l-amber-500'
                            )}
                          >
                            {/* Lead Card Header */}
                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Avatar className="w-6 h-6 shrink-0">
                                  <AvatarFallback className={cn("text-[10px] text-white", getRandomColor(lead.name))}>
                                    {getInitials(lead.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs truncate">{lead.name}</p>
                                  {lead.company && (
                                    <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => { e.stopPropagation(); setViewLead(lead); }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => { e.stopPropagation(); setEditLead(lead); }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setViewLead(lead)}>
                                      <Eye className="w-3.5 h-3.5 mr-2" />Ver detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditLead(lead)}>
                                      <Edit className="w-3.5 h-3.5 mr-2" />Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => fetchLeadHistory(lead)}>
                                      <History className="w-3.5 h-3.5 mr-2" />Histórico
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Footer: Value + Time */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-primary flex items-center gap-0.5">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(Number(lead.value) || 0)}
                              </span>
                              <span className={cn(
                                "flex items-center gap-0.5 px-1 py-0.5 rounded",
                                slaStatus === 'critical' && 'text-red-500 bg-red-500/10',
                                slaStatus === 'warning' && 'text-amber-500 bg-amber-500/10',
                                slaStatus === 'ok' && 'text-muted-foreground'
                              )}>
                                {slaStatus === 'critical' && <AlertTriangle className="w-2.5 h-2.5" />}
                                <Clock className="w-2.5 h-2.5" />
                                {getTimeInStage(lead.stage_entered_at || lead.created_at)}
                              </span>
                            </div>

                            {/* Tags */}
                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 mt-1.5">
                                {lead.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-3.5"
                                    style={{ borderColor: tag.color, color: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {lead.tags.length > 2 && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
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
                      <div className="py-6 text-center text-[10px] text-muted-foreground border-2 border-dashed rounded-lg">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-40" />
                        Arraste leads
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center border rounded-lg bg-card">
          <p className="text-muted-foreground text-sm mb-3">Nenhuma etapa configurada</p>
          <Button variant="outline" size="sm">Configurar Funil</Button>
        </div>
      )}

      {/* Lead History Dialog */}
      <Dialog open={!!selectedLeadHistory} onOpenChange={() => setSelectedLeadHistory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <History className="w-4 h-4" />
              Histórico: {selectedLeadHistory?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[350px] pr-3">
            {isHistoryLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : leadHistory.length > 0 ? (
              <div className="space-y-2">
                {leadHistory.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <Badge variant="outline" className="text-[10px] h-4">
                        {item.action === 'stage_changed' ? 'Movido' : item.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {item.action === 'stage_changed' && item.old_value && item.new_value && (
                      <p className="text-xs">
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        por {item.user.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-6">
                Nenhum histórico
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <CRMLeadDetailModal
        lead={viewLead}
        isOpen={!!viewLead}
        onClose={() => setViewLead(null)}
        onEdit={(lead) => {
          setViewLead(null);
          setEditLead(lead);
        }}
      />

      {/* Lead Edit Modal */}
      <CRMLeadEditModal
        lead={editLead}
        isOpen={!!editLead}
        onClose={() => setEditLead(null)}
        onSave={() => {
          setEditLead(null);
          fetchStagesAndLeads();
        }}
      />
    </div>
  );
}
