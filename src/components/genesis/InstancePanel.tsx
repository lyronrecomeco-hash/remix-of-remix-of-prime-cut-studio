import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Smartphone,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Download,
  FileText,
  Settings2,
  Link2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GenesisWhatsAppConnect } from './GenesisWhatsAppConnect';

// Import integration logos
import shopifyLogo from '@/assets/integrations/shopify.png';
import woocommerceLogo from '@/assets/integrations/woocommerce.png';
import nuvemshopLogo from '@/assets/integrations/nuvemshop.png';
import mercadoshopsLogo from '@/assets/integrations/mercadoshops.png';
import rdstationLogo from '@/assets/integrations/rdstation.png';

interface Instance {
  id: string;
  name: string;
  phone_number?: string;
  status: string;
  is_paused: boolean;
  created_at: string;
  backend_url?: string;
  backend_token?: string;
  last_heartbeat?: string;
  effective_status?: string;
}

interface InstancePanelProps {
  instance: Instance;
  onBack: () => void;
}

// Integration cards
const integrations = [
  { id: 'shopify', name: 'Shopify', description: 'Integre sua loja Shopify para enviar notificações.', logo: shopifyLogo, enabled: false },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Integre sua loja WooCommerce para enviar notificações.', logo: woocommerceLogo, enabled: false },
  { id: 'nuvemshop', name: 'Nuvemshop', description: 'Integre sua conta Nuvemshop para realizar disparos.', logo: nuvemshopLogo, enabled: false },
  { id: 'mercadoshops', name: 'Mercado Shops', description: 'Integre sua conta do Mercado Shops para receber notificações.', logo: mercadoshopsLogo, enabled: false },
  { id: 'rdstation', name: 'RD Station', description: 'Integre sua conta RD Station para realizar gráficos.', logo: rdstationLogo, enabled: false },
];

export function InstancePanel({ instance: initialInstance, onBack }: InstancePanelProps) {
  const [instance, setInstance] = useState<Instance>(initialInstance);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [events, setEvents] = useState({
    message_received: true,
    message_sent: true,
    message_status: false,
    connection_status: true,
    group_events: false,
  });
  const [autoReadMessages, setAutoReadMessages] = useState(false);
  const [saving, setSaving] = useState(false);

  const instanceCode = `genesis-${instance.id.slice(0, 8)}`;
  const endpoint = `https://api.genesis.com.br/instances/${instanceCode}`;
  const token = `gns_${instance.id.replace(/-/g, '').slice(0, 24)}...`;

  const fetchInstance = async () => {
    const { data, error } = await supabase
      .from('genesis_instances')
      .select('*')
      .eq('id', instance.id)
      .single();

    if (!error && data) {
      setInstance(data as Instance);
    }
  };

  useEffect(() => {
    fetchInstance();
  }, [instance.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const handleAction = async (action: string) => {
    if (action === 'Pausar') {
      await supabase
        .from('genesis_instances')
        .update({ is_paused: true })
        .eq('id', instance.id);
      toast.success('Instância pausada');
      fetchInstance();
    } else if (action === 'Retomar') {
      await supabase
        .from('genesis_instances')
        .update({ is_paused: false })
        .eq('id', instance.id);
      toast.success('Instância retomada');
      fetchInstance();
    } else {
      toast.info(`${action} - Em implementação`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-primary hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{instance.name}</h2>
              <p className="text-xs text-muted-foreground">
                {instance.phone_number || 'Aguardando conexão'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* WhatsApp Connection - MAIN FOCUS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GenesisWhatsAppConnect 
          instance={instance} 
          onRefresh={fetchInstance} 
        />
      </motion.div>

      {/* Quick Actions Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {instance.is_paused ? (
                <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Retomar')}>
                  <Play className="w-4 h-4 text-green-500" />
                  Retomar
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Pausar')}>
                  <Pause className="w-4 h-4 text-yellow-500" />
                  Pausar
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Reiniciar')}>
                <RefreshCw className="w-4 h-4 text-blue-500" />
                Reiniciar
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Exportar contatos')}>
                <Download className="w-4 h-4" />
                Contatos
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Exportar chats')}>
                <Download className="w-4 h-4" />
                Chats
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-10" onClick={() => handleAction('Histórico')}>
                <FileText className="w-4 h-4" />
                Histórico
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-10 opacity-50" disabled>
                <FileText className="w-4 h-4" />
                Docs
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Consumo mínimo: 15 créditos/dia por instância ativa
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Info - For External Integrations */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Dados para Integração Externa
            </CardTitle>
            <CardDescription className="text-xs">
              Use estes dados para integrar com sistemas externos via API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">Código da Instância</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono flex-1 truncate">{instanceCode}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(instanceCode, 'Código')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">Endpoint API</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono flex-1 truncate">{endpoint}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(endpoint, 'Endpoint')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <Label className="text-xs text-muted-foreground">Token API</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono flex-1 truncate">••••••••</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(token, 'Token')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Webhook Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm">Endereço webhook (opcional)</Label>
              <Input 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://seu-servidor.com/webhook"
                className="mt-2"
              />
            </div>

            <div className="space-y-4">
              {Object.entries(events).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={value}
                      onCheckedChange={(checked) => setEvents(e => ({ ...e, [key]: checked }))}
                    />
                    <span className="text-sm">
                      {key === 'message_received' && 'Eventos de recebimento de mensagem'}
                      {key === 'message_sent' && 'Eventos de envio de mensagem'}
                      {key === 'message_status' && 'Eventos de status de mensagem'}
                      {key === 'connection_status' && 'Eventos de status da conexão'}
                      {key === 'group_events' && 'Eventos de grupos'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-4">Outras configurações</p>
              <div className="flex items-center gap-3">
                <Switch 
                  checked={autoReadMessages}
                  onCheckedChange={setAutoReadMessages}
                />
                <span className="text-sm">Ler mensagens automática</span>
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Aplicar e salvar
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations - All Locked */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Integrações
                </CardTitle>
                <CardDescription>Integrações disponíveis em breve</CardDescription>
              </div>
              <Button variant="link" size="sm" className="text-muted-foreground" disabled>
                Abrir relatórios das integrações
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <Card 
                  key={integration.id} 
                  className="opacity-60 pointer-events-none relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardContent className="pt-6">
                    <div className="h-16 mb-3 flex items-center">
                      <img 
                        src={integration.logo} 
                        alt={integration.name} 
                        className="h-14 w-auto object-contain max-w-[160px]"
                      />
                    </div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-4 w-full opacity-50 cursor-not-allowed"
                      disabled
                    >
                      ACESSAR
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
