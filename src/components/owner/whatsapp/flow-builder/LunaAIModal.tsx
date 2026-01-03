import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Lightbulb, 
  Wand2,
  MessageSquare,
  Trash2,
  AlertCircle,
  X,
  Zap,
  CheckCircle2,
  GitBranch,
  ArrowRight
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
  summary?: string;
  tips?: string[];
  timestamp: Date;
  isError?: boolean;
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
  message: '💬',
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
  const [animatingNodes, setAnimatingNodes] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 🤖✨ Sou a **Luna**, sua assistente de IA para criar fluxos de WhatsApp.\n\nMe diga o que você precisa e eu vou construir o fluxo completo para você, ao vivo!',
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

  // Animate nodes being created
  const animateNodeCreation = useCallback(async (nodes: FlowNode[]) => {
    setAnimatingNodes([]);
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setAnimatingNodes(prev => [...prev, nodes[i].id]);
    }
  }, []);

  const simulateBuildSteps = useCallback(async () => {
    const steps: BuildStep[] = [
      { id: 'analyze', label: 'Analisando solicitação', status: 'pending' },
      { id: 'design', label: 'Projetando estrutura', status: 'pending' },
      { id: 'nodes', label: 'Criando nós', status: 'pending' },
      { id: 'connect', label: 'Conectando fluxo', status: 'pending' },
      { id: 'validate', label: 'Validando lógica', status: 'pending' },
    ];
    
    setBuildSteps(steps);

    // Animate through steps
    for (let i = 0; i < steps.length - 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      setBuildSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx === i ? 'done' : idx === i + 1 ? 'active' : s.status
      })));
    }
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

    // Start build animation
    simulateBuildSteps();

    try {
      const context = currentNodes.length > 0 ? {
        nodes: currentNodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
        edges: currentEdges.map(e => ({ source: e.source, target: e.target }))
      } : null;

      const { data, error } = await supabase.functions.invoke('flow-ai-builder', {
        body: { prompt: messageContent, context }
      });

      if (error) {
        // Check if the error response has a specific message
        const errorBody = error.message;
        throw new Error(errorBody || 'Erro ao conectar com a IA');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Complete all steps
      setBuildSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })));
      
      // Animate node creation
      if (data.flow?.nodes) {
        setGeneratedFlow(data.flow);
        await animateNodeCreation(data.flow.nodes);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.summary || '✅ Fluxo criado com sucesso!',
        flow: data.flow,
        summary: data.summary,
        tips: data.tips,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Erro ao gerar fluxo:', error);
      
      setBuildSteps([]);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      
      if (error instanceof Error && error.message.includes('Créditos')) {
        toast.error('Créditos de IA insuficientes', {
          description: 'Adicione fundos em Settings → Workspace → Usage'
        });
      } else {
        toast.error('Erro ao gerar fluxo');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setBuildSteps([]), 1000);
    }
  };

  const applyFlow = () => {
    if (generatedFlow) {
      onApplyFlow(generatedFlow.nodes, generatedFlow.edges);
      toast.success('Fluxo aplicado ao canvas!', {
        description: `${generatedFlow.nodes.length} nós adicionados`
      });
      onOpenChange(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: '🔄 Chat reiniciado! Me diga o que você precisa criar.',
      timestamp: new Date()
    }]);
    setShowQuickPrompts(true);
    setGeneratedFlow(null);
    setAnimatingNodes([]);
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
                  {isLoading ? '🔧 Construindo fluxo...' : '✨ Criadora de Fluxos Inteligente'}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Build Progress Animation - Genesis Theme */}
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
                  <span className="text-sm font-medium">Luna está trabalhando...</span>
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
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
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

        {/* Live Node Creation Preview */}
        <AnimatePresence>
          {generatedFlow && animatingNodes.length > 0 && isLoading && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border"
            >
              <div className="p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Criando nós ao vivo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {generatedFlow.nodes.map((node, i) => {
                    const isAnimated = animatingNodes.includes(node.id);
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={isAnimated ? { opacity: 1, scale: 1, y: 0 } : {}}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-card border",
                          isAnimated ? 'border-green-500/50' : 'border-transparent opacity-30'
                        )}
                      >
                        <span>{NODE_ICONS[node.data.type] || '📦'}</span>
                        <span className="font-medium truncate max-w-[100px]">{node.data.label}</span>
                        {isAnimated && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-green-500"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {generatedFlow.edges.length > 0 && animatingNodes.length === generatedFlow.nodes.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-green-400 flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3" />
                    {generatedFlow.edges.length} conexões criadas
                  </motion.div>
                )}
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
                      : 'bg-gradient-to-r from-primary to-primary/60'
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 max-w-[400px]",
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

                    {/* Flow Preview & Apply */}
                    {message.flow && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Fluxo Pronto!</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {message.flow.nodes.length} nós • {message.flow.edges.length} conexões
                          </Badge>
                        </div>
                        
                        {/* Node preview */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {message.flow.nodes.slice(0, 8).map((node) => (
                            <motion.div
                              key={node.id}
                              whileHover={{ scale: 1.05 }}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-background/50 text-[10px]"
                            >
                              <span>{NODE_ICONS[node.data.type] || '📦'}</span>
                              <span className="truncate max-w-[60px]">{node.data.label}</span>
                            </motion.div>
                          ))}
                          {message.flow.nodes.length > 8 && (
                            <div className="px-2 py-1 rounded bg-background/50 text-[10px] text-muted-foreground">
                              +{message.flow.nodes.length - 8} mais
                            </div>
                          )}
                        </div>
                        
                        {message.tips && message.tips.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {message.tips.slice(0, 2).map((tip, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={applyFlow}
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 group"
                          size="sm"
                        >
                          <Wand2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                          Aplicar ao Canvas
                        </Button>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                  <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Iniciando...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <AnimatePresence>
          {showQuickPrompts && !isLoading && (
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
              placeholder="Descreva o fluxo que você deseja criar..."
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
