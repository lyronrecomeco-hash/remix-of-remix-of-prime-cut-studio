import { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
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
  Settings,
  Play,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowNodeData, NODE_COLORS, NodeType } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  Zap,
  Play,
  Timer,
  CheckCircle2,
  AlertCircle
};

const getIconForType = (type: NodeType, iconName?: string) => {
  if (iconName && ICONS[iconName]) return ICONS[iconName];
  
  const typeIcons: Record<NodeType, any> = {
    trigger: Zap,
    condition: GitBranch,
    action: Send,
    delay: Timer,
    split: Shuffle,
    message: MessageSquare,
    button: LayoutGrid,
    list: List,
    webhook: Globe,
    ai: Brain,
    end: CircleStop,
    goto: Play,
    variable: CheckCircle2,
    integration: Globe,
    note: MessageSquare,
    http_request: Globe,
    webhook_in: Zap,
    ecommerce: LayoutGrid,
    crm_sheets: List,
  };
  
  return typeIcons[type] || Zap;
};

const getNodeCategory = (type: NodeType): string => {
  if (type === 'trigger' || type === 'webhook_in') return 'GATILHO';
  if (type === 'condition' || type === 'split') return 'CONDIÇÃO';
  if (type === 'end') return 'FIM';
  if (type === 'delay' || type === 'goto') return 'CONTROLE';
  if (type === 'variable' || type === 'integration' || type === 'note' || type === 'http_request' || type === 'ecommerce' || type === 'crm_sheets') return 'AVANÇADO';
  return 'AÇÃO';
};

interface FlowNodeComponentProps {
  data: FlowNodeData;
  selected?: boolean;
  id: string;
}

