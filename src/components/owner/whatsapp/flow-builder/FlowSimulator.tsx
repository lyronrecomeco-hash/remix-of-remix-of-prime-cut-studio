// =====================================================
// FLOW SIMULATOR - Simulador de execução de fluxo
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward,
  ChevronRight,
  MessageSquare,
  User,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FlowNode, FlowEdge, NodeType, NODE_COLORS } from './types';

interface SimulationStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  response?: string;
  duration?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  nodeId?: string;
}

interface FlowSimulatorProps {
  open: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNavigateToNode: (nodeId: string) => void;
}

export const FlowSimulator = ({ open, onClose, nodes, edges, onNavigateToNode }: FlowSimulatorProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [variables, setVariables] = useState<Record<string, string>>({
    nome: 'João Silva',
    telefone: '11999998888',
    email: 'joao@email.com'
  });

  // Build execution path from trigger
  const buildExecutionPath = useCallback(() => {
    const path: FlowNode[] = [];
    const trigger = nodes.find(n => n.data.type === 'trigger');
    if (!trigger) return path;

    const visited = new Set<string>();
    let current: FlowNode | undefined = trigger;

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.push(current);

      // Find next node via edges
      const outEdge = edges.find(e => e.source === current!.id && (!e.sourceHandle || e.sourceHandle === 'yes'));
      if (outEdge) {
        current = nodes.find(n => n.id === outEdge.target);
      } else {
        current = undefined;
      }
    }

    return path;
  }, [nodes, edges]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentNodeIndex(0);
    setWaitingForInput(false);
    setChatMessages([]);
    
    const path = buildExecutionPath();
    setSteps(path.map(node => ({
      nodeId: node.id,
      nodeLabel: node.data.label,
      nodeType: node.data.type as NodeType,
      status: 'pending'
    })));
  }, [buildExecutionPath]);

  // Initialize on open
  useEffect(() => {
    if (open) {
      resetSimulation();
    }
  }, [open, resetSimulation]);

  // Replace variables in text
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  // Execute current step
  const executeStep = useCallback(async () => {
    if (currentNodeIndex >= steps.length || isPaused) return;

    const step = steps[currentNodeIndex];
    const node = nodes.find(n => n.id === step.nodeId);
    if (!node) return;

    // Update step to running
    setSteps(prev => prev.map((s, i) => 
      i === currentNodeIndex ? { ...s, status: 'running' } : s
    ));

    // Highlight node in canvas
    onNavigateToNode(step.nodeId);

    const delay = 1500 / speed;

    // Simulate based on node type
    switch (node.data.type) {
      case 'trigger':
        await new Promise(r => setTimeout(r, delay));
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: node.data.config?.keywords || 'Olá!',
          timestamp: new Date(),
          nodeId: node.id
        }]);
        break;

      case 'message':
        await new Promise(r => setTimeout(r, delay));
        const messageText = replaceVariables(node.data.config?.text || 'Mensagem');
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: messageText,
          timestamp: new Date(),
          nodeId: node.id
        }]);
        break;

      case 'button':
        await new Promise(r => setTimeout(r, delay));
        const buttonText = replaceVariables(node.data.config?.text || 'Escolha:');
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `${buttonText}\n\n${node.data.config?.buttons?.map((b: any) => `[${b.text}]`).join('  ') || '[Opção 1] [Opção 2]'}`,
          timestamp: new Date(),
          nodeId: node.id
        }]);
        // Wait for user selection
        setWaitingForInput(true);
        return; // Don't advance automatically

      case 'delay':
        const seconds = node.data.config?.seconds || 5;
        await new Promise(r => setTimeout(r, Math.min(seconds * 1000, delay * 2)));
        break;

      case 'condition':
        await new Promise(r => setTimeout(r, delay));
        // Simulate condition check (always true for demo)
        break;

      case 'ai':
        await new Promise(r => setTimeout(r, delay * 2));
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: '🤖 [Resposta gerada por IA baseada no contexto da conversa]',
          timestamp: new Date(),
          nodeId: node.id
        }]);
        break;

      case 'webhook':
        await new Promise(r => setTimeout(r, delay));
        break;

      case 'end':
        await new Promise(r => setTimeout(r, delay / 2));
        break;

      default:
        await new Promise(r => setTimeout(r, delay));
    }

    // Mark step as complete
    setSteps(prev => prev.map((s, i) => 
      i === currentNodeIndex ? { ...s, status: 'success', duration: Math.round(delay) } : s
    ));

    // Move to next step
    if (currentNodeIndex < steps.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
    }
  }, [currentNodeIndex, steps, nodes, isPaused, speed, onNavigateToNode, replaceVariables]);

  // Auto-execute when running
  useEffect(() => {
    if (isRunning && !isPaused && !waitingForInput) {
      executeStep();
    }
  }, [isRunning, isPaused, currentNodeIndex, waitingForInput, executeStep]);

  // Handle user input
  const handleUserInput = () => {
    if (!userInput.trim()) return;

    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date()
    }]);

    setUserInput('');
    setWaitingForInput(false);
    
    // Continue execution
    setSteps(prev => prev.map((s, i) => 
      i === currentNodeIndex ? { ...s, status: 'success' } : s
    ));
    setCurrentNodeIndex(prev => prev + 1);
  };

  const progress = steps.length > 0 ? ((currentNodeIndex + (isRunning ? 0.5 : 0)) / steps.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Simulador de Fluxo</DialogTitle>
              <p className="text-sm text-muted-foreground">Teste seu fluxo em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {speed}x
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            >
              <FastForward className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16">Progresso</span>
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-xs font-medium w-12 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Steps Panel */}
          <div className="w-80 border-r bg-muted/20 flex flex-col">
            <div className="p-3 border-b">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Passos do Fluxo
              </h4>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {steps.map((step, index) => {
                  const color = NODE_COLORS[step.nodeType] || '#6b7280';
                  return (
                    <motion.div
                      key={step.nodeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                        index === currentNodeIndex && isRunning ? 'bg-primary/10' : 'hover:bg-muted'
                      )}
                      onClick={() => onNavigateToNode(step.nodeId)}
                    >
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          {step.status === 'running' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Clock className="w-4 h-4" style={{ color }} />
                            </motion.div>
                          ) : step.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : step.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-2 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{step.nodeLabel}</p>
                        <p className="text-xs text-muted-foreground capitalize">{step.nodeType}</p>
                      </div>
                      {step.duration && (
                        <Badge variant="secondary" className="text-[10px]">
                          {step.duration}ms
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Preview */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/20">
            <div className="p-3 border-b bg-green-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{variables.nome}</p>
                  <p className="text-xs text-white/70">{variables.telefone}</p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-md mx-auto">
                <AnimatePresence mode="popLayout">
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        'flex',
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm',
                          msg.sender === 'user'
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-card border rounded-bl-md'
                        )}
                      >
                        {msg.sender === 'bot' && (
                          <div className="flex items-center gap-1 mb-1">
                            <Bot className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-primary font-medium">Luna</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <p className={cn(
                          'text-[10px] mt-1',
                          msg.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {waitingForInput && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-muted-foreground py-2"
                  >
                    Aguardando resposta do usuário...
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-background">
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
                  placeholder={waitingForInput ? 'Digite sua resposta...' : 'Simulação em andamento...'}
                  disabled={!waitingForInput}
                  className="bg-muted/50"
                />
                <Button 
                  size="icon" 
                  onClick={handleUserInput}
                  disabled={!waitingForInput || !userInput.trim()}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t flex justify-between items-center bg-muted/30">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetSimulation} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {!isRunning ? (
              <Button onClick={() => setIsRunning(true)} className="gap-2">
                <Play className="w-4 h-4" />
                Executar
              </Button>
            ) : (
              <Button 
                variant={isPaused ? 'default' : 'secondary'}
                onClick={() => setIsPaused(!isPaused)} 
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pausar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
