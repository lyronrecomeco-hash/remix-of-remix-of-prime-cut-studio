import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
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
  MoreHorizontal,
  Copy,
  Trash2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowNodeData, NODE_COLORS, NodeType } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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

const getIconForType = (type: NodeType, iconName?: string) => {
  if (iconName && ICONS[iconName]) return ICONS[iconName];
  
  const typeIcons: Record<NodeType, any> = {
    trigger: Zap,
    condition: GitBranch,
    action: Send,
    delay: Clock,
    split: Shuffle,
    message: MessageSquare,
    button: LayoutGrid,
    list: List,
    webhook: Globe,
    ai: Brain,
    end: CircleStop
  };
  
  return typeIcons[type] || Zap;
};

interface FlowNodeComponentProps {
  data: FlowNodeData;
  selected?: boolean;
  id: string;
}

const FlowNodeComponent = ({ data, selected, id }: FlowNodeComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeType = data?.type || 'trigger';
  const Icon = getIconForType(nodeType as NodeType, data?.icon);
  const color = NODE_COLORS[nodeType as NodeType] || '#6b7280';
  const isTrigger = nodeType === 'trigger';
  const isEnd = nodeType === 'end';
  const isCondition = nodeType === 'condition' || nodeType === 'split';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative rounded-2xl shadow-lg border-2 bg-card min-w-[200px] max-w-[280px] transition-all duration-300',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105',
        isHovered && !selected && 'shadow-xl scale-[1.02]'
      )}
      style={{ 
        borderColor: color,
        boxShadow: selected ? `0 0 30px ${color}40` : isHovered ? `0 8px 30px ${color}20` : undefined
      }}
    >
      {/* Input Handle - não mostra em triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            '!w-4 !h-4 !bg-card !border-2 !rounded-full transition-all duration-200',
            isHovered && '!scale-125'
          )}
          style={{ borderColor: color }}
        />
      )}

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, ${color}40 0%, transparent 60%)` 
        }}
      />

      {/* Node Content */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner"
            style={{ 
              backgroundColor: `${color}20`,
              boxShadow: `inset 0 2px 10px ${color}30`
            }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </motion.div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">
              {data?.label || 'Nó'}
            </p>
            {data?.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions - appears on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-2 -right-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="w-7 h-7 rounded-full shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2">
                    <Settings className="w-4 h-4" /> Configurar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Copy className="w-4 h-4" /> Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution count badge */}
        {data?.config?.executionCount && (
          <div className="absolute -bottom-2 right-3 bg-background px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm">
            {data.config.executionCount} execuções
          </div>
        )}
      </div>

      {/* Output Handles */}
      {!isEnd && (
        <>
          {isCondition ? (
            <>
              {/* Condition has two outputs: Yes and No */}
              <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className={cn(
                  '!w-4 !h-4 !bg-green-500 !border-2 !border-background !rounded-full transition-all duration-200',
                  isHovered && '!scale-125'
                )}
                style={{ left: '30%' }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className={cn(
                  '!w-4 !h-4 !bg-red-500 !border-2 !border-background !rounded-full transition-all duration-200',
                  isHovered && '!scale-125'
                )}
                style={{ left: '70%' }}
              />
              {/* Labels for handles */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-6 left-[30%] -translate-x-1/2"
              >
                <span className="text-[10px] font-bold text-green-500 bg-background/80 px-1.5 py-0.5 rounded">
                  SIM
                </span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-6 left-[70%] -translate-x-1/2"
              >
                <span className="text-[10px] font-bold text-red-500 bg-background/80 px-1.5 py-0.5 rounded">
                  NÃO
                </span>
              </motion.div>
            </>
          ) : (
            <Handle
              type="source"
              position={Position.Bottom}
              className={cn(
                '!w-4 !h-4 !bg-card !border-2 !rounded-full transition-all duration-200',
                isHovered && '!scale-125'
              )}
              style={{ borderColor: color }}
            />
          )}
        </>
      )}

      {/* Active/Status indicator pulse */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 0.4, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background shadow-md"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};

export const FlowNode = memo(FlowNodeComponent);
