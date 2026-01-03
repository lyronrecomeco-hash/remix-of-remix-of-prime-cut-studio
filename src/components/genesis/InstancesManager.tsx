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

  const getStatusConfig = (status: string, isPaused: boolean) => {
    if (isPaused) return { 
      color: 'bg-yellow-500', 
      label: 'Pausado', 
      icon: Pause,
      textColor: 'text-yellow-500'
    };
    
    switch (status) {
      case 'connected': return { 
        color: 'bg-green-500', 
        label: 'conectado', 
        icon: CheckCircle2,
        textColor: 'text-green-500'
      };
      case 'disconnected': return { 
        color: 'bg-red-500', 
        label: 'desconectado', 
        icon: XCircle,
        textColor: 'text-red-500'
      };
      case 'connecting': return { 
        color: 'bg-blue-500', 
        label: 'conectando...', 
        icon: RefreshCw,
        textColor: 'text-blue-500'
      };
      case 'qr_pending': return { 
        color: 'bg-purple-500', 
        label: 'aguardando QR', 
        icon: QrCode,
        textColor: 'text-purple-500'
      };
      default: return { 
        color: 'bg-gray-500', 
        label: status, 
        icon: AlertCircle,
        textColor: 'text-gray-500'
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

  // Compute filtered stats
  const connectedCount = instances.filter(i => i.status === 'connected' && !i.is_paused).length;
  const disconnectedCount = instances.filter(i => i.status !== 'connected' || i.is_paused).length;
  
  const filteredInstances = instances.filter(i => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'connected') return i.status === 'connected' && !i.is_paused;
    return i.status !== 'connected' || i.is_paused;
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
      >
        <h1 className="text-2xl font-bold">Minhas instâncias</h1>
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredInstances.map((instance) => {
            const status = getStatusConfig(instance.status, instance.is_paused);
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={instance.id}
                variants={itemVariants}
                layout
                layoutId={instance.id}
              >
                <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  {/* Refresh button */}
                  <button 
                    className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-muted transition-colors"
                    onClick={() => fetchInstances()}
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <CardContent className="pt-8 pb-6 text-center">
                    {/* Instance Name */}
                    <h3 className="font-bold text-lg uppercase tracking-wide">
                      {instance.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {instance.phone_number || `genesis-${instance.id.slice(0, 8)}`}
                    </p>

                    {/* Status Icon */}
                    <motion.div 
                      className="my-6 flex justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <div className="relative">
                        <motion.div
                          animate={instance.status === 'connected' && !instance.is_paused ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                            <Smartphone className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </motion.div>
                        {instance.status === 'connected' && !instance.is_paused && (
                          <motion.div 
                            className="absolute -bottom-1 -right-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500/20" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Status Text */}
                    <p className={cn("font-semibold", status.textColor)}>
                      {status.label}
                    </p>

                    {/* Action Button - Always "Acessar" */}
                    <div className="mt-6">
                      <Button 
                        className="w-32 rounded-full gap-2"
                        onClick={() => setSelectedInstance(instance)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acessar
                      </Button>
                    </div>

                    {/* Actions Menu */}
                    <div className="mt-4 flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                            Mais opções
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48 bg-popover">
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
          })}

          {/* Add More Card */}
          <motion.div
            variants={itemVariants}
            layout
          >
            <Card 
              className={cn(
                "border-2 border-dashed h-full min-h-[320px] flex flex-col items-center justify-center transition-all cursor-pointer",
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
