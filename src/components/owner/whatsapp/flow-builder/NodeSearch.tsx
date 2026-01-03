// =====================================================
// NODE SEARCH - Busca dentro do fluxo
// =====================================================

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown, Zap, MessageSquare, GitBranch, Globe, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FlowNode, NodeType, NODE_COLORS } from './types';

interface NodeSearchProps {
  nodes: FlowNode[];
  onNavigateToNode: (nodeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, any> = {
  trigger: Zap,
  message: MessageSquare,
  condition: GitBranch,
  webhook: Globe,
  ai: Brain
};

export const NodeSearch = ({ nodes, onNavigateToNode, isOpen, onClose }: NodeSearchProps) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    
    const term = search.toLowerCase();
    return nodes.filter(node => 
      node.data.label.toLowerCase().includes(term) ||
      node.data.type.toLowerCase().includes(term) ||
      node.data.description?.toLowerCase().includes(term) ||
      JSON.stringify(node.data.config).toLowerCase().includes(term)
    );
  }, [nodes, search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredNodes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredNodes[selectedIndex]) {
          onNavigateToNode(filteredNodes[selectedIndex].id);
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [filteredNodes, selectedIndex, onNavigateToNode, onClose]);

  const handleSelect = (nodeId: string) => {
    onNavigateToNode(nodeId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-card border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="relative p-2 border-b">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar nós no fluxo..."
            className="pl-12 pr-10 h-12 text-base border-0 focus-visible:ring-0 bg-transparent"
          />
          {search && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-80">
          <div className="p-2">
            {filteredNodes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum nó encontrado</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredNodes.map((node, index) => {
                  const Icon = TYPE_ICONS[node.data.type] || Zap;
                  const color = NODE_COLORS[node.data.type as NodeType] || '#6b7280';
                  
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelect(node.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                        index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
                      )}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{node.data.label}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {node.data.type}
                          </Badge>
                        </div>
                        {node.data.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {node.data.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        #{node.id.split('-')[1]?.slice(-4) || node.id.slice(-4)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ChevronUp className="w-3 h-3" />
              <ChevronDown className="w-3 h-3" />
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">Enter</kbd>
              selecionar
            </span>
          </div>
          <span>{filteredNodes.length} resultado(s)</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
