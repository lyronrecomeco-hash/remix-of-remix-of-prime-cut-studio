import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Target,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  Sparkles,
  Zap,
  BarChart3,
  Send,
  Bot,
  X,
  ChevronDown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  affiliate: {
    name: string;
    whatsapp: string;
    email: string;
  } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '', duration = 2000 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [hasStarted, value, duration]);

  return (
    <div ref={ref} className="font-bold">
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </div>
  );
};

// AI Chat Component
const ProposalChat = ({ proposalContext, whatsappLink }: { 
  proposalContext: GeneratedProposal & { companyName: string; contactName?: string };
  whatsappLink: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `Olá! 👋 Sou a Luna, assistente virtual do Genesis Hub. Vi que você está analisando a proposta para ${proposalContext.companyName}. Posso te ajudar com qualquer dúvida sobre o sistema, preços ou benefícios. O que gostaria de saber?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
            messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
              role: m.role,
              content: m.content
            })),
            proposalContext
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

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
                  newMessages[newMessages.length - 1] = { 
                    role: 'assistant', 
                    content: assistantMessage 
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, tive um problema. Que tal falar diretamente pelo WhatsApp? Clique no botão abaixo! 💬' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Bot className="w-8 h-8 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-slate-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Luna - IA Genesis</h3>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  Online agora
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-md' 
                      : 'bg-white/10 text-white/90 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {['Qual o preço?', 'Tem garantia?', 'Como funciona?'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 py-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Prefere falar com um humano? Clique aqui
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ProposalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // First try to find by ID (UUID format)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      let matchedProposal: ProposalData | null = null;
      
      if (isUUID) {
        // Direct lookup by ID
        const { data, error: fetchError } = await supabase
          .from('affiliate_proposals')
          .select(`
            *,
            affiliate:affiliates(name, whatsapp, email)
          `)
          .eq('id', slug)
          .single();

        if (!fetchError && data) {
          matchedProposal = data as unknown as ProposalData;
        }
      }
      
      // If not found by ID, try by company name slug
      if (!matchedProposal) {
        const { data, error: fetchError } = await supabase
          .from('affiliate_proposals')
          .select(`
            *,
            affiliate:affiliates(name, whatsapp, email)
          `)
          .eq('questionnaire_completed', true);

        if (fetchError) throw fetchError;

        const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
        matchedProposal = data?.find(p => 
          p.company_name.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedSlug ||
          p.company_name.toLowerCase().replace(/\s+/g, '-').trim() === slug.toLowerCase() ||
          p.id === slug
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPricingText = () => {
    if (!proposal?.generated_proposal?.pricing) return '';
    if (typeof proposal.generated_proposal.pricing === 'string') {
      return proposal.generated_proposal.pricing;
    }
    const pricingObj = proposal.generated_proposal.pricing as { plan: string; justification: string };
    return pricingObj.plan || '';
  };

  const getWhatsAppLink = () => {
    if (!proposal?.affiliate?.whatsapp) return '#';
    const phone = proposal.affiliate.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi a proposta do Genesis Hub para ${proposal.company_name} e gostaria de saber mais.`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/70">Carregando proposta...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div {...fadeInUp}>
          <Card className="max-w-md w-full bg-white/5 border-white/10">
            <CardContent className="pt-8 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-white">Proposta não encontrada</h1>
              <p className="text-white/60">A proposta que você está procurando não existe ou foi removida.</p>
              <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const gen = proposal.generated_proposal;
  const proposalContext = {
    companyName: proposal.company_name,
    contactName: proposal.contact_name || undefined,
    painPoints: gen?.painPoints,
    benefits: gen?.benefits,
    roiAnalysis: gen?.roiAnalysis,
    pricing: getPricingText(),
    ...gen
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* AI Chat Widget */}
      <ProposalChat proposalContext={proposalContext} whatsappLink={getWhatsAppLink()} />

      {/* Hero Section */}
      <header className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full" />
        
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary tracking-wider">GENESIS HUB</h2>
              <p className="text-xs text-white/50">Sistema de Gestão Inteligente</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30 px-4 py-1.5">
              <Star className="w-3 h-3 mr-1" />
              Proposta Comercial Personalizada
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {proposal.company_name}
            </h1>

            {proposal.contact_name && (
              <p className="text-xl md:text-2xl text-white/70 mb-10">
                Preparado especialmente para{' '}
                <span className="text-primary font-semibold">{proposal.contact_name}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30" 
                  onClick={() => window.open(getWhatsAppLink(), '_blank')}
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </Button>
              </motion.div>
              {proposal.affiliate?.email && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="gap-2 text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10"
                  >
                    <Mail className="w-5 h-5" />
                    Enviar Email
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-2 text-white/40"
            >
              <span className="text-xs">Deslize para ver mais</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Pain Points Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 md:py-32 relative"
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-12">
            <div className="p-4 bg-red-500/10 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Desafios Identificados</h2>
              <p className="text-white/60 mt-1">Os principais pontos que impactam seu negócio</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {gen?.painPoints?.map((pain, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <Card className="bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-red-400 font-bold">{index + 1}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">{pain}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 md:py-32 bg-white/[0.02]"
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-12">
            <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Como o Genesis Resolve</h2>
              <p className="text-white/60 mt-1">Benefícios exclusivos para sua empresa</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gen?.benefits?.map((benefit, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="h-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="text-white/80 leading-relaxed">{benefit}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ROI Section with Animated Counters */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-12">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Análise de Retorno (ROI)</h2>
              <p className="text-white/60 mt-1">Projeção de resultados com o Genesis</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }}>
              <Card className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 overflow-hidden group">
                <CardContent className="p-6 md:p-8 text-center relative">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DollarSign className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                  <p className="text-sm text-white/60 mb-2">Economia Mensal</p>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                    <AnimatedCounter 
                      value={gen?.roiAnalysis?.estimatedSavings || 0} 
                      prefix="R$ "
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }}>
              <Card className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20 overflow-hidden group">
                <CardContent className="p-6 md:p-8 text-center relative">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Clock className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                  <p className="text-sm text-white/60 mb-2">Horas/Semana</p>
                  <div className="text-3xl md:text-4xl font-bold text-blue-400">
                    <AnimatedCounter 
                      value={gen?.roiAnalysis?.timeRecovery || 0} 
                      prefix="+"
                      suffix="h"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }}>
              <Card className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border-purple-500/20 overflow-hidden group">
                <CardContent className="p-6 md:p-8 text-center relative">
                  <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <BarChart3 className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                  <p className="text-sm text-white/60 mb-2">Aumento Receita</p>
                  <div className="text-3xl md:text-4xl font-bold text-purple-400">
                    <AnimatedCounter 
                      value={gen?.roiAnalysis?.revenueIncrease || 0} 
                      prefix="+"
                      suffix="%"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }}>
              <Card className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20 overflow-hidden group">
                <CardContent className="p-6 md:p-8 text-center relative">
                  <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Target className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                  <p className="text-sm text-white/60 mb-2">Payback</p>
                  <div className="text-3xl md:text-4xl font-bold text-amber-400">
                    <AnimatedCounter 
                      value={gen?.roiAnalysis?.paybackPeriod || 0} 
                      suffix=" meses"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Pitch Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-20 md:py-32 bg-white/[0.02]"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-12">
              <div className="p-4 bg-purple-500/10 rounded-2xl">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Nossa Proposta</h2>
                <p className="text-white/60 mt-1">Solução personalizada para seu negócio</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="bg-gradient-to-br from-purple-500/10 via-primary/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-8 md:p-12">
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed whitespace-pre-line">
                    {gen?.personalizedPitch}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-primary/30 px-4 py-1.5">
                Investimento
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Plano Recomendado
              </h2>
            </motion.div>
            
            <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }}>
              <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/10 border-primary/30 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <p className="text-xl text-white/90 whitespace-pre-line mb-6">
                    {getPricingText()}
                  </p>
                  {proposal.proposal_value && proposal.proposal_value > 0 && (
                    <div className="text-5xl md:text-6xl font-bold text-primary">
                      {formatCurrency(proposal.proposal_value)}
                      <span className="text-xl text-white/60 font-normal">/mês</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Next Steps Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 md:py-32 bg-white/[0.02]"
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-12">
            <div className="p-4 bg-amber-500/10 rounded-2xl">
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Próximos Passos</h2>
              <p className="text-white/60 mt-1">Como dar início a essa transformação</p>
            </div>
          </motion.div>

          <div className="space-y-4 max-w-3xl">
            {gen?.nextSteps?.map((step, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                whileHover={{ x: 10 }}
              >
                <Card className="bg-white/5 border-white/10 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-5 md:p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">{index + 1}</span>
                    </div>
                    <p className="text-white/80 flex-1 text-lg">{step}</p>
                    <ArrowRight className="w-6 h-6 text-primary/50" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-24 md:py-40 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Pronto para transformar<br />seu negócio?
            </h2>
            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
              Entre em contato agora e descubra como o Genesis Hub pode revolucionar a gestão da sua empresa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="gap-2 text-xl px-10 py-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/30" 
                  onClick={() => window.open(getWhatsAppLink(), '_blank')}
                >
                  <MessageCircle className="w-6 h-6" />
                  Falar no WhatsApp
                </Button>
              </motion.div>
              {proposal.affiliate?.whatsapp && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="gap-2 text-xl px-10 py-7 border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open(`tel:${proposal.affiliate?.whatsapp}`, '_self')}
                  >
                    <Phone className="w-6 h-6" />
                    Ligar Agora
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Genesis Hub</span>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Genesis Hub - Sistema de Gestão Inteligente
          </p>
          {proposal.affiliate && (
            <p className="text-white/30 text-xs mt-2">
              Proposta apresentada por {proposal.affiliate.name}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ProposalPage;
