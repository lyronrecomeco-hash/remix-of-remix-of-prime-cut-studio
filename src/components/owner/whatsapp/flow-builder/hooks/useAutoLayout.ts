import { useCallback } from 'react';

interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: any;
}

interface LayoutEdge {
  source: string;
  target: string;
}

// Simple Dagre-like algorithm without external dependency
export const useAutoLayout = () => {
  const calculateLayout = useCallback((
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    direction: 'TB' | 'LR' = 'TB',
    nodeWidth = 280,
    nodeHeight = 120,
    horizontalSpacing = 80,
    verticalSpacing = 100
  ) => {
    if (nodes.length === 0) return [];

    // Build adjacency map
    const children = new Map<string, string[]>();
    const parents = new Map<string, string[]>();
    
    nodes.forEach(n => {
      children.set(n.id, []);
      parents.set(n.id, []);
    });

    edges.forEach(e => {
      children.get(e.source)?.push(e.target);
      parents.get(e.target)?.push(e.source);
    });

    // Find root nodes (no parents)
    const roots = nodes.filter(n => (parents.get(n.id)?.length || 0) === 0);
    if (roots.length === 0) {
      // If no root, use first node
      roots.push(nodes[0]);
    }

    // BFS to calculate levels
    const levels = new Map<string, number>();
    const queue = roots.map(r => ({ id: r.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, Math.max(levels.get(id) || 0, level));

      const childIds = children.get(id) || [];
      childIds.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Handle unvisited nodes
    nodes.forEach(n => {
      if (!levels.has(n.id)) {
        levels.set(n.id, 0);
      }
    });

    // Group nodes by level
    const nodesByLevel = new Map<number, LayoutNode[]>();
    nodes.forEach(n => {
      const level = levels.get(n.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(n);
    });

    // Calculate positions
    const maxLevel = Math.max(...Array.from(levels.values()));
    const newNodes = nodes.map(node => {
      const level = levels.get(node.id) || 0;
      const nodesAtLevel = nodesByLevel.get(level) || [];
      const indexAtLevel = nodesAtLevel.findIndex(n => n.id === node.id);
      const totalAtLevel = nodesAtLevel.length;

      // Center nodes at each level
      const totalWidth = totalAtLevel * nodeWidth + (totalAtLevel - 1) * horizontalSpacing;
      const startX = -totalWidth / 2;

      let x: number, y: number;
      
      if (direction === 'TB') {
        x = startX + indexAtLevel * (nodeWidth + horizontalSpacing) + nodeWidth / 2;
        y = level * (nodeHeight + verticalSpacing);
      } else {
        x = level * (nodeWidth + horizontalSpacing);
        y = startX + indexAtLevel * (nodeHeight + verticalSpacing) + nodeHeight / 2;
      }

      return {
        ...node,
        position: { x, y }
      };
    });

    return newNodes;
  }, []);

  return { calculateLayout };
};
