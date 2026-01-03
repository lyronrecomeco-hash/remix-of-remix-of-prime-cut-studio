import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Copy,
  Pause,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Instance {
  id: string;
  name: string;
  phone_number?: string;
  status: string;
  is_paused: boolean;
  created_at: string;
}

interface InstancePanelProps {
  instance: Instance;
  onBack: () => void;
}

// Locked integration cards
const integrations = [
  { id: 'chatpro', name: 'chatPro', description: 'Ferramenta de disparos de mensagens.', logo: '💬', enabled: false },
  { id: 'shopify', name: 'Shopify', description: 'Integre sua loja Shopify para enviar notificações.', logo: '🛒', enabled: false },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Integre sua loja WooCommerce para enviar notificações.', logo: '🛍️', enabled: false },
  { id: 'nuvemshop', name: 'NuvemShop', description: 'Integre sua conta NuvemShop para realizar disparos.', logo: '☁️', enabled: false },
  { id: 'rdstation', name: 'RD Station', description: 'Integre sua conta RD Station para realizar gráficos.', logo: '📊', enabled: false },
  { id: 'mercadoshops', name: 'Mercado Shops', description: 'Integre sua conta do Mercado Shops para receber notificações.', logo: '🏪', enabled: false },
];

export function InstancePanel({ instance, onBack }: InstancePanelProps) {
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulated save
    await new Promise(r => setTimeout(r, 800));
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const handleAction = (action: string) => {
    toast.info(`${action} - Em implementação`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-primary">
          <ArrowLeft className="w-4 h-4" />
          Minhas instâncias
        </Button>
        <span className="text-lg font-bold">{instance.name}</span>
      </motion.div>

      {/* Status and Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-500" />
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute -bottom-1 -right-1" />
                </div>
                <div>
                  <p className="text-green-500 font-semibold text-sm">conectado</p>
                  <p className="text-sm text-muted-foreground">Pushname: <span className="text-foreground">{instance.name}</span></p>
                  <p className="text-sm text-muted-foreground">
                    Número conectado: <span className="text-foreground">{instance.phone_number || 'Não disponível'}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAction('Pausar')}>
                  <Pause className="w-4 h-4" />
                  Pausar a Instância
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAction('Reiniciar')}>
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar e Atualizar
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAction('Exportar contatos')}>
                  <Download className="w-4 h-4" />
                  Exportar contatos
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAction('Exportar chats')}>
                  <Download className="w-4 h-4" />
                  Exportar chats
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAction('Histórico')}>
                  <FileText className="w-4 h-4" />
                  Histórico de ativação
                </Button>
                <Button variant="outline" size="sm" className="gap-2 opacity-50 cursor-not-allowed" disabled>
                  <FileText className="w-4 h-4" />
                  Documentação
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Consumo mínimo de créditos: cada instância ativa deve consumir no mínimo 15 créditos por dia. Se o consumo diário for menor, a diferença será debitada automaticamente.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Instance Info */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Informações da Instância
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Código</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={instanceCode} readOnly className="bg-muted/50" />
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(instanceCode, 'Código')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Endpoint</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={endpoint} readOnly className="bg-muted/50 text-xs" />
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(endpoint, 'Endpoint')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Token</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={token} readOnly type="password" className="bg-muted/50" />
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token, 'Token')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nome da Instância</Label>
                <Input value={instance.name} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Webhook Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
        transition={{ delay: 0.4 }}
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
                    <div className="text-3xl mb-3">{integration.logo}</div>
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
