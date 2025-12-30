import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, MessageSquare, Users, BarChart3, Zap, Shield, 
  ArrowRight, Check, Sparkles, Clock, Bell, Star,
  ChevronRight, Smartphone, Globe, Lock, 
  CheckCircle, Crown, Rocket, Gift, Quote, ChevronDown,
  TrendingUp, Target, Award, Heart
} from 'lucide-react';
import LeadContactModal from '@/components/landing/LeadContactModal';

// Stats Counter Animation
const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [isInView, value]);
  
  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { 
  icon: any; 
  title: string; 
  description: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
        <CardContent className="p-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Testimonial Card
const TestimonialCard = ({ name, role, text, rating }: { 
  name: string; 
  role: string; 
  text: string;
  rating: number;
}) => (
  <Card className="bg-card/50 border-border/50 h-full">
    <CardContent className="p-6">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
      <Quote className="w-8 h-8 text-primary/20 mb-2" />
      <p className="text-sm text-muted-foreground mb-4">{text}</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{name[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// FAQ Item
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Live Simulation Section - Interactive Demo
const LiveSimulationSection = () => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Auto-advance simulation
  useEffect(() => {
    if (!isInView || !isPlaying) return;
    
    const timer = setInterval(() => {
      setStep(prev => (prev + 1) % 5);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [isInView, isPlaying]);

  const simulationSteps = [
    {
      title: 'Cliente acessa o site',
      phone: {
        screen: 'landing',
        content: (
          <div className="p-3 space-y-2">
            <div className="h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">Barber Studio</span>
            </div>
            <div className="h-12 bg-muted/50 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-muted/30 rounded" />
              <div className="h-8 bg-muted/30 rounded" />
            </div>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 }}
              className="h-10 bg-primary rounded-lg flex items-center justify-center mt-4"
            >
              <span className="text-[10px] font-bold text-primary-foreground">AGENDAR AGORA</span>
            </motion.div>
          </div>
        )
      },
      dashboard: null
    },
    {
      title: 'Escolhe serviço e horário',
      phone: {
        screen: 'booking',
        content: (
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-medium text-center mb-2">Escolha o Serviço</div>
            <motion.div 
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1, borderColor: 'hsl(var(--primary))' }}
              transition={{ delay: 0.5 }}
              className="p-2 border-2 border-primary rounded-lg bg-primary/10"
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-medium">Corte + Barba</span>
                <span className="text-[9px] text-primary font-bold">R$ 45</span>
              </div>
            </motion.div>
            <div className="p-2 border border-border/50 rounded-lg opacity-50">
              <div className="flex justify-between items-center">
                <span className="text-[9px]">Corte Simples</span>
                <span className="text-[9px]">R$ 35</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-medium text-center">Horário</div>
            <div className="grid grid-cols-3 gap-1">
              {['14:00', '14:30', '15:00'].map((time, i) => (
                <motion.div
                  key={time}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    backgroundColor: i === 1 ? 'hsl(var(--primary))' : 'transparent',
                    color: i === 1 ? 'hsl(var(--primary-foreground))' : 'inherit'
                  }}
                  transition={{ delay: 1 + i * 0.2 }}
                  className="p-1 border border-border/50 rounded text-center text-[9px]"
                >
                  {time}
                </motion.div>
              ))}
            </div>
          </div>
        )
      },
      dashboard: null
    },
    {
      title: 'Confirma agendamento',
      phone: {
        screen: 'confirm',
        content: (
          <div className="p-3 flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3"
            >
              <Check className="w-6 h-6 text-green-500" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="text-[11px] font-bold text-green-500 mb-1">Agendado!</div>
              <div className="text-[9px] text-muted-foreground">Corte + Barba</div>
              <div className="text-[9px] text-muted-foreground">Hoje, 14:30</div>
              <div className="text-[8px] text-muted-foreground mt-2">Protocolo: #28491</div>
            </motion.div>
          </div>
        )
      },
      dashboard: (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 bg-card border border-primary/50 rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-medium">Novo agendamento!</span>
          </div>
        </motion.div>
      )
    },
    {
      title: 'WhatsApp automático',
      phone: {
        screen: 'whatsapp',
        content: (
          <div className="p-2 bg-[#0b141a] h-full">
            <div className="flex items-center gap-2 p-2 border-b border-white/10">
              <div className="w-6 h-6 rounded-full bg-primary/30" />
              <span className="text-[10px] text-white">Barber Studio</span>
            </div>
            <div className="p-2 space-y-2 mt-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#202c33] rounded-lg p-2 max-w-[85%]"
              >
                <p className="text-[8px] text-white/90">
                  ✅ Agendamento Confirmado!{'\n\n'}
                  📅 Data: Hoje{'\n'}
                  ⏰ Horário: 14:30{'\n'}
                  ✂️ Serviço: Corte + Barba{'\n\n'}
                  Te esperamos! 💈
                </p>
                <span className="text-[6px] text-white/50 float-right">14:32 ✓✓</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-[#005c4b] rounded-lg p-2 max-w-[60%] ml-auto"
              >
                <p className="text-[8px] text-white/90">Beleza, estarei lá! 👍</p>
                <span className="text-[6px] text-white/50 float-right">14:33 ✓✓</span>
              </motion.div>
            </div>
          </div>
        )
      },
      dashboard: null
    },
    {
      title: 'Dashboard atualizado',
      phone: null,
      dashboard: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-4 bg-card border border-border rounded-xl p-4 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[11px] font-bold">Dashboard</span>
            </div>
            <Badge className="text-[8px] bg-green-500/20 text-green-500">Online</Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Hoje', value: '12', icon: Calendar },
              { label: 'Faturamento', value: 'R$ 540', icon: TrendingUp },
              { label: 'Clientes', value: '89', icon: Users }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-muted/50 rounded-lg p-2 text-center"
              >
                <stat.icon className="w-3 h-3 mx-auto mb-1 text-primary" />
                <div className="text-[10px] font-bold">{stat.value}</div>
                <div className="text-[7px] text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-[9px] font-medium mb-2">Próximos Agendamentos</div>
          <div className="space-y-1">
            {[
              { time: '14:30', name: 'João Silva', service: 'Corte + Barba', isNew: true },
              { time: '15:00', name: 'Pedro Santos', service: 'Corte', isNew: false },
              { time: '15:30', name: 'Carlos Lima', service: 'Barba', isNew: false }
            ].map((apt, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className={`flex items-center justify-between p-1.5 rounded-lg ${apt.isNew ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-primary">{apt.time}</span>
                  <span className="text-[8px]">{apt.name}</span>
                </div>
                <span className="text-[7px] text-muted-foreground">{apt.service}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    }
  ];

  const currentStep = simulationSteps[step];

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gradient-to-b from-background to-card/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Simulação Interativa
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Veja o sistema{' '}
            <span className="text-gradient">funcionando ao vivo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acompanhe o fluxo completo: do agendamento do cliente até a gestão no seu dashboard.
          </p>
        </div>

        <div className="relative">
          {/* Step Indicators */}
          <div className="flex justify-center gap-2 md:gap-4 mb-8 flex-wrap">
            {simulationSteps.map((s, i) => (
              <button
                key={i}
                onClick={() => { setStep(i); setIsPlaying(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  step === i 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Simulation Container */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
            {/* Phone Mockup */}
            <AnimatePresence mode="wait">
              {currentStep.phone && (
                <motion.div
                  key={`phone-${step}`}
                  initial={{ opacity: 0, x: -50, rotateY: -15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 50, rotateY: 15 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  {/* Phone Frame */}
                  <div className="relative w-48 md:w-56 h-96 md:h-[420px] bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] p-2 shadow-2xl">
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
                    
                    {/* Screen */}
                    <div className="w-full h-full bg-background rounded-[2rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="h-6 bg-card flex items-center justify-between px-4 text-[8px] text-muted-foreground">
                        <span>14:32</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-2 border border-current rounded-sm">
                            <div className="w-2 h-full bg-green-500 rounded-sm" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="h-[calc(100%-1.5rem)]">
                        {currentStep.phone.content}
                      </div>
                    </div>
                  </div>
                  
                  {/* Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arrow */}
            {currentStep.phone && (step === 2 || step === 4) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:flex items-center"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Dashboard Mockup */}
            <AnimatePresence mode="wait">
              {(step === 2 || step === 4) && (
                <motion.div
                  key={`dashboard-${step}`}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-72 md:w-96 h-64 md:h-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  {/* Browser Bar */}
                  <div className="h-7 bg-muted/50 flex items-center gap-1.5 px-3 border-b border-border">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <div className="flex-1 mx-3">
                      <div className="bg-muted rounded-md px-2 py-0.5 text-[8px] text-muted-foreground">
                        app.genesishub.cloud/admin
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="relative h-[calc(100%-1.75rem)]">
                    {currentStep.dashboard}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Step Title */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <Badge variant="outline" className="text-sm px-4 py-2">
              <span className="text-primary mr-2">Passo {step + 1}:</span>
              {currentStep.title}
            </Badge>
          </motion.div>

          {/* Play/Pause Button */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <div className="w-3 h-3 border-2 border-current" />
                  Pausar
                </>
              ) : (
                <>
                  <div className="w-0 h-0 border-l-[8px] border-l-current border-y-[5px] border-y-transparent" />
                  Reproduzir
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Pricing Card Component
const PricingCard = ({ 
  name, 
  price, 
  description, 
  features, 
  popular = false,
  buttonText,
  onButtonClick,
  isLink = false,
  buttonLink = '',
  icon: Icon 
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  onButtonClick?: () => void;
  isLink?: boolean;
  buttonLink?: string;
  icon: any;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className={`relative ${popular ? 'z-10' : ''}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Crown className="w-3 h-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      <Card className={`h-full ${popular ? 'border-primary shadow-glow bg-card' : 'bg-card/50 border-border/50'}`}>
        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${popular ? 'bg-primary/20' : 'bg-muted'} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${popular ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <CardTitle className="text-xl">{name}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-4">
            <span className="text-4xl font-bold">{price}</span>
            {price !== 'Sob Consulta' && <span className="text-muted-foreground">/mês</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {isLink ? (
            <Button 
              asChild 
              className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
            >
              <Link to={buttonLink}>{buttonText}</Link>
            </Button>
          ) : (
            <Button 
              onClick={onButtonClick}
              className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
            >
              {buttonText}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const GenesisLanding = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'vitalicio'>('premium');
  
  const openLeadModal = (plan: 'premium' | 'vitalicio') => {
    setSelectedPlan(plan);
    setLeadModalOpen(true);
  };
  
  const features = [
    {
      icon: Calendar,
      title: 'Agendamento Inteligente',
      description: 'Sistema de agendamentos online 24/7 com confirmação automática e gestão completa da agenda.'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integrado',
      description: 'Notificações automáticas via WhatsApp para confirmações, lembretes e campanhas de marketing.'
    },
    {
      icon: Users,
      title: 'Gestão de Equipe',
      description: 'Controle completo de barbeiros, horários, folgas e desempenho individual.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Financeiro',
      description: 'Relatórios detalhados de faturamento, metas mensais e análise de performance.'
    },
    {
      icon: Bell,
      title: 'Notificações Push',
      description: 'Alertas em tempo real para novos agendamentos, cancelamentos e lembretes.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia, backups automáticos e controle de acesso.'
    },
    {
      icon: Globe,
      title: 'Site Personalizado',
      description: 'Landing page profissional com sua marca, serviços e galeria de trabalhos.'
    },
    {
      icon: Sparkles,
      title: 'Marketing com IA',
      description: 'Campanhas inteligentes com geração de textos por IA para reconquistar clientes.'
    }
  ];

  const stats = [
    { value: 5000, suffix: '+', label: 'Agendamentos' },
    { value: 98, suffix: '%', label: 'Satisfação' },
    { value: 24, suffix: '/7', label: 'Disponível' },
    { value: 50, suffix: '+', label: 'Recursos' }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Barbearia Vintage',
      text: 'O Genesis Hub transformou completamente a gestão da minha barbearia. Antes eu perdia clientes por falta de organização, hoje tenho tudo automatizado.',
      rating: 5
    },
    {
      name: 'Rafael Santos',
      role: 'Barber Premium',
      text: 'A automação via WhatsApp reduziu minhas faltas em 70%. Os clientes recebem lembretes e confirmam automaticamente. Incrível!',
      rating: 5
    },
    {
      name: 'Anderson Lima',
      role: 'Studio Barber',
      text: 'O marketing com IA me ajudou a reconquistar clientes inativos. Recuperei mais de 30 clientes só no primeiro mês de uso.',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Como funciona o período de teste?',
      answer: 'Você pode testar todas as funcionalidades do Genesis Hub por 7 dias gratuitamente, sem compromisso e sem precisar de cartão de crédito.'
    },
    {
      question: 'Preciso de conhecimento técnico para usar?',
      answer: 'Não! O sistema foi desenvolvido para ser intuitivo e fácil de usar. Qualquer pessoa consegue configurar em minutos.'
    },
    {
      question: 'Como funciona a integração com WhatsApp?',
      answer: 'Utilizamos o ChatPro para integração oficial com WhatsApp. Você conecta seu número comercial e o sistema envia mensagens automáticas.'
    },
    {
      question: 'Posso personalizar meu site comercial?',
      answer: 'Sim! Você pode personalizar cores, logo, serviços, galeria de fotos e muito mais diretamente pelo painel administrativo.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente! Utilizamos criptografia de ponta, backups automáticos e seguimos todas as normas da LGPD para proteção de dados.'
    },
    {
      question: 'Qual a diferença entre Premium e Vitalício?',
      answer: 'O Premium é uma assinatura mensal com todas as funcionalidades. O Vitalício é um pagamento único que dá acesso permanente, incluindo todas as atualizações futuras.'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Crie sua conta gratuita',
      description: 'Cadastre-se em menos de 2 minutos. Sem cartão, sem compromisso.',
      icon: Rocket,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '02',
      title: 'Configure sua barbearia',
      description: 'Adicione serviços, preços, barbeiros e personalize seu site.',
      icon: Smartphone,
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: '03',
      title: 'Conecte o WhatsApp',
      description: 'Integre seu número comercial para automações inteligentes.',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: '04',
      title: 'Comece a faturar',
      description: 'Compartilhe seu link e receba agendamentos automaticamente.',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Lead Contact Modal */}
      <LeadContactModal 
        isOpen={leadModalOpen} 
        onClose={() => setLeadModalOpen(false)} 
        planType={selectedPlan}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Genesis<span className="text-primary">Hub</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
              <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/admin/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/admin/login?register=true">
                  Começar Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                <Rocket className="w-3 h-3 mr-1" />
                Plataforma #1 para Barbearias
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Transforme sua barbearia em uma{' '}
                <span className="text-gradient">máquina de vendas</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Automatize agendamentos, fidelize clientes e aumente seu faturamento com o sistema mais completo do mercado. 
                WhatsApp, marketing com IA e muito mais.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg h-14 px-8">
                  <Link to="/admin/login?register=true">
                    <Gift className="w-5 h-5 mr-2" />
                    Testar 7 Dias Grátis
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => openLeadModal('premium')} className="text-lg h-14 px-8">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Falar com Consultor
                </Button>
              </div>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">SSL Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">LGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Uptime 99.9%</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Suporte Brasileiro</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm text-muted-foreground">+500 Clientes Felizes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Simulation Section */}
      <LiveSimulationSection />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Recursos Poderosos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{' '}
              <span className="text-gradient">crescer</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do agendamento ao marketing, o Genesis Hub oferece todas as ferramentas 
              para transformar sua barbearia em um negócio de sucesso.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Interactive */}
      <section id="how" className="py-20 md:py-32 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Target className="w-3 h-3 mr-1" />
              Simples e Rápido
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              4 passos para{' '}
              <span className="text-gradient">automatizar tudo</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em menos de 10 minutos você terá seu sistema funcionando e pronto para receber clientes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
                )}
                
                <div className="relative bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group-hover:shadow-glow">
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* CTA after steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <Link to="/admin/login?register=true">
                Começar Agora - É Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Star className="w-3 h-3 mr-1" />
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes{' '}
              <span className="text-gradient">dizem</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Centenas de barbearias já transformaram seus negócios com o Genesis Hub.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BarChart3 className="w-3 h-3 mr-1" />
              Comparativo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Antes vs{' '}
              <span className="text-gradient">Depois</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <span className="text-2xl">😓</span>
                  Sem Genesis Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Agenda desorganizada no papel',
                  'Clientes faltam sem avisar',
                  'Perda de tempo com ligações',
                  'Sem controle financeiro',
                  'Marketing inexistente',
                  'Clientes indo para concorrência'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* After */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <span className="text-2xl">🚀</span>
                  Com Genesis Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Agenda online automática 24/7',
                  'Lembretes via WhatsApp = menos faltas',
                  'Clientes se agendam sozinhos',
                  'Dashboard com todo o faturamento',
                  'Marketing com IA reconquista clientes',
                  'Clientes fiéis e satisfeitos'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Crown className="w-3 h-3 mr-1" />
              Preços Transparentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal para{' '}
              <span className="text-gradient">seu negócio</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce. Sem surpresas, sem taxas escondidas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <PricingCard
              name="Teste Grátis"
              price="R$ 0"
              description="Experimente por 7 dias"
              icon={Gift}
              features={[
                'Agendamentos ilimitados',
                'Site comercial personalizado',
                'Integração WhatsApp (ChatPro)',
                'Até 2 barbeiros',
                'Dashboard básico',
                'Suporte por email'
              ]}
              buttonText="Começar Agora"
              isLink={true}
              buttonLink="/admin/login?register=true"
            />
            
            <PricingCard
              name="Premium"
              price="Sob Consulta"
              description="Para barbearias em crescimento"
              icon={Crown}
              popular
              features={[
                'Tudo do plano gratuito',
                'Barbeiros ilimitados',
                'Marketing com IA',
                'Campanhas em massa',
                'Relatórios avançados',
                'Webhooks e API',
                'Suporte prioritário 24/7'
              ]}
              buttonText="Falar com Equipe"
              onButtonClick={() => openLeadModal('premium')}
            />
            
            <PricingCard
              name="Vitalício"
              price="Sob Consulta"
              description="Acesso permanente"
              icon={Lock}
              features={[
                'Tudo do plano Premium',
                'Pagamento único',
                'Sem mensalidades',
                'Atualizações vitalícias',
                'Suporte VIP',
                'Consultoria de setup',
                'Treinamento exclusivo'
              ]}
              buttonText="Garantir Acesso"
              onButtonClick={() => openLeadModal('vitalicio')}
            />
          </div>
          
          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Garantia de 7 dias ou seu dinheiro de volta</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-card/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas{' '}
              <span className="text-gradient">frequentes</span>
            </h2>
          </div>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              {faqs.map((faq, i) => (
                <FAQItem key={i} {...faq} />
              ))}
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            Não encontrou sua pergunta?{' '}
            <button onClick={() => openLeadModal('premium')} className="text-primary hover:underline">
              Fale conosco
            </button>
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para transformar sua{' '}
              <span className="text-gradient">barbearia?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de barbearias que já automatizaram seus processos 
              e aumentaram seu faturamento com o Genesis Hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg h-14 px-10">
                <Link to="/admin/login?register=true">
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => openLeadModal('premium')} className="text-lg h-14 px-10">
                <MessageSquare className="w-5 h-5 mr-2" />
                Falar com Consultor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Genesis<span className="text-primary">Hub</span></span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A plataforma completa para gestão inteligente de barbearias. Automatize, organize e cresça.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  SSL Seguro
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  LGPD
                </Badge>
              </div>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
                </li>
                <li>
                  <a href="#how" className="hover:text-foreground transition-colors">Como Funciona</a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
                </li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link to="/docs" className="hover:text-foreground transition-colors">Documentação</Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
                </li>
                <li>
                  <button onClick={() => openLeadModal('premium')} className="hover:text-foreground transition-colors">Suporte</button>
                </li>
                <li>
                  <Link to="/admin/login" className="hover:text-foreground transition-colors">Login</Link>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link>
                </li>
                <li>
                  <Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="py-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Genesis Hub. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Todos os sistemas operacionais
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GenesisLanding;
