import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Zap,
  TrendingUp,
  Phone,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alert {
  id: string;
  instance_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  acknowledged_at: string | null;
  auto_resolved: boolean;
  notification_sent: boolean;
  metadata: Record<string, any>;
  created_at: string;
  instance?: { name: string };
}

interface CircuitBreaker {
  id: string;
  instance_id: string;
  circuit_name: string;
  state: 'closed' | 'open' | 'half_open';
  failure_count: number;
  success_count: number;
  last_failure_at: string | null;
  last_success_at: string | null;
  opened_at: string | null;
  threshold_failures: number;
  reset_timeout_seconds: number;
  instance?: { name: string };
}

interface StabilityLog {
  id: string;
  instance_id: string;
  event_type: string;
  severity: string;
  message: string;
  details: Record<string, any>;
  created_at: string;
  instance?: { name: string };
}

interface QueueItem {
  id: string;
  instance_id: string;
  phone_to: string;
  message_type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string | null;
  error_message: string | null;
  validation_status: string;
  phone_validated: boolean;
  created_at: string;
}

interface WAStabilityDashboardProps {
  instances: Array<{ id: string; name: string }>;
}

const SEVERITY_COLORS = {
  debug: 'bg-gray-500',
  info: 'bg-blue-500',
  warn: 'bg-yellow-500',
  error: 'bg-red-500',
  critical: 'bg-red-700'
};

const CIRCUIT_COLORS = {
  closed: 'bg-green-500',
  open: 'bg-red-500',
  half_open: 'bg-yellow-500'
};

