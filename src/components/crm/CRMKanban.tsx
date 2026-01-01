import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
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
  Sparkles,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  priority?: 'high' | 'medium' | 'low';
  aiScore?: number;
  aiInsight?: string;
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

// Simulate AI scores for demo purposes
const generateAIScore = (lead: Lead): number => {
  const baseScore = lead.value ? Math.min(lead.value / 10000, 0.5) : 0.3;
  const hasEmail = lead.email ? 0.15 : 0;
  const hasPhone = lead.phone ? 0.15 : 0;
  const hasCompany = lead.company ? 0.1 : 0;
  return Math.min(Math.round((baseScore + hasEmail + hasPhone + hasCompany) * 100), 95);
};

const generateAIInsight = (lead: Lead, score: number): string => {
  if (score >= 70) return "Alta probabilidade de conversão. Recomendado contato imediato.";
  if (score >= 50) return "Potencial moderado. Sugerido follow-up em 24h.";
  return "Necessita qualificação adicional antes de avançar.";
};

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

        const leadsWithTags = leadsData.map((lead) => {
          const aiScore = generateAIScore(lead as Lead);
          return {
            ...lead,
            priority: aiScore >= 70 ? 'high' : aiScore >= 50 ? 'medium' : 'low',
            aiScore,
            aiInsight: generateAIInsight(lead as Lead, aiScore),
            tags: leadTagsData
              ?.filter((lt) => lt.lead_id === lead.id)
              .map((lt) => lt.tag as unknown as { id: string; name: string; color: string })
              .filter(Boolean) || [],
          };
        });

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
    toast({ title: 'Pipeline atualizado' });
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

  const formatCurrencyK = (value: number) => {
    if (value >= 1000) {
      return `R$${(value / 1000).toFixed(1)}k`;
    }
    return `R$${value.toFixed(0)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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

  const getPriorityStyles = (priority: 'high' | 'medium' | 'low' | undefined) => {
    switch (priority) {
      case 'high':
        return 'border-l-rose-500 bg-rose-500';
      case 'medium':
        return 'border-l-amber-500 bg-amber-500';
      case 'low':
        return 'border-l-emerald-500 bg-emerald-500';
      default:
        return 'border-l-slate-300 bg-slate-300';
    }
  };

  const totalKanbanValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const currentFunnel = funnels.find(f => f.id === selectedFunnel);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[500px] w-[320px] shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pipeline de Vendas</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentFunnel?.color || '#6366f1' }} />
                  <span className="font-medium">{currentFunnel?.name || 'Pipeline'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1.5" align="start">
                {funnels.map((funnel) => (
                  <Button
                    key={funnel.id}
                    variant={funnel.id === selectedFunnel ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2.5 h-9"
                    onClick={() => setSelectedFunnel(funnel.id)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: funnel.color }} />
                    {funnel.name}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="h-7 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-700">
              {leads.length} leads
            </Badge>
            <Badge className="h-7 px-3 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600">
              {formatCurrencyK(totalKanbanValue)} total
            </Badge>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 w-48 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing} 
              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board - Horizontal Scroll */}
      {stages.length > 0 ? (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 min-w-max h-full">
            {stages.map((stage) => {
              const stageLeads = getLeadsForStage(stage.id);
              const totalValue = getTotalValue(stage.id);
              const isDropTarget = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex flex-col w-[320px] shrink-0 transition-all duration-200",
                    isDropTarget && "scale-[1.01]"
                  )}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  data-allow-drag="true"
                >
                  {/* Column Header - Intelligent */}
                  <div className={cn(
                    "p-4 rounded-t-xl border border-b-0 bg-white dark:bg-slate-800 transition-all",
                    isDropTarget && "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: stage.color }} 
                        />
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                          {stage.name}
                        </span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-2 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700"
                      >
                        {stageLeads.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrencyK(totalValue)}
                      </span>
                      {stage.is_final && (
                        <Badge 
                          className={cn(
                            "text-[10px] h-5 px-2",
                            stage.is_won 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {stage.is_won ? '✓ Ganho' : '✕ Perdido'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Cards Container */}
                  <ScrollArea className={cn(
                    "flex-1 border border-t-0 rounded-b-xl min-h-[400px] max-h-[calc(100vh-280px)] transition-colors",
                    isDropTarget 
                      ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-600" 
                      : "bg-slate-100/50 dark:bg-slate-800/30"
                  )}>
                    <div className="p-3 space-y-3">
                      <AnimatePresence>
                        {stageLeads.map((lead) => {
                          const slaStatus = getSLAStatus(lead.stage_entered_at || lead.created_at);
                          const aiScore = lead.aiScore || generateAIScore(lead);
                          const isHighScore = aiScore >= 70;

                          return (
                            <motion.div
                              key={lead.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              draggable
                              data-allow-drag="true"
                              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, lead)}
                              className={cn(
                                'relative rounded-xl bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing select-none overflow-hidden',
                                'border border-slate-200 dark:border-slate-700',
                                'hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200 group',
                                draggedLead?.id === lead.id && 'opacity-40 scale-95 ring-2 ring-indigo-500',
                              )}
                            >
                              {/* Priority Indicator Bar */}
                              <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1",
                                getPriorityStyles(lead.priority as 'high' | 'medium' | 'low')
                              )} />

                              <div className="p-4 pl-5">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                                      {lead.company || lead.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {lead.company ? lead.name : (lead.email || lead.phone || 'Sem contato')}
                                    </p>
                                  </div>

                                  {/* AI Smart Badge */}
                                  <div className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0",
                                    isHighScore 
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                  )}>
                                    <Sparkles className="w-3 h-3" />
                                    <span>{aiScore}%</span>
                                    {isHighScore && (
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* AI Insight Block */}
                                <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50">
                                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                    {lead.aiInsight || generateAIInsight(lead, aiScore)}
                                  </p>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                      {formatCurrency(Number(lead.value) || 0)}
                                    </span>
                                  </div>
                                  <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                                    slaStatus === 'critical' && 'bg-red-50 dark:bg-red-900/20',
                                    slaStatus === 'warning' && 'bg-amber-50 dark:bg-amber-900/20',
                                    slaStatus === 'ok' && 'bg-slate-50 dark:bg-slate-700/50'
                                  )}>
                                    <Clock className={cn(
                                      "w-3.5 h-3.5",
                                      slaStatus === 'critical' && 'text-red-500',
                                      slaStatus === 'warning' && 'text-amber-500',
                                      slaStatus === 'ok' && 'text-slate-400'
                                    )} />
                                    <span className={cn(
                                      "text-xs font-medium",
                                      slaStatus === 'critical' && 'text-red-700 dark:text-red-400',
                                      slaStatus === 'warning' && 'text-amber-700 dark:text-amber-400',
                                      slaStatus === 'ok' && 'text-slate-600 dark:text-slate-300'
                                    )}>
                                      {getTimeInStage(lead.stage_entered_at || lead.created_at)}
                                    </span>
                                    {slaStatus === 'critical' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                  </div>
                                </div>

                                {/* AI Progress Bar */}
                                <div className="mb-2">
                                  <Progress 
                                    value={aiScore} 
                                    className="h-1.5 bg-slate-100 dark:bg-slate-700"
                                  />
                                </div>

                                {/* Quick Actions (visible on hover) */}
                                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-1">
                                    {lead.phone && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                      </Button>
                                    )}
                                    {lead.email && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => { e.stopPropagation(); setViewLead(lead); }}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => { e.stopPropagation(); setEditLead(lead); }}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                          <MoreHorizontal className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => setViewLead(lead)}>
                                          <Eye className="w-4 h-4 mr-2" />Ver detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditLead(lead)}>
                                          <Edit className="w-4 h-4 mr-2" />Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => fetchLeadHistory(lead)}>
                                          <History className="w-4 h-4 mr-2" />Ver histórico
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {stageLeads.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Arraste leads para cá
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Nenhum funil configurado</p>
            <Button className="bg-indigo-500 hover:bg-indigo-600">Configurar Funil</Button>
          </div>
        </div>
      )}

      {/* Lead History Dialog */}
      <Dialog open={!!selectedLeadHistory} onOpenChange={() => setSelectedLeadHistory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Histórico: {selectedLeadHistory?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-3">
            {isHistoryLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : leadHistory.length > 0 ? (
              <div className="space-y-3">
                {leadHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.action === 'stage_changed' ? 'Movido' : item.action}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
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
                        <span className="font-semibold">
                          {(item.new_value as { stage_name?: string }).stage_name}
                        </span>
                      </p>
                    )}
                    {item.user && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        por {item.user.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico registrado
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
