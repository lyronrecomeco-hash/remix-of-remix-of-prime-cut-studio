import { useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  nodeId?: string;
  type: 'error';
  message: string;
  code: string;
}

interface ValidationWarning {
  nodeId?: string;
  type: 'warning';
  message: string;
  code: string;
}

export const useFlowValidation = () => {
  const validateFlow = useCallback((nodes: any[], edges: any[]): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for empty flow
    if (nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'O fluxo está vazio. Adicione pelo menos um nó.',
        code: 'EMPTY_FLOW'
      });
      return { isValid: false, errors, warnings };
    }

    // Check for trigger node
    const triggerNodes = nodes.filter(n => n.data?.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'O fluxo precisa de pelo menos um gatilho (trigger) para iniciar.',
        code: 'NO_TRIGGER'
      });
    }

    // Check for orphan nodes (no connections)
    const connectedNodes = new Set<string>();
    edges.forEach(e => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          type: 'warning',
          message: `O nó "${node.data?.label}" não está conectado.`,
          code: 'ORPHAN_NODE'
        });
      }
    });

    // Check for dead ends (non-end nodes without outgoing connections)
    const sourcesSet = new Set(edges.map(e => e.source));
    nodes.forEach(node => {
      if (node.data?.type !== 'end' && !sourcesSet.has(node.id)) {
        warnings.push({
          nodeId: node.id,
          type: 'warning',
          message: `O nó "${node.data?.label}" não leva a lugar nenhum.`,
          code: 'DEAD_END'
        });
      }
    });

    // Validate condition nodes have both paths
    nodes.forEach(node => {
      if (node.data?.type === 'condition' || node.data?.type === 'split') {
        const outgoingEdges = edges.filter(e => e.source === node.id);
        const hasYes = outgoingEdges.some(e => e.sourceHandle === 'yes');
        const hasNo = outgoingEdges.some(e => e.sourceHandle === 'no');
        
        if (!hasYes || !hasNo) {
          warnings.push({
            nodeId: node.id,
            type: 'warning',
            message: `O nó de condição "${node.data?.label}" deveria ter ambos os caminhos (Sim e Não).`,
            code: 'INCOMPLETE_CONDITION'
          });
        }
      }
    });

    // Validate required config fields
    nodes.forEach(node => {
      const { type, config, label } = node.data || {};
      
      switch (type) {
        case 'message':
          if (!config?.text?.trim()) {
            errors.push({
              nodeId: node.id,
              type: 'error',
              message: `O nó "${label}" precisa de uma mensagem.`,
              code: 'MISSING_MESSAGE'
            });
          }
          break;
        case 'webhook':
          if (!config?.url?.trim()) {
            errors.push({
              nodeId: node.id,
              type: 'error',
              message: `O nó "${label}" precisa de uma URL.`,
              code: 'MISSING_URL'
            });
          }
          break;
        case 'ai':
          if (!config?.prompt?.trim()) {
            warnings.push({
              nodeId: node.id,
              type: 'warning',
              message: `O nó "${label}" não tem um prompt definido.`,
              code: 'MISSING_PROMPT'
            });
          }
          break;
      }
    });

    // Check for loops (simple detection)
    const hasLoop = detectLoop(nodes, edges);
    if (hasLoop) {
      warnings.push({
        type: 'warning',
        message: 'O fluxo contém um loop. Certifique-se de que isso é intencional.',
        code: 'FLOW_LOOP'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  return { validateFlow };
};

// Simple loop detection using DFS
function detectLoop(nodes: any[], edges: any[]): boolean {
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(e => adjacency.get(e.source)?.push(e.target));

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (dfs(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (dfs(node.id)) return true;
  }

  return false;
}
