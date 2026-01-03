import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
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
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NODE_TEMPLATES, NODE_CATEGORIES, NodeTemplate } from './types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  MessageSquare, UserPlus, MousePointer, GitBranch, Shuffle, Send, LayoutGrid,
  List, Globe, Brain, Clock, CircleStop, Zap, Timer: Clock, Webhook: Globe,
  CornerDownRight: ChevronRight, Tag: Sparkles, Plug: ChevronRight, StickyNote: MessageSquare
};

interface ComponentsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectComponent: (template: NodeTemplate) => void;
  onOpenLuna: () => void;
}

export const ComponentsModal = ({ open, onClose, onSelectComponent, onOpenLuna }: ComponentsModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = NODE_TEMPLATES.filter(t =>
    (t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedCategory || t.category === selectedCategory)
  );

  const handleSelect = (template: NodeTemplate) => {
    onSelectComponent(template);
    onClose();
  };

  return (
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
                <p className="text-sm text-muted-foreground">Selecione um componente para adicionar ao fluxo</p>
              </div>
            </div>
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

          {/* Category Filters */}
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
                className="h-8 gap-1.5"
                style={selectedCategory === key ? { backgroundColor: color } : undefined}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
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
                
                return (
                  <motion.button
                    key={`${template.type}-${template.label}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(template)}
                    className={cn(
                      'group flex items-center gap-3 p-4 rounded-xl border bg-card text-left transition-all',
                      'hover:bg-muted/80 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]'
                    )}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${categoryColor}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: categoryColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{template.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{template.description}</p>
                    </div>
                  </motion.button>
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
  );
};
