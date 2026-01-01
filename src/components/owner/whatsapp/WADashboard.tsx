import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Timer,
  Server,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WhatsAppInstance, Alert } from './types';

interface InstanceMetrics {
  id: string;
  name: string;
  status: string;
  messagesSent: number;
  messagesReceived: number;
  messagesFailed: number;
  uptime: number;
  latency: number;
  lastHeartbeat: string | null;
}

interface DailyMetric {
  date: string;
  sent: number;
  received: number;
  failed: number;
}

interface WADashboardProps {
  instances: Array<{
    id: string;
    name: string;
    status: string;
    last_heartbeat_at?: string | null;
    uptime_seconds?: number;
  }>;
  isBackendActive: boolean;
}

export const WADashboard = ({ instances, isBackendActive }: WADashboardProps) => {
  const [metrics, setMetrics] = useState<InstanceMetrics[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('whatsapp_metrics')
        .select('*')
        .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (metricsError) throw metricsError;

      // Aggregate daily metrics
      const dailyMap = new Map<string, DailyMetric>();
      (metricsData || []).forEach((m: Record<string, unknown>) => {
        const date = m.metric_date as string;
        const existing = dailyMap.get(date) || { date, sent: 0, received: 0, failed: 0 };
        existing.sent += (m.messages_sent as number) || 0;
        existing.received += (m.messages_received as number) || 0;
        existing.failed += (m.messages_failed as number) || 0;
        dailyMap.set(date, existing);
      });

      setDailyMetrics(Array.from(dailyMap.values()));

      // Fetch health checks
      const { data: healthData } = await supabase
        .from('whatsapp_health_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(10);

      // Calculate instance metrics
      const instanceMetrics: InstanceMetrics[] = instances.map(inst => {
        const instMetrics = (metricsData || []).filter((m: Record<string, unknown>) => m.instance_id === inst.id);
        const latestHealth = (healthData || []).find((h: Record<string, unknown>) => h.instance_id === inst.id);
        
        return {
          id: inst.id,
          name: inst.name,
          status: inst.status,
          messagesSent: instMetrics.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.messages_sent as number) || 0), 0),
          messagesReceived: instMetrics.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.messages_received as number) || 0), 0),
          messagesFailed: instMetrics.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.messages_failed as number) || 0), 0),
          uptime: inst.uptime_seconds || 0,
          latency: (latestHealth?.latency_ms as number) || 0,
          lastHeartbeat: inst.last_heartbeat_at || null,
        };
      });

      setMetrics(instanceMetrics);

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('whatsapp_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      setAlerts((alertsData || []) as Alert[]);

      // Determine overall health based on effective status (heartbeat-aware)
      const getEffectiveStatus = (inst: typeof instances[0]) => {
        const lastHeartbeat = inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at) : null;
        const isStale = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) > 120000 : true;
        return isStale && inst.status === 'connected' ? 'disconnected' : inst.status;
      };
      const connectedCount = instances.filter(i => getEffectiveStatus(i) === 'connected').length;
      if (connectedCount === instances.length && instances.length > 0) {
        setHealthStatus('healthy');
      } else if (connectedCount > 0) {
        setHealthStatus('degraded');
      } else {
        setHealthStatus('unhealthy');
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [instances]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      
      if (error) throw error;
      toast.success('Alerta resolvido');
      fetchMetrics();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const totalSent = metrics.reduce((sum, m) => sum + m.messagesSent, 0);
  const totalReceived = metrics.reduce((sum, m) => sum + m.messagesReceived, 0);
  const totalFailed = metrics.reduce((sum, m) => sum + m.messagesFailed, 0);
  const successRate = totalSent > 0 ? ((totalSent - totalFailed) / totalSent * 100).toFixed(1) : '100';
  const getEffectiveStatusForCount = (inst: typeof instances[0]) => {
    const lastHeartbeat = inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at) : null;
    const isStale = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) > 120000 : true;
    return isStale && inst.status === 'connected' ? 'disconnected' : inst.status;
  };
  const connectedInstances = instances.filter(i => getEffectiveStatusForCount(i) === 'connected').length;

  const healthColors = {
    healthy: 'text-green-500 bg-green-500/10',
    degraded: 'text-yellow-500 bg-yellow-500/10',
    unhealthy: 'text-red-500 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Monitoramento</h2>
          <p className="text-muted-foreground text-sm">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={healthColors[healthStatus]}>
            {healthStatus === 'healthy' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {healthStatus === 'degraded' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {healthStatus === 'unhealthy' && <XCircle className="w-3 h-3 mr-1" />}
            {healthStatus === 'healthy' ? 'Saudável' : healthStatus === 'degraded' ? 'Degradado' : 'Crítico'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Instâncias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedInstances}/{instances.length}</div>
            <p className="text-xs text-muted-foreground">conectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Enviadas (7d)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">mensagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recebidas (7d)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">mensagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Falhas (7d)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">mensagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={parseFloat(successRate)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mensagens nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Enviadas" />
                  <Area type="monotone" dataKey="received" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Recebidas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mr-4 opacity-50" />
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das Instâncias</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {metrics.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {inst.status === 'connected' ? (
                        <Wifi className="w-5 h-5 text-green-500" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inst.messagesSent} enviadas • {inst.messagesReceived} recebidas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={inst.status === 'connected' ? 'default' : 'secondary'}>
                        {inst.status === 'connected' ? 'Online' : 'Offline'}
                      </Badge>
                      {inst.latency > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Timer className="w-3 h-3 inline mr-1" />
                          {inst.latency}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma instância configurada
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alertas Ativos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-500/10' : 
                    alert.severity === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => resolveAlert(alert.id)}>
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
