import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Shield,
  Clock,
  Zap,
  Activity,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Save,
  Loader2,
  FileText,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface SecuritySettings {
  id: string;
  instance_id: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  message_delay_min_ms: number;
  message_delay_max_ms: number;
  typing_simulation: boolean;
  typing_duration_ms: number;
  warmup_enabled: boolean;
  warmup_day: number;
  warmup_messages_per_day: number;
  ip_whitelist: string[];
  blocked_keywords: string[];
  require_2fa: boolean;
  audit_log_enabled: boolean;
}

interface AuditLog {
  id: string;
  instance_id: string | null;
  action: string;
  actor_type: string;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  created_at: string;
}

interface WASecurityProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

export const WASecurity = ({ instances }: WASecurityProps) => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  // Form state
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [rateLimitPerHour, setRateLimitPerHour] = useState(500);
  const [delayMin, setDelayMin] = useState(1000);
  const [delayMax, setDelayMax] = useState(3000);
  const [typingEnabled, setTypingEnabled] = useState(true);
  const [typingDuration, setTypingDuration] = useState(2000);
  const [warmupEnabled, setWarmupEnabled] = useState(false);
  const [warmupDay, setWarmupDay] = useState(1);
  const [warmupMessagesPerDay, setWarmupMessagesPerDay] = useState(10);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [blockedKeywords, setBlockedKeywords] = useState('');
  const [auditEnabled, setAuditEnabled] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const instanceId = instances[0]?.id;
      if (!instanceId) return;

      const [settingsRes, logsRes] = await Promise.all([
        supabase
          .from('whatsapp_security_settings')
          .select('*')
          .eq('instance_id', instanceId)
          .maybeSingle(),
        supabase
          .from('whatsapp_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (settingsRes.data) {
        const s = settingsRes.data as SecuritySettings;
        setSettings(s);
        setRateLimitPerMinute(s.rate_limit_per_minute);
        setRateLimitPerHour(s.rate_limit_per_hour);
        setDelayMin(s.message_delay_min_ms);
        setDelayMax(s.message_delay_max_ms);
        setTypingEnabled(s.typing_simulation);
        setTypingDuration(s.typing_duration_ms);
        setWarmupEnabled(s.warmup_enabled);
        setWarmupDay(s.warmup_day);
        setWarmupMessagesPerDay(s.warmup_messages_per_day);
        setIpWhitelist(s.ip_whitelist.join(', '));
        setBlockedKeywords(s.blocked_keywords.join(', '));
        setAuditEnabled(s.audit_log_enabled);
      }

      if (logsRes.data) {
        setAuditLogs(logsRes.data as AuditLog[]);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [instances]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSettings = async () => {
    const instanceId = instances[0]?.id;
    if (!instanceId) {
      toast.error('Nenhuma instância configurada');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        instance_id: instanceId,
        rate_limit_per_minute: rateLimitPerMinute,
        rate_limit_per_hour: rateLimitPerHour,
        message_delay_min_ms: delayMin,
        message_delay_max_ms: delayMax,
        typing_simulation: typingEnabled,
        typing_duration_ms: typingDuration,
        warmup_enabled: warmupEnabled,
        warmup_day: warmupDay,
        warmup_messages_per_day: warmupMessagesPerDay,
        ip_whitelist: ipWhitelist.split(',').map(ip => ip.trim()).filter(Boolean),
        blocked_keywords: blockedKeywords.split(',').map(k => k.trim()).filter(Boolean),
        audit_log_enabled: auditEnabled,
      };

      if (settings) {
        const { error } = await supabase
          .from('whatsapp_security_settings')
          .update(data)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_security_settings')
          .insert(data);
        if (error) throw error;
      }

      toast.success('Configurações salvas!');
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Data', 'Ação', 'Tipo Ator', 'Ator', 'Tipo Alvo', 'Alvo', 'IP'].join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.action,
        log.actor_type,
        log.actor_id || '',
        log.target_type || '',
        log.target_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs-whatsapp.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados!');
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!logFilter) return true;
    const query = logFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.actor_type.toLowerCase().includes(query) ||
      log.target_type?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>
            Configure limites de envio para evitar banimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Limite por Minuto</Label>
                <span className="text-sm font-medium">{rateLimitPerMinute} msg</span>
              </div>
              <Slider
                value={[rateLimitPerMinute]}
                onValueChange={([v]) => setRateLimitPerMinute(v)}
                min={10}
                max={200}
                step={5}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Limite por Hora</Label>
                <span className="text-sm font-medium">{rateLimitPerHour} msg</span>
              </div>
              <Slider
                value={[rateLimitPerHour]}
                onValueChange={([v]) => setRateLimitPerHour(v)}
                min={100}
                max={2000}
                step={50}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anti-Ban Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Proteção Anti-Ban
          </CardTitle>
          <CardDescription>
            Configurações para simular comportamento humano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Delay Mínimo</Label>
                <span className="text-sm font-medium">{delayMin}ms</span>
              </div>
              <Slider
                value={[delayMin]}
                onValueChange={([v]) => setDelayMin(v)}
                min={500}
                max={10000}
                step={100}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Delay Máximo</Label>
                <span className="text-sm font-medium">{delayMax}ms</span>
              </div>
              <Slider
                value={[delayMax]}
                onValueChange={([v]) => setDelayMax(v)}
                min={1000}
                max={15000}
                step={100}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Simular Digitação</p>
              <p className="text-sm text-muted-foreground">
                Mostra "digitando..." antes de enviar
              </p>
            </div>
            <Switch checked={typingEnabled} onCheckedChange={setTypingEnabled} />
          </div>

          {typingEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Duração da Digitação</Label>
                <span className="text-sm font-medium">{typingDuration}ms</span>
              </div>
              <Slider
                value={[typingDuration]}
                onValueChange={([v]) => setTypingDuration(v)}
                min={500}
                max={5000}
                step={100}
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Warmup de Instância</p>
              <p className="text-sm text-muted-foreground">
                Aumento gradual de envios em novas instâncias
              </p>
            </div>
            <Switch checked={warmupEnabled} onCheckedChange={setWarmupEnabled} />
          </div>

          {warmupEnabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Dia atual do warmup</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={warmupDay}
                  onChange={(e) => setWarmupDay(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagens por dia (base)</Label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={warmupMessagesPerDay}
                  onChange={(e) => setWarmupMessagesPerDay(parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Palavras Bloqueadas
          </CardTitle>
          <CardDescription>
            Mensagens contendo essas palavras não serão enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="spam, promoção, grátis (separadas por vírgula)"
            value={blockedKeywords}
            onChange={(e) => setBlockedKeywords(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            IP Whitelist
          </CardTitle>
          <CardDescription>
            Apenas IPs listados podem acessar a API (deixe vazio para desativar)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="192.168.1.1, 10.0.0.1 (separados por vírgula)"
            value={ipWhitelist}
            onChange={(e) => setIpWhitelist(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Configurações
      </Button>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de ações do sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar logs..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum log encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.actor_type}</span>
                        {log.actor_id && (
                          <span className="ml-1 font-mono text-xs">
                            {log.actor_id.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target_type && (
                          <span className="text-muted-foreground">{log.target_type}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
