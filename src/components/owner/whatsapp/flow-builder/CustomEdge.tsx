import { memo } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  sourceHandleId?: string | null;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    label?: string;
  };
}

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  data
}: CustomEdgeProps) => {
  // Get edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16
  });

  // Determine edge color and label based on handle
  const isYes = sourceHandleId === 'yes';
  const isNo = sourceHandleId === 'no';
  const isConditional = isYes || isNo;
  
  const edgeColor = isYes ? '#22c55e' : isNo ? '#ef4444' : 'hsl(var(--primary))';
  const edgeLabel = isYes ? 'SIM' : isNo ? 'NÃO' : data?.label;
  const glowColor = isYes ? 'rgba(34, 197, 94, 0.4)' : isNo ? 'rgba(239, 68, 68, 0.4)' : 'hsl(var(--primary) / 0.3)';

  return (
    <>
      {/* Glow effect layer */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={8}
        stroke={glowColor}
        style={{
          filter: 'blur(4px)',
          opacity: 0.5
        }}
      />
      
      {/* Main edge - dashed with animation */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        strokeWidth={2.5}
        stroke={edgeColor}
        strokeDasharray={isConditional ? "8 4" : "6 3"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-dash-flow"
      />
      
      {/* Animated particles along path */}
      <circle r="3" fill={edgeColor} opacity={0.9}>
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
      <circle r="2" fill={edgeColor} opacity={0.6}>
        <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
      
      {/* Arrow marker at end */}
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
        </marker>
      </defs>
      <path
        d={edgePath}
        fill="none"
        strokeWidth={0}
        markerEnd={`url(#arrow-${id})`}
      />
      
      {/* Label */}
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-lg border-2",
                "flex items-center gap-1"
              )}
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: edgeColor,
                color: edgeColor,
                boxShadow: `0 2px 8px ${glowColor}`
              }}
            >
              {isYes && <span>✓</span>}
              {isNo && <span>✗</span>}
              {edgeLabel}
            </motion.div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
