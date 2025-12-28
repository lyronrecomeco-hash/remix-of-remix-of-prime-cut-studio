import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const AUDIT_LOGS_PER_PAGE = 10;
const AUTO_REFRESH_INTERVAL = 60000; // 1 minute

const AuditLogsSection = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Load security settings from database
  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('settings')
          .eq('setting_type', 'security')
          .single();
        
        if (data?.settings) {
          const settings = data.settings as unknown as { auditLog?: boolean };
          setAuditLogEnabled(settings.auditLog ?? true);
        }
      } catch (e) {
        console.error('Error loading security settings:', e);
      }
      setSettingsLoading(false);
    };
    
    loadSecuritySettings();
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(auditLogsPage * AUDIT_LOGS_PER_PAGE, (auditLogsPage + 1) * AUDIT_LOGS_PER_PAGE - 1);
      
      if (!error && data) {
        setAuditLogs(data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
    setAuditLogsLoading(false);
  }, [auditLogsPage]);

  // Initial fetch and auto-refresh every 1 minute
  useEffect(() => {
    if (auditLogEnabled && !settingsLoading) {
      fetchAuditLogs();
      
      const interval = setInterval(() => {
        fetchAuditLogs();
      }, AUTO_REFRESH_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [fetchAuditLogs, auditLogEnabled, settingsLoading]);

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auditLogEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Logs de Auditoria Desativado</h2>
        <p className="text-muted-foreground mb-4">
          Ative os logs de auditoria nas configurações de segurança para visualizar o histórico de ações.
        </p>
      </div>
    );
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Criação',
      update: 'Atualização',
      delete: 'Exclusão',
      login: 'Login',
      logout: 'Logout',
      confirm: 'Confirmação',
      cancel: 'Cancelamento',
      complete: 'Conclusão',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      appointment: 'Agendamento',
      service: 'Serviço',
      barber: 'Barbeiro',
      user: 'Usuário',
      settings: 'Configurações',
      queue: 'Fila',
      feedback: 'Feedback',
    };
    return labels[entity] || entity;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              <span className="ml-2 text-xs">(atualiza a cada 1 min)</span>
            </p>
          )}
        </div>
        <Button variant="outline" onClick={fetchAuditLogs} disabled={auditLogsLoading}>
          {auditLogsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Atualizar
        </Button>
      </div>
      
      <div className="glass-card rounded-xl p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Registro de todas as ações administrativas realizadas no sistema.
        </p>
      </div>

      {auditLogsLoading && auditLogs.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Carregando logs...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum log de auditoria encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.action === 'create' ? 'bg-green-500/20 text-green-400' :
                      log.action === 'update' ? 'bg-blue-500/20 text-blue-400' :
                      log.action === 'delete' ? 'bg-destructive/20 text-destructive' :
                      log.action === 'login' ? 'bg-purple-500/20 text-purple-400' :
                      log.action === 'confirm' ? 'bg-primary/20 text-primary' :
                      log.action === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="font-medium">{getEntityLabel(log.entity_type)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.details ? (
                      typeof log.details === 'string' 
                        ? log.details.substring(0, 100) 
                        : JSON.stringify(log.details).substring(0, 100)
                    ) : 'Sem detalhes'}
                    {log.details && (typeof log.details === 'string' ? log.details.length > 100 : JSON.stringify(log.details).length > 100) && '...'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuditLogsPage(p => Math.max(0, p - 1))}
              disabled={auditLogsPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Página {auditLogsPage + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuditLogsPage(p => p + 1)}
              disabled={auditLogs.length < AUDIT_LOGS_PER_PAGE}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsSection;
