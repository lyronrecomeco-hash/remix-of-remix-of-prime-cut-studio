import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowNodeData, NODE_COLORS, NodeType } from './types';

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

interface FlowNodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

const FlowNodeComponent = ({ data, selected }: FlowNodeProps) => {
  const nodeType = data?.type || 'trigger';
  const Icon = getIconForType(nodeType as NodeType, data?.icon);
  const color = NODE_COLORS[nodeType as NodeType] || '#6b7280';
  const isTrigger = nodeType === 'trigger';
  const isEnd = nodeType === 'end';
  const isCondition = nodeType === 'condition' || nodeType === 'split';

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl shadow-lg border-2 bg-card min-w-[180px] transition-all',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      style={{ borderColor: color }}
    >
      {/* Input Handle - não mostra em triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {data?.label || 'Nó'}
          </p>
          {data?.description && (
            <p className="text-xs text-muted-foreground truncate">
              {data.description}
            </p>
          )}
        </div>
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
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
                style={{ left: '30%' }}
              />
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
                style={{ left: '70%' }}
              />
              {/* Labels for handles */}
              <div className="absolute -bottom-5 left-[30%] -translate-x-1/2 text-[10px] text-green-500 font-medium">
                Sim
              </div>
              <div className="absolute -bottom-5 left-[70%] -translate-x-1/2 text-[10px] text-red-500 font-medium">
                Não
              </div>
            </>
          ) : (
            <Handle
              type="source"
              position={Position.Bottom}
              className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
            />
          )}
        </>
      )}

      {/* Active indicator */}
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export const FlowNode = memo(FlowNodeComponent);
