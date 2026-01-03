import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
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
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  GripVertical,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NODE_TEMPLATES, NODE_CATEGORIES, NodeTemplate } from './types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
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
  Zap
};

interface NodeSidebarProps {
  onDragStart: (event: React.DragEvent, template: NodeTemplate) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NodeSidebar = ({ onDragStart, isCollapsed = false, onToggleCollapse }: NodeSidebarProps) => {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    triggers: true,
    conditions: true,
    actions: true,
    flow: true
  });
  const [draggingTemplate, setDraggingTemplate] = useState<NodeTemplate | null>(null);

  const filteredTemplates = NODE_TEMPLATES.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    setDraggingTemplate(template);
    onDragStart(e, template);
  };

  const handleDragEnd = () => {
    setDraggingTemplate(null);
  };

  if (isCollapsed) {
    return (
      <motion.div 
        initial={{ width: 64 }}
        animate={{ width: 64 }}
        className="bg-card/80 backdrop-blur-xl border-r flex flex-col h-full"
      >
        <div className="p-3 border-b flex justify-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleCollapse}
            className="h-10 w-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-2">
          {Object.entries(NODE_CATEGORIES).map(([key, { color }]) => {
            const templates = NODE_TEMPLATES.filter(t => t.category === key);
            const Icon = ICONS[templates[0]?.icon] || Zap;
            return (
              <div key={key} className="px-2 py-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ backgroundColor: `${color}20` }}
                  title={NODE_CATEGORIES[key as keyof typeof NODE_CATEGORIES].label}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ width: 280 }}
      animate={{ width: 280 }}
      className="bg-card/80 backdrop-blur-xl border-r flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">Componentes</h3>
          </div>
          {onToggleCollapse && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar componente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {Object.entries(NODE_CATEGORIES).map(([key, { label, color }]) => {
            const templates = groupedTemplates[key] || [];
            if (templates.length === 0 && search) return null;

            return (
              <Collapsible
                key={key}
                open={openCategories[key]}
                onOpenChange={() => toggleCategory(key)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </motion.div>
                    <span className="font-medium text-sm">{label}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {templates.length}
                    </Badge>
                  </div>
                  <motion.div
                    animate={{ rotate: openCategories[key] ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </motion.div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-2 pl-1"
                    >
                      {templates.map((template, index) => {
                        const Icon = ICONS[template.icon] || Zap;
                        const isDragging = draggingTemplate?.type === template.type && draggingTemplate?.label === template.label;
                        
                        return (
                          <motion.div
                            key={`${template.type}-${template.label}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, template)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              'group flex items-center gap-3 p-3 rounded-xl border bg-background/50 cursor-grab active:cursor-grabbing transition-all',
                              'hover:bg-muted/80 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]',
                              isDragging && 'opacity-50 scale-95'
                            )}
                          >
                            <div className="opacity-0 group-hover:opacity-50 transition-opacity">
                              <GripVertical className="w-3 h-3" />
                            </div>
                            <motion.div
                              whileHover={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 0.3 }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ 
                                backgroundColor: `${color}15`,
                                boxShadow: `inset 0 1px 4px ${color}20`
                              }}
                            >
                              <Icon className="w-5 h-5" style={{ color }} />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {template.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                                {template.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-primary" />
          </div>
          <span>Arraste para adicionar ao fluxo</span>
        </div>
      </div>
    </motion.div>
  );
};
