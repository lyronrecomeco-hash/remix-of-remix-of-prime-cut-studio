import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, Search, Download, RefreshCw, Filter, AlertTriangle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  attempted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

type LogType = 'audit' | 'login' | 'all';

const GlobalLogsViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [logType, setLogType] = useState<LogType>('all');
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange));

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (auditError) throw auditError;

      // Fetch login attempts
      const { data: loginData, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .gte('attempted_at', startDate.toISOString())
        .order('attempted_at', { ascending: false })
        .limit(500);

      if (loginError) throw loginError;

      setAuditLogs(auditData || []);
      setLoginAttempts(loginData || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    const allLogs = [
      ...auditLogs.map(log => ({
        type: 'audit',
        timestamp: log.created_at,
        action: log.action,
        entity: log.entity_type,
        details: JSON.stringify(log.details),
        ip: log.ip_address,
      })),
      ...loginAttempts.map(log => ({
        type: 'login',
        timestamp: log.attempted_at,
        action: log.success ? 'login_success' : 'login_failed',
        entity: log.email,
        details: log.user_agent,
        ip: log.ip_address,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const csv = [
      'Tipo,Timestamp,Ação,Entidade,Detalhes,IP',
      ...allLogs.map(log => 
        `${log.type},${log.timestamp},${log.action},${log.entity},"${log.details || ''}",${log.ip || ''}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();

    toast.success('Logs exportados com sucesso!');
  };

  const getActionIcon = (action: string, success?: boolean) => {
    if (action.includes('login')) {
      return success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (action.includes('create')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (action.includes('update')) return <Info className="w-4 h-4 text-blue-500" />;
    if (action.includes('delete')) return <XCircle className="w-4 h-4 text-red-500" />;
    return <Info className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-500/10 text-green-500';
    if (action.includes('update')) return 'bg-blue-500/10 text-blue-500';
    if (action.includes('delete')) return 'bg-red-500/10 text-red-500';
    if (action.includes('login')) return 'bg-amber-500/10 text-amber-500';
    return 'bg-muted text-muted-foreground';
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      (log.ip_address && log.ip_address.includes(search))
    );
  });

  const filteredLoginAttempts = loginAttempts.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.email.toLowerCase().includes(search) ||
      (log.ip_address && log.ip_address.includes(search))
    );
  });

  const showAudit = logType === 'all' || logType === 'audit';
  const showLogin = logType === 'all' || logType === 'login';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Logs Globais</h2>
          <p className="text-sm text-muted-foreground">Monitore todas as atividades do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, entidade ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={logType} onValueChange={(v) => setLogType(v as LogType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de log" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="audit">Auditoria</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24h</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Logs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{auditLogs.length + loginAttempts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Logins OK</span>
            </div>
            <p className="text-2xl font-bold mt-1">{loginAttempts.filter(l => l.success).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Logins Falhos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{loginAttempts.filter(l => !l.success).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Ações Críticas</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {auditLogs.filter(l => l.action.includes('delete')).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Logs */}
        {showAudit && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>{filteredAuditLogs.length} registros</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredAuditLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <div>
                              <Badge className={`text-xs ${getActionColor(log.action)}`}>
                                {log.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-2">
                                {log.entity_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {JSON.stringify(log.details).slice(0, 100)}...
                          </p>
                        )}
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Login Attempts */}
        {showLogin && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Tentativas de Login
              </CardTitle>
              <CardDescription>{filteredLoginAttempts.length} registros</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredLoginAttempts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                  ) : (
                    filteredLoginAttempts.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getActionIcon('login', log.success)}
                            <div>
                              <p className="text-sm font-medium">{log.email}</p>
                              <Badge 
                                variant={log.success ? 'default' : 'destructive'}
                                className="text-xs mt-1"
                              >
                                {log.success ? 'Sucesso' : 'Falhou'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(log.attempted_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground mt-2">
                            IP: {log.ip_address}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GlobalLogsViewer;
