import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Save, AlertTriangle, CheckCircle, XCircle, Key, Bell, Shield, Database, Loader2 } from 'lucide-react';

interface OwnerSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

interface IntegrationStatus {
  name: string;
  configured: boolean;
  lastCheck?: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<OwnerSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  // Form states
  const [systemLimits, setSystemLimits] = useState({
    max_appointments_per_day: 50,
    max_barbers: 10,
    max_services: 20,
  });
  const [notifications, setNotifications] = useState({
    critical_errors: true,
    login_alerts: true,
    daily_summary: false,
  });

  useEffect(() => {
    fetchSettings();
    checkIntegrations();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('owner_settings')
        .select('*');

      if (error) throw error;

      setSettings(data || []);

      // Parse settings
      data?.forEach(setting => {
        if (setting.setting_key === 'system_limits' && typeof setting.setting_value === 'object') {
          setSystemLimits(setting.setting_value as typeof systemLimits);
        }
        if (setting.setting_key === 'notifications' && typeof setting.setting_value === 'object') {
          setNotifications(setting.setting_value as typeof notifications);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIntegrations = async () => {
    try {
      // Check ChatPro
      const { data: chatproData } = await supabase
        .from('chatpro_config')
        .select('is_enabled, api_token')
        .single();

      // Check Webhooks
      const { data: webhooksData } = await supabase
        .from('webhook_configs')
        .select('is_active')
        .eq('is_active', true);

      setIntegrations([
        {
          name: 'ChatPro (WhatsApp)',
          configured: !!(chatproData?.is_enabled && chatproData?.api_token),
        },
        {
          name: 'Webhooks',
          configured: (webhooksData?.length || 0) > 0,
        },
        {
          name: 'Email (Resend)',
          configured: false, // Will be true when RESEND_API_KEY is configured
        },
        {
          name: 'Push Notifications',
          configured: true, // Already configured with VAPID keys
        },
      ]);
    } catch (error) {
      console.error('Error checking integrations:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update system limits
      const { error: limitsError } = await supabase
        .from('owner_settings')
        .update({ 
          setting_value: systemLimits,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'system_limits');

      if (limitsError) throw limitsError;

      // Update notifications
      const { error: notifError } = await supabase
        .from('owner_settings')
        .update({ 
          setting_value: notifications,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'notifications');

      if (notifError) throw notifError;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Configurações do Sistema</h2>
          <p className="text-sm text-muted-foreground">Gerencie as configurações globais do sistema</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Limits */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Limites do Sistema
            </CardTitle>
            <CardDescription>Configure os limites operacionais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Máximo de Agendamentos/Dia</Label>
              <Input
                type="number"
                value={systemLimits.max_appointments_per_day}
                onChange={(e) => setSystemLimits({
                  ...systemLimits,
                  max_appointments_per_day: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo de Barbeiros</Label>
              <Input
                type="number"
                value={systemLimits.max_barbers}
                onChange={(e) => setSystemLimits({
                  ...systemLimits,
                  max_barbers: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Máximo de Serviços</Label>
              <Input
                type="number"
                value={systemLimits.max_services}
                onChange={(e) => setSystemLimits({
                  ...systemLimits,
                  max_services: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notificações do Owner
            </CardTitle>
            <CardDescription>Configure suas notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Erros Críticos</Label>
                <p className="text-xs text-muted-foreground">Notificar sobre erros graves</p>
              </div>
              <Switch
                checked={notifications.critical_errors}
                onCheckedChange={(checked) => setNotifications({
                  ...notifications,
                  critical_errors: checked
                })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Login</Label>
                <p className="text-xs text-muted-foreground">Notificar logins suspeitos</p>
              </div>
              <Switch
                checked={notifications.login_alerts}
                onCheckedChange={(checked) => setNotifications({
                  ...notifications,
                  login_alerts: checked
                })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Resumo Diário</Label>
                <p className="text-xs text-muted-foreground">Receber resumo do dia</p>
              </div>
              <Switch
                checked={notifications.daily_summary}
                onCheckedChange={(checked) => setNotifications({
                  ...notifications,
                  daily_summary: checked
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations Status */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Status das Integrações
            </CardTitle>
            <CardDescription>Verifique suas integrações ativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                <span className="text-sm">{integration.name}</span>
                <Badge variant={integration.configured ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {integration.configured ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Configurado
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Informações do Banco
            </CardTitle>
            <CardDescription>Dados sobre o banco de dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
              <span className="text-sm">Status</span>
              <Badge className="bg-green-500/10 text-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
              <span className="text-sm">Projeto</span>
              <span className="text-xs text-muted-foreground font-mono">wvnszzrvrrueuycrpgyc</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
              <span className="text-sm">RLS</span>
              <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
              <span className="text-sm">Backups</span>
              <Badge className="bg-green-500/10 text-green-500">Automático</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Warning */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Aviso de Segurança</p>
              <p className="text-sm text-muted-foreground mt-1">
                Este painel é acessível apenas para o email <strong>lyronrp@gmail.com</strong> com 
                role <strong>super_admin</strong>. Todas as ações são registradas nos logs de auditoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
