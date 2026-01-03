import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Sparkles,
  GripVertical,
  Zap,
  MessageSquare,
  UserPlus,
  MousePointer,
  GitBranch,
  Shuffle,
  Send,
  LayoutGrid,
  List,
  Globe,
  Brain,
  Clock,
  CircleStop,
  ChevronRight,
  Smartphone,
  Inbox,
  Wifi
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NODE_TEMPLATES, NODE_CATEGORIES, NodeTemplate, NATIVE_WA_TEMPLATES } from './types';
import { InstanceRequiredModal } from './InstanceRequiredModal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  MessageSquare, UserPlus, MousePointer, GitBranch, Shuffle, Send, LayoutGrid,
  List, Globe, Brain, Clock, CircleStop, Zap, Timer: Clock, Webhook: Globe,
  CornerDownRight: ChevronRight, Tag: Sparkles, Plug: ChevronRight, StickyNote: MessageSquare,
  ShoppingCart: LayoutGrid, Table: LayoutGrid, Smartphone, Inbox, Wifi,
};

interface ComponentsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectComponent: (template: NodeTemplate) => void;
  onOpenLuna: () => void;
  onNavigateToInstances?: () => void;
}

export const ComponentsModal = ({ 
  open, 
  onClose, 
  onSelectComponent, 
  onOpenLuna,
  onNavigateToInstances 
}: ComponentsModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasConnectedInstance, setHasConnectedInstance] = useState<boolean | null>(null);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [pendingComponent, setPendingComponent] = useState<NodeTemplate | null>(null);

  // Combine all templates - Native first
  const allTemplates = [...NATIVE_WA_TEMPLATES, ...NODE_TEMPLATES];

  // Check for connected instances
  useEffect(() => {
    const checkInstances = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check genesis_instances for connected status
      const { data: instances } = await supabase
        .from('genesis_instances')
        .select('id, status')
        .eq('status', 'connected')
        .limit(1);

      setHasConnectedInstance(instances && instances.length > 0);
    };

    if (open) {
      checkInstances();
    }
  }, [open]);

  const filteredTemplates = allTemplates.filter(t =>
    (t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedCategory || t.category === selectedCategory)
  );

  const handleSelect = (template: NodeTemplate) => {
    // If it's a native component and no connected instance
    if (template.requiresInstance && !hasConnectedInstance) {
      setPendingComponent(template);
      setShowInstanceModal(true);
      return;
    }
    
    onSelectComponent(template);
    onClose();
  };

  const handleDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    // If it's a native component and no connected instance, show modal instead
    if (template.requiresInstance && !hasConnectedInstance) {
      event.preventDefault();
      setPendingComponent(template);
      setShowInstanceModal(true);
      return;
    }

    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setTimeout(() => onClose(), 150);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleInstanceModalClose = () => {
    setShowInstanceModal(false);
    setPendingComponent(null);
  };

  const handleNavigateToInstances = () => {
    setShowInstanceModal(false);
    onClose();
    onNavigateToInstances?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-card to-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Adicionar Componente</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar ou <span className="text-primary font-medium">arraste</span> para o canvas
                  </p>
                </div>
              </div>
              
              {/* Instance Status Badge */}
              <Badge 
                variant={hasConnectedInstance ? 'default' : 'secondary'} 
                className={cn(
                  'gap-1.5',
                  hasConnectedInstance 
                    ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                )}
              >
                <Wifi className="w-3 h-3" />
                {hasConnectedInstance ? 'WhatsApp Conectado' : 'Sem Instância'}
              </Badge>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar componente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/80"
                autoFocus
              />
            </div>

            {/* Category Filters - Nativos first */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-8"
              >
                Todos
              </Button>
              {Object.entries(NODE_CATEGORIES).map(([key, { label, color }]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    "h-8 gap-1.5",
                    key === 'nativos' && "border-[#25D366]/50"
                  )}
                  style={selectedCategory === key ? { backgroundColor: color } : undefined}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                  {key === 'nativos' && (
                    <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1 h-4 border-[#25D366]/50 text-[#25D366]">
                      WhatsApp
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="p-4 grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => {
                  const Icon = ICONS[template.icon] || Zap;
                  const categoryColor = NODE_CATEGORIES[template.category as keyof typeof NODE_CATEGORIES]?.color || '#6b7280';
                  const isNative = template.category === 'nativos';
                  const isDisabled = isNative && !hasConnectedInstance;
                  
                  return (
                    <motion.div
                      key={`${template.type}-${template.label}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                      draggable={!isDisabled}
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, template)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleSelect(template)}
                      data-allow-drag="true"
                      className={cn(
                        'group flex items-center gap-3 p-4 rounded-xl border bg-card text-left transition-all',
                        isDisabled 
                          ? 'cursor-pointer opacity-70 hover:opacity-100 hover:border-amber-500/50' 
                          : 'cursor-grab active:cursor-grabbing hover:bg-muted/80 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]',
                        isDragging && 'opacity-50',
                        isNative && 'border-[#25D366]/20'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <GripVertical className={cn(
                          "w-4 h-4 transition-colors",
                          isDisabled 
                            ? 'text-muted-foreground/20' 
                            : 'text-muted-foreground/40 group-hover:text-muted-foreground'
                        )} />
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${categoryColor}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: categoryColor }} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{template.label}</p>
                          {isNative && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[9px] py-0 px-1 h-4",
                                hasConnectedInstance 
                                  ? "border-[#25D366]/50 text-[#25D366]" 
                                  : "border-amber-500/50 text-amber-500"
                              )}
                            >
                              {hasConnectedInstance ? 'Pronto' : 'Conectar'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{template.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum componente encontrado</p>
              </div>
            )}
          </ScrollArea>

          {/* Luna AI CTA */}
          <div className="p-4 border-t bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <Button
              onClick={() => { onClose(); onOpenLuna(); }}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Criar Fluxo com Luna IA
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Descreva o que você precisa e a Luna cria o fluxo automaticamente
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instance Required Modal */}
      <InstanceRequiredModal
        open={showInstanceModal}
        onClose={handleInstanceModalClose}
        onNavigateToInstances={handleNavigateToInstances}
        componentName={pendingComponent?.label || ''}
      />
    </>
  );
};
