import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  RefreshCw,
  Zap,
  Globe,
  Webhook
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, subHours, startOfDay, startOfHour, eachDayOfInterval, eachHourOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface APILog {
  id: string;
  project_id: string | null;
  endpoint: string;
  method: string;
  response_status: number | null;
  response_time_ms: number | null;
  created_at: string;
}

interface MessageLog {
  id: string;
  instance_id: string;
  direction: string;
  status: string;
  created_at: string;
}

interface AutomationExecution {
  id: string;
  status: string;
  processed_at: string | null;
}

interface WebhookLog {
  id: string;
  is_success: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const WAAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationExecution[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedProject]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h': return subHours(now, 24);
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const dateFilter = getDateFilter().toISOString();
    
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('whatsapp_api_projects')
        .select('id, name');
      setProjects((projectsData || []) as Project[]);

      // Fetch API logs
      let apiQuery = supabase
        .from('whatsapp_api_logs')
        .select('id, project_id, endpoint, method, response_status, response_time_ms, created_at')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });
      
      if (selectedProject !== 'all') {
        apiQuery = apiQuery.eq('project_id', selectedProject);
      }
      
      const { data: apiData } = await apiQuery;
      setApiLogs((apiData || []) as APILog[]);

      // Fetch message logs
      const { data: messageData } = await supabase
        .from('whatsapp_message_logs')
        .select('id, instance_id, direction, status, created_at')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false });
      setMessageLogs((messageData || []) as MessageLog[]);

      // Fetch automation executions
      const { data: automationData } = await supabase
        .from('whatsapp_event_queue')
        .select('id, status, processed_at')
        .gte('created_at', dateFilter);
      setAutomationLogs((automationData || []).map(a => ({
        id: a.id,
        status: a.status,
        processed_at: a.processed_at
      })) as AutomationExecution[]);

      // Fetch webhook logs
      const { data: webhookData } = await supabase
        .from('whatsapp_webhook_logs')
        .select('id, is_success, created_at')
        .gte('created_at', dateFilter);
      setWebhookLogs((webhookData || []) as WebhookLog[]);

    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalApiCalls = apiLogs.length;
    const successfulCalls = apiLogs.filter(l => l.response_status && l.response_status < 400).length;
    const failedCalls = totalApiCalls - successfulCalls;
    const successRate = totalApiCalls > 0 ? (successfulCalls / totalApiCalls) * 100 : 0;
    
    const avgResponseTime = apiLogs.length > 0
      ? apiLogs.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / apiLogs.length
      : 0;
    
    const totalMessages = messageLogs.length;
    const sentMessages = messageLogs.filter(m => m.status === 'sent' || m.status === 'delivered').length;
    
    const totalAutomations = automationLogs.length;
    const successfulAutomations = automationLogs.filter(a => a.status === 'processed').length;
    
    const totalWebhooks = webhookLogs.length;
    const successfulWebhooks = webhookLogs.filter(w => w.is_success === true).length;

    return {
      totalApiCalls,
      successfulCalls,
      failedCalls,
      successRate,
      avgResponseTime,
      totalMessages,
      sentMessages,
      totalAutomations,
      successfulAutomations,
      totalWebhooks,
      successfulWebhooks
    };
  }, [apiLogs, messageLogs, automationLogs, webhookLogs]);

  // Chart data - API calls over time
  const apiCallsOverTime = useMemo(() => {
    const dateFilter = getDateFilter();
    const now = new Date();
    
    if (dateRange === '24h') {
      const hours = eachHourOfInterval({ start: dateFilter, end: now });
      return hours.map(hour => {
        const count = apiLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return startOfHour(logDate).getTime() === startOfHour(hour).getTime();
        }).length;
        return {
          time: format(hour, 'HH:mm'),
          calls: count
        };
      });
    } else {
      const days = eachDayOfInterval({ start: dateFilter, end: now });
      return days.map(day => {
        const count = apiLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return startOfDay(logDate).getTime() === startOfDay(day).getTime();
        }).length;
        return {
          time: format(day, 'dd/MM'),
          calls: count
        };
      });
    }
  }, [apiLogs, dateRange]);

  // Endpoint distribution
  const endpointDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    apiLogs.forEach(log => {
      const endpoint = log.endpoint.split('/')[1] || log.endpoint;
      counts[endpoint] = (counts[endpoint] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [apiLogs]);

  // Status code distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { '2xx': 0, '4xx': 0, '5xx': 0, 'other': 0 };
    apiLogs.forEach(log => {
      if (!log.response_status) {
        counts['other']++;
      } else if (log.response_status >= 200 && log.response_status < 300) {
        counts['2xx']++;
      } else if (log.response_status >= 400 && log.response_status < 500) {
        counts['4xx']++;
      } else if (log.response_status >= 500) {
        counts['5xx']++;
      } else {
        counts['other']++;
      }
    });
    
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [apiLogs]);

  // Response time distribution
  const responseTimeOverTime = useMemo(() => {
    const dateFilter = getDateFilter();
    const now = new Date();
    
    if (dateRange === '24h') {
      const hours = eachHourOfInterval({ start: dateFilter, end: now });
      return hours.map(hour => {
        const logsInHour = apiLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return startOfHour(logDate).getTime() === startOfHour(hour).getTime();
        });
        const avgTime = logsInHour.length > 0
          ? logsInHour.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / logsInHour.length
          : 0;
        return {
          time: format(hour, 'HH:mm'),
          ms: Math.round(avgTime)
        };
      });
    } else {
      const days = eachDayOfInterval({ start: dateFilter, end: now });
      return days.map(day => {
        const logsInDay = apiLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return startOfDay(logDate).getTime() === startOfDay(day).getTime();
        });
        const avgTime = logsInDay.length > 0
          ? logsInDay.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / logsInDay.length
          : 0;
        return {
          time: format(day, 'dd/MM'),
          ms: Math.round(avgTime)
        };
      });
    }
  }, [apiLogs, dateRange]);

  const chartConfig = {
    calls: { label: 'Chamadas', color: 'hsl(var(--primary))' },
    ms: { label: 'Tempo (ms)', color: 'hsl(var(--chart-2))' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics da API
          </h3>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas de uso em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Chamadas API
                </p>
                <p className="text-2xl font-bold mt-1">{metrics.totalApiCalls.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={metrics.successRate >= 95 ? 'default' : metrics.successRate >= 80 ? 'secondary' : 'destructive'} className="text-xs">
                    {metrics.successRate.toFixed(1)}% sucesso
                  </Badge>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Mensagens Enviadas
                </p>
                <p className="text-2xl font-bold mt-1">{metrics.sentMessages.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {metrics.totalMessages.toLocaleString()} total
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Automações
                </p>
                <p className="text-2xl font-bold mt-1">{metrics.successfulAutomations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  executadas com sucesso
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Tempo Médio
                </p>
                <p className="text-2xl font-bold mt-1">{Math.round(metrics.avgResponseTime)}ms</p>
                <p className="text-xs text-muted-foreground mt-1">
                  resposta da API
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* API Calls Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamadas por {dateRange === '24h' ? 'Hora' : 'Dia'}</CardTitle>
            <CardDescription>Volume de requisições no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={apiCallsOverTime}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#colorCalls)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Response Time Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tempo de Resposta</CardTitle>
            <CardDescription>Média de latência por período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={responseTimeOverTime}>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="ms" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Endpoint Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Endpoints</CardTitle>
            <CardDescription>Endpoints mais utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {endpointDistribution.length > 0 ? (
                endpointDistribution.map((ep, idx) => (
                  <div key={ep.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs truncate max-w-[150px]">/{ep.name}</span>
                      <span className="text-muted-foreground">{ep.value}</span>
                    </div>
                    <Progress 
                      value={(ep.value / (endpointDistribution[0]?.value || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sem dados no período
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das Respostas</CardTitle>
            <CardDescription>Distribuição por código HTTP</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === '2xx' ? 'hsl(var(--primary))' : 
                                entry.name === '4xx' ? 'hsl(var(--chart-4))' : 
                                entry.name === '5xx' ? 'hsl(var(--destructive))' : 
                                'hsl(var(--muted))'} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sem dados no período
              </p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {statusDistribution.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-1 text-xs">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: s.name === '2xx' ? 'hsl(var(--primary))' : 
                                       s.name === '4xx' ? 'hsl(var(--chart-4))' : 
                                       s.name === '5xx' ? 'hsl(var(--destructive))' : 
                                       'hsl(var(--muted))' 
                    }} 
                  />
                  {s.name}: {s.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo do Período</CardTitle>
            <CardDescription>
              {dateRange === '24h' ? 'Últimas 24 horas' : 
               dateRange === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Sucesso (2xx)</span>
              </div>
              <span className="font-medium">{metrics.successfulCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm">Erros (4xx/5xx)</span>
              </div>
              <span className="font-medium">{metrics.failedCalls.toLocaleString()}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Webhooks</span>
                </div>
                <span className="font-medium">
                  {metrics.successfulWebhooks}/{metrics.totalWebhooks}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Automações</span>
              </div>
              <span className="font-medium">
                {metrics.successfulAutomations}/{metrics.totalAutomations}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WAAnalytics;
