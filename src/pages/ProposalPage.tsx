import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  MessageCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Bot,
  X,
  Send,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Cinematic Components
import { LunaAvatar } from '@/components/proposal/LunaAvatar';
import { CinematicBackground } from '@/components/proposal/CinematicBackground';
import { SeductiveText, DramaticReveal, ImpactNumber, GlitchText } from '@/components/proposal/CinematicText';
import { CinematicEnter, FloatingElement, PulseGlow } from '@/components/proposal/PhaseTransition';
import { WhatsAppSimulation, WhatsAppMultipleChats } from '@/components/proposal/WhatsAppSimulation';
import { PanelSimulation } from '@/components/proposal/PanelSimulation';
import { ChaosMetrics } from '@/components/proposal/ChaosMetrics';

// Types
interface GeneratedProposal {
  painPoints: string[];
  benefits: string[];
  roiAnalysis: {
    estimatedSavings: number;
    timeRecovery: number;
    revenueIncrease: number;
    paybackPeriod: number;
  };
  pricing: string | { plan: string; justification: string };
  personalizedPitch: string;
  nextSteps: string[];
}

interface ProposalData {
  id: string;
  company_name: string;
  contact_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  generated_proposal: GeneratedProposal | null;
  proposal_value: number | null;
  created_at: string;
  niche_id: string | null;
  affiliate: {
    name: string;
    whatsapp: string;
    email: string;
  } | null;
  business_niche?: {
    name: string;
    slug: string;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Phase = 'entry' | 'chaos' | 'pain' | 'solution' | 'power' | 'action';

// Luna Chat Component
const LunaChat = ({ proposalContext, whatsappLink }: { 
  proposalContext: { companyName: string; contactName?: string } & GeneratedProposal;
  whatsappLink: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `Algo te chamou atenção? Estou aqui se quiser explorar mais...`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proposal-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
            proposalContext
          }),
        }
      );

      if (!response.ok || !response.body) throw new Error('Failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                  return newMessages;
                });
              }
            } catch { /* Skip */ }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Prefere conversar pelo WhatsApp? Às vezes é mais fácil...' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 group"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-lg opacity-60"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse border-2 border-slate-900" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-8 right-8 z-50 w-[380px] max-w-[calc(100vw-64px)] h-[500px] max-h-[calc(100vh-120px)] bg-slate-950/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-violet-500/20 border border-white/10 flex flex-col overflow-hidden"
          >
            <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 p-5">
              <div className="relative flex items-center gap-4">
                <LunaAvatar state="idle" size="sm" />
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg tracking-wide">Luna</h3>
                  <p className="text-xs text-white/70">Sua guia nessa jornada</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white' 
                      : 'bg-white/5 text-white/90 border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span 
                          key={i} 
                          className="w-2 h-2 bg-violet-400 rounded-full"
                          animate={{ y: [-3, 3, -3] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-5 border-t border-white/10 bg-slate-900/50">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva aqui..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:opacity-90 rounded-xl">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Prefiro WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Main Component
const ProposalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>('entry');
  const [showContinue, setShowContinue] = useState(false);
  const [chaosSimComplete, setChaosSimComplete] = useState(false);
  const [solutionSimComplete, setSolutionSimComplete] = useState(false);

  useEffect(() => {
    fetchProposal();
  }, [slug]);

  const fetchProposal = async () => {
    if (!slug) {
      setError('Proposta não encontrada');
      setLoading(false);
      return;
    }

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let matchedProposal: ProposalData | null = null;
      
      if (isUUID) {
        const { data } = await supabase
          .from('affiliate_proposals')
          .select(`*, affiliate:affiliates(name, whatsapp, email), business_niche:business_niches(name, slug)`)
          .eq('id', slug)
          .single();

        if (data) matchedProposal = data as unknown as ProposalData;
      }
      
      if (!matchedProposal) {
        const { data } = await supabase
          .from('affiliate_proposals')
          .select(`*, affiliate:affiliates(name, whatsapp, email), business_niche:business_niches(name, slug)`)
          .eq('questionnaire_completed', true);

        const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
        matchedProposal = data?.find(p => 
          p.company_name.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedSlug ||
          p.company_name.toLowerCase().replace(/\s+/g, '-').trim() === slug.toLowerCase()
        ) as unknown as ProposalData | undefined || null;
      }

      if (!matchedProposal) {
        setError('Proposta não encontrada');
        setLoading(false);
        return;
      }

      setProposal(matchedProposal);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!proposal?.affiliate?.whatsapp) return '#';
    const phone = proposal.affiliate.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Quero ativar o Genesis para ${proposal.company_name}!`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  const advancePhase = () => {
    const phases: Phase[] = ['entry', 'chaos', 'pain', 'solution', 'power', 'action'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
      setShowContinue(false);
      setChaosSimComplete(false);
      setSolutionSimComplete(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <CinematicBackground />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 relative z-10">
          <FloatingElement amplitude={15}>
            <LunaAvatar state="thinking" size="xl" />
          </FloatingElement>
          <motion.p 
            className="text-white/60 text-xl font-light tracking-widest"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Preparando algo especial...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <CinematicBackground />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <Card className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border-white/10">
            <CardContent className="pt-8 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Proposta não encontrada</h1>
              <p className="text-white/50">O link pode ter expirado ou estar incorreto.</p>
              <Button onClick={() => navigate('/')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const gen = proposal.generated_proposal;
  const firstName = proposal.contact_name?.split(' ')[0] || '';
  const companyName = proposal.company_name;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <CinematicBackground />
      
      <AnimatePresence mode="wait">
        {/* PHASE 1: ENTRY */}
        {currentPhase === 'entry' && (
          <motion.section
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10"
          >
            <CinematicEnter delay={0.5}>
              <FloatingElement amplitude={8} duration={6}>
                <LunaAvatar state="seductive" size="xl" />
              </FloatingElement>
            </CinematicEnter>

            <div className="text-center max-w-3xl mt-12">
              <CinematicEnter delay={1.5}>
                <motion.p 
                  className="text-white/40 text-sm tracking-[0.3em] uppercase mb-6"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Diagnóstico exclusivo para
                </motion.p>
              </CinematicEnter>

              <CinematicEnter delay={2}>
                <GlitchText 
                  text={companyName}
                  className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent mb-8"
                />
              </CinematicEnter>

              <CinematicEnter delay={3}>
                <DramaticReveal
                  lines={[
                    firstName ? `${firstName}, eu sou a Luna.` : "Eu sou a Luna.",
                    "Vou te mostrar exatamente o que está acontecendo no seu negócio.",
                    "E depois... o que você pode se tornar."
                  ]}
                  className="text-xl md:text-2xl font-light text-white/80"
                  lineDelay={2000}
                  onComplete={() => setShowContinue(true)}
                />
              </CinematicEnter>
            </div>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16"
                >
                  <PulseGlow color="violet" intensity="strong">
                    <Button
                      size="lg"
                      onClick={advancePhase}
                      className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3 shadow-2xl shadow-violet-500/30"
                    >
                      Me mostre a realidade
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </PulseGlow>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 2: CHAOS - O WhatsApp do Caos */}
        {currentPhase === 'chaos' && (
          <motion.section
            key="chaos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10"
          >
            {/* Header */}
            <CinematicEnter delay={0.3}>
              <div className="text-center mb-12">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-3 bg-red-500/20 border border-red-500/40 rounded-2xl px-6 py-3 mb-6"
                >
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <span className="text-red-300 font-bold">Isso está acontecendo agora</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Enquanto você lê isso...
                </h2>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                  Clientes estão esperando respostas. Alguns já desistiram.
                </p>
              </div>
            </CinematicEnter>

            {/* WhatsApp Simulation */}
            <CinematicEnter delay={0.8}>
              <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
                {/* Múltiplas conversas */}
                <div className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-white/50 text-sm mb-4"
                  >
                    Sua caixa de entrada agora
                  </motion.p>
                  <WhatsAppMultipleChats />
                </div>

                {/* Conversa individual */}
                <div className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-center text-white/50 text-sm mb-4"
                  >
                    O que acontece com cada cliente
                  </motion.p>
                  <WhatsAppSimulation 
                    mode="chaos" 
                    onComplete={() => setChaosSimComplete(true)} 
                  />
                </div>
              </div>
            </CinematicEnter>

            {/* Continue Button */}
            <AnimatePresence>
              {chaosSimComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12"
                >
                  <Button
                    size="lg"
                    onClick={advancePhase}
                    variant="outline"
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-lg px-10 py-6 rounded-2xl gap-3"
                  >
                    E isso custa caro...
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 3: PAIN - Métricas de Dor */}
        {currentPhase === 'pain' && (
          <motion.section
            key="pain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10"
          >
            <ChaosMetrics onComplete={() => setShowContinue(true)} />

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/60 text-xl mb-8"
                  >
                    Mas não precisa ser assim...
                  </motion.p>
                  
                  <PulseGlow color="emerald" intensity="strong">
                    <Button
                      size="lg"
                      onClick={advancePhase}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3 shadow-2xl shadow-emerald-500/30"
                    >
                      <Sparkles className="w-5 h-5" />
                      Me mostre a solução
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </PulseGlow>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 4: SOLUTION - WhatsApp Automatizado */}
        {currentPhase === 'solution' && (
          <motion.section
            key="solution"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10"
          >
            {/* Header */}
            <CinematicEnter delay={0.3}>
              <div className="text-center mb-12">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-3 mb-6"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">A transformação</span>
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Com o Genesis Hub ativo...
                </h2>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                  Cada cliente é atendido instantaneamente. 24 horas por dia.
                </p>
              </div>
            </CinematicEnter>

            {/* WhatsApp Automated */}
            <CinematicEnter delay={0.8}>
              <WhatsAppSimulation 
                mode="automated" 
                onComplete={() => setSolutionSimComplete(true)} 
              />
            </CinematicEnter>

            {/* Comparison Stats */}
            <AnimatePresence>
              {solutionSimComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
                >
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <motion.p 
                      className="text-3xl font-bold text-emerald-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                    >
                      2min
                    </motion.p>
                    <p className="text-white/50 text-sm mt-1">Tempo de resposta</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <motion.p 
                      className="text-3xl font-bold text-emerald-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring' }}
                    >
                      24/7
                    </motion.p>
                    <p className="text-white/50 text-sm mt-1">Disponibilidade</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <motion.p 
                      className="text-3xl font-bold text-emerald-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: 'spring' }}
                    >
                      100%
                    </motion.p>
                    <p className="text-white/50 text-sm mt-1">Clientes atendidos</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button */}
            <AnimatePresence>
              {solutionSimComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-12"
                >
                  <PulseGlow color="violet" intensity="strong">
                    <Button
                      size="lg"
                      onClick={advancePhase}
                      className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3 shadow-2xl shadow-violet-500/30"
                    >
                      <Zap className="w-5 h-5" />
                      Ver o painel completo
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </PulseGlow>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 5: POWER - Painel Genesis */}
        {currentPhase === 'power' && (
          <motion.section
            key="power"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10"
          >
            {/* Header */}
            <CinematicEnter delay={0.3}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  O comando do seu negócio
                </h2>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                  Enquanto você foca no que importa, o Genesis cuida do resto.
                </p>
              </div>
            </CinematicEnter>

            {/* Panel Simulation */}
            <CinematicEnter delay={0.8}>
              <PanelSimulation />
            </CinematicEnter>

            {/* ROI Summary */}
            {gen && (
              <CinematicEnter delay={2}>
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl border border-emerald-500/20">
                    <ImpactNumber 
                      value={gen.roiAnalysis.estimatedSavings} 
                      prefix="R$ " 
                      className="text-3xl font-bold text-emerald-400" 
                    />
                    <p className="text-white/50 text-sm mt-2">Economia mensal</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl border border-blue-500/20">
                    <ImpactNumber 
                      value={gen.roiAnalysis.timeRecovery} 
                      suffix="h" 
                      className="text-3xl font-bold text-blue-400" 
                    />
                    <p className="text-white/50 text-sm mt-2">Horas recuperadas</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl border border-purple-500/20">
                    <ImpactNumber 
                      value={gen.roiAnalysis.revenueIncrease} 
                      suffix="%" 
                      className="text-3xl font-bold text-purple-400" 
                    />
                    <p className="text-white/50 text-sm mt-2">Aumento de receita</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-2xl border border-amber-500/20">
                    <ImpactNumber 
                      value={gen.roiAnalysis.paybackPeriod} 
                      suffix=" dias" 
                      className="text-3xl font-bold text-amber-400" 
                    />
                    <p className="text-white/50 text-sm mt-2">Retorno do investimento</p>
                  </div>
                </div>
              </CinematicEnter>
            )}

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 }}
              className="mt-12"
            >
              <PulseGlow color="violet" intensity="strong">
                <Button
                  size="lg"
                  onClick={advancePhase}
                  className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3 shadow-2xl shadow-violet-500/30"
                >
                  Quero isso para mim
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </PulseGlow>
            </motion.div>
          </motion.section>
        )}

        {/* PHASE 6: ACTION - Fechamento */}
        {currentPhase === 'action' && (
          <motion.section
            key="action"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10"
          >
            <CinematicEnter delay={0.3}>
              <FloatingElement amplitude={5} duration={8}>
                <LunaAvatar state="excited" size="xl" />
              </FloatingElement>
            </CinematicEnter>

            <div className="text-center max-w-3xl mt-12">
              <CinematicEnter delay={0.8}>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                    {companyName}
                  </span>
                  <br />
                  <span className="text-white">está pronta para evoluir</span>
                </h2>
              </CinematicEnter>

              <CinematicEnter delay={1.3}>
                <p className="text-white/60 text-xl mb-12 leading-relaxed">
                  Você viu a diferença. Sentiu o potencial.<br />
                  Agora é só uma decisão.
                </p>
              </CinematicEnter>

              <CinematicEnter delay={1.8}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <PulseGlow color="emerald" intensity="strong">
                    <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3 shadow-2xl shadow-emerald-500/30 w-full sm:w-auto"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Ativar minha estrutura
                      </Button>
                    </a>
                  </PulseGlow>

                  {proposal.affiliate?.email && (
                    <a href={`mailto:${proposal.affiliate.email}?subject=Interesse%20Genesis%20-%20${companyName}`}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 text-lg px-10 py-6 rounded-2xl gap-3 w-full sm:w-auto"
                      >
                        <Mail className="w-5 h-5" />
                        Enviar e-mail
                      </Button>
                    </a>
                  )}
                </div>
              </CinematicEnter>

              {/* Consultor info */}
              {proposal.affiliate && (
                <CinematicEnter delay={2.3}>
                  <div className="mt-16 p-6 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto">
                    <p className="text-white/40 text-sm mb-2">Seu consultor</p>
                    <p className="text-white font-semibold text-lg">{proposal.affiliate.name}</p>
                    <p className="text-white/50 text-sm">{proposal.affiliate.email}</p>
                  </div>
                </CinematicEnter>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Luna Chat (always visible after entry) */}
      {currentPhase !== 'entry' && gen && (
        <LunaChat
          proposalContext={{
            companyName,
            contactName: firstName,
            ...gen
          }}
          whatsappLink={getWhatsAppLink()}
        />
      )}

      {/* Progress Indicator */}
      <div className="fixed bottom-8 left-8 z-40 flex gap-2">
        {(['entry', 'chaos', 'pain', 'solution', 'power', 'action'] as Phase[]).map((phase, i) => (
          <motion.div
            key={phase}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentPhase === phase 
                ? 'bg-violet-500' 
                : i < (['entry', 'chaos', 'pain', 'solution', 'power', 'action'] as Phase[]).indexOf(currentPhase)
                  ? 'bg-violet-500/50'
                  : 'bg-white/20'
            }`}
            animate={currentPhase === phase ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalPage;
