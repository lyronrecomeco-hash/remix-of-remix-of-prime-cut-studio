import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Server, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  Copy, 
  Check,
  RefreshCw,
  Settings2,
  MessageSquare,
  Clock,
  Shield,
  Link2,
  AlertTriangle,
  Power,
  PowerOff
} from 'lucide-react';

interface BackendConfig {
  id: string;
  backend_url: string | null;
  master_token: string | null;
  is_connected: boolean;
  last_health_check: string | null;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  instance_token: string;
  status: 'inactive' | 'awaiting_backend' | 'connected' | 'disconnected' | 'qr_pending';
  phone_number: string | null;
  last_seen: string | null;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  message_delay_ms: number;
  created_at: string;
}

const statusConfig = {
  inactive: { label: 'Inativo', color: 'bg-gray-500', icon: PowerOff },
  awaiting_backend: { label: 'Aguardando Backend', color: 'bg-yellow-500', icon: Clock },
  connected: { label: 'Conectado', color: 'bg-green-500', icon: Wifi },
  disconnected: { label: 'Desconectado', color: 'bg-red-500', icon: WifiOff },
  qr_pending: { label: 'QR Code Pendente', color: 'bg-blue-500', icon: QrCode },
};

const WhatsAppAutomation = () => {
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Form states
  const [backendUrl, setBackendUrl] = useState('');
  const [masterToken, setMasterToken] = useState('');
  
  // New instance dialog
  const [isNewInstanceOpen, setIsNewInstanceOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  
  // Edit instance dialog
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [editName, setEditName] = useState('');
  const [editAutoReply, setEditAutoReply] = useState(false);
  const [editAutoReplyMessage, setEditAutoReplyMessage] = useState('');
  const [editMessageDelay, setEditMessageDelay] = useState(1000);

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch backend config
      const { data: configData, error: configError } = await supabase
        .from('whatsapp_backend_config')
        .select('*')
        .maybeSingle();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (configData) {
        setBackendConfig(configData);
        setBackendUrl(configData.backend_url || '');
        setMasterToken(configData.master_token || '');
      }

      // Fetch instances
      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;
      setInstances((instancesData || []) as WhatsAppInstance[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBackendConfig = async () => {
    setIsSaving(true);
    try {
      if (backendConfig?.id) {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .update({
            backend_url: backendUrl || null,
            master_token: masterToken || null,
          })
          .eq('id', backendConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_backend_config')
          .insert({
            backend_url: backendUrl || null,
            master_token: masterToken || null,
          });

        if (error) throw error;
      }

      toast.success('Configuração salva com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const testBackendConnection = async () => {
    if (!backendUrl) {
      toast.error('Configure a URL do backend primeiro');
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${masterToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update connection status
        if (backendConfig?.id) {
          await supabase
            .from('whatsapp_backend_config')
            .update({
              is_connected: true,
              last_health_check: new Date().toISOString(),
            })
            .eq('id', backendConfig.id);
        }
        toast.success('Backend conectado com sucesso!');
        fetchData();
      } else {
        throw new Error('Backend não respondeu corretamente');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      if (backendConfig?.id) {
        await supabase
          .from('whatsapp_backend_config')
          .update({
            is_connected: false,
          })
          .eq('id', backendConfig.id);
      }
      toast.error('Falha na conexão com o backend. Verifique se está online.');
      fetchData();
    } finally {
      setIsTestingConnection(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setIsCreatingInstance(true);
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .insert({
          name: newInstanceName.trim(),
          status: backendConfig?.is_connected ? 'awaiting_backend' : 'inactive',
        });

      if (error) throw error;

      toast.success('Instância criada com sucesso');
      setNewInstanceName('');
      setIsNewInstanceOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const updateInstance = async () => {
    if (!editingInstance) return;

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          name: editName,
          auto_reply_enabled: editAutoReply,
          auto_reply_message: editAutoReplyMessage || null,
          message_delay_ms: editMessageDelay,
        })
        .eq('id', editingInstance.id);

      if (error) throw error;

      toast.success('Instância atualizada');
      setEditingInstance(null);
      fetchData();
    } catch (error) {
      console.error('Error updating instance:', error);
      toast.error('Erro ao atualizar instância');
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Instância removida');
      fetchData();
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao remover instância');
    }
  };

  const copyToClipboard = async (text: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(tokenId);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success('Copiado para a área de transferência');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const openEditDialog = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setEditName(instance.name);
    setEditAutoReply(instance.auto_reply_enabled);
    setEditAutoReplyMessage(instance.auto_reply_message || '');
    setEditMessageDelay(instance.message_delay_ms);
  };

  const getInstanceEndpoint = (instanceId: string) => {
    if (backendUrl) {
      return `${backendUrl}/api/instance/${instanceId}`;
    }
    return `${currentDomain}/api/whatsapp/${instanceId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">WhatsApp Automação</h2>
          <p className="text-muted-foreground">
            Gerencie instâncias e configure o backend de automação
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="instances" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="backend" className="gap-2">
            <Server className="w-4 h-4" />
            Backend
          </TabsTrigger>
        </TabsList>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-6">
          {/* Backend Status Alert */}
          {!backendConfig?.is_connected && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">
                    Backend não configurado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configure o backend Node.js na aba "Backend" para ativar as automações
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Instance Button */}
          <div className="flex justify-end">
            <Dialog open={isNewInstanceOpen} onOpenChange={setIsNewInstanceOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Instância</DialogTitle>
                  <DialogDescription>
                    Cada instância representa um número de WhatsApp diferente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Instância</Label>
                    <Input
                      placeholder="Ex: WhatsApp Principal"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewInstanceOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={createInstance}
                    disabled={isCreatingInstance}
                  >
                    {isCreatingInstance && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Criar Instância
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Instances List */}
          {instances.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma instância criada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira instância para começar
                </p>
                <Button onClick={() => setIsNewInstanceOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Instância
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {instances.map((instance) => {
                const statusInfo = statusConfig[instance.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={instance.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${statusInfo.color}/20 flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{instance.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {statusInfo.label}
                              </Badge>
                              {instance.phone_number && (
                                <span className="text-xs">{instance.phone_number}</span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(instance)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover instância?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A instância "{instance.name}" será removida permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInstance(instance.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Separator />
                      
                      {/* Token & Endpoint */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Token de Autenticação
                          </Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                              {instance.instance_token.substring(0, 20)}...
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(instance.instance_token, `token-${instance.id}`)}
                            >
                              {copiedToken === `token-${instance.id}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            Endpoint da API
                          </Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                              {getInstanceEndpoint(instance.id)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getInstanceEndpoint(instance.id), `endpoint-${instance.id}`)}
                            >
                              {copiedToken === `endpoint-${instance.id}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Auto Reply Status */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Resposta Automática</span>
                        </div>
                        <Badge variant={instance.auto_reply_enabled ? 'default' : 'secondary'}>
                          {instance.auto_reply_enabled ? 'Ativo' : 'Desativado'}
                        </Badge>
                      </div>

                      {/* Actions */}
                      {!backendConfig?.is_connected && (
                        <p className="text-xs text-muted-foreground text-center">
                          Configure o backend para ativar ações de conexão e QR Code
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Backend Tab */}
        <TabsContent value="backend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Configuração do Backend
              </CardTitle>
              <CardDescription>
                Configure a conexão com seu servidor Node.js de automação WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className={`w-3 h-3 rounded-full ${backendConfig?.is_connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="flex-1">
                  <p className="font-medium">
                    {backendConfig?.is_connected ? 'Backend Conectado' : 'Backend Desconectado'}
                  </p>
                  {backendConfig?.last_health_check && (
                    <p className="text-xs text-muted-foreground">
                      Última verificação: {new Date(backendConfig.last_health_check).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testBackendConnection}
                  disabled={isTestingConnection || !backendUrl}
                >
                  {isTestingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {/* Backend URL */}
              <div className="space-y-2">
                <Label>URL do Backend (VPS)</Label>
                <Input
                  placeholder="https://seu-servidor.com"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL do seu servidor Node.js com WhatsApp Web (Baileys)
                </p>
              </div>

              {/* Master Token */}
              <div className="space-y-2">
                <Label>Token Master</Label>
                <Input
                  type="password"
                  placeholder="Token de autenticação do backend"
                  value={masterToken}
                  onChange={(e) => setMasterToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Token para autenticar requisições ao backend
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={testBackendConnection}
                  disabled={isTestingConnection || !backendUrl}
                >
                  {isTestingConnection && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Testar Conexão
                </Button>
                <Button onClick={saveBackendConfig} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Endpoints da API
              </CardTitle>
              <CardDescription>
                Endpoints que seu backend deve implementar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {[
                    { method: 'GET', path: '/health', desc: 'Health check do backend' },
                    { method: 'GET', path: '/api/instance/:id/status', desc: 'Status da instância' },
                    { method: 'GET', path: '/api/instance/:id/qrcode', desc: 'Obter QR Code' },
                    { method: 'POST', path: '/api/instance/:id/connect', desc: 'Conectar instância' },
                    { method: 'POST', path: '/api/instance/:id/disconnect', desc: 'Desconectar instância' },
                    { method: 'POST', path: '/api/instance/:id/send', desc: 'Enviar mensagem' },
                  ].map((endpoint, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge
                        variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        className="font-mono text-xs"
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="flex-1 text-sm font-mono">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Instance Dialog */}
      <Dialog open={!!editingInstance} onOpenChange={(open) => !open && setEditingInstance(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Instância</DialogTitle>
            <DialogDescription>
              Configure as opções da instância "{editingInstance?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Resposta Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Responder automaticamente mensagens recebidas
                </p>
              </div>
              <Switch
                checked={editAutoReply}
                onCheckedChange={setEditAutoReply}
              />
            </div>

            {editAutoReply && (
              <div className="space-y-2">
                <Label>Mensagem de Resposta</Label>
                <Textarea
                  placeholder="Digite a mensagem automática..."
                  value={editAutoReplyMessage}
                  onChange={(e) => setEditAutoReplyMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Delay entre Mensagens (ms)</Label>
              <Input
                type="number"
                min={500}
                max={10000}
                value={editMessageDelay}
                onChange={(e) => setEditMessageDelay(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Tempo de espera entre mensagens consecutivas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInstance(null)}>
              Cancelar
            </Button>
            <Button onClick={updateInstance}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAutomation;