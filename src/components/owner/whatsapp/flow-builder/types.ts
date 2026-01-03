// =====================================================
// FLOW BUILDER - TYPES
// =====================================================

export type NodeType = 
  | 'trigger' 
  | 'condition' 
  | 'action' 
  | 'delay' 
  | 'split' 
  | 'message' 
  | 'button'
  | 'list'
  | 'webhook'
  | 'ai'
  | 'end';

export interface FlowNodeData {
  label: string;
  type: NodeType;
  config: Record<string, any>;
  description?: string;
  icon?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: Record<string, any>;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface CanvasPosition {
  x: number;
  y: number;
  zoom: number;
}

export interface AutomationRule {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: any[];
  actions: any[];
  priority: number;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  flow_data: FlowData;
  flow_version: number;
  canvas_position: CanvasPosition;
  created_at: string;
  updated_at: string;
}

// Node Templates para o sidebar
export interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  category: 'triggers' | 'conditions' | 'actions' | 'flow';
  defaultConfig: Record<string, any>;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Mensagem Recebida',
    icon: 'MessageSquare',
    description: 'Inicia quando uma mensagem é recebida',
    category: 'triggers',
    defaultConfig: { keywords: [], matchType: 'contains' }
  },
  {
    type: 'trigger',
    label: 'Primeiro Contato',
    icon: 'UserPlus',
    description: 'Inicia no primeiro contato do cliente',
    category: 'triggers',
    defaultConfig: { triggerType: 'first_contact' }
  },
  {
    type: 'trigger',
    label: 'Botão Clicado',
    icon: 'MousePointer',
    description: 'Inicia quando um botão é clicado',
    category: 'triggers',
    defaultConfig: { buttonId: '' }
  },
  // Conditions
  {
    type: 'condition',
    label: 'Condição',
    icon: 'GitBranch',
    description: 'Divide o fluxo baseado em uma condição',
    category: 'conditions',
    defaultConfig: { field: '', operator: 'equals', value: '' }
  },
  {
    type: 'split',
    label: 'Split A/B',
    icon: 'Shuffle',
    description: 'Divide o tráfego em porcentagens',
    category: 'conditions',
    defaultConfig: { percentageA: 50 }
  },
  // Actions
  {
    type: 'message',
    label: 'Enviar Mensagem',
    icon: 'Send',
    description: 'Envia uma mensagem de texto',
    category: 'actions',
    defaultConfig: { text: '', typing: true }
  },
  {
    type: 'button',
    label: 'Mensagem com Botões',
    icon: 'LayoutGrid',
    description: 'Envia mensagem com botões interativos',
    category: 'actions',
    defaultConfig: { text: '', buttons: [] }
  },
  {
    type: 'list',
    label: 'Menu de Lista',
    icon: 'List',
    description: 'Envia um menu de lista',
    category: 'actions',
    defaultConfig: { title: '', sections: [] }
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: 'Globe',
    description: 'Chama uma API externa',
    category: 'actions',
    defaultConfig: { url: '', method: 'POST', headers: {} }
  },
  {
    type: 'ai',
    label: 'Resposta IA',
    icon: 'Brain',
    description: 'Gera resposta com inteligência artificial',
    category: 'actions',
    defaultConfig: { prompt: '', model: 'gemini-2.5-flash' }
  },
  // Flow Control
  {
    type: 'delay',
    label: 'Aguardar',
    icon: 'Clock',
    description: 'Pausa o fluxo por um tempo',
    category: 'flow',
    defaultConfig: { seconds: 5 }
  },
  {
    type: 'end',
    label: 'Fim',
    icon: 'CircleStop',
    description: 'Finaliza o fluxo',
    category: 'flow',
    defaultConfig: {}
  }
];

export const NODE_CATEGORIES = {
  triggers: { label: 'Gatilhos', color: '#22c55e' },
  conditions: { label: 'Condições', color: '#eab308' },
  actions: { label: 'Ações', color: '#3b82f6' },
  flow: { label: 'Controle', color: '#a855f7' }
};

export const NODE_COLORS: Record<NodeType, string> = {
  trigger: '#22c55e',
  condition: '#eab308',
  action: '#3b82f6',
  delay: '#a855f7',
  split: '#f97316',
  message: '#06b6d4',
  button: '#ec4899',
  list: '#8b5cf6',
  webhook: '#64748b',
  ai: '#14b8a6',
  end: '#ef4444'
};
