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
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { InstancePanel } from './InstancePanel';

interface Instance {
  id: string;
  name: string;
  phone_number?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  is_paused: boolean;
  last_activity_at?: string;
  qr_code?: string;
  created_at: string;
  backend_url?: string;
  backend_token?: string;
  last_heartbeat?: string;
  effective_status?: string;
}

export function InstancesManager() {
  const { genesisUser, subscription } = useGenesisAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  const maxInstances = subscription?.max_instances || 1;

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

    if (instances.length >= maxInstances) {
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

  // Determinar status real baseado em effective_status e heartbeat
  const getEffectiveStatus = (instance: Instance): string => {
    // Se tiver heartbeat recente (< 3 min), usa effective_status
    if (instance.last_heartbeat) {
      const lastHb = new Date(instance.last_heartbeat).getTime();
      const isStale = Date.now() - lastHb > 180000; // 3 minutos
      
      if (isStale && instance.effective_status === 'connected') {
        return 'disconnected'; // Heartbeat expirado = desconectado
      }
      return instance.effective_status || instance.status;
    }
    return instance.status;
  };

  const getStatusConfig = (instance: Instance) => {
    const effectiveStatus = getEffectiveStatus(instance);
    const isPaused = instance.is_paused;
    
    if (isPaused) return { 
      color: 'bg-yellow-500', 
      label: 'Pausado', 
      icon: Pause,
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    };
    
    switch (effectiveStatus) {
      case 'connected': return { 
        color: 'bg-green-500', 
        label: 'Conectado', 
        icon: CheckCircle2,
        textColor: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
      case 'disconnected': return { 
        color: 'bg-red-500', 
        label: 'Desconectado', 
        icon: XCircle,
        textColor: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      };
      case 'connecting': return { 
        color: 'bg-blue-500', 
        label: 'Conectando...', 
        icon: RefreshCw,
        textColor: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
      case 'qr_pending': return { 
        color: 'bg-purple-500', 
        label: 'Aguardando QR', 
        icon: QrCode,
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
      };
      default: return { 
        color: 'bg-gray-500', 
        label: effectiveStatus, 
        icon: AlertCircle,
        textColor: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-border'
      };
    }
  };

  // If viewing instance panel
  if (selectedInstance) {
    return (
      <InstancePanel 
        instance={selectedInstance} 
        onBack={() => setSelectedInstance(null)} 
      />
    );
  }

  // Compute filtered stats usando status efetivo
  const connectedCount = instances.filter(i => getEffectiveStatus(i) === 'connected' && !i.is_paused).length;
  const disconnectedCount = instances.filter(i => getEffectiveStatus(i) !== 'connected' || i.is_paused).length;
  
  const filteredInstances = instances.filter(i => {
    const effectiveStatus = getEffectiveStatus(i);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'connected') return effectiveStatus === 'connected' && !i.is_paused;
    return effectiveStatus !== 'connected' || i.is_paused;
  });

  const canAddMore = instances.length < maxInstances;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-muted/50 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold">Minhas Instâncias</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas conexões WhatsApp</p>
      </motion.div>

      {/* Status Filter Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            statusFilter === 'all' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todos: {instances.length}
        </button>
        <button
          onClick={() => setStatusFilter('connected')}
          className={cn(
            "text-sm transition-colors",
            statusFilter === 'connected' 
              ? "text-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Conectados: {connectedCount}
        </button>
        <button
          onClick={() => setStatusFilter('disconnected')}
          className={cn(
            "text-sm transition-colors",
            statusFilter === 'disconnected' 
              ? "text-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Desconectados: {disconnectedCount}
        </button>
      </motion.div>

      {/* Instances Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        <AnimatePresence mode="popLayout">
          {filteredInstances.map((instance) => {
            const status = getStatusConfig(instance);
            const StatusIcon = status.icon;
            const effectiveStatus = getEffectiveStatus(instance);
            const isConnected = effectiveStatus === 'connected' && !instance.is_paused;

            return (
              <motion.div
                key={instance.id}
                variants={itemVariants}
                layout
                layoutId={instance.id}
              >
                <Card className={cn(
                  "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
                  status.borderColor,
                  isConnected && "hover:shadow-green-500/10"
                )}>
                  {/* Status indicator bar at top */}
                  <div className={cn("h-1 w-full", status.color)} />
                  
                  {/* Refresh button */}
                  <button 
                    className="absolute top-5 right-4 p-1.5 rounded-md hover:bg-muted transition-colors"
                    onClick={() => fetchInstances()}
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <CardContent className="pt-6 pb-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={cn(
                        "gap-1.5 text-xs font-medium",
                        status.bgColor,
                        status.textColor,
                        "border-0"
                      )}>
                        <StatusIcon className={cn(
                          "w-3 h-3",
                          effectiveStatus === 'connecting' && "animate-spin"
                        )} />
                        {status.label}
                      </Badge>
                    </div>
                    
                    {/* Instance Name */}
                    <h3 className="font-bold text-lg">
                      {instance.name}
                    </h3>
                    
                    {/* Phone Number */}
                    <p className={cn(
                      "text-sm mt-1",
                      instance.phone_number ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {instance.phone_number 
                        ? `📱 ${instance.phone_number.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}`
                        : "Número não conectado"
                      }
                    </p>

                    {/* Instance Icon */}
                    <motion.div 
                      className="my-5 flex justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <div className="relative">
                        <motion.div
                          animate={isConnected ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                            status.bgColor
                          )}>
                            <Smartphone className={cn("w-7 h-7", status.textColor)} />
                          </div>
                        </motion.div>
                        {isConnected && (
                          <motion.div 
                            className="absolute -bottom-1 -right-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Action Button */}
                    <div className="mt-4">
                      <Button 
                        className="w-full gap-2"
                        variant={isConnected ? "default" : "secondary"}
                        onClick={() => setSelectedInstance(instance)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {isConnected ? "Gerenciar" : "Conectar"}
                      </Button>
                    </div>

                    {/* Actions Menu */}
                    <div className="mt-3 flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                            Mais opções
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48 bg-popover">
                          {isConnected && (
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
                          <DropdownMenuItem onClick={() => fetchInstances()}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Atualizar Status
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
          })}

          {/* Add More Card */}
          <motion.div
            variants={itemVariants}
            layout
          >
            <Card 
              className={cn(
                "border-2 border-dashed h-full min-h-[280px] flex flex-col items-center justify-center transition-all cursor-pointer",
                canAddMore 
                  ? "hover:border-primary/50 hover:bg-muted/30" 
                  : "opacity-60 cursor-not-allowed"
              )}
              onClick={() => canAddMore && setCreateModalOpen(true)}
            >
              <CardContent className="text-center py-12">
                <motion.div
                  animate={canAddMore ? { y: [0, -5, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Plus className="w-12 h-12 mx-auto text-muted-foreground/50" />
                </motion.div>
                <h3 className="text-lg font-medium text-muted-foreground mt-4">
                  Adicionar mais instâncias?
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-2 max-w-[200px] mx-auto">
                  {canAddMore 
                    ? `Você pode criar até ${maxInstances} instâncias`
                    : 'Compre créditos para liberar a criação de mais instâncias'
                  }
                </p>
                <Button 
                  variant={canAddMore ? "default" : "secondary"}
                  className="mt-6 rounded-full gap-2"
                  disabled={!canAddMore}
                >
                  {canAddMore ? (
                    <>
                      <Plus className="w-4 h-4" />
                      criar instância
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      comprar créditos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Create Instance Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              Nova Instância WhatsApp
            </DialogTitle>
            <DialogDescription>
              Crie uma nova conexão para automatizar seu WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Instância</Label>
              <Input
                id="name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: Vendas, Suporte, Marketing..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createInstance} disabled={creating || !newInstanceName.trim()} className="gap-2">
              {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
              Criar Instância
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