export const WAStabilityDashboard = ({ instances }: WAStabilityDashboardProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [circuits, setCircuits] = useState<CircuitBreaker[]>([]);
  const [logs, setLogs] = useState<StabilityLog[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, circuitsRes, logsRes, queueRes] = await Promise.all([
        supabase
          .from('whatsapp_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('whatsapp_circuit_breaker')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('whatsapp_stability_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('whatsapp_send_queue')
          .select('*')
          .in('status', ['pending', 'retrying', 'failed'])
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (alertsRes.error) throw alertsRes.error;
      if (circuitsRes.error) throw circuitsRes.error;
      if (logsRes.error) throw logsRes.error;
      if (queueRes.error) throw queueRes.error;

      // Enrich with instance names
      const enrichWithInstance = (items: any[]) => 
        items.map(item => ({
          ...item,
          instance: instances.find(i => i.id === item.instance_id)
        }));

      setAlerts(enrichWithInstance(alertsRes.data || []));
      setCircuits(enrichWithInstance(circuitsRes.data || []));
      setLogs(enrichWithInstance(logsRes.data || []));
      setQueue(queueRes.data || []);
    } catch (error) {
      console.error('Error fetching stability data:', error);
      toast.error('Erro ao carregar dados de estabilidade');
    } finally {
      setIsLoading(false);
    }
  }, [instances]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerta reconhecido');
      fetchData();
    } catch (error) {
      toast.error('Erro ao reconhecer alerta');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerta resolvido');
      fetchData();
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  };

  const resetCircuit = async (circuitId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_circuit_breaker')
        .update({ 
          state: 'closed', 
          failure_count: 0,
          opened_at: null,
          half_open_at: null
        })
        .eq('id', circuitId);

      if (error) throw error;
      toast.success('Circuit breaker resetado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao resetar circuit breaker');
    }
  };

  const retryQueueItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_send_queue')
        .update({ 
          status: 'pending',
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item re-enfileirado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao reprocessar item');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
  const openCircuits = circuits.filter(c => c.state === 'open');
  const failedQueue = queue.filter(q => q.status === 'failed');
  const pendingQueue = queue.filter(q => q.status === 'pending' || q.status === 'retrying');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={unresolvedAlerts.length > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className="text-3xl font-bold">{unresolvedAlerts.length}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${
                unresolvedAlerts.length > 0 ? 'text-red-500' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card className={openCircuits.length > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Circuits Abertos</p>
                <p className="text-3xl font-bold">{openCircuits.length}</p>
              </div>
              <ShieldAlert className={`w-8 h-8 ${
                openCircuits.length > 0 ? 'text-yellow-500' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fila Pendente</p>
                <p className="text-3xl font-bold">{pendingQueue.length}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={failedQueue.length > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas na Fila</p>
                <p className="text-3xl font-bold">{failedQueue.length}</p>
              </div>
              <XCircle className={`w-8 h-8 ${
                failedQueue.length > 0 ? 'text-red-500' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertas
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unresolvedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="circuits" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Circuit Breakers
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Fila de Envio
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {unresolvedAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      Nenhum alerta ativo
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unresolvedAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className={`w-2 h-2 rounded-full mt-2 ${SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Circuit Breakers Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status dos Circuit Breakers</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {circuits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="w-12 h-12 mx-auto mb-2" />
                      Nenhum circuit breaker configurado
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {circuits.map((circuit) => (
                        <div key={circuit.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${CIRCUIT_COLORS[circuit.state]}`} />
                            <div>
                              <p className="font-medium text-sm">{circuit.circuit_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {circuit.instance?.name || 'Instância desconhecida'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={circuit.state === 'closed' ? 'default' : 'destructive'}>
                            {circuit.state === 'closed' ? 'Fechado' : 
                             circuit.state === 'open' ? 'Aberto' : 'Semi-aberto'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertas do Sistema</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p>Nenhum alerta registrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border ${
                          alert.is_resolved ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{alert.title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {alert.alert_type}
                                </Badge>
                                {alert.is_resolved && (
                                  <Badge variant="secondary">Resolvido</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                                {alert.instance?.name && (
                                  <span>• {alert.instance.name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!alert.is_resolved && (
                            <div className="flex gap-2">
                              {!alert.acknowledged_at && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => acknowledgeAlert(alert.id)}
                                >
                                  Reconhecer
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolver
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Circuit Breakers Tab */}
        <TabsContent value="circuits">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breakers</CardTitle>
              <CardDescription>
                Proteção contra falhas em cascata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {circuits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="w-16 h-16 mx-auto mb-4" />
                  <p>Nenhum circuit breaker configurado</p>
                  <p className="text-sm mt-2">
                    Os circuit breakers são criados automaticamente quando ocorrem falhas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {circuits.map((circuit) => (
                    <div key={circuit.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${CIRCUIT_COLORS[circuit.state]}`} />
                          <div>
                            <p className="font-medium">{circuit.circuit_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {circuit.instance?.name || 'Instância desconhecida'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={circuit.state === 'closed' ? 'default' : 'destructive'}>
                            {circuit.state === 'closed' ? 'Fechado' : 
                             circuit.state === 'open' ? 'Aberto' : 'Semi-aberto'}
                          </Badge>
                          {circuit.state !== 'closed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => resetCircuit(circuit.id)}
                            >
                              Resetar
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Falhas</p>
                          <p className="font-medium">{circuit.failure_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sucessos</p>
                          <p className="font-medium">{circuit.success_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Threshold</p>
                          <p className="font-medium">{circuit.threshold_failures}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Reset (s)</p>
                          <p className="font-medium">{circuit.reset_timeout_seconds}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fila de Envio</CardTitle>
                  <CardDescription>
                    Mensagens pendentes e com retry
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p>Fila vazia</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{item.phone_to}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{item.message_type}</Badge>
                                <Badge variant={
                                  item.status === 'failed' ? 'destructive' :
                                  item.status === 'retrying' ? 'secondary' : 'default'
                                }>
                                  {item.status}
                                </Badge>
                                {item.phone_validated && (
                                  <Badge variant="outline" className="text-green-600">
                                    Validado
                                  </Badge>
                                )}
                              </div>
                              {item.error_message && (
                                <p className="text-sm text-red-500 mt-2">
                                  {item.error_message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Tentativas: {item.attempts}/{item.max_attempts}
                                {item.next_attempt_at && (
                                  <span className="ml-2">
                                    • Próxima: {format(new Date(item.next_attempt_at), "HH:mm:ss")}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {item.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => retryQueueItem(item.id)}
                            >
                              Reprocessar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Estabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4" />
                    <p>Nenhum log registrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {log.event_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.instance?.name}
                            </span>
                          </div>
                          <p className="mt-1">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
