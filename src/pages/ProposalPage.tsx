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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Cinematic Components
import { LunaAvatar } from '@/components/proposal/LunaAvatar';
import { CinematicBackground } from '@/components/proposal/CinematicBackground';
import { SeductiveText, DramaticReveal, ImpactNumber, GlitchText } from '@/components/proposal/CinematicText';
import { CinematicEnter, FloatingElement, PulseGlow } from '@/components/proposal/PhaseTransition';

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

type Phase = 'entry' | 'desire' | 'vision' | 'power' | 'destiny' | 'action';

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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
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
  const [lunaState, setLunaState] = useState<'idle' | 'talking' | 'thinking' | 'excited' | 'seductive'>('idle');
  const [showContinue, setShowContinue] = useState(false);

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
    const phases: Phase[] = ['entry', 'desire', 'vision', 'power', 'destiny', 'action'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
      setShowContinue(false);
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
        {/* PHASE 1: ENTRY - The Seduction Begins */}
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
                  Uma experiência exclusiva para
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
                    "Vou te mostrar algo que vai mudar sua perspectiva.",
                    "Isso não é uma proposta. É uma visão do que você pode se tornar."
                  ]}
                  className="text-xl md:text-2xl font-light text-white/80"
                  lineDelay={2500}
                  onComplete={() => {
                    setLunaState('seductive');
                    setShowContinue(true);
                  }}
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
                      Estou pronto
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </PulseGlow>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 2: DESIRE - Create the Want */}
        {currentPhase === 'desire' && (
          <motion.section
            key="desire"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10"
          >
            <div className="max-w-4xl w-full">
              <CinematicEnter>
                <div className="flex items-start gap-6 mb-16">
                  <LunaAvatar state="talking" size="md" />
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                    <DramaticReveal
                      lines={[
                        "Deixa eu te fazer uma pergunta sincera...",
                        "Quantas horas você perde por semana apagando incêndios?",
                        "Quantas oportunidades escapam enquanto você está ocupado demais?",
                        "E se eu te dissesse que isso pode mudar?"
                      ]}
                      className="text-xl text-white/90 font-light"
                      lineDelay={2500}
                      onComplete={() => setShowContinue(true)}
                    />
                  </div>
                </div>
              </CinematicEnter>

              {gen?.painPoints && gen.painPoints.length > 0 && (
                <CinematicEnter delay={2}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gen.painPoints.slice(0, 4).map((point, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 8 + index * 0.3 }}
                        className="bg-gradient-to-br from-red-950/30 to-transparent p-6 rounded-2xl border border-red-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                          <p className="text-white/70">{point}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CinematicEnter>
              )}
            </div>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16"
                >
                  <Button
                    size="lg"
                    onClick={advancePhase}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-lg px-10 py-6 rounded-2xl gap-3"
                  >
                    E se pudesse ser diferente?
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 3: VISION - Show the Future */}
        {currentPhase === 'vision' && (
          <motion.section
            key="vision"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10"
          >
            <div className="max-w-4xl w-full">
              <CinematicEnter>
                <div className="text-center mb-16">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 mb-8"
                    animate={{ boxShadow: ['0 0 20px rgba(16,185,129,0.3)', '0 0 40px rgba(16,185,129,0.5)', '0 0 20px rgba(16,185,129,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Visão do Futuro</span>
                  </motion.div>

                  <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Imagine acordar assim
                  </h2>
                </div>
              </CinematicEnter>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: Clock, title: 'Tempo Livre', desc: 'Processos rodando sozinhos enquanto você foca no que importa' },
                  { icon: TrendingUp, title: 'Crescimento', desc: 'Cada cliente gerando mais valor, sem esforço extra' },
                  { icon: Shield, title: 'Controle', desc: 'Visão completa do negócio na palma da sua mão' },
                  { icon: Zap, title: 'Velocidade', desc: 'Decisões em segundos com dados em tempo real' }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                    className="group relative bg-gradient-to-br from-white/5 to-white/0 p-8 rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-all duration-500"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <item.icon className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-white/60">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <CinematicEnter delay={1.5}>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="text-center text-xl text-white/60 mt-12 font-light"
                  onAnimationComplete={() => setShowContinue(true)}
                >
                  Isso não é fantasia. É o que acontece quando você tem a estrutura certa.
                </motion.p>
              </CinematicEnter>
            </div>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12"
                >
                  <Button
                    size="lg"
                    onClick={advancePhase}
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3"
                  >
                    Me mostre os números
                    <TrendingUp className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 4: POWER - Show the Numbers */}
        {currentPhase === 'power' && gen?.roiAnalysis && (
          <motion.section
            key="power"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10"
          >
            <div className="max-w-5xl w-full">
              <CinematicEnter>
                <div className="text-center mb-16">
                  <LunaAvatar state="excited" size="lg" className="mx-auto mb-8" />
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    O impacto para a <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{companyName}</span>
                  </h2>
                  <p className="text-xl text-white/50">Calculado especificamente para o seu cenário</p>
                </div>
              </CinematicEnter>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-8 rounded-3xl border border-emerald-500/20 text-center"
                >
                  <ImpactNumber
                    value={gen.roiAnalysis.estimatedSavings}
                    prefix="R$ "
                    className="text-4xl md:text-5xl font-bold text-emerald-400"
                    delay={800}
                  />
                  <p className="text-white/60 mt-3">Economia mensal</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 p-8 rounded-3xl border border-cyan-500/20 text-center"
                >
                  <ImpactNumber
                    value={gen.roiAnalysis.timeRecovery}
                    suffix="h"
                    className="text-4xl md:text-5xl font-bold text-cyan-400"
                    delay={1000}
                  />
                  <p className="text-white/60 mt-3">Horas recuperadas/mês</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-8 rounded-3xl border border-violet-500/20 text-center"
                >
                  <ImpactNumber
                    value={gen.roiAnalysis.revenueIncrease}
                    suffix="%"
                    className="text-4xl md:text-5xl font-bold text-violet-400"
                    delay={1200}
                  />
                  <p className="text-white/60 mt-3">Aumento potencial</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 p-8 rounded-3xl border border-fuchsia-500/20 text-center"
                >
                  <ImpactNumber
                    value={gen.roiAnalysis.paybackPeriod}
                    className="text-4xl md:text-5xl font-bold text-fuchsia-400"
                    delay={1400}
                  />
                  <p className="text-white/60 mt-3">Meses para retorno</p>
                </motion.div>
              </div>

              <CinematicEnter delay={2}>
                <motion.div
                  className="text-center bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
                  onAnimationComplete={() => setShowContinue(true)}
                >
                  <p className="text-2xl font-light text-white/80">
                    Não é sobre custo. É sobre <span className="text-emerald-400 font-semibold">o que você está deixando de ganhar</span> a cada dia que passa.
                  </p>
                </motion.div>
              </CinematicEnter>
            </div>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12"
                >
                  <Button
                    size="lg"
                    onClick={advancePhase}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-lg px-10 py-6 rounded-2xl gap-3"
                  >
                    Quero essa transformação
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 5: DESTINY - The Revelation */}
        {currentPhase === 'destiny' && (
          <motion.section
            key="destiny"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10"
          >
            <div className="max-w-3xl w-full text-center">
              <CinematicEnter>
                <FloatingElement amplitude={10}>
                  <LunaAvatar state="seductive" size="xl" className="mx-auto mb-12" />
                </FloatingElement>
              </CinematicEnter>

              <DramaticReveal
                lines={[
                  "Tudo que você viu até aqui...",
                  "Cada número, cada insight, cada possibilidade...",
                  "Foi criado especificamente para você.",
                  "Porque eu entendo o seu negócio."
                ]}
                className="text-2xl md:text-3xl font-light text-white/90 leading-relaxed"
                lineDelay={2500}
                onComplete={() => setShowContinue(true)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 10 }}
                className="mt-16 grid grid-cols-3 gap-8"
              >
                {[
                  { label: 'Inteligência', value: 'Adaptativa' },
                  { label: 'Escala', value: 'Ilimitada' },
                  { label: 'Suporte', value: 'Humano' }
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {item.value}
                    </div>
                    <div className="text-sm text-white/50 mt-1">{item.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16"
                >
                  <Button
                    size="lg"
                    onClick={advancePhase}
                    className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:opacity-90 text-lg px-12 py-7 rounded-2xl gap-3 shadow-2xl shadow-violet-500/30"
                  >
                    Quero começar agora
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* PHASE 6: ACTION - The Close */}
        {currentPhase === 'action' && (
          <motion.section
            key="action"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10"
          >
            <div className="max-w-2xl w-full text-center">
              <CinematicEnter>
                <LunaAvatar state="excited" size="xl" className="mx-auto mb-8" />
              </CinematicEnter>

              <CinematicEnter delay={0.5}>
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  A decisão é{' '}
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                    sua
                  </span>
                </h2>
              </CinematicEnter>

              <CinematicEnter delay={1}>
                <p className="text-xl text-white/60 mb-12 font-light leading-relaxed">
                  Você pode continuar como está.<br />
                  Ou pode ativar uma estrutura que trabalha para você.<br />
                  <span className="text-white/90">Eu já te mostrei o caminho.</span>
                </p>
              </CinematicEnter>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="space-y-4"
              >
                <motion.a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-50"
                    animate={{ opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative flex items-center justify-center gap-4 px-10 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-emerald-500/30">
                    <MessageCircle className="w-6 h-6" />
                    Ativar minha estrutura agora
                  </div>
                </motion.a>

                {proposal.affiliate?.email && (
                  <motion.a
                    href={`mailto:${proposal.affiliate.email}?subject=Quero ativar o Genesis - ${companyName}`}
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mail className="w-5 h-5" />
                    Prefiro enviar um e-mail
                  </motion.a>
                )}
              </motion.div>

              {proposal.affiliate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  className="mt-16 text-white/40 text-sm"
                >
                  <p>Proposta apresentada por <span className="text-white/60">{proposal.affiliate.name}</span></p>
                  <p className="flex items-center justify-center gap-2 mt-1">
                    <Phone className="w-3 h-3" />
                    {proposal.affiliate.whatsapp}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Luna Chat Widget */}
      {currentPhase !== 'entry' && gen && (
        <LunaChat
          proposalContext={{
            companyName: proposal.company_name,
            contactName: proposal.contact_name || undefined,
            ...gen
          }}
          whatsappLink={getWhatsAppLink()}
        />
      )}

      {/* Phase Navigation */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
        {(['entry', 'desire', 'vision', 'power', 'destiny', 'action'] as Phase[]).map((phase) => (
          <motion.button
            key={phase}
            onClick={() => setCurrentPhase(phase)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentPhase === phase 
                ? 'bg-violet-400 scale-150 shadow-lg shadow-violet-400/50' 
                : 'bg-white/20 hover:bg-white/40'
            }`}
            whileHover={{ scale: 1.5 }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalPage;
