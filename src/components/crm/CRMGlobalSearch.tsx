import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Users,
  CheckSquare,
  DollarSign,
  Kanban,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'lead' | 'task' | 'pipeline';
  title: string;
  subtitle?: string;
  status?: string;
  value?: number;
}

interface CRMGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export default function CRMGlobalSearch({ isOpen, onClose, onNavigate }: CRMGlobalSearchProps) {
  const { crmTenant } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const search = useCallback(async (term: string) => {
    if (!crmTenant || term.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const allResults: SearchResult[] = [];

      // Search leads
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('id, name, email, phone, status, value')
        .eq('crm_tenant_id', crmTenant.id)
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(5);

      if (leads) {
        leads.forEach((lead) => {
          allResults.push({
            id: lead.id,
            type: 'lead',
            title: lead.name,
            subtitle: lead.email || lead.phone || undefined,
            status: lead.status,
            value: lead.value || 0,
          });
        });
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from('crm_tasks')
        .select('id, title, description, status')
        .eq('crm_tenant_id', crmTenant.id)
        .ilike('title', `%${term}%`)
        .limit(5);

      if (tasks) {
        tasks.forEach((task) => {
          allResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: task.description || undefined,
            status: task.status,
          });
        });
      }

      // Search pipelines
      const { data: pipelines } = await supabase
        .from('crm_pipelines')
        .select('id, name, description')
        .eq('crm_tenant_id', crmTenant.id)
        .ilike('name', `%${term}%`)
        .limit(3);

      if (pipelines) {
        pipelines.forEach((pipeline) => {
          allResults.push({
            id: pipeline.id,
            type: 'pipeline',
            title: pipeline.name,
            subtitle: pipeline.description || undefined,
          });
        });
      }

      setResults(allResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [crmTenant]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(searchTerm);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'lead':
        onNavigate('leads', result.id);
        break;
      case 'task':
        onNavigate('tasks', result.id);
        break;
      case 'pipeline':
        onNavigate('pipelines', result.id);
        break;
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <Users className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'pipeline':
        return <Kanban className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lead':
        return 'Lead';
      case 'task':
        return 'Tarefa';
      case 'pipeline':
        return 'Pipeline';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar leads, tarefas, pipelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-lg py-6"
            autoFocus
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {result.value !== undefined && result.value > 0 && (
                      <span className="text-sm font-medium text-primary">
                        {formatCurrency(result.value)}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum resultado encontrado para "{searchTerm}"
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-4">
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd> navegar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> selecionar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
