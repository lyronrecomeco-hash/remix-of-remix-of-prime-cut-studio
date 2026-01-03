// =====================================================
// FLOW MINIMAP - Minimap customizado com preview
// =====================================================

import { memo } from 'react';
import { MiniMap, MiniMapProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { NODE_COLORS, NodeType } from './types';

interface FlowMinimapProps extends Partial<MiniMapProps> {
  isVisible?: boolean;
}

// Custom node color function
const nodeColor = (node: any) => {
  const type = node.data?.type as NodeType;
  return NODE_COLORS[type] || '#6b7280';
};

// Custom node stroke color
const nodeStrokeColor = (node: any) => {
  if (node.selected) return '#fff';
  return 'transparent';
};

export const FlowMinimap = memo(({ isVisible = true, ...props }: FlowMinimapProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute bottom-4 right-4 z-10"
    >
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-background/50 bg-card/80 backdrop-blur-sm">
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeColor={nodeStrokeColor}
          nodeStrokeWidth={2}
          maskColor="hsl(var(--background) / 0.8)"
          style={{
            backgroundColor: 'transparent',
            width: 180,
            height: 120,
          }}
          pannable
          zoomable
          {...props}
        />
        
        {/* Overlay label */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-[9px] font-medium text-muted-foreground">
          Mapa
        </div>
      </div>
    </motion.div>
  );
});

FlowMinimap.displayName = 'FlowMinimap';
