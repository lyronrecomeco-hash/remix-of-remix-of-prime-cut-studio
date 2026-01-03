import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { GitBranch, MessageSquare, Zap, Timer, Globe, Brain, Keyboard } from 'lucide-react';
import { NODE_COLORS, NodeType } from './types';

interface FlowStatsProps {
  nodes: any[];
  edges: any[];
}

export const FlowStats = memo(({ nodes, edges }: FlowStatsProps) => {
  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    nodes.forEach(n => {
      const type = n.data?.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return {
      total: nodes.length,
      edges: edges.length,
      triggers: typeCount['trigger'] || 0,
      messages: typeCount['message'] || 0,
      conditions: (typeCount['condition'] || 0) + (typeCount['split'] || 0),
      delays: typeCount['delay'] || 0,
      webhooks: typeCount['webhook'] || 0,
      ai: typeCount['ai'] || 0
    };
  }, [nodes, edges]);

  const statItems = [
    { label: 'Nós', value: stats.total, icon: GitBranch, color: 'hsl(var(--primary))' },
    { label: 'Conexões', value: stats.edges, icon: GitBranch, color: 'hsl(var(--muted-foreground))' },
    { label: 'Gatilhos', value: stats.triggers, icon: Zap, color: NODE_COLORS.trigger },
    { label: 'Mensagens', value: stats.messages, icon: MessageSquare, color: NODE_COLORS.message },
    { label: 'Condições', value: stats.conditions, icon: GitBranch, color: NODE_COLORS.condition },
    { label: 'Delays', value: stats.delays, icon: Timer, color: NODE_COLORS.delay },
    { label: 'Webhooks', value: stats.webhooks, icon: Globe, color: NODE_COLORS.webhook },
    { label: 'IA', value: stats.ai, icon: Brain, color: NODE_COLORS.ai }
  ].filter(s => s.value > 0 || s.label === 'Nós' || s.label === 'Conexões');

  return (
    <>
      {/* Flow Stats */}
      <Panel position="bottom-center" className="hidden md:block">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 bg-card/90 backdrop-blur-xl rounded-xl border shadow-lg px-4 py-2"
        >
          {statItems.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-1.5">
                {index > 0 && <div className="w-px h-4 bg-border" />}
                <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="text-xs text-muted-foreground">{stat.label}:</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                  {stat.value}
                </Badge>
              </div>
            );
          })}
        </motion.div>
      </Panel>

      {/* Keyboard Shortcuts */}
      <Panel position="bottom-left" className="hidden lg:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘S</kbd> Salvar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘Z</kbd> Desfazer</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘C</kbd> Copiar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Del</kbd> Excluir</span>
        </motion.div>
      </Panel>
    </>
  );
});

FlowStats.displayName = 'FlowStats';
