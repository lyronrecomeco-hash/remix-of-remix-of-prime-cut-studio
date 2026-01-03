import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  User, 
  Lightbulb, 
  Wand2,
  MessageSquare,
  AlertCircle,
  Zap,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FlowNode, FlowEdge } from './types';
import lunaAvatar from '@/assets/luna-avatar.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  flow?: { nodes: FlowNode[]; edges: FlowEdge[] };
  plan?: FlowPlan;
  timestamp: Date;
  isError?: boolean;
  isPlanApproved?: boolean;
}

interface FlowPlan {
  objective: string;
  approach: string;
  steps: { icon: string; title: string; description: string }[];
  estimatedNodes: number;
  estimatedTime: string;
}

interface LunaAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  currentNodes?: FlowNode[];
  currentEdges?: FlowEdge[];
  flowId?: string;
  onSaveFlow?: () => Promise<void>;
}

const QUICK_PROMPTS = [
  { icon: MessageSquare, label: 'Atendimento', prompt: 'Crie um fluxo de atendimento ao cliente com menu de opções, FAQ e transferência para humano' },
  { icon: Sparkles, label: 'Vendas', prompt: 'Crie um fluxo de vendas com apresentação de produtos, perguntas de qualificação e fechamento' },
  { icon: Lightbulb, label: 'Suporte', prompt: 'Crie um fluxo de suporte técnico com triagem de problemas, soluções automáticas e escalação' },
  { icon: Wand2, label: 'Agendamento', prompt: 'Crie um fluxo de agendamento com seleção de data, horário e confirmação' },
];

const NODE_ICONS: Record<string, string> = {
  trigger: '⚡',
  wa_start: '▶️',
  message: '💬',
  wa_send_text: '💬',
  wa_send_buttons: '🔘',
  wa_send_list: '📋',
  wa_wait_response: '⏳',
  wa_receive: '📥',
  button: '🔘',
  list: '📋',
  condition: '🔀',
  delay: '⏱️',
  ai: '🤖',
  webhook: '🌐',
  variable: '📝',
  end: '🏁'
};

