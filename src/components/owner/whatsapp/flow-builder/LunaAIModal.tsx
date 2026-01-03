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
  summary?: string;
  tips?: string[];
  timestamp: Date;
  isError?: boolean;
  isPlanApproved?: boolean;
  isBuilding?: boolean;
}

interface FlowPlan {
  objective: string;
  approach: string;
  steps: { icon: string; title: string; description: string }[];
  estimatedNodes: number;
  estimatedTime: string;
}

interface BuildStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
  detail?: string;
}

interface LunaAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  currentNodes?: FlowNode[];
  currentEdges?: FlowEdge[];
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
  currentEdges = []
}: LunaAIModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [generatedFlow, setGeneratedFlow] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<FlowPlan | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [animatingNodes, setAnimatingNodes] = useState<string[]>([]);
  const [isApplyingToCanvas, setIsApplyingToCanvas] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Sou a **Luna**, sua assistente especialista em automação WhatsApp.\n\nMe descreva o fluxo que você precisa e eu vou:\n1. 📋 **Analisar** sua necessidade\n2. 📐 **Propor** uma estrutura\n3. ⏳ **Aguardar** sua aprovação\n4. 🔧 **Construir** o fluxo ao vivo no canvas!',
        timestamp: new Date()
      }]);
    }
  }, [open, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, buildSteps]);

  // Generate a plan from the AI
  const generatePlan = useCallback(async (prompt: string): Promise<FlowPlan> => {
    // Simulated plan generation based on prompt keywords
    const isVendas = prompt.toLowerCase().includes('venda') || prompt.toLowerCase().includes('produto');
    const isAtendimento = prompt.toLowerCase().includes('atendimento') || prompt.toLowerCase().includes('cliente');
    const isSuporte = prompt.toLowerCase().includes('suporte') || prompt.toLowerCase().includes('problema');
    const isAgendamento = prompt.toLowerCase().includes('agenda') || prompt.toLowerCase().includes('horário');

    const steps = [];
    let objective = '';
    let approach = '';
    let estimatedNodes = 6;

    if (isVendas) {
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
      estimatedTime: `${Math.ceil(estimatedNodes * 0.5)}-${estimatedNodes} minutos`
    };
  }, []);

  // Animate nodes being created on canvas
  const buildFlowOnCanvas = useCallback(async (nodes: FlowNode[], edges: FlowEdge[]) => {
    setIsApplyingToCanvas(true);
    setAnimatingNodes([]);
    
    // Close modal and start building
    onOpenChange(false);
    
    // Small delay before starting
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Apply flow with animation
    onApplyFlow(nodes, edges);
    
    toast.success('🎉 Fluxo construído com sucesso!', {
      description: `${nodes.length} nós criados e conectados`
    });
    
    setIsApplyingToCanvas(false);
  }, [onApplyFlow, onOpenChange]);

  // Handle plan approval
  const approvePlan = useCallback(async () => {
    if (!currentPlan || !pendingPrompt) return;
    
    // Update message to show approved
    setMessages(prev => prev.map(msg => 
      msg.plan && !msg.isPlanApproved 
        ? { ...msg, isPlanApproved: true }
        : msg
    ));
    
    // Add building message
    const buildingMessage: Message = {
      id: `building-${Date.now()}`,
      role: 'assistant',
      content: '🔧 Perfeito! Vou construir o fluxo agora. Fechando o modal para você acompanhar a construção no canvas...',
      isBuilding: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, buildingMessage]);
    
    setIsLoading(true);
    
    // Animate build steps
    const steps: BuildStep[] = [
      { id: 'analyze', label: 'Processando plano', status: 'active' },
      { id: 'design', label: 'Gerando estrutura', status: 'pending' },
      { id: 'nodes', label: 'Criando nós', status: 'pending' },
      { id: 'connect', label: 'Conectando fluxo', status: 'pending' },
    ];
    setBuildSteps(steps);
    
    try {
      // Actually generate the flow
      const { data, error } = await supabase.functions.invoke('flow-ai-builder', {
        body: { prompt: pendingPrompt, context: null }
      });

      if (error) throw new Error(error.message || 'Erro ao gerar fluxo');
      if (data.error) throw new Error(data.error);

      // Animate through steps
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setBuildSteps(prev => prev.map((s, idx) => ({
          ...s,
          status: idx <= i ? 'done' : idx === i + 1 ? 'active' : s.status
        })));
      }

      if (data.flow?.nodes) {
        setGeneratedFlow(data.flow);
        
        // Build on canvas
        await buildFlowOnCanvas(data.flow.nodes, data.flow.edges);
      }

    } catch (error) {
      console.error('Erro ao gerar fluxo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar fluxo');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setBuildSteps([]);
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
    setGeneratedFlow(null);
    setAnimatingNodes([]);

    try {
      // First, generate a plan
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking
      
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
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-background/95">
        {/* Header - Genesis Theme */}
        <DialogHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative"
                animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                  <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                </div>
                <motion.div 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                  animate={isLoading ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  Luna IA
                  <Badge className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground border-0 text-[10px]">
                    GENESIS
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? '🔧 Processando...' : currentPlan ? '📋 Aguardando aprovação' : '✨ Arquiteta de Fluxos'}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Build Progress Animation */}
        <AnimatePresence>
          {buildSteps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="h-4 w-4 text-primary" />
                  </motion.div>
                  <span className="text-sm font-medium">Construindo fluxo...</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {buildSteps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all",
                        step.status === 'done' && 'bg-green-500/20 text-green-400',
                        step.status === 'active' && 'bg-primary/20 text-primary ring-2 ring-primary/30',
                        step.status === 'pending' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {step.status === 'done' && <CheckCircle2 className="h-3 w-3" />}
                      {step.status === 'active' && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Loader2 className="h-3 w-3" />
                        </motion.div>
                      )}
                      {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-current" />}
                      {step.label}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                        <span className="text-sm text-green-500 font-medium">Plano aprovado!</span>
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
            {isLoading && buildSteps.length === 0 && (
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
                    <span className="text-sm text-muted-foreground">Analisando sua solicitação...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <AnimatePresence>
          {showQuickPrompts && !isLoading && !currentPlan && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-2 border-t border-border overflow-hidden"
            >
              <div className="pt-3">
                <span className="text-xs text-muted-foreground mb-2 block">💡 Sugestões rápidas</span>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((item, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => sendMessage(item.prompt)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all text-left group border border-transparent hover:border-primary/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentPlan ? "Descreva as modificações desejadas..." : "Descreva o fluxo que você deseja criar..."}
              className="min-h-[50px] max-h-[120px] resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shrink-0 h-[50px] w-[50px]"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
