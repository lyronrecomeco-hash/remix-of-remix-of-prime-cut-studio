import { useState, useEffect } from 'react';
import { Settings, Bell, Send, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AffiliateSettingsProps {
  affiliateId: string;
}

interface AffiliatePreferences {
  auto_send_proposal: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
}

const AffiliateSettings = ({ affiliateId }: AffiliateSettingsProps) => {
  const [preferences, setPreferences] = useState<AffiliatePreferences>({
    auto_send_proposal: false,
    email_notifications: true,
    whatsapp_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [affiliateId]);

  const loadPreferences = async () => {
    try {
      // Load from localStorage for now (can be moved to DB later)
      const stored = localStorage.getItem(`affiliate_prefs_${affiliateId}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`affiliate_prefs_${affiliateId}`, JSON.stringify(preferences));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AffiliatePreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configurações
        </h2>
        <p className="text-muted-foreground mt-1">
          Personalize suas preferências do painel de afiliado
        </p>
      </div>

      {/* Modo Empresa Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Modo Empresa
          </CardTitle>
          <CardDescription>
            Configure o comportamento do envio de propostas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-send" className="text-base font-medium">
                Envio Automático de Propostas
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando ativado, a proposta será enviada automaticamente assim que o questionário for concluído e a proposta gerada.
              </p>
            </div>
            <Switch
              id="auto-send"
              checked={preferences.auto_send_proposal}
              onCheckedChange={() => handleToggle('auto_send_proposal')}
            />
          </div>

          {preferences.auto_send_proposal && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-medium">
                ✓ Modo automático ativado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                As propostas serão enviadas imediatamente após a geração, sem necessidade de ação manual.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Escolha como deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif" className="text-base font-medium">
                Notificações por E-mail
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre suas vendas e comissões por e-mail
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={preferences.email_notifications}
              onCheckedChange={() => handleToggle('email_notifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-notif" className="text-base font-medium">
                Notificações por WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas importantes via WhatsApp
              </p>
            </div>
            <Switch
              id="whatsapp-notif"
              checked={preferences.whatsapp_notifications}
              onCheckedChange={() => handleToggle('whatsapp_notifications')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default AffiliateSettings;