export const LunaAIModal = ({ 
  open,
  onOpenChange,
  onApplyFlow, 
  currentNodes = [], 
  currentEdges = [],
  flowId,
  onSaveFlow
}: LunaAIModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<FlowPlan | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Sou a **Luna**, sua assistente de automação WhatsApp.\n\nMe descreva o fluxo que você precisa e eu vou:\n1. 📋 **Analisar** sua necessidade\n2. 📐 **Propor** uma estrutura\n3. ⏳ **Aguardar** sua aprovação\n4. 🔧 **Construir** o fluxo no canvas!\n\n*Após aprovação, fecharei esta janela e você verá os nós sendo criados em tempo real!*',
        timestamp: new Date()
      }]);
    }
  }, [open, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate a plan from the AI
  const generatePlan = useCallback(async (prompt: string): Promise<FlowPlan> => {
    const isVendas = prompt.toLowerCase().includes('venda') || prompt.toLowerCase().includes('produto');
    const isAtendimento = prompt.toLowerCase().includes('atendimento') || prompt.toLowerCase().includes('cliente');
    const isSuporte = prompt.toLowerCase().includes('suporte') || prompt.toLowerCase().includes('problema');
    const isAgendamento = prompt.toLowerCase().includes('agenda') || prompt.toLowerCase().includes('horário');
    const isRestaurante = prompt.toLowerCase().includes('restaurante') || prompt.toLowerCase().includes('cardápio') || prompt.toLowerCase().includes('pedido');

    const steps = [];
    let objective = '';
    let approach = '';
    let estimatedNodes = 6;

    if (isRestaurante) {
      objective = 'Sistema completo de atendimento para restaurante com cardápio interativo';
      approach = 'Fluxo conversacional com apresentação do cardápio, coleta de pedido, endereço e pagamento';
      steps.push(
        { icon: '⚡', title: 'Gatilho Inicial', description: 'Detecta início de conversa' },
        { icon: '👋', title: 'Boas-vindas', description: 'Saudação e horário de funcionamento' },
        { icon: '📋', title: 'Cardápio', description: 'Lista de categorias de produtos' },
        { icon: '🍕', title: 'Itens', description: 'Produtos de cada categoria' },
        { icon: '🛒', title: 'Pedido', description: 'Coleta de itens e quantidades' },
        { icon: '📍', title: 'Endereço', description: 'Captura do endereço de entrega' },
        { icon: '💳', title: 'Pagamento', description: 'Forma de pagamento' },
        { icon: '✅', title: 'Confirmação', description: 'Resumo e confirmação do pedido' }
      );
      estimatedNodes = 12;
    } else if (isVendas) {
      objective = 'Criar um funil de vendas automatizado via WhatsApp';
      approach = 'Fluxo conversacional com qualificação de leads, apresentação de produtos e direcionamento para fechamento';
      steps.push(
        { icon: '⚡', title: 'Gatilho Inicial', description: 'Detecta interesse do cliente ao iniciar conversa' },
        { icon: '👋', title: 'Boas-vindas', description: 'Saudação personalizada e apresentação' },
        { icon: '📋', title: 'Menu de Produtos', description: 'Lista interativa com categorias ou produtos' },
        { icon: '💬', title: 'Detalhes do Produto', description: 'Informações, preços e benefícios' },
        { icon: '🔀', title: 'Qualificação', description: 'Perguntas para entender necessidade' },
        { icon: '🎯', title: 'Fechamento', description: 'CTA para compra ou falar com vendedor' }
      );
      estimatedNodes = 8;
    } else if (isSuporte) {
      objective = 'Criar um sistema de suporte técnico inteligente';
      approach = 'Triagem automática de problemas com soluções pré-definidas e escalação quando necessário';
      steps.push(
        { icon: '⚡', title: 'Gatilho', description: 'Identifica solicitação de suporte' },
        { icon: '📋', title: 'Triagem', description: 'Lista de categorias de problemas' },
        { icon: '🔀', title: 'Diagnóstico', description: 'Perguntas específicas por categoria' },
        { icon: '💡', title: 'Solução Automática', description: 'Instruções passo a passo' },
        { icon: '❓', title: 'Verificação', description: 'Confirma se resolveu o problema' },
        { icon: '👤', title: 'Escalação', description: 'Transfere para atendente humano' }
      );
      estimatedNodes = 10;
    } else if (isAgendamento) {
      objective = 'Criar um sistema de agendamento automatizado';
      approach = 'Fluxo guiado para seleção de serviço, data, horário e confirmação';
      steps.push(
        { icon: '⚡', title: 'Gatilho', description: 'Detecta intenção de agendar' },
        { icon: '📋', title: 'Seleção de Serviço', description: 'Lista de serviços disponíveis' },
        { icon: '📅', title: 'Escolha de Data', description: 'Datas disponíveis na semana' },
        { icon: '⏰', title: 'Escolha de Horário', description: 'Horários livres no dia' },
        { icon: '✅', title: 'Confirmação', description: 'Resumo e confirmação do agendamento' },
        { icon: '📲', title: 'Lembrete', description: 'Mensagem de confirmação via WhatsApp' }
      );
      estimatedNodes = 8;
    } else {
      objective = 'Criar um fluxo de atendimento automatizado';
      approach = 'Menu interativo com opções principais e respostas personalizadas';
      steps.push(
        { icon: '⚡', title: 'Gatilho Inicial', description: 'Ativa ao receber mensagem' },
        { icon: '👋', title: 'Boas-vindas', description: 'Saudação cordial e apresentação' },
        { icon: '📋', title: 'Menu Principal', description: 'Opções de atendimento' },
        { icon: '💬', title: 'Respostas', description: 'Informações para cada opção' },
        { icon: '🔀', title: 'Decisão', description: 'Verifica se precisa de mais ajuda' },
        { icon: '🏁', title: 'Finalização', description: 'Agradecimento e encerramento' }
      );
      estimatedNodes = 7;
    }

    return {
      objective,
      approach,
      steps,
      estimatedNodes,
      estimatedTime: '~45 segundos'
    };
  }, []);

  // Build flow on canvas node by node (MAX 1 MINUTE)
  const buildFlowOnCanvas = useCallback(async (nodes: FlowNode[], edges: FlowEdge[]) => {
    // Close modal immediately when building starts
    onOpenChange(false);
    
    // Calculate timing: max 60 seconds total
    // Analysis: 3s, Per node: ~4-5s each, Connections: 3s, Finish: 2s
    const analysisTime = 3000;
    const connectionTime = 3000;
    const finishTime = 2000;
    const availableForNodes = 60000 - analysisTime - connectionTime - finishTime; // 52 seconds for nodes
    const perNodeTime = Math.min(5000, Math.floor(availableForNodes / nodes.length));
    
    // Show toast with progress
    const toastId = toast.loading('🤖 Luna está construindo o fluxo...', {
      description: 'Analisando estrutura...'
    });
    
    // Step 1: Analysis
    await new Promise(r => setTimeout(r, analysisTime));
    
    // Step 2: Add nodes one by one
    const addedNodes: FlowNode[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeLabel = node.data?.label || `Nó ${i + 1}`;
      
      toast.loading(`🤖 Luna está construindo o fluxo...`, {
        id: toastId,
        description: `Criando: ${nodeLabel} (${i + 1}/${nodes.length})`
      });
      
      // Add node to canvas
      addedNodes.push(node);
      onApplyFlow([...addedNodes], []);
      
      // Wait per node time (with slight randomness)
      await new Promise(r => setTimeout(r, perNodeTime * (0.8 + Math.random() * 0.4)));
    }
    
    // Step 3: Connect edges
    toast.loading(`🤖 Luna está construindo o fluxo...`, {
      id: toastId,
      description: 'Conectando nós...'
    });
    await new Promise(r => setTimeout(r, connectionTime));
    onApplyFlow(addedNodes, edges);
    
    // Step 4: Save automatically
    toast.loading(`🤖 Luna está construindo o fluxo...`, {
      id: toastId,
      description: 'Salvando...'
    });
    
    if (onSaveFlow) {
      try {
        await onSaveFlow();
      } catch (error) {
        console.error('Error auto-saving flow:', error);
      }
    }
    
    await new Promise(r => setTimeout(r, finishTime));
    
    // Complete!
    toast.success('🎉 Fluxo construído pela Luna!', {
      id: toastId,
      description: `${nodes.length} nós criados e salvos automaticamente`
    });
  }, [onApplyFlow, onOpenChange, onSaveFlow]);

  // Handle plan approval
  const approvePlan = useCallback(async () => {
    if (!currentPlan || !pendingPrompt) return;
    
    // Update message to show approved
    setMessages(prev => prev.map(msg => 
      msg.plan && !msg.isPlanApproved 
        ? { ...msg, isPlanApproved: true }
        : msg
    ));
    
    setIsLoading(true);
    setShowQuickPrompts(false);
    
    try {
      // Actually generate the flow via edge function
      const { data, error } = await supabase.functions.invoke('flow-ai-builder', {
        body: { prompt: pendingPrompt, context: null }
      });

      if (error) throw new Error(error.message || 'Erro ao gerar fluxo');
      if (data.error) throw new Error(data.error);

      if (data.flow?.nodes) {
        // Close modal and start building on canvas
        await buildFlowOnCanvas(data.flow.nodes, data.flow.edges || []);
      } else {
        throw new Error('Resposta inválida da IA');
      }

    } catch (error) {
      console.error('Erro ao gerar fluxo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar fluxo');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Ocorreu um erro ao construir o fluxo. Por favor, tente novamente.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentPlan(null);
      setPendingPrompt('');
    }
  }, [currentPlan, pendingPrompt, buildFlowOnCanvas]);

  // Reject plan and ask for modifications
  const rejectPlan = useCallback(() => {
    setCurrentPlan(null);
    
    const rejectMessage: Message = {
      id: `reject-${Date.now()}`,
      role: 'assistant',
      content: 'Entendi! 💡 Me diga o que gostaria de modificar no plano, ou descreva novamente sua necessidade com mais detalhes.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, rejectMessage]);
    setShowQuickPrompts(false);
  }, []);

  const sendMessage = async (prompt?: string) => {
    const messageContent = prompt || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickPrompts(false);

    try {
      // Simulate thinking (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      const plan = await generatePlan(messageContent);
      setCurrentPlan(plan);
      setPendingPrompt(messageContent);

      const planMessage: Message = {
        id: `plan-${Date.now()}`,
        role: 'assistant',
        content: `📋 Analisei sua solicitação! Aqui está meu plano:\n\n**🎯 Objetivo:**\n${plan.objective}\n\n**📐 Abordagem:**\n${plan.approach}`,
        plan,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, planMessage]);

    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Erro ao gerar plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-background/95">
        {/* Header - Genesis Theme */}
        <DialogHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative"
              animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </motion.div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                Luna IA
                <Badge className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground border-0 text-[10px]">
                  GENESIS
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {isLoading 
                  ? '🔍 Processando...' 
                  : currentPlan 
                    ? '📋 Aguardando aprovação' 
                    : '✨ Arquiteta de Fluxos'
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' 
                      ? 'bg-primary' 
                      : 'bg-gradient-to-r from-primary to-primary/60 overflow-hidden'
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 max-w-[450px]",
                    message.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    <div className={cn(
                      "inline-block p-3 rounded-2xl text-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : message.isError 
                          ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
                          : 'bg-muted rounded-tl-sm'
                    )}>
                      {message.isError && (
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Erro</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                      </div>
                    </div>

                    {/* Plan Preview & Approval */}
                    {message.plan && !message.isPlanApproved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Estrutura do Fluxo</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>~{message.plan.estimatedNodes} nós</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{message.plan.estimatedTime}</span>
                          </div>
                        </div>
                        
                        {/* Steps preview */}
                        <div className="space-y-2 mb-4">
                          {message.plan.steps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 p-2 bg-background/50 rounded-lg"
                            >
                              <span className="text-base">{step.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{step.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
                              </div>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                            </motion.div>
                          ))}
                        </div>

                        <div className="border-t border-border/50 pt-3">
                          <p className="text-xs text-muted-foreground mb-3 text-center">
                            Posso implementar esse fluxo?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={approvePlan}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 gap-2"
                              size="sm"
                              disabled={isLoading}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Sim, implementar!
                            </Button>
                            <Button
                              onClick={rejectPlan}
                              variant="outline"
                              className="flex-1 gap-2"
                              size="sm"
                              disabled={isLoading}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Modificar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Approved badge */}
                    {message.plan && message.isPlanApproved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-3 bg-green-500/10 rounded-xl border border-green-500/30 flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">Plano aprovado! Construindo...</span>
                      </motion.div>
                    )}

                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center overflow-hidden">
                  <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analisando...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <AnimatePresence>
          {showQuickPrompts && !isLoading && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 border-t border-border"
            >
              <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(qp.prompt)}
                    className="justify-start gap-2 h-auto py-2 text-xs"
                  >
                    <qp.icon className="h-4 w-4 text-primary" />
                    {qp.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentPlan ? 'Aguardando aprovação do plano...' : 'Descreva o fluxo que você precisa...'}
              className="min-h-[44px] max-h-32 resize-none text-sm"
              disabled={isLoading || !!currentPlan}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || !!currentPlan}
              className="px-3 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LunaAIModal;
