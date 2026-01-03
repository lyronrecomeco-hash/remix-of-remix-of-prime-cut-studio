import { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NODE_TEMPLATES, NODE_CATEGORIES, NodeTemplate } from './types';

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
}

export const NodeSidebar = ({ onDragStart }: NodeSidebarProps) => {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    triggers: true,
    conditions: true,
    actions: true,
    flow: true
  });

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

  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Componentes</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(NODE_CATEGORIES).map(([key, { label, color }]) => {
            const templates = groupedTemplates[key] || [];
            if (templates.length === 0) return null;

            return (
              <Collapsible
                key={key}
                open={openCategories[key]}
                onOpenChange={() => toggleCategory(key)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({templates.length})
                    </span>
                  </div>
                  {openCategories[key] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2 pl-2">
                    {templates.map((template) => {
                      const Icon = ICONS[template.icon] || Zap;
                      return (
                        <div
                          key={`${template.type}-${template.label}`}
                          draggable
                          onDragStart={(e) => onDragStart(e, template)}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {template.label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Arraste os componentes para o canvas
        </p>
      </div>
    </div>
  );
};
