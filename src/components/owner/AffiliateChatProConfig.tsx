import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, MessageCircle, CheckCircle, XCircle, Send, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ChatProConfig {
  base_endpoint: string;
  instance_id: string;
  api_token: string;
  is_enabled: boolean;
}

const AffiliateChatProConfig = () => {
  const [config, setConfig] = useState<ChatProConfig>({
    base_endpoint: 'https://v2.chatpro.com.br',
    instance_id: '',
    api_token: '',
    is_enabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('owner_settings')
        .select('setting_value')
        .eq('setting_key', 'affiliate_chatpro_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        const savedConfig = data.setting_value as unknown as ChatProConfig;
        setConfig({
          base_endpoint: savedConfig.base_endpoint || 'https://v2.chatpro.com.br',
          instance_id: savedConfig.instance_id || '',
          api_token: savedConfig.api_token || '',
          is_enabled: savedConfig.is_enabled || false
        });
      }
    } catch (error) {
      console.error('Error fetching ChatPro config:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.instance_id || !config.api_token) {
      toast.error('Preencha o Instance ID e Token');
      return;
    }

    setIsSaving(true);
    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('owner_settings')
        .select('id')
        .eq('setting_key', 'affiliate_chatpro_config')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('owner_settings')
          .update({
            setting_value: config as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'affiliate_chatpro_config');

        if (error) throw error;
      } else {
        // Insert new - migration already created the record, so this is a fallback
        const insertData = {
          setting_key: 'affiliate_chatpro_config' as const,
          setting_value: config as unknown as Json,
          description: 'Configuração do ChatPro para verificação de afiliados'
        };
        
        const { error } = await supabase
          .from('owner_settings')
          .insert(insertData);

        if (error) throw error;
      }

      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Error saving ChatPro config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) {
      toast.error('Digite um número para teste');
      return;
    }

    if (!config.instance_id || !config.api_token) {
      toast.error('Configure o ChatPro primeiro');
      return;
    }

    setIsTesting(true);
    try {
      // Extract clean base endpoint (remove instance_id if user pasted full URL)
      let cleanEndpoint = config.base_endpoint.replace(/\/$/, '');
      const instanceId = config.instance_id.trim();
      
      // Remove instance_id from endpoint if it was included
      if (cleanEndpoint.includes(instanceId)) {
        cleanEndpoint = cleanEndpoint.replace(new RegExp(`/${instanceId}.*$`), '');
      }
      
      // Build correct URL: base_endpoint/instance_id/api/v1/send_message
      const url = `${cleanEndpoint}/${instanceId}/api/v1/send_message`;

      const cleanPhone = testPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.api_token
        },
        body: JSON.stringify({
          number: formattedPhone,
          message: '✅ *Teste ChatPro Genesis Hub*\n\nConexão funcionando corretamente!'
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ${response.status}: ${text}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Mensagem de teste enviada com sucesso!');
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = config.instance_id && config.api_token && config.is_enabled;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">ChatPro para Afiliados</CardTitle>
              <CardDescription>
                Configure o envio de códigos de verificação via WhatsApp
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConfigured ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isConfigured ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Ativo
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Inativo
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium mb-1">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-500/80">
                <li>Acesse o painel do ChatPro</li>
                <li>Copie o <strong>Instance ID</strong> (ex: chatpro-abc123)</li>
                <li>Copie o <strong>Token de API</strong></li>
                <li>Cole aqui e ative a integração</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
          <div>
            <p className="font-medium">Ativar ChatPro</p>
            <p className="text-sm text-muted-foreground">Habilitar envio de códigos via WhatsApp</p>
          </div>
          <Switch
            checked={config.is_enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_enabled: checked }))}
          />
        </div>

        {/* Configuration Fields */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Base Endpoint</Label>
            <Input
              value={config.base_endpoint}
              onChange={(e) => setConfig(prev => ({ ...prev, base_endpoint: e.target.value }))}
              placeholder="https://v2.chatpro.com.br"
            />
            <p className="text-xs text-muted-foreground">
              Geralmente: https://v2.chatpro.com.br ou https://v5.chatpro.com.br
            </p>
          </div>

          <div className="space-y-2">
            <Label>Instance ID</Label>
            <Input
              value={config.instance_id}
              onChange={(e) => setConfig(prev => ({ ...prev, instance_id: e.target.value }))}
              placeholder="chatpro-xxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Encontre no painel do ChatPro (ex: chatpro-59xioz25vo)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Token de API</Label>
            <Input
              type="password"
              value={config.api_token}
              onChange={(e) => setConfig(prev => ({ ...prev, api_token: e.target.value }))}
              placeholder="Seu token de autenticação"
            />
          </div>
        </div>

        {/* Test Section */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
          <Label>Testar Conexão</Label>
          <div className="flex gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="(27) 99999-9999"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !config.instance_id || !config.api_token}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Testar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Envie uma mensagem de teste para verificar se a conexão está funcionando
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://app.chatpro.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Acessar ChatPro
          </a>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configuração
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateChatProConfig;
