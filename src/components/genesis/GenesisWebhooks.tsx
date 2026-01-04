import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenesisWebhook {
  id: string;
  name: string;
  url: string;
  secret_key: string | null;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

interface GenesisWebhooksProps {
  userId: string;
}

const AVAILABLE_EVENTS = [
  { value: 'connected', label: 'Conexão estabelecida' },
  { value: 'disconnected', label: 'Desconexão' },
  { value: 'message_received', label: 'Mensagem recebida' },
  { value: 'message_sent', label: 'Mensagem enviada' },
  { value: 'qr_generated', label: 'QR Code gerado' },
  { value: 'error', label: 'Erro' },
];

export function GenesisWebhooks({ userId }: GenesisWebhooksProps) {
  const [webhooks, setWebhooks] = useState<GenesisWebhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<GenesisWebhook | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret_key: '',
    events: ['connected', 'disconnected'] as string[],
  });

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('genesis_webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks((data || []) as GenesisWebhook[]);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [userId]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.url) {
      toast.error('Nome e URL são obrigatórios');
      return;
    }

    try {
      if (editingWebhook) {
        const { error } = await supabase
          .from('genesis_webhooks')
          .update({
            name: formData.name,
            url: formData.url,
            secret_key: formData.secret_key || null,
            events: formData.events,
          })
          .eq('id', editingWebhook.id);

        if (error) throw error;
        toast.success('Webhook atualizado!');
      } else {
        const { error } = await supabase.from('genesis_webhooks').insert({
          user_id: userId,
          name: formData.name,
          url: formData.url,
          secret_key: formData.secret_key || null,
          events: formData.events,
        });

        if (error) throw error;
        toast.success('Webhook criado!');
      }

      setIsModalOpen(false);
      setEditingWebhook(null);
      setFormData({ name: '', url: '', secret_key: '', events: ['connected', 'disconnected'] });
      fetchWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Erro ao salvar webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este webhook?')) return;

    try {
      const { error } = await supabase.from('genesis_webhooks').delete().eq('id', id);
      if (error) throw error;
      toast.success('Webhook excluído');
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Erro ao excluir');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('genesis_webhooks')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const openEdit = (webhook: GenesisWebhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret_key: webhook.secret_key || '',
      events: webhook.events,
    });
    setIsModalOpen(true);
  };

  const generateSecretKey = () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setFormData(prev => ({ ...prev, secret_key: key }));
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhooks
          </CardTitle>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingWebhook(null);
              setFormData({ name: '', url: '', secret_key: '', events: ['connected', 'disconnected'] });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Meu Webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://meusite.com/webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    Secret Key (opcional)
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateSecretKey}
                      className="h-6 text-xs"
                    >
                      Gerar
                    </Button>
                  </Label>
                  <Input
                    value={formData.secret_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
                    placeholder="Chave para assinar requisições"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eventos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              events: checked
                                ? [...prev.events, event.value]
                                : prev.events.filter(e => e !== event.value),
                            }));
                          }}
                        />
                        <span className="text-sm">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingWebhook ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Webhook className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhum webhook configurado</p>
            <p className="text-xs">Clique em "Novo" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {webhooks.map((webhook, i) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    webhook.is_active
                      ? 'bg-muted/20 border-border'
                      : 'bg-muted/5 border-muted opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{webhook.name}</h4>
                        {webhook.failure_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {webhook.failure_count} falhas
                          </Badge>
                        )}
                        {webhook.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      {webhook.last_triggered_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Último disparo: {format(new Date(webhook.last_triggered_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(webhook)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(webhook.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
