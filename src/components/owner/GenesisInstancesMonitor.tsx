import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Search, 
  Wifi, 
  WifiOff, 
  Clock, 
  Smartphone,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  MessageCircle,
  TrendingUp,
  Zap,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenesisInstance {
  id: string;
  name: string;
  status: string;
  phone_number: string | null;
  last_heartbeat: string | null;
  created_at: string;
  backend_url: string | null;
  user_id: string;
  heartbeat_age_seconds: number | null;
  user_email?: string;
  user_name?: string;
}

interface Stats {
  total: number;
  connected: number;
  disconnected: number;
  stale: number;
}

const STALE_THRESHOLD_MS = 180000; // 3 minutes

const GenesisInstancesMonitor = () => {
  const [instances, setInstances] = useState<GenesisInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'stale'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchInstances = useCallback(async () => {
    try {
      // Fetch genesis instances with user info
      const { data: instancesData, error } = await supabase
        .from('genesis_instances')
        .select(`
          id,
          name,
          status,
          phone_number,
          last_heartbeat,
          created_at,
          backend_url,
          user_id,
          heartbeat_age_seconds
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user info for each instance
      const userIds = [...new Set((instancesData || []).map(i => i.user_id))];
      
      const { data: usersData } = await supabase
        .from('genesis_users')
        .select('id, name, email')
        .in('id', userIds);

      const userMap = new Map((usersData || []).map(u => [u.id, u]));

      const enrichedInstances = (instancesData || []).map(inst => ({
        ...inst,
        user_name: userMap.get(inst.user_id)?.name || 'Desconhecido',
        user_email: userMap.get(inst.user_id)?.email || '-'
      }));

      setInstances(enrichedInstances);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching genesis instances:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();

    // Polling every 5 seconds
    const interval = setInterval(fetchInstances, 5000);

    // Realtime subscription
    const channel = supabase
      .channel('genesis_instances_monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'genesis_instances' },
        () => fetchInstances()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchInstances]);

  const getEffectiveStatus = (instance: GenesisInstance) => {
    const now = Date.now();
    const lastHeartbeat = instance.last_heartbeat
      ? new Date(instance.last_heartbeat).getTime() 
      : 0;
    const heartbeatAge = lastHeartbeat ? now - lastHeartbeat : Infinity;
    const isStale = heartbeatAge > STALE_THRESHOLD_MS;

    if (instance.status === 'connected' && isStale && lastHeartbeat > 0) {
      return 'stale';
    }
    return instance.status;
  };

  const getHeartbeatAge = (instance: GenesisInstance) => {
    if (!instance.last_heartbeat) return null;
    const now = Date.now();
    const lastHeartbeat = new Date(instance.last_heartbeat).getTime();
    return Math.floor((now - lastHeartbeat) / 1000);
  };

  const stats: Stats = instances.reduce((acc, inst) => {
    const status = getEffectiveStatus(inst);
    acc.total++;
    if (status === 'connected') acc.connected++;
    else if (status === 'stale') acc.stale++;
    else acc.disconnected++;
    return acc;
  }, { total: 0, connected: 0, disconnected: 0, stale: 0 });

  const filteredInstances = instances.filter(inst => {
    const status = getEffectiveStatus(inst);
    const matchesFilter = filter === 'all' || status === filter || 
      (filter === 'disconnected' && status !== 'connected' && status !== 'stale');
    
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      inst.name.toLowerCase().includes(searchLower) ||
      inst.phone_number?.includes(search) ||
      inst.user_name?.toLowerCase().includes(searchLower) ||
      inst.user_email?.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInstances();
  };

  const formatHeartbeatAge = (seconds: number | null) => {
    if (!seconds && seconds !== 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conectados</p>
                <p className="text-3xl font-bold text-green-600">{stats.connected}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instáveis</p>
                <p className="text-3xl font-bold text-amber-600">{stats.stale}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-bold text-red-600">{stats.disconnected}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-0 bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'connected', label: 'Online' },
                  { id: 'stale', label: 'Instável' },
                  { id: 'disconnected', label: 'Offline' }
                ].map(f => (
                  <Button
                    key={f.id}
                    variant={filter === f.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f.id as any)}
                    className="text-xs"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                Atualizado: {format(lastUpdate, 'HH:mm:ss')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instances List */}
      <Card className="border-0 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Instâncias Genesis ({filteredInstances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredInstances.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma instância encontrada</p>
                </div>
              ) : (
                filteredInstances.map(instance => {
                  const status = getEffectiveStatus(instance);
                  const heartbeatAge = getHeartbeatAge(instance);

                  return (
                    <div
                      key={instance.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        status === 'connected' && "bg-green-500/5 border-green-500/20",
                        status === 'stale' && "bg-amber-500/5 border-amber-500/20",
                        status !== 'connected' && status !== 'stale' && "bg-muted/30 border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            status === 'connected' && "bg-green-500/20",
                            status === 'stale' && "bg-amber-500/20",
                            status !== 'connected' && status !== 'stale' && "bg-muted"
                          )}>
                            {status === 'connected' ? (
                              <Wifi className="w-5 h-5 text-green-500" />
                            ) : status === 'stale' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <WifiOff className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground truncate">
                                {instance.name}
                              </h4>
                              <Badge
                                variant={
                                  status === 'connected' ? 'default' :
                                  status === 'stale' ? 'secondary' : 'outline'
                                }
                                className={cn(
                                  "text-xs",
                                  status === 'connected' && "bg-green-500/20 text-green-700 border-green-500/30",
                                  status === 'stale' && "bg-amber-500/20 text-amber-700 border-amber-500/30"
                                )}
                              >
                                {status === 'connected' ? 'Online' : 
                                 status === 'stale' ? 'Instável' : 'Offline'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              {instance.phone_number && (
                                <span className="flex items-center gap-1">
                                  <Smartphone className="w-3.5 h-3.5" />
                                  {instance.phone_number}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {instance.user_name}
                              </span>
                              {heartbeatAge !== null && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5" />
                                  {heartbeatAge < 60 ? `${heartbeatAge}s atrás` : 
                                   heartbeatAge < 3600 ? `${Math.floor(heartbeatAge / 60)}min atrás` :
                                   `${Math.floor(heartbeatAge / 3600)}h atrás`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side Stats */}
                        <div className="text-right shrink-0">
                          <div className="text-xs text-muted-foreground">Heartbeat</div>
                          <div className="font-mono text-sm font-medium">
                            {formatHeartbeatAge(instance.heartbeat_age_seconds)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Criado: {format(new Date(instance.created_at), 'dd/MM/yy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenesisInstancesMonitor;
