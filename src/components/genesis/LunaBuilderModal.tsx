import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, MessageSquare, Hash, Brain, Timer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import lunaAvatar from '@/assets/luna-avatar.png';

interface ChatbotConfig {
  name: string;
  trigger_type: string;
  keywords: string;
  response_type: string;
  response: string;
  delay: number;
  instance_id: string;
  ai_enabled: boolean;
  ai_model: string;
  ai_temperature: number;
  ai_system_prompt: string;
}

interface LunaBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: ChatbotConfig) => void;
  instances: Array<{ id: string; name: string }>;
}

interface BuildStep {
  id: string;
  label: string;
  icon: string;
  content?: string;
  completed: boolean;
  active: boolean;
}

export function LunaBuilderModal({ open, onOpenChange, onComplete, instances }: LunaBuilderModalProps) {
  const [lunaPrompt, setLunaPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [generatedConfig, setGeneratedConfig] = useState<ChatbotConfig | null>(null);
  const [currentTyping, setCurrentTyping] = useState('');
  const [previewMessages, setPreviewMessages] = useState<Array<{ type: 'user' | 'bot'; text: string }>>([]);

  const startBuild = async () => {
    if (!lunaPrompt.trim()) {
      toast.error('Digite uma descrição para a Luna');
      return;
    }

    setIsBuilding(true);
    setBuildSteps([]);
    setCurrentTyping('');
    setPreviewMessages([]);

    const steps: Omit<BuildStep, 'completed' | 'active'>[] = [
      { id: 'analyze', label: 'Analisando descrição...', icon: '🔍' },
      { id: 'triggers', label: 'Configurando gatilhos...', icon: '🎯' },
      { id: 'personality', label: 'Definindo personalidade...', icon: '🤖' },
      { id: 'responses', label: 'Gerando respostas IA...', icon: '💬' },
      { id: 'training', label: 'Treinando modelo...', icon: '🧠' },
      { id: 'preview', label: 'Preparando preview...', icon: '📱' },
    ];

    // Simulate each build step with typewriter effect
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Update build steps
      setBuildSteps(prev => [
        ...prev.map(s => ({ ...s, active: false })),
        { ...step, completed: false, active: true }
      ]);

      // Simulate typing content for each step
      const stepContents: Record<string, string> = {
        'analyze': `Entendi! Você precisa de um chatbot para: ${lunaPrompt.slice(0, 50)}...`,
        'triggers': 'Palavras-chave detectadas: olá, oi, bom dia, preço, cardápio, horário',
        'personality': 'Personalidade configurada: Amigável, profissional e prestativo',
        'responses': 'Prompts de IA configurados para respostas inteligentes e contextuais',
        'training': 'Modelo Luna IA (ChatGPT) otimizado para seu caso de uso',
        'preview': 'Preview pronto! Veja como seu chatbot vai responder...'
      };

      const content = stepContents[step.id] || '';
      setCurrentTyping('');
      
      // Typewriter effect
      for (let j = 0; j <= content.length; j++) {
        await new Promise(r => setTimeout(r, 20));
        setCurrentTyping(content.slice(0, j));
      }

      // Mark step as completed
      setBuildSteps(prev => 
        prev.map(s => s.id === step.id ? { ...s, completed: true, active: false } : s)
      );

      await new Promise(r => setTimeout(r, 400));
    }

    // Generate config
    const keywords = lunaPrompt.toLowerCase().split(' ')
      .filter(w => w.length > 3)
      .slice(0, 5)
      .join(', ');

    const config: ChatbotConfig = {
      name: `Bot Luna - ${lunaPrompt.slice(0, 25)}...`,
      trigger_type: 'keyword',
      keywords: keywords || 'oi, olá, bom dia',
      response_type: 'ai',
      response: '',
      delay: 2,
      instance_id: instances[0]?.id || '',
      ai_enabled: true,
      ai_model: 'Luna IA',
      ai_temperature: 0.7,
      ai_system_prompt: `Você é um assistente virtual inteligente e amigável. ${lunaPrompt}. 
      
Diretrizes:
- Seja sempre educado e profissional
- Responda de forma clara e objetiva
- Ajude os clientes da melhor forma possível
- Use emojis com moderação para humanizar a conversa`
    };

    setGeneratedConfig(config);

    // Simulate preview conversation
    setShowPreview(true);
    await new Promise(r => setTimeout(r, 500));

    const demoConversation = [
      { type: 'user' as const, text: 'Olá, bom dia!' },
      { type: 'bot' as const, text: 'Olá! Bom dia! 👋 Seja bem-vindo! Como posso ajudar você hoje?' },
      { type: 'user' as const, text: 'Quais são os horários de atendimento?' },
      { type: 'bot' as const, text: 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h, e aos sábados das 9h às 13h. Posso ajudar em mais alguma coisa?' },
    ];

    for (const msg of demoConversation) {
      setPreviewMessages(prev => [...prev, msg]);
      await new Promise(r => setTimeout(r, 800));
    }

    setIsBuilding(false);
  };

  const handleApply = () => {
    if (generatedConfig) {
      onComplete(generatedConfig);
      onOpenChange(false);
      resetState();
      toast.success('Chatbot configurado! Revise e salve.');
    }
  };

  const resetState = () => {
    setLunaPrompt('');
    setIsBuilding(false);
    setShowPreview(false);
    setBuildSteps([]);
    setGeneratedConfig(null);
    setCurrentTyping('');
    setPreviewMessages([]);
  };

  const handleClose = () => {
    if (!isBuilding) {
      onOpenChange(false);
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-b from-background to-background/95">
        <DialogHeader className="border-b border-border pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center ring-2 ring-primary/30 overflow-hidden shadow-xl shadow-primary/20">
              <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="flex items-center gap-2">
                Luna IA Builder
                <Badge className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground border-0 text-[10px]">
                  GENESIS PRO
                </Badge>
              </span>
              <p className="text-sm font-normal text-muted-foreground">
                Construção inteligente de chatbots em tempo real
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {!isBuilding && !showPreview ? (
            /* Input Stage */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Descreva detalhadamente o que você precisa. A Luna vai construir seu chatbot em tempo real, mostrando cada etapa da configuração.
              </p>
              <Textarea
                value={lunaPrompt}
                onChange={(e) => setLunaPrompt(e.target.value)}
                placeholder="Ex: Quero um chatbot para atender clientes de uma pizzaria. Ele deve responder sobre cardápio, preços, horários de funcionamento, promoções e formas de pagamento. Precisa ser amigável e profissional..."
                rows={8}
                className="resize-none"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="w-4 h-4" />
                Tempo estimado: 30-60 segundos para um resultado perfeito
              </div>
            </motion.div>
          ) : (
            /* Building / Preview Stage */
            <div className="flex gap-4 h-full">
              {/* Build Progress */}
              <div className="flex-1 space-y-4 overflow-auto">
                <div className="space-y-3">
                  {buildSteps.map((step, idx) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg border transition-all ${
                        step.active 
                          ? 'border-primary bg-primary/5' 
                          : step.completed 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{step.icon}</span>
                        <span className={`text-sm font-medium ${
                          step.completed ? 'text-green-600' : step.active ? 'text-primary' : ''
                        }`}>
                          {step.label}
                        </span>
                        {step.completed && <Check className="w-4 h-4 text-green-500 ml-auto" />}
                        {step.active && (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="ml-auto w-2 h-2 rounded-full bg-primary"
                          />
                        )}
                      </div>
                      {step.active && currentTyping && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 text-xs text-muted-foreground pl-8"
                        >
                          {currentTyping}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            |
                          </motion.span>
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Generated Config Summary */}
                {generatedConfig && !isBuilding && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Configuração Gerada</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-card rounded-lg">
                        <p className="text-muted-foreground">Gatilho</p>
                        <p className="font-medium">Palavras-chave</p>
                      </div>
                      <div className="p-2 bg-card rounded-lg">
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">Resposta IA</p>
                      </div>
                      <div className="p-2 bg-card rounded-lg">
                        <p className="text-muted-foreground">Modelo</p>
                        <p className="font-medium">Luna IA (ChatGPT)</p>
                      </div>
                      <div className="p-2 bg-card rounded-lg">
                        <p className="text-muted-foreground">Delay</p>
                        <p className="font-medium">2 segundos</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* iPhone Preview */}
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-72 flex-shrink-0"
                >
                  <div className="relative mx-auto w-[260px]">
                    {/* iPhone Frame */}
                    <div className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-20" />
                      
                      {/* Screen */}
                      <div className="bg-card rounded-[32px] overflow-hidden">
                        {/* Status Bar */}
                        <div className="h-10 bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">WhatsApp Preview</span>
                        </div>
                        
                        {/* Chat Header */}
                        <div className="h-14 bg-card border-b flex items-center gap-3 px-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden">
                            <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Luna Bot</p>
                            <p className="text-[10px] text-green-500">online</p>
                          </div>
                        </div>
                        
                        {/* Messages */}
                        <div className="h-72 bg-[#0a1014] p-3 space-y-2 overflow-y-auto">
                          <AnimatePresence>
                            {previewMessages.map((msg, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[85%] p-2.5 rounded-lg text-xs ${
                                  msg.type === 'user' 
                                    ? 'bg-primary/20 text-foreground rounded-br-none' 
                                    : 'bg-card text-foreground rounded-bl-none border'
                                }`}>
                                  {msg.text}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          {isBuilding && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-start"
                            >
                              <div className="bg-card border rounded-lg p-2.5 rounded-bl-none">
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="flex gap-1"
                                >
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Input Bar */}
                        <div className="h-12 bg-card border-t flex items-center gap-2 px-3">
                          <div className="flex-1 h-8 bg-muted rounded-full px-3 flex items-center">
                            <span className="text-[10px] text-muted-foreground">Mensagem...</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          {!isBuilding && !showPreview ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={startBuild} className="gap-2 bg-gradient-to-r from-primary to-primary/80" disabled={!lunaPrompt.trim()}>
                <Sparkles className="w-4 h-4" />
                Iniciar Construção
              </Button>
            </>
          ) : isBuilding ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Luna está trabalhando...
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={resetState}>
                Refazer
              </Button>
              <Button onClick={handleApply} className="gap-2">
                <Check className="w-4 h-4" />
                Aplicar e Configurar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
