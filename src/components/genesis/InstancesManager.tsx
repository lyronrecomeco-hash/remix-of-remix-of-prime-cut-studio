import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Plus, 
  MoreVertical, 
  Pause, 
  Play, 
  RefreshCw, 
  Trash2,
  QrCode,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Instance {
  id: string;
  name: string;
  phone_number?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  is_paused: boolean;
  last_activity_at?: string;
  qr_code?: string;
}

export function InstancesManager() {
  const { genesisUser, subscription } = useGenesisAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchInstances = async () => {
    if (!genesisUser) return;

    const { data, error } = await supabase
      .from('genesis_instances')
      .select('*')
      .eq('user_id', genesisUser.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInstances(data as Instance[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstances();
  }, [genesisUser]);

  const createInstance = async () => {
    if (!genesisUser || !newInstanceName.trim()) return;

    if (instances.length >= (subscription?.max_instances || 1)) {
      toast.error('Limite de instâncias atingido. Faça upgrade do plano.');
      return;
    }

    setCreating(true);
    const { error } = await supabase
      .from('genesis_instances')
      .insert({
        user_id: genesisUser.id,
        name: newInstanceName.trim(),
        status: 'qr_pending',
      });

    if (error) {
      toast.error('Erro ao criar instância');
    } else {
      toast.success('Instância criada! Escaneie o QR Code para conectar.');
      setNewInstanceName('');
      setCreateModalOpen(false);
      fetchInstances();
    }
    setCreating(false);
  };

  const updateInstanceStatus = async (id: string, updates: Partial<Instance>) => {
    const { error } = await supabase
      .from('genesis_instances')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar instância');
    } else {
      fetchInstances();
      toast.success('Instância atualizada!');
    }
  };

  const deleteInstance = async (id: string) => {
    const { error } = await supabase
      .from('genesis_instances')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir instância');
    } else {
      fetchInstances();
      toast.success('Instância excluída!');
    }
  };

  const getStatusConfig = (status: string, isPaused: boolean) => {
    if (isPaused) return { 
      color: 'bg-yellow-500', 
      label: 'Pausado', 
      icon: Pause,
      dotClass: 'bg-yellow-500' 
    };
    
    switch (status) {
      case 'connected': return { 
        color: 'bg-green-500', 
        label: 'Conectado', 
        icon: Wifi,
        dotClass: 'bg-green-500 animate-pulse' 
      };
      case 'disconnected': return { 
        color: 'bg-red-500', 
        label: 'Desconectado', 
        icon: WifiOff,
        dotClass: 'bg-red-500' 
      };
      case 'connecting': return { 
        color: 'bg-blue-500', 
        label: 'Conectando...', 
        icon: RefreshCw,
        dotClass: 'bg-blue-500 animate-pulse' 
      };
      case 'qr_pending': return { 
        color: 'bg-purple-500', 
        label: 'Aguardando QR', 
        icon: QrCode,
        dotClass: 'bg-purple-500 animate-pulse' 
      };
      default: return { 
        color: 'bg-gray-500', 
        label: status, 
        icon: AlertCircle,
        dotClass: 'bg-gray-500' 
      };
    }
  };

  const formatLastActivity = (date?: string) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { duration: 0.2 } 
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Smartphone className="w-7 h-7 text-primary" />
            </motion.div>
            Instâncias WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas conexões ({instances.length}/{subscription?.max_instances || 1})
          </p>
        </div>

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Nova Instância
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Criar Nova Instância
              </DialogTitle>
              <DialogDescription>
                Dê um nome para sua nova conexão WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Instância</Label>
                <Input
                  id="name"
                  placeholder="Ex: Atendimento Principal"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createInstance} disabled={creating || !newInstanceName.trim()}>
                {creating ? 'Criando...' : 'Criar Instância'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Usage Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Uso de Instâncias</span>
              <span className="text-sm font-semibold">
                {instances.length} / {subscription?.max_instances || 1}
              </span>
            </div>
            <Progress 
              value={(instances.length / (subscription?.max_instances || 1)) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Instances Grid */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 pr-4"
        >
          <AnimatePresence mode="popLayout">
            {instances.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Smartphone className="w-16 h-16 mx-auto text-muted-foreground/30" />
                </motion.div>
                <h3 className="text-lg font-medium mt-4">Nenhuma instância</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Crie sua primeira instância para começar
                </p>
                <Button className="mt-4 gap-2" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Criar Instância
                </Button>
              </motion.div>
            ) : (
              instances.map((instance) => {
                const status = getStatusConfig(instance.status, instance.is_paused);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={instance.id}
                    variants={itemVariants}
                    layout
                    layoutId={instance.id}
                  >
                    <Card className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="flex items-center justify-between py-5">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Smartphone className="w-7 h-7 text-primary" />
                            <motion.div
                              className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background", status.dotClass)}
                            />
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {instance.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {instance.phone_number || 'Número não conectado'}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatLastActivity(instance.last_activity_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {instance.status === 'qr_pending' && (
                            <Button variant="outline" size="sm" className="gap-2">
                              <QrCode className="w-4 h-4" />
                              Ver QR
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {instance.status === 'connected' && !instance.is_paused && (
                                <DropdownMenuItem onClick={() => updateInstanceStatus(instance.id, { is_paused: true })}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pausar
                                </DropdownMenuItem>
                              )}
                              {instance.is_paused && (
                                <DropdownMenuItem onClick={() => updateInstanceStatus(instance.id, { is_paused: false })}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Retomar
                                </DropdownMenuItem>
                              )}
                              {instance.status === 'disconnected' && (
                                <DropdownMenuItem onClick={() => updateInstanceStatus(instance.id, { status: 'qr_pending' })}>
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Reconectar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => updateInstanceStatus(instance.id, { status: 'connecting' })}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reiniciar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteInstance(instance.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </ScrollArea>
    </div>
  );
}
