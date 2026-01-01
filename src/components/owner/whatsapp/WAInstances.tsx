import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Server, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  QrCode, 
  Copy, 
  Check,
  Clock,
  PowerOff,
  Monitor,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppConnection } from './hooks/useWhatsAppConnection';

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

interface WAInstancesProps {
  instances: WhatsAppInstance[];
  isBackendActive: boolean;
  backendMode: 'vps' | 'local';
  backendUrl: string;
  localEndpoint: string;
  localPort: string;
  localToken: string;
  masterToken: string;
  isLocalConnected: boolean;
  onRefresh: () => void;
}

const statusConfig = {
  inactive: { label: 'Inativo', color: 'bg-gray-500', textColor: 'text-gray-500', icon: PowerOff },
  awaiting_backend: { label: 'Aguardando Backend', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Clock },
  connected: { label: 'Conectado', color: 'bg-green-500', textColor: 'text-green-500', icon: Wifi },
  disconnected: { label: 'Desconectado', color: 'bg-red-500', textColor: 'text-red-500', icon: WifiOff },
  qr_pending: { label: 'QR Pendente', color: 'bg-blue-500', textColor: 'text-blue-500', icon: QrCode },
};

export const WAInstances = ({
  instances,
  isBackendActive,
  backendMode,
  backendUrl,
  localEndpoint,
  localPort,
  localToken,
  masterToken,
  isLocalConnected,
  onRefresh,
}: WAInstancesProps) => {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<'choose' | 'form' | 'qrcode'>('choose');
  const [selectedBackendType, setSelectedBackendType] = useState<'vps' | 'local' | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);

  // Edit states
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [editName, setEditName] = useState('');
  const [editAutoReply, setEditAutoReply] = useState(false);
  const [editAutoReplyMessage, setEditAutoReplyMessage] = useState('');
  const [editMessageDelay, setEditMessageDelay] = useState(1000);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Use the new connection hook
  const { 
    connectionState, 
    startConnection, 
    refreshQRCode, 
    stopPolling 
  } = useWhatsAppConnection();

  const getBackendUrl = () => {
    return backendMode === 'local' ? `${localEndpoint}:${localPort}` : backendUrl;
  };

  const getToken = () => {
    return backendMode === 'local' ? localToken : masterToken;
  };

  const openNewDialog = () => {
    setCreationStep('choose');
    setSelectedBackendType(null);
    setNewName('');
    setNewPhone('');
    setCurrentInstanceId(null);
    setIsNewDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      stopPolling();
    }
    setIsNewDialogOpen(open);
  };

  // Close dialog when connected
  useEffect(() => {
    if (!connectionState.isPolling && !connectionState.qrCode && !connectionState.error && currentInstanceId) {
      // Connection successful - detected by no polling, no QR, no error but has instanceId
      // This means the connection callback was triggered
    }
  }, [connectionState, currentInstanceId]);

  const handleBackendTypeSelection = (type: 'vps' | 'local') => {
    setSelectedBackendType(type);
    setCreationStep('form');
  };

  const createInstance = async () => {
    if (!newName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      const instanceToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          name: newName,
          instance_token: instanceToken,
          status: 'inactive',
          phone_number: newPhone || null,
          auto_reply_enabled: false,
          message_delay_ms: 1000,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Instância criada!');
      setCurrentInstanceId(data.id);
      
      if (isBackendActive) {
        setCreationStep('qrcode');
        // Use the new connection hook
        startConnection(
          data.id,
          getBackendUrl(),
          getToken(),
          newPhone,
          () => {
            setIsNewDialogOpen(false);
            onRefresh();
          }
        );
      } else {
        setIsNewDialogOpen(false);
      }
      
      onRefresh();
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectInstance = (instanceId: string) => {
    const instance = instances.find((i) => i.id === instanceId);

    setCurrentInstanceId(instanceId);
    setCreationStep('qrcode');
    setIsNewDialogOpen(true);

    startConnection(
      instanceId,
      getBackendUrl(),
      getToken(),
      instance?.phone_number ?? undefined,
      () => {
        setIsNewDialogOpen(false);
        onRefresh();
      }
    );
  };

  const handleRefreshQR = () => {
    if (!currentInstanceId) return;
    
    refreshQRCode(
      currentInstanceId,
      getBackendUrl(),
      getToken()
    );
  };

  const openEditDialog = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setEditName(instance.name);
    setEditAutoReply(instance.auto_reply_enabled);
    setEditAutoReplyMessage(instance.auto_reply_message || '');
    setEditMessageDelay(instance.message_delay_ms);
  };

  const updateInstance = async () => {
    if (!editingInstance) return;

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          name: editName,
          auto_reply_enabled: editAutoReply,
          auto_reply_message: editAutoReplyMessage,
          message_delay_ms: editMessageDelay,
        })
        .eq('id', editingInstance.id);

      if (error) throw error;

      toast.success('Instância atualizada!');
      setEditingInstance(null);
      onRefresh();
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
      onRefresh();
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
      toast.success('Token copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const connectedCount = instances.filter(i => i.status === 'connected').length;

  const primaryInstance = instances.length === 1 ? instances[0] : null;
  const canQuickConnect = !!primaryInstance && isBackendActive && primaryInstance.status !== 'connected';

  const primaryAction = canQuickConnect
    ? {
        label: 'Conectar WhatsApp',
        onClick: () => handleConnectInstance(primaryInstance.id),
        icon: QrCode,
      }
    : {
        label: 'Nova Instância',
        onClick: openNewDialog,
        icon: Plus,
      };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{instances.length}</p>
                <p className="text-sm text-muted-foreground">Total de Instâncias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Wifi className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{instances.length - connectedCount}</p>
                <p className="text-sm text-muted-foreground">Desconectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backend Status */}
      {!isBackendActive ? (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium text-yellow-600 dark:text-yellow-400">
                Backend não configurado
              </p>
              <p className="text-sm text-muted-foreground">
                Configure o backend na aba "Configurações" para conectar instâncias
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-green-600 dark:text-green-400">
                Backend Ativo: {backendMode === 'vps' ? 'VPS' : 'PC Local'}
              </p>
              <p className="text-sm text-muted-foreground">
                {backendMode === 'vps' ? backendUrl : `${localEndpoint}:${localPort}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Instâncias WhatsApp</h3>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões WhatsApp</p>
        </div>
        <Button onClick={primaryAction.onClick} disabled={!isBackendActive && primaryAction.label === 'Conectar WhatsApp'}>
          <primaryAction.icon className="w-4 h-4 mr-2" />
          {primaryAction.label}
        </Button>
      </div>

      {/* Instances Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {instances.map((instance) => {
          const statusInfo = statusConfig[instance.status] || statusConfig.inactive;
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={instance.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-full ${statusInfo.color} flex items-center justify-center shrink-0`}>
                    <StatusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{instance.name}</h4>
                      <Badge variant="outline" className={statusInfo.textColor}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {instance.phone_number || 'Número não definido'}
                    </p>
                    {instance.auto_reply_enabled && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Auto-resposta ativa
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(instance.instance_token, instance.id)}
                    >
                      {copiedToken === instance.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(instance)}>
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    {isBackendActive && instance.status !== 'connected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConnectInstance(instance.id)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Instância</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover "{instance.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteInstance(instance.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {instances.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">Nenhuma instância criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira instância para começar a usar o WhatsApp Automação
              </p>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Instância
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Instance Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          {creationStep === 'choose' && (
            <>
              <DialogHeader>
                <DialogTitle>Escolha o Tipo de Backend</DialogTitle>
                <DialogDescription>
                  Selecione onde o WhatsApp será executado
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleBackendTypeSelection('vps')}
                  disabled={!isBackendActive || backendMode !== 'vps'}
                >
                  <Server className="w-8 h-8 text-primary" />
                  <span>VPS / Servidor</span>
                  {backendMode !== 'vps' && (
                    <span className="text-xs text-muted-foreground">Modo VPS não ativo</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleBackendTypeSelection('local')}
                  disabled={!isLocalConnected}
                >
                  <Monitor className="w-8 h-8 text-primary" />
                  <span>PC Local</span>
                  {!isLocalConnected && (
                    <span className="text-xs text-muted-foreground">Conecte o backend primeiro</span>
                  )}
                </Button>
              </div>
            </>
          )}

          {creationStep === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle>Nova Instância</DialogTitle>
                <DialogDescription>
                  Configure os detalhes da nova instância
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Instância *</Label>
                  <Input
                    placeholder="Ex: Atendimento Principal"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone (opcional)</Label>
                  <Input
                    placeholder="5511999999999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreationStep('choose')}>
                  Voltar
                </Button>
                <Button onClick={createInstance} disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </>
          )}

          {creationStep === 'qrcode' && (
            <>
              <DialogHeader>
                <DialogTitle>Conectar WhatsApp</DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code com seu WhatsApp
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8">
                {connectionState.isConnecting ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Conectando...</p>
                  </div>
                ) : connectionState.qrCode ? (
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-white rounded-lg inline-block">
                      <img src={connectionState.qrCode} alt="QR Code" className="w-64 h-64" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Abra o WhatsApp → Menu → Aparelhos conectados → Conectar
                    </p>
                    {connectionState.isPolling && (
                      <div className="flex items-center justify-center gap-2 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aguardando conexão... ({connectionState.attempts}s)</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshQR}
                      className="mt-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar QR Code
                    </Button>
                  </div>
                ) : connectionState.error ? (
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-50" />
                    <p className="text-destructive mb-2">{connectionState.error}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => currentInstanceId && handleConnectInstance(currentInstanceId)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Iniciando conexão...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Instance Dialog */}
      <Dialog open={!!editingInstance} onOpenChange={() => setEditingInstance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Instância</DialogTitle>
            <DialogDescription>
              Configure as opções da instância
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
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-resposta</Label>
                <p className="text-sm text-muted-foreground">
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
                <Label>Mensagem de auto-resposta</Label>
                <Textarea
                  value={editAutoReplyMessage}
                  onChange={(e) => setEditAutoReplyMessage(e.target.value)}
                  placeholder="Olá! Obrigado por entrar em contato..."
                  rows={4}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Delay entre mensagens (ms)</Label>
              <Input
                type="number"
                value={editMessageDelay}
                onChange={(e) => setEditMessageDelay(parseInt(e.target.value) || 1000)}
                min={500}
                max={10000}
              />
              <p className="text-xs text-muted-foreground">
                Intervalo mínimo entre envios para evitar bloqueios
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInstance(null)}>
              Cancelar
            </Button>
            <Button onClick={updateInstance}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
