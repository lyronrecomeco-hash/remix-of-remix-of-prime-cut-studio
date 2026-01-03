// =====================================================
// FLOW TEMPLATES - Templates prontos por nicho
// =====================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Store, 
  Stethoscope, 
  GraduationCap, 
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Search,
  Check,
  ArrowRight,
  Scissors,
  Building2,
  Dumbbell
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FlowNode, FlowEdge, NODE_COLORS } from './types';

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  nodeCount: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'welcome-basic',
    name: 'Boas-vindas Simples',
    description: 'Recepção automática para novos contatos',
    icon: Heart,
    category: 'Geral',
    difficulty: 'easy',
    nodeCount: 3,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Primeiro Contato', type: 'trigger', config: { triggerType: 'first_contact' }, description: 'Quando um novo cliente entra em contato' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 200 },
        data: { label: 'Mensagem de Boas-vindas', type: 'message', config: { text: 'Olá {{nome}}! 👋 Seja bem-vindo(a)! Como posso te ajudar hoje?', typing: true }, description: 'Saudação personalizada' }
      },
      {
        id: 'button-1',
        type: 'flowNode',
        position: { x: 300, y: 350 },
        data: { label: 'Menu Principal', type: 'button', config: { text: 'Escolha uma opção:', buttons: [{ id: 'info', text: 'ℹ️ Informações' }, { id: 'atendimento', text: '👤 Atendimento' }] }, description: 'Opções iniciais' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'button-1' }
    ]
  },
  {
    id: 'appointment-barber',
    name: 'Agendamento Barbearia',
    description: 'Fluxo completo de agendamento para barbearias',
    icon: Scissors,
    category: 'Barbearia',
    difficulty: 'medium',
    nodeCount: 7,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Mensagem Recebida', type: 'trigger', config: { triggerType: 'keyword', keywords: 'agendar, horário, marcar' }, description: 'Palavras-chave de agendamento' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 180 },
        data: { label: 'Boas-vindas', type: 'message', config: { text: '✂️ Olá {{nome}}! Vamos agendar seu horário?', typing: true }, description: 'Saudação' }
      },
      {
        id: 'button-1',
        type: 'flowNode',
        position: { x: 300, y: 310 },
        data: { label: 'Serviços', type: 'button', config: { text: 'Qual serviço você deseja?', buttons: [{ id: 'corte', text: '💈 Corte' }, { id: 'barba', text: '🧔 Barba' }, { id: 'combo', text: '✨ Combo' }] }, description: 'Seleção de serviço' }
      },
      {
        id: 'condition-1',
        type: 'flowNode',
        position: { x: 300, y: 450 },
        data: { label: 'Verifica Horário', type: 'condition', config: { field: 'state', operator: 'equals', value: 'available' }, description: 'Checa disponibilidade' }
      },
      {
        id: 'message-2',
        type: 'flowNode',
        position: { x: 100, y: 600 },
        data: { label: 'Confirma Horário', type: 'message', config: { text: '✅ Horário disponível! Confirma?', typing: true }, description: 'Disponível' }
      },
      {
        id: 'message-3',
        type: 'flowNode',
        position: { x: 500, y: 600 },
        data: { label: 'Sem Horário', type: 'message', config: { text: '😔 Esse horário não está disponível. Que tal outro?', typing: true }, description: 'Indisponível' }
      },
      {
        id: 'end-1',
        type: 'flowNode',
        position: { x: 100, y: 750 },
        data: { label: 'Fim', type: 'end', config: { endType: 'complete' }, description: 'Agendamento confirmado' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'button-1' },
      { id: 'e3-4', source: 'button-1', target: 'condition-1' },
      { id: 'e4-5', source: 'condition-1', target: 'message-2', sourceHandle: 'yes' },
      { id: 'e4-6', source: 'condition-1', target: 'message-3', sourceHandle: 'no' },
      { id: 'e5-7', source: 'message-2', target: 'end-1' }
    ]
  },
  {
    id: 'lead-qualification',
    name: 'Qualificação de Lead',
    description: 'Qualifica leads automaticamente com perguntas',
    icon: Briefcase,
    category: 'Vendas',
    difficulty: 'advanced',
    nodeCount: 8,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Primeiro Contato', type: 'trigger', config: { triggerType: 'first_contact' }, description: 'Novo lead' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 180 },
        data: { label: 'Apresentação', type: 'message', config: { text: 'Olá {{nome}}! 🚀 Sou a Luna, assistente virtual. Vou te ajudar a encontrar a melhor solução!', typing: true }, description: 'Saudação inicial' }
      },
      {
        id: 'delay-1',
        type: 'flowNode',
        position: { x: 300, y: 310 },
        data: { label: 'Aguarda 2s', type: 'delay', config: { seconds: 2, showTyping: true }, description: 'Pausa natural' }
      },
      {
        id: 'button-1',
        type: 'flowNode',
        position: { x: 300, y: 440 },
        data: { label: 'Tipo de Empresa', type: 'button', config: { text: 'Qual o tamanho da sua empresa?', buttons: [{ id: 'mei', text: '👤 MEI/Autônomo' }, { id: 'pme', text: '🏢 PME' }, { id: 'grande', text: '🏙️ Grande Empresa' }] }, description: 'Qualificação 1' }
      },
      {
        id: 'button-2',
        type: 'flowNode',
        position: { x: 300, y: 580 },
        data: { label: 'Interesse', type: 'button', config: { text: 'Qual sua principal necessidade?', buttons: [{ id: 'vendas', text: '💰 Aumentar Vendas' }, { id: 'atendimento', text: '💬 Melhorar Atendimento' }, { id: 'automacao', text: '⚡ Automatizar Processos' }] }, description: 'Qualificação 2' }
      },
      {
        id: 'ai-1',
        type: 'flowNode',
        position: { x: 300, y: 720 },
        data: { label: 'Análise IA', type: 'ai', config: { prompt: 'Analise o perfil do lead e sugira a melhor abordagem', model: 'gemini-2.5-flash', useContext: true }, description: 'IA qualifica' }
      },
      {
        id: 'webhook-1',
        type: 'flowNode',
        position: { x: 300, y: 860 },
        data: { label: 'Salvar no CRM', type: 'webhook', config: { url: 'https://api.crm.com/leads', method: 'POST' }, description: 'Integração CRM' }
      },
      {
        id: 'end-1',
        type: 'flowNode',
        position: { x: 300, y: 1000 },
        data: { label: 'Lead Qualificado', type: 'end', config: { endType: 'complete' }, description: 'Fim do fluxo' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'delay-1' },
      { id: 'e3-4', source: 'delay-1', target: 'button-1' },
      { id: 'e4-5', source: 'button-1', target: 'button-2' },
      { id: 'e5-6', source: 'button-2', target: 'ai-1' },
      { id: 'e6-7', source: 'ai-1', target: 'webhook-1' },
      { id: 'e7-8', source: 'webhook-1', target: 'end-1' }
    ]
  },
  {
    id: 'restaurant-order',
    name: 'Pedido Restaurante',
    description: 'Recebe pedidos de delivery via WhatsApp',
    icon: Utensils,
    category: 'Restaurante',
    difficulty: 'medium',
    nodeCount: 6,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Mensagem Recebida', type: 'trigger', config: { triggerType: 'keyword', keywords: 'cardápio, pedir, delivery, pedido' }, description: 'Intenção de pedido' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 180 },
        data: { label: 'Boas-vindas', type: 'message', config: { text: '🍕 Olá {{nome}}! Bem-vindo ao nosso delivery!', typing: true }, description: 'Saudação' }
      },
      {
        id: 'list-1',
        type: 'flowNode',
        position: { x: 300, y: 310 },
        data: { label: 'Cardápio', type: 'list', config: { title: 'Escolha uma categoria', sections: [{ title: 'Pratos', items: ['Pizza', 'Hambúrguer', 'Sushi'] }, { title: 'Bebidas', items: ['Refrigerante', 'Suco', 'Água'] }] }, description: 'Menu de opções' }
      },
      {
        id: 'message-2',
        type: 'flowNode',
        position: { x: 300, y: 450 },
        data: { label: 'Confirma Pedido', type: 'message', config: { text: '📝 Anotei seu pedido! Qual o endereço de entrega?', typing: true }, description: 'Coleta endereço' }
      },
      {
        id: 'webhook-1',
        type: 'flowNode',
        position: { x: 300, y: 590 },
        data: { label: 'Registra Pedido', type: 'webhook', config: { url: 'https://api.restaurante.com/orders', method: 'POST' }, description: 'Salva pedido' }
      },
      {
        id: 'end-1',
        type: 'flowNode',
        position: { x: 300, y: 730 },
        data: { label: 'Pedido Confirmado', type: 'end', config: { endType: 'complete' }, description: 'Fim' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'list-1' },
      { id: 'e3-4', source: 'list-1', target: 'message-2' },
      { id: 'e4-5', source: 'message-2', target: 'webhook-1' },
      { id: 'e5-6', source: 'webhook-1', target: 'end-1' }
    ]
  },
  {
    id: 'gym-checkin',
    name: 'Check-in Academia',
    description: 'Registro de presença e treinos',
    icon: Dumbbell,
    category: 'Fitness',
    difficulty: 'medium',
    nodeCount: 5,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Mensagem Recebida', type: 'trigger', config: { triggerType: 'keyword', keywords: 'checkin, check-in, cheguei, treino' }, description: 'Check-in' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 180 },
        data: { label: 'Confirmação', type: 'message', config: { text: '💪 Olá {{nome}}! Check-in registrado! Bom treino!', typing: true }, description: 'Confirma presença' }
      },
      {
        id: 'button-1',
        type: 'flowNode',
        position: { x: 300, y: 310 },
        data: { label: 'Tipo de Treino', type: 'button', config: { text: 'Qual treino vai fazer hoje?', buttons: [{ id: 'peito', text: '💪 Peito/Tríceps' }, { id: 'costas', text: '🏋️ Costas/Bíceps' }, { id: 'pernas', text: '🦵 Pernas' }] }, description: 'Registra treino' }
      },
      {
        id: 'webhook-1',
        type: 'flowNode',
        position: { x: 300, y: 450 },
        data: { label: 'Registra Treino', type: 'webhook', config: { url: 'https://api.academia.com/checkins', method: 'POST' }, description: 'Salva no sistema' }
      },
      {
        id: 'end-1',
        type: 'flowNode',
        position: { x: 300, y: 590 },
        data: { label: 'Fim', type: 'end', config: { endType: 'complete' }, description: 'Check-in completo' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'button-1' },
      { id: 'e3-4', source: 'button-1', target: 'webhook-1' },
      { id: 'e4-5', source: 'webhook-1', target: 'end-1' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Imobiliária - Interesse',
    description: 'Qualifica interessados em imóveis',
    icon: Building2,
    category: 'Imobiliária',
    difficulty: 'advanced',
    nodeCount: 6,
    nodes: [
      {
        id: 'trigger-1',
        type: 'flowNode',
        position: { x: 300, y: 50 },
        data: { label: 'Primeiro Contato', type: 'trigger', config: { triggerType: 'first_contact' }, description: 'Novo interessado' }
      },
      {
        id: 'message-1',
        type: 'flowNode',
        position: { x: 300, y: 180 },
        data: { label: 'Apresentação', type: 'message', config: { text: '🏠 Olá {{nome}}! Sou a assistente virtual da Imobiliária. Posso te ajudar a encontrar o imóvel ideal!', typing: true }, description: 'Saudação' }
      },
      {
        id: 'button-1',
        type: 'flowNode',
        position: { x: 300, y: 320 },
        data: { label: 'Tipo de Interesse', type: 'button', config: { text: 'Você está buscando:', buttons: [{ id: 'comprar', text: '🏡 Comprar' }, { id: 'alugar', text: '📋 Alugar' }, { id: 'investir', text: '💰 Investir' }] }, description: 'Qualificação' }
      },
      {
        id: 'button-2',
        type: 'flowNode',
        position: { x: 300, y: 460 },
        data: { label: 'Tipo de Imóvel', type: 'button', config: { text: 'Qual tipo de imóvel?', buttons: [{ id: 'apartamento', text: '🏢 Apartamento' }, { id: 'casa', text: '🏠 Casa' }, { id: 'comercial', text: '🏪 Comercial' }] }, description: 'Preferência' }
      },
      {
        id: 'ai-1',
        type: 'flowNode',
        position: { x: 300, y: 600 },
        data: { label: 'Sugestão IA', type: 'ai', config: { prompt: 'Com base no perfil do cliente, sugira 3 imóveis disponíveis', model: 'gemini-2.5-flash', useContext: true }, description: 'IA sugere imóveis' }
      },
      {
        id: 'end-1',
        type: 'flowNode',
        position: { x: 300, y: 740 },
        data: { label: 'Lead Qualificado', type: 'end', config: { endType: 'complete' }, description: 'Encaminha corretor' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'trigger-1', target: 'message-1' },
      { id: 'e2-3', source: 'message-1', target: 'button-1' },
      { id: 'e3-4', source: 'button-1', target: 'button-2' },
      { id: 'e4-5', source: 'button-2', target: 'ai-1' },
      { id: 'e5-6', source: 'ai-1', target: 'end-1' }
    ]
  }
];

const CATEGORIES = ['Todos', 'Geral', 'Barbearia', 'Vendas', 'Restaurante', 'Fitness', 'Imobiliária'];

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Fácil' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Médio' },
  advanced: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Avançado' }
};

interface FlowTemplatesProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

export const FlowTemplates = ({ open, onClose, onSelectTemplate }: FlowTemplatesProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);

  const filteredTemplates = FLOW_TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.nodes, selectedTemplate.edges);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Templates de Fluxo
          </DialogTitle>
          <DialogDescription>
            Escolha um template pronto e personalize conforme sua necessidade
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b bg-muted/30">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="h-8"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                const difficulty = DIFFICULTY_COLORS[template.difficulty];
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg',
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-transparent bg-card hover:border-muted-foreground/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{template.name}</h4>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.nodeCount} nós
                          </Badge>
                          <Badge className={cn('text-xs', difficulty.bg, difficulty.text)}>
                            {difficulty.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum template encontrado</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedTemplate ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Template selecionado: <strong>{selectedTemplate.name}</strong>
              </span>
            ) : (
              'Selecione um template para aplicar'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!selectedTemplate}
              className="gap-2"
            >
              Aplicar Template
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
