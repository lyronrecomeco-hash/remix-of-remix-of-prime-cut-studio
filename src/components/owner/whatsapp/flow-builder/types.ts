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
  | 'end'
  | 'goto'
  | 'variable'
  | 'integration'
  | 'note'
  | 'http_request'
  | 'webhook_in'
  | 'ecommerce'
  | 'crm_sheets';

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
  category: 'triggers' | 'conditions' | 'actions' | 'flow' | 'advanced';
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
  {
    type: 'trigger',
    label: 'Webhook Recebido',
    icon: 'Webhook',
    description: 'Inicia por chamada externa',
    category: 'triggers',
    defaultConfig: { webhookId: '' }
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
  {
    type: 'condition',
    label: 'Horário Comercial',
    icon: 'Clock',
    description: 'Verifica se está no horário',
    category: 'conditions',
    defaultConfig: { checkType: 'business_hours' }
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
    type: 'ai',
    label: 'Resposta IA',
    icon: 'Brain',
    description: 'Gera resposta com inteligência artificial',
    category: 'actions',
    defaultConfig: { prompt: '', model: 'gemini-2.5-flash', temperature: 0.7 }
  },
  {
    type: 'webhook',
    label: 'Chamar API',
    icon: 'Globe',
    description: 'Chama uma API externa',
    category: 'actions',
    defaultConfig: { url: '', method: 'POST', headers: {}, body: '' }
  },
  // Flow Control
  {
    type: 'delay',
    label: 'Aguardar',
    icon: 'Timer',
    description: 'Pausa o fluxo por um tempo',
    category: 'flow',
    defaultConfig: { seconds: 5, showTyping: true }
  },
  {
    type: 'goto',
    label: 'Ir Para',
    icon: 'CornerDownRight',
    description: 'Redireciona para outro nó',
    category: 'flow',
    defaultConfig: { targetNodeId: '' }
  },
  {
    type: 'end',
    label: 'Fim',
    icon: 'CircleStop',
    description: 'Finaliza o fluxo',
    category: 'flow',
    defaultConfig: { endType: 'complete' }
  },
  // Advanced
  {
    type: 'variable',
    label: 'Definir Variável',
    icon: 'Tag',
    description: 'Define uma variável no contexto',
    category: 'advanced',
    defaultConfig: { name: '', value: '', source: 'static' }
  },
  {
    type: 'integration',
    label: 'Integração',
    icon: 'Plug',
    description: 'Conecta com sistema externo',
    category: 'advanced',
    defaultConfig: { integrationType: '', config: {} }
  },
  {
    type: 'note',
    label: 'Nota',
    icon: 'StickyNote',
    description: 'Adiciona comentário visual',
    category: 'advanced',
    defaultConfig: { text: '', color: 'yellow' }
  },
  // External API / Integrations
  {
    type: 'http_request',
    label: 'HTTP Request',
    icon: 'Globe',
    description: 'Faz requisição HTTP (GET/POST/PUT/DELETE)',
    category: 'advanced',
    defaultConfig: { url: '', method: 'GET', headers: {}, body: '', saveResponseTo: '' }
  },
  {
    type: 'webhook_in',
    label: 'Webhook In',
    icon: 'Webhook',
    description: 'Recebe eventos de sistemas externos',
    category: 'triggers',
    defaultConfig: { webhookPath: '', secret: '', validatePayload: true }
  },
  {
    type: 'ecommerce',
    label: 'E-commerce',
    icon: 'ShoppingCart',
    description: 'Ações para Shopify, Woo, etc.',
    category: 'advanced',
    defaultConfig: { platform: 'shopify', action: 'get_order', orderId: '', productId: '' }
  },
  {
    type: 'crm_sheets',
    label: 'CRM / Planilhas',
    icon: 'Table',
    description: 'Cria/atualiza leads, salva em Sheets',
    category: 'advanced',
    defaultConfig: { target: 'crm', action: 'create_lead', fields: {} }
  }
];

export const NODE_CATEGORIES = {
  triggers: { label: 'Gatilhos', color: '#22c55e' },
  conditions: { label: 'Condições', color: '#eab308' },
  actions: { label: 'Ações', color: '#3b82f6' },
  flow: { label: 'Controle', color: '#a855f7' },
  advanced: { label: 'Avançado', color: '#6366f1' }
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
  end: '#ef4444',
  goto: '#f59e0b',
  variable: '#10b981',
  integration: '#6366f1',
  note: '#fbbf24',
  http_request: '#0ea5e9',
  webhook_in: '#7c3aed',
  ecommerce: '#f43f5e',
  crm_sheets: '#059669',
};

// Connection validation rules
export const CONNECTION_RULES = {
  // Nodes that can only have one outgoing connection
  singleOutput: ['trigger', 'message', 'button', 'list', 'ai', 'webhook', 'delay', 'variable', 'integration', 'http_request', 'webhook_in', 'ecommerce', 'crm_sheets'],
  // Nodes that can have multiple outgoing connections (yes/no)
  conditionalOutput: ['condition', 'split'],
  // Nodes that cannot have outgoing connections
  noOutput: ['end'],
  // Nodes that can be connected from any node
  universalInput: ['message', 'button', 'list', 'ai', 'webhook', 'delay', 'condition', 'split', 'variable', 'integration', 'end', 'goto', 'note', 'http_request', 'ecommerce', 'crm_sheets'],
};
