import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckSquare,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Clock,
  Activity,
  Zap,
  Star,
  BarChart3,
  PieChart as PieIcon,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { StatCard, ProgressStat } from './CRMQuickStats';

interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  pendingTasks: number;
  overdueTasks: number;
  totalValue: number;
  wonValue: number;
  conversionRate: number;
  avgDealTime: number;
  todayLeads: number;
  weekLeads: number;
}

interface RecentActivity {
  id: string;
  type: 'lead_created' | 'lead_won' | 'lead_lost' | 'task_completed' | 'stage_changed';
  title: string;
  description: string;
  timestamp: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function CRMDashboard() {
  const { crmTenant, crmUser } = useCRM();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalValue: 0,
    wonValue: 0,
    conversionRate: 0,
    avgDealTime: 0,
    todayLeads: 0,
    weekLeads: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [leadsOverTime, setLeadsOverTime] = useState<any[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<any[]>([]);
  const [leadsByOrigin, setLeadsByOrigin] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    if (crmTenant) {
      fetchDashboardData();
    }
  }, [crmTenant, period]);

  const fetchDashboardData = async () => {
    if (!crmTenant) return;

    try {
      setIsLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Fetch leads
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('id, status, value, stage_id, created_at, won_at, origin, responsible_id')
        .eq('crm_tenant_id', crmTenant.id);

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('crm_tasks')
        .select('id, status, due_date')
        .eq('crm_tenant_id', crmTenant.id);

      // Calculate stats
      const totalLeads = leads?.length || 0;
      const activeLeads = leads?.filter((l) => l.status === 'active' || l.status === 'new').length || 0;
      const wonLeads = leads?.filter((l) => l.status === 'won').length || 0;
      const lostLeads = leads?.filter((l) => l.status === 'lost').length || 0;
      const totalValue = leads?.reduce((sum, l) => sum + (Number(l.value) || 0), 0) || 0;
      const wonValue = leads?.filter((l) => l.status === 'won').reduce((sum, l) => sum + (Number(l.value) || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      const pendingTasks = tasks?.filter((t) => t.status === 'pending').length || 0;
      const overdueTasks = tasks?.filter((t) => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      ).length || 0;

      // Today and week leads
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const todayLeads = leads?.filter((l) => l.created_at.startsWith(today)).length || 0;
      const weekLeads = leads?.filter((l) => new Date(l.created_at) >= weekAgo).length || 0;

      // Avg deal time
      const wonLeadsWithTime = leads?.filter((l) => l.status === 'won' && l.won_at);
      let avgDealTime = 0;
      if (wonLeadsWithTime && wonLeadsWithTime.length > 0) {
        const totalDays = wonLeadsWithTime.reduce((sum, l) => {
          const created = new Date(l.created_at);
          const won = new Date(l.won_at!);
          return sum + Math.floor((won.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDealTime = Math.round(totalDays / wonLeadsWithTime.length);
      }

      setStats({
        totalLeads,
        activeLeads,
        wonLeads,
        lostLeads,
        pendingTasks,
        overdueTasks,
        totalValue,
        wonValue,
        conversionRate,
        avgDealTime,
        todayLeads,
        weekLeads,
      });

      // Leads over time (last 14 days)
      const last14Days = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLeads = leads?.filter((l) => l.created_at.startsWith(dateStr)).length || 0;
        const wonDayLeads = leads?.filter((l) => l.won_at?.startsWith(dateStr)).length || 0;
        last14Days.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          leads: dayLeads,
          ganhos: wonDayLeads,
        });
      }
      setLeadsOverTime(last14Days);

      // Leads by stage
      const { data: stages } = await supabase
        .from('crm_funnel_stages')
        .select('id, name, color, position')
        .eq('crm_tenant_id', crmTenant.id)
        .order('position');

      if (stages && leads) {
        const stageData = stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage_id === stage.id);
          return {
            name: stage.name,
            value: stageLeads.length,
            amount: stageLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
            color: stage.color,
            fill: stage.color,
          };
        }).filter((s) => s.value > 0);
        setLeadsByStage(stageData);

        // Funnel data
        const sortedStages = stages.sort((a, b) => a.position - b.position);
        const funnelStages = sortedStages.map((stage) => ({
          name: stage.name,
          value: leads.filter((l) => l.stage_id === stage.id).length,
          fill: stage.color,
        }));
        setFunnelData(funnelStages);
      }

      // Leads by origin
      if (leads) {
        const originCounts: Record<string, number> = {};
        leads.forEach((l) => {
          const origin = l.origin || 'Não informado';
          originCounts[origin] = (originCounts[origin] || 0) + 1;
        });
        setLeadsByOrigin(
          Object.entries(originCounts)
            .map(([name, value], index) => ({
              name,
              value,
              fill: COLORS[index % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
        );
      }

      // Top performers
      if (leads) {
        const { data: users } = await supabase
          .from('crm_users')
          .select('id, name')
          .eq('crm_tenant_id', crmTenant.id);

        if (users) {
          const performerData = users.map((user) => {
            const userLeads = leads.filter((l) => l.responsible_id === user.id);
            const wonUserLeads = userLeads.filter((l) => l.status === 'won');
            return {
              name: user.name,
              leads: userLeads.length,
              won: wonUserLeads.length,
              value: wonUserLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
              rate: userLeads.length > 0 ? (wonUserLeads.length / userLeads.length) * 100 : 0,
            };
          }).filter((u) => u.leads > 0).sort((a, b) => b.value - a.value).slice(0, 5);
          setTopPerformers(performerData);
        }
      }

      // Recent leads
      const { data: recent } = await supabase
        .from('crm_leads')
        .select('id, name, value, status, created_at, origin')
        .eq('crm_tenant_id', crmTenant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentLeads(recent || []);

      // Recent activities
      const { data: history } = await supabase
        .from('crm_lead_history')
        .select('id, action, new_value, created_at, lead:crm_leads(name)')
        .eq('crm_tenant_id', crmTenant.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (history) {
        const activities: RecentActivity[] = history.map((h) => {
          const leadName = (h.lead as any)?.name || 'Lead';
          let title = '';
          let type: RecentActivity['type'] = 'lead_created';
          
          switch (h.action) {
            case 'created':
              title = `Novo lead: ${leadName}`;
              type = 'lead_created';
              break;
            case 'stage_changed':
              title = `${leadName} mudou de etapa`;
              type = 'stage_changed';
              break;
            case 'task_completed':
              title = `Tarefa concluída para ${leadName}`;
              type = 'task_completed';
              break;
            default:
              title = `Atualização em ${leadName}`;
          }

          return {
            id: h.id,
            type,
            title,
            description: h.action,
            timestamp: h.created_at,
          };
        });
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: value >= 1000000 ? 'compact' : 'standard',
    }).format(value);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'lead_created':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'lead_won':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'lead_lost':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case 'stage_changed':
        return <Activity className="w-4 h-4 text-amber-500" />;
      default:
        return <Zap className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Olá, {crmUser?.name?.split(' ')[0]} • {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
            <SelectItem value="365">1 ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats Row 1 - Compact */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          trend={stats.weekLeads > 0 ? { value: 12, label: 'semana' } : undefined}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          delay={0}
        />
        <StatCard
          title="Ativos"
          value={stats.activeLeads}
          icon={Activity}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          delay={0.05}
        />
        <StatCard
          title="Ganhos"
          value={stats.wonLeads}
          icon={TrendingUp}
          trend={{ value: stats.conversionRate, label: 'conversão' }}
          color="text-green-500"
          bgColor="bg-green-500/10"
          delay={0.1}
        />
        <StatCard
          title="Perdidos"
          value={stats.lostLeads}
          icon={ArrowDown}
          color="text-red-500"
          bgColor="bg-red-500/10"
          delay={0.15}
        />
      </div>

      {/* Quick Stats Row 2 - Compact */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Em Negociação"
          value={formatCurrency(stats.totalValue - stats.wonValue)}
          icon={DollarSign}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
          delay={0.2}
        />
        <StatCard
          title="Receita"
          value={formatCurrency(stats.wonValue)}
          icon={Target}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          delay={0.25}
        />
        <StatCard
          title="Tarefas"
          value={stats.pendingTasks}
          icon={CheckSquare}
          trend={stats.overdueTasks > 0 ? { value: -stats.overdueTasks, label: 'atrasadas' } : undefined}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
          delay={0.3}
        />
        <StatCard
          title="Tempo Médio"
          value={`${stats.avgDealTime || 0}d`}
          icon={Clock}
          color="text-cyan-500"
          bgColor="bg-cyan-500/10"
          delay={0.35}
        />
      </div>

      {/* Conversion Rate Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão Geral</p>
                  <p className="text-4xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{stats.wonLeads}</p>
                  <p className="text-xs text-muted-foreground">Ganhos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.lostLeads}</p>
                  <p className="text-xs text-muted-foreground">Perdidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.activeLeads}</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Leads por Período
              </CardTitle>
              <CardDescription>Novos leads e conversões nos últimos 14 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadsOverTime}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      name="Novos Leads"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorLeads)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="ganhos"
                      name="Ganhos"
                      stroke="#22c55e"
                      fill="url(#colorWon)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leads by Stage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-primary" />
                Leads por Etapa
              </CardTitle>
              <CardDescription>Distribuição atual no funil de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {leadsByStage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsByStage}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {leadsByStage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value} leads (${formatCurrency(props.payload.amount)})`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhum lead cadastrado ainda</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Leads Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {recentLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.origin || 'Sem origem'} • {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-medium text-primary">{formatCurrency(Number(lead.value) || 0)}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            lead.status === 'won'
                              ? 'border-green-500 text-green-500'
                              : lead.status === 'lost'
                              ? 'border-red-500 text-red-500'
                              : 'border-blue-500 text-blue-500'
                          }`}
                        >
                          {lead.status === 'won' ? 'Ganho' : lead.status === 'lost' ? 'Perdido' : 'Ativo'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum lead cadastrado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 6).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-muted shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Top Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <motion.div
                      key={performer.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {performer.won} ganhos de {performer.leads} ({performer.rate.toFixed(0)}%)
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-primary">{formatCurrency(performer.value)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Sem dados de vendedores</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
