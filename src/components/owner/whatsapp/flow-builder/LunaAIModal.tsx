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
  Target,
  Pause,
  Play,
  X
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
  const [currentPlan, setCurrentPlan] = useState<FlowPlan | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [currentBuildNode, setCurrentBuildNode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [builtNodesCount, setBuiltNodesCount] = useState(0);
  const [totalNodesTouild, setTotalNodesToBuild] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buildAbortRef = useRef(false);
  const pauseRef = useRef(false);

  // Keep pauseRef in sync
  useEffect(() => {
    pauseRef.current = isPaused;
  }, [isPaused]);

  // Reset state when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Sou a **Luna**, sua assistente especialista em automação WhatsApp.\n\nMe descreva o fluxo que você precisa e eu vou:\n1. 📋 **Analisar** sua necessidade\n2. 📐 **Propor** uma estrutura\n3. ⏳ **Aguardar** sua aprovação\n4. 🔧 **Construir** o fluxo ao vivo no canvas!\n\n⏱️ *O processo de construção leva de 2 a 5 minutos, pois cada nó é configurado com cuidado.*',
        timestamp: new Date()
      }]);
    }
  }, [open, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, buildSteps, builtNodesCount]);

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

    // Calculate realistic time (15-25 seconds per node)
    const minMinutes = Math.ceil((estimatedNodes * 15) / 60);
    const maxMinutes = Math.ceil((estimatedNodes * 25) / 60);

    return {
      objective,
      approach,
      steps,
      estimatedNodes,
      estimatedTime: `${minMinutes}-${maxMinutes} minutos`
    };
  }, []);

  // Delay helper that respects pause
  const delayWithPause = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = 100;
      let elapsed = 0;
      
      const check = () => {
        if (buildAbortRef.current) {
          resolve();
          return;
        }
        if (pauseRef.current) {
          setTimeout(check, checkInterval);
          return;
        }
        elapsed += checkInterval;
        if (elapsed >= ms) {
          resolve();
        } else {
          setTimeout(check, checkInterval);
        }
      };
      
      setTimeout(check, checkInterval);
    });
  }, []);

  // Build flow on canvas node by node (SLOW - human speed 2-5 minutes)
  const buildFlowOnCanvas = useCallback(async (nodes: FlowNode[], edges: FlowEdge[]) => {
    setIsBuilding(true);
    setBuildProgress(0);
    setBuiltNodesCount(0);
    setTotalNodesToBuild(nodes.length);
    buildAbortRef.current = false;
    
    const totalSteps = nodes.length + 4; // nodes + analyze/prepare/connect/finish
    let currentStep = 0;
    
    // Initialize build steps
    const steps: BuildStep[] = [
      { id: 'analyze', label: 'Analisando estrutura...', status: 'active' },
      { id: 'prepare', label: 'Preparando canvas...', status: 'pending' },
      ...nodes.map((n, i) => ({ 
        id: `node-${i}`, 
        label: `${NODE_ICONS[n.type] || '📦'} ${n.data?.label || `Nó ${i + 1}`}`, 
        status: 'pending' as const 
      })),
      { id: 'connect', label: 'Conectando fluxo...', status: 'pending' },
      { id: 'finish', label: 'Finalizando...', status: 'pending' }
    ];
    setBuildSteps(steps);
    
    const updateStep = (stepId: string, status: 'active' | 'done', detail?: string) => {
      setBuildSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status, detail } : s
      ));
    };
    
    // Step 1: Analyze (8-15 seconds)
    setCurrentBuildNode('Analisando estrutura do fluxo...');
    await delayWithPause(8000 + Math.random() * 7000);
    if (buildAbortRef.current) { setIsBuilding(false); return; }
    updateStep('analyze', 'done', 'Estrutura mapeada');
    currentStep++;
    setBuildProgress((currentStep / totalSteps) * 100);
    
    // Step 2: Prepare canvas (5-10 seconds)
    updateStep('prepare', 'active');
    setCurrentBuildNode('Preparando área de trabalho...');
    await delayWithPause(5000 + Math.random() * 5000);
    if (buildAbortRef.current) { setIsBuilding(false); return; }
    updateStep('prepare', 'done', 'Canvas pronto');
    currentStep++;
    setBuildProgress((currentStep / totalSteps) * 100);
    
    // Step 3: Add nodes one by one (12-25 seconds each)
    const addedNodes: FlowNode[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (buildAbortRef.current) { setIsBuilding(false); return; }
      
      const node = nodes[i];
      const stepId = `node-${i}`;
      const nodeLabel = node.data?.label || `Nó ${i + 1}`;
      
      updateStep(stepId, 'active');
      setCurrentBuildNode(`Criando: ${nodeLabel}`);
      
      // Simulate thinking/configuring time based on node complexity
      // AI nodes take longer, simple messages are faster
      let baseTime = 12000; // 12 seconds minimum
      if (node.type === 'ai') baseTime = 20000;
      else if (node.type === 'list' || node.type === 'wa_send_list') baseTime = 18000;
      else if (node.type === 'condition') baseTime = 16000;
      else if (node.type === 'webhook') baseTime = 15000;
      
      const randomExtra = Math.random() * 8000; // 0-8 seconds extra
      await delayWithPause(baseTime + randomExtra);
      
      if (buildAbortRef.current) { setIsBuilding(false); return; }
      
      // Add node to canvas
      addedNodes.push(node);
      onApplyFlow([...addedNodes], []);
      setBuiltNodesCount(i + 1);
      
      updateStep(stepId, 'done', 'Configurado ✓');
      currentStep++;
      setBuildProgress((currentStep / totalSteps) * 100);
      
      // Small pause between nodes (2-4 seconds)
      await delayWithPause(2000 + Math.random() * 2000);
    }
    
    // Step 4: Connect edges (10-20 seconds)
    if (buildAbortRef.current) { setIsBuilding(false); return; }
    updateStep('connect', 'active');
    setCurrentBuildNode('Conectando nós...');
    await delayWithPause(10000 + Math.random() * 10000);
    if (buildAbortRef.current) { setIsBuilding(false); return; }
    
    // Apply all edges
    onApplyFlow(addedNodes, edges);
    updateStep('connect', 'done', `${edges.length} conexões`);
    currentStep++;
    setBuildProgress((currentStep / totalSteps) * 100);
    
    // Step 5: Finish (3-6 seconds)
    updateStep('finish', 'active');
    setCurrentBuildNode('Validando e finalizando...');
    await delayWithPause(3000 + Math.random() * 3000);
    if (buildAbortRef.current) { setIsBuilding(false); return; }
    updateStep('finish', 'done', 'Completo!');
    setBuildProgress(100);
    setCurrentBuildNode(null);
    
    // Add completion message
    setMessages(prev => [...prev, {
      id: `complete-${Date.now()}`,
      role: 'assistant',
      content: `✅ **Fluxo construído com sucesso!**\n\nCriei **${nodes.length} nós** e **${edges.length} conexões** no canvas.\n\nO fluxo está pronto! Você pode:\n- 🔧 **Editar** qualquer nó clicando nele\n- ▶️ **Testar** usando o preview do celular\n- 💾 **Salvar** para manter suas alterações\n\nPrecisa de algum ajuste?`,
      timestamp: new Date()
    }]);
    
    setIsBuilding(false);
    setBuildSteps([]);
    toast.success('🎉 Fluxo construído pela Luna!', {
      description: `${nodes.length} nós criados e conectados`
    });
  }, [onApplyFlow, delayWithPause]);

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
      content: '🔧 **Iniciando construção do fluxo!**\n\nVocê verá cada nó sendo criado no canvas em tempo real.\n\n⏱️ Este processo pode levar alguns minutos - estou configurando cada etapa com cuidado para garantir o melhor funcionamento.\n\n*Mantenha esta janela aberta para acompanhar o progresso.*',
      isBuilding: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, buildingMessage]);
    
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
        // Start slow building process - DO NOT close modal
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
      setIsBuilding(false);
      setBuildSteps([]);
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

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Cancel build
  const cancelBuild = useCallback(() => {
    buildAbortRef.current = true;
    setIsBuilding(false);
    setBuildSteps([]);
    setBuildProgress(0);
    setCurrentBuildNode(null);
    toast.info('Construção cancelada');
  }, []);

  const sendMessage = async (prompt?: string) => {
    const messageContent = prompt || input.trim();
    if (!messageContent || isLoading || isBuilding) return;

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
      // Simulate thinking (3-6 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));
      
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

  // Prevent closing while building
  const handleOpenChange = (newOpen: boolean) => {
    if (isBuilding && !newOpen) {
      toast.info('Aguarde a construção terminar ou cancele primeiro');
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-background/95">
        {/* Header - Genesis Theme */}
        <DialogHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative"
                animate={isLoading || isBuilding ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                  <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                </div>
                <motion.div 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                  animate={isBuilding ? { scale: [1, 1.3, 1], backgroundColor: ['#22c55e', '#3b82f6', '#22c55e'] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
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
                  {isBuilding 
                    ? `🔧 Construindo... ${builtNodesCount}/${totalNodesTouild} nós`
                    : isLoading 
                      ? '🔍 Processando...' 
                      : currentPlan 
                        ? '📋 Aguardando aprovação' 
                        : '✨ Arquiteta de Fluxos'
                  }
                </p>
              </div>
            </div>
            
            {/* Build controls */}
            {isBuilding && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePause}
                  className="h-8 px-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelBuild}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Build Progress Bar */}
        {isBuilding && (
          <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                {isPaused ? (
                  <>
                    <Pause className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-500">Pausado</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {currentBuildNode}
                  </>
                )}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(buildProgress)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${buildProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Build Steps Animation */}
        <AnimatePresence>
          {buildSteps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border overflow-hidden max-h-[200px]"
            >
              <ScrollArea className="h-full max-h-[200px]">
                <div className="p-4 space-y-1">
                  {buildSteps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "flex items-center gap-2 py-1 text-sm transition-all",
                        step.status === 'done' && 'text-green-500',
                        step.status === 'active' && 'text-primary font-medium',
                        step.status === 'pending' && 'text-muted-foreground/50'
                      )}
                    >
                      {step.status === 'done' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                      {step.status === 'active' && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Loader2 className="h-4 w-4 flex-shrink-0" />
                        </motion.div>
                      )}
                      {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-current flex-shrink-0" />}
                      <span className="truncate">{step.label}</span>
                      {step.detail && (
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                          {step.detail}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
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
                              disabled={isLoading || isBuilding}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Sim, implementar!
                            </Button>
                            <Button
                              onClick={rejectPlan}
                              variant="outline"
                              className="flex-1 gap-2"
                              size="sm"
                              disabled={isLoading || isBuilding}
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
            {isLoading && !isBuilding && buildSteps.length === 0 && (
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
          {showQuickPrompts && !isLoading && !isBuilding && !currentPlan && (
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
              placeholder={
                isBuilding 
                  ? "Aguarde a construção terminar..." 
                  : currentPlan 
                    ? "Descreva as modificações desejadas..." 
                    : "Descreva o fluxo que você deseja criar..."
              }
              className="min-h-[50px] max-h-[120px] resize-none text-sm"
              disabled={isLoading || isBuilding}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || isBuilding}
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
            {isBuilding 
              ? `⏱️ Construindo... ${builtNodesCount}/${totalNodesTouild} nós criados`
              : 'Pressione Enter para enviar • Shift+Enter para nova linha'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
