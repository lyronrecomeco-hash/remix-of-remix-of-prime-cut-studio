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
  Eye
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Minhas Instâncias</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas conexões WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            {instances.length}/{maxInstances} instâncias
          </Badge>
          {canAddMore && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Instância
            </Button>
          )}
        </div>
      </motion.div>

      {/* Status Filter Tabs - More polished */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 p-1 rounded-xl bg-muted/50 w-fit"
      >
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            statusFilter === 'all' 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todas ({instances.length})
        </button>
        <button
          onClick={() => setStatusFilter('connected')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            statusFilter === 'connected' 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Conectadas ({connectedCount})
        </button>
        <button
          onClick={() => setStatusFilter('disconnected')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            statusFilter === 'disconnected' 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Desconectadas ({disconnectedCount})
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
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl group cursor-pointer",
                  "border bg-card/50 backdrop-blur-sm",
                  isConnected && "ring-1 ring-green-500/30 hover:ring-green-500/50"
                )}
                onClick={() => setSelectedInstance(instance)}
                >
                  {/* Gradient overlay based on status */}
                  <div className={cn(
                    "absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10",
                    isConnected ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-gray-500 to-gray-600"
                  )} />
                  
                  {/* Status indicator bar at top */}
                  <div className={cn("h-1 w-full", status.color)} />

                  <CardContent className="relative pt-5 pb-5">
                    {/* Top row: Status + Menu */}
                    <div className="flex items-start justify-between mb-4">
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
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-popover">
                          {isConnected && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateInstanceStatus(instance.id, { is_paused: true }); }}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {instance.is_paused && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateInstanceStatus(instance.id, { is_paused: false }); }}>
                              <Play className="w-4 h-4 mr-2" />
                              Retomar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); fetchInstances(); }}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Atualizar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteInstance(instance.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Instance Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        animate={isConnected ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          status.bgColor
                        )}>
                          <Smartphone className={cn("w-6 h-6", status.textColor)} />
                        </div>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{instance.name}</h3>
                        <p className={cn(
                          "text-sm truncate",
                          instance.phone_number ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {instance.phone_number 
                            ? instance.phone_number.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
                            : "Aguardando conexão"
                          }
                        </p>
                      </div>
                      {isConnected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="shrink-0"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full gap-2 group-hover:shadow-md transition-shadow"
                      variant={isConnected ? "default" : "secondary"}
                      onClick={(e) => { e.stopPropagation(); setSelectedInstance(instance); }}
                    >
                      {isConnected ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Gerenciar
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          Conectar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Add More Card */}
          {canAddMore && (
            <motion.div variants={itemVariants} layout>
              <Card 
                className="border-2 border-dashed h-full min-h-[200px] flex flex-col items-center justify-center transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/30"
                onClick={() => setCreateModalOpen(true)}
              >
                <CardContent className="text-center py-8">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <Plus className="w-7 h-7 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-base font-medium mt-4">Nova Instância</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte mais um WhatsApp
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upgrade Card when limit reached */}
          {!canAddMore && (
            <motion.div variants={itemVariants} layout>
              <Card className="border-2 border-dashed h-full min-h-[200px] flex flex-col items-center justify-center opacity-70">
                <CardContent className="text-center py-8">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-base font-medium mt-4">Limite Atingido</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[180px] mx-auto">
                    Faça upgrade para mais instâncias
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                    <CreditCard className="w-4 h-4" />
                    Ver Planos
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
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