const FlowNodeComponent = ({ data, selected, id }: FlowNodeComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setNodes, setEdges, getNode } = useReactFlow();
  
  const nodeType = data?.type || 'trigger';
  const Icon = getIconForType(nodeType as NodeType, data?.icon);
  const color = NODE_COLORS[nodeType as NodeType] || '#6b7280';
  const isTrigger = nodeType === 'trigger';
  const isEnd = nodeType === 'end';
  const isCondition = nodeType === 'condition' || nodeType === 'split';
  const category = getNodeCategory(nodeType as NodeType);

  // Duplicate node
  const handleDuplicate = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    
    const newNode = {
      ...node,
      id: `${nodeType}-${Date.now()}`,
      position: {
        x: node.position.x + 60,
        y: node.position.y + 60
      },
      selected: false
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [id, nodeType, getNode, setNodes]);

  // Delete node
  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [id, setNodes, setEdges]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: selected ? 1.02 : 1, 
        opacity: 1,
        y: isHovered ? -2 : 0
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isMenuOpen && setIsHovered(false)}
      className={cn(
        'relative rounded-xl shadow-lg border bg-card min-w-[220px] max-w-[300px] transition-all duration-200 overflow-visible group',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        !selected && isHovered && 'shadow-2xl'
      )}
      style={{ 
        borderColor: selected ? color : `${color}60`,
        // @ts-ignore - custom ring styling
        '--tw-ring-color': color,
        boxShadow: selected 
          ? `0 0 0 2px ${color}30, 0 20px 40px ${color}25` 
          : isHovered 
            ? `0 20px 50px ${color}20, 0 0 0 1px ${color}40` 
            : `0 4px 20px ${color}10`
      } as React.CSSProperties}
    >
      {/* Category Label */}
      <div 
        className="absolute -top-3 left-4 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider shadow-sm"
        style={{ 
          backgroundColor: color,
          color: '#fff'
        }}
      >
        {category}
      </div>

      {/* Input Handle */}
      {!isTrigger && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Handle
              type="target"
              position={Position.Top}
              className={cn(
                '!w-5 !h-5 !-top-2.5 !bg-card !border-[3px] !rounded-full transition-all duration-200 hover:!scale-125 !cursor-crosshair',
                'after:content-[""] after:absolute after:inset-1 after:rounded-full after:transition-colors',
                isHovered && 'after:bg-current'
              )}
              style={{ 
                borderColor: color,
                color: color
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Entrada</TooltipContent>
        </Tooltip>
      )}

      {/* Glow effect on hover */}
      <motion.div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{ opacity: isHovered || selected ? 1 : 0 }}
        style={{
          background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`
        }}
      />

      {/* Glass morphism overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-50 pointer-events-none"
        style={{ 
          background: `linear-gradient(180deg, ${color}08 0%, transparent 40%, ${color}05 100%)` 
        }}
      />

      {/* Node Content */}
      <div className="relative p-4 pt-5">
        <div className="flex items-start gap-3">
          {/* Icon Container with pulse effect */}
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: `${color}15`,
              boxShadow: `inset 0 2px 8px ${color}20, 0 2px 8px ${color}15`
            }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
            
            {/* Pulse ring for active nodes */}
            {data?.config?.isActive && (
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
                className="absolute inset-0 rounded-xl"
                style={{ 
                  border: `2px solid ${color}`
                }}
              />
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">
              {data?.label || 'Nó'}
            </p>
            {data?.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {data.description}
              </p>
            )}
            
            {/* Config preview badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {nodeType === 'delay' && data?.config?.seconds && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  <Timer className="w-2.5 h-2.5 mr-0.5" />
                  {data.config.seconds}s
                </Badge>
              )}
              {nodeType === 'message' && data?.config?.text && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 max-w-[100px] truncate">
                  <MessageSquare className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                  {data.config.text.substring(0, 20)}...
                </Badge>
              )}
              {nodeType === 'button' && data?.config?.buttons?.length > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  <LayoutGrid className="w-2.5 h-2.5 mr-0.5" />
                  {data.config.buttons.length} botões
                </Badge>
              )}
              {nodeType === 'webhook' && data?.config?.url && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  <Globe className="w-2.5 h-2.5 mr-0.5" />
                  API
                </Badge>
              )}
              {nodeType === 'ai' && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  <Brain className="w-2.5 h-2.5 mr-0.5" />
                  IA
                </Badge>
              )}
              {nodeType === 'condition' && data?.config?.field && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {data.config.field} {data.config.operator} {data.config.value}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Menu */}
        <AnimatePresence>
          {(isHovered || isMenuOpen) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-3 -right-3 z-50"
            >
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="w-8 h-8 rounded-full shadow-lg border-2 border-background hover:scale-110 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44" sideOffset={5}>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" /> Configurar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleDuplicate}>
                    <Copy className="w-4 h-4" /> Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 text-destructive cursor-pointer focus:text-destructive" 
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution Stats */}
        {data?.config?.executionCount !== undefined && data.config.executionCount > 0 && (
          <div className="absolute -bottom-2.5 right-4 flex items-center gap-1 bg-background px-2 py-0.5 rounded-full text-[10px] font-medium border shadow-sm">
            <Play className="w-2.5 h-2.5 text-green-500" />
            {data.config.executionCount}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {!isEnd && (
        <>
          {isCondition ? (
            <>
              {/* Yes Handle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id="yes"
                    className={cn(
                      '!w-5 !h-5 !-bottom-2.5 !bg-green-500 !border-[3px] !border-background !rounded-full transition-all duration-200 hover:!scale-125 !cursor-crosshair'
                    )}
                    style={{ left: '25%' }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-green-500">Sim / Verdadeiro</TooltipContent>
              </Tooltip>
              
              {/* No Handle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id="no"
                    className={cn(
                      '!w-5 !h-5 !-bottom-2.5 !bg-red-500 !border-[3px] !border-background !rounded-full transition-all duration-200 hover:!scale-125 !cursor-crosshair'
                    )}
                    style={{ left: '75%' }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-red-500">Não / Falso</TooltipContent>
              </Tooltip>
              
              {/* Handle Labels */}
              <div className="absolute -bottom-7 left-[25%] -translate-x-1/2">
                <span className="text-[9px] font-bold text-green-500 bg-background/90 px-1.5 py-0.5 rounded shadow-sm border">
                  ✓ SIM
                </span>
              </div>
              <div className="absolute -bottom-7 left-[75%] -translate-x-1/2">
                <span className="text-[9px] font-bold text-red-500 bg-background/90 px-1.5 py-0.5 rounded shadow-sm border">
                  ✗ NÃO
                </span>
              </div>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  className={cn(
                    '!w-5 !h-5 !-bottom-2.5 !bg-card !border-[3px] !rounded-full transition-all duration-200 hover:!scale-125 !cursor-crosshair',
                    'after:content-[""] after:absolute after:inset-1 after:rounded-full after:transition-colors',
                    isHovered && 'after:bg-current'
                  )}
                  style={{ 
                    borderColor: color,
                    color: color
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Próximo passo</TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* Status Indicator */}
      <motion.div
        animate={data?.config?.isActive ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.5, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className={cn(
          'absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-sm',
          data?.config?.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
        )}
      />

      {/* Connection hint on hover */}
      <AnimatePresence>
        {isHovered && !isEnd && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap bg-background/90 px-2 py-1 rounded-md border shadow-sm"
          >
            Arraste para conectar
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FlowNode = memo(FlowNodeComponent);
