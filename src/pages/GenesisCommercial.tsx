import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Check, Sparkles, Zap, Shield, 
  MessageSquare, Bot, Workflow, BarChart3,
  Rocket, Crown, Gift, Star, Play,
  ChevronRight, Globe, Lock, Users,
  TrendingUp, Clock, CheckCircle, Heart,
  Infinity, Send, Phone, Mail
} from 'lucide-react';
import VendaFAQ from '@/components/venda/VendaFAQ';

// Animated typing effect
const TypewriterText = ({ text, className = '' }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Animated counter
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

// Hero Section with Integrated Panel
const HeroSection = () => {
  const [isTyping, setIsTyping] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false);
      setShowPanel(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        {/* Animated grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), 
                             linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[80px]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Plataforma #1 de Automação WhatsApp com IA
          </Badge>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center max-w-5xl mx-auto mb-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Automatize seu</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              WhatsApp com IA
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Crie chatbots inteligentes, fluxos de automação e aumente suas vendas 
            em até 300%. Sem código. Sem complicação.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to="/genesis-login">
            <Button size="lg" className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Rocket className="w-5 h-5 mr-2" />
              Começar Grátis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border/50 backdrop-blur-sm">
            <Play className="w-5 h-5 mr-2" />
            Ver Demonstração
          </Button>
        </motion.div>

        {/* Integrated Panel Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Browser Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-background/50 rounded-full text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  app.genesis-ia.cloud
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-background to-muted/20">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Genesis IA</div>
                      <div className="text-xs text-muted-foreground">Painel Principal</div>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {[
                      { icon: BarChart3, label: 'Dashboard', active: true },
                      { icon: MessageSquare, label: 'Instâncias' },
                      { icon: Workflow, label: 'Flow Builder' },
                      { icon: Bot, label: 'Chatbots' },
                      { icon: Users, label: 'Contatos' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          item.active 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Mensagens Hoje', value: '2.847', icon: MessageSquare, color: 'text-blue-500' },
                      { label: 'Conversas Ativas', value: '156', icon: Users, color: 'text-green-500' },
                      { label: 'Taxa de Resposta', value: '98%', icon: Zap, color: 'text-yellow-500' },
                      { label: 'Vendas via Bot', value: 'R$ 12.4k', icon: TrendingUp, color: 'text-primary' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + i * 0.1 }}
                        className="p-4 rounded-xl bg-card border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          <span className="text-xs text-muted-foreground">+12%</span>
                        </div>
                        <div className="text-xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chat Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium">Conversa Ativa</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">IA Respondendo</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">JC</div>
                        <div className="flex-1 p-3 rounded-lg bg-muted/50 text-sm">
                          Olá! Quero saber sobre os planos de vocês
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="flex-1 max-w-[80%] p-3 rounded-lg bg-primary/10 text-sm border border-primary/20">
                          <div className="flex items-center gap-1 text-xs text-primary mb-1">
                            <Bot className="w-3 h-3" />
                            Luna IA
                          </div>
                          Olá! 😊 Temos planos a partir de R$97/mês com chatbot ilimitado...
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: -30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 2 }}
            className="absolute -top-4 -left-4 md:-left-8 p-3 rounded-xl bg-card border border-green-500/30 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs font-medium">Venda Realizada</div>
                <div className="text-xs text-muted-foreground">+R$ 297,00</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 2.2 }}
            className="absolute -bottom-4 -right-4 md:-right-8 p-3 rounded-xl bg-card border border-primary/30 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium">Bot Ativo 24/7</div>
                <div className="text-xs text-muted-foreground">156 conversas</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-border/30"
        >
          {[
            { value: 2500, suffix: '+', label: 'Empresas Ativas' },
            { value: 15, suffix: 'M+', label: 'Mensagens/mês' },
            { value: 99, suffix: '%', label: 'Uptime' },
            { value: 4, suffix: '.9/5', label: 'Avaliação' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Bot,
      title: 'Luna IA',
      description: 'Assistente de IA que responde como um humano, 24 horas por dia.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Workflow,
      title: 'Flow Builder',
      description: 'Crie fluxos de automação complexos sem escrever código.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageSquare,
      title: 'Multi-Instâncias',
      description: 'Gerencie múltiplos WhatsApp em um único painel centralizado.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avançado',
      description: 'Métricas em tempo real de conversas, vendas e performance.',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Criptografia de ponta, backup automático e LGPD compliant.',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: Zap,
      title: 'Webhooks & APIs',
      description: 'Integre com qualquer sistema via API RESTful completa.',
      color: 'from-primary to-blue-500'
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Zap className="w-3 h-3 mr-1" />
            Recursos Poderosos
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              escalar
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com todos os recursos para automatizar seu atendimento e vender mais.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4`}>
                    <div className="w-full h-full rounded-xl bg-card flex items-center justify-center group-hover:bg-transparent transition-colors">
                      <feature.icon className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Partners Section
const PartnersSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Heart className="w-3 h-3 mr-1" />
            Nossas Parcerias
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tecnologias que{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              potencializam
            </span>{' '}
            nossa plataforma
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Lovable Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-gradient-to-br from-card to-muted/30 border-border/50 hover:border-pink-500/30 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl" />
              <CardContent className="p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src="https://asset.brandfetch.io/idgDVbJtZn/idABhB2rn5.svg" 
                        alt="Lovable"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Lovable</h3>
                      <p className="text-sm text-muted-foreground">AI Software Engineer</p>
                    </div>
                  </div>
                  <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/20">
                    <Gift className="w-3 h-3 mr-1" />
                    Partner
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Interface desenvolvida com a mais avançada plataforma de desenvolvimento com IA, 
                  garantindo código limpo, escalável e de alta performance.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Código TypeScript de alta qualidade</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Google Cloud Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full bg-gradient-to-br from-card to-muted/30 border-border/50 hover:border-blue-500/30 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
              <CardContent className="p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src="https://www.gstatic.com/images/branding/product/2x/google_cloud_64dp.png" 
                        alt="Google Cloud"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Google Cloud</h3>
                      <p className="text-sm text-muted-foreground">AI & Infrastructure</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Zap className="w-3 h-3 mr-1" />
                    Powered
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Infraestrutura robusta com Gemini AI para processamento de linguagem natural 
                  avançado e respostas inteligentes em tempo real.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Gemini AI integrado nativamente</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const plans = [
    {
      name: 'Premium',
      description: 'Para negócios em crescimento',
      price: 97,
      originalPrice: 147,
      period: '/mês',
      icon: Rocket,
      color: 'from-primary to-blue-500',
      popular: true,
      features: [
        '3 Instâncias WhatsApp',
        'Luna IA Ilimitada',
        'Flow Builder Completo',
        'Analytics Avançado',
        'Webhooks & Integrações',
        'Suporte Prioritário',
        '10.000 mensagens/mês',
        'Backup Automático',
      ]
    },
    {
      name: 'Lifetime',
      description: 'Acesso vitalício',
      price: 997,
      originalPrice: 2997,
      period: 'único',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      popular: false,
      features: [
        'Instâncias Ilimitadas',
        'Luna IA Ilimitada',
        'Flow Builder Completo',
        'White Label Disponível',
        'API Completa',
        'Suporte VIP',
        'Mensagens Ilimitadas',
        'Todas Atualizações Futuras',
      ]
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
            <Gift className="w-3 h-3 mr-1" />
            Oferta Especial
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Escolha seu{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              plano ideal
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e escale conforme seu negócio cresce.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.2 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'} bg-card/80 backdrop-blur-sm overflow-hidden`}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">R$ {plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <div className="text-sm text-muted-foreground line-through">
                      De R$ {plan.originalPrice}
                    </div>
                    <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                      Economize R$ {plan.originalPrice - plan.price}
                    </Badge>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/genesis-login">
                    <Button 
                      className={`w-full ${plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white'
                      }`}
                      size="lg"
                    >
                      {plan.name === 'Lifetime' ? (
                        <>
                          <Infinity className="w-5 h-5 mr-2" />
                          Garantir Acesso Vitalício
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          Começar Agora
                        </>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          {[
            { icon: Shield, text: '7 Dias de Garantia' },
            { icon: Lock, text: 'Pagamento Seguro' },
            { icon: Clock, text: 'Ativação Imediata' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="w-4 h-4 text-green-500" />
              {item.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Footer Section
const FooterSection = () => {
  return (
    <footer className="py-16 bg-card border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Genesis IA</span>
                <div className="text-xs text-muted-foreground">Automação Inteligente</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              A plataforma mais avançada para automatizar seu WhatsApp com inteligência artificial. 
              Venda mais, atenda melhor, trabalhe menos.
            </p>
            <div className="flex gap-4">
              {['instagram', 'linkedin', 'youtube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
              <li><Link to="/docs" className="hover:text-primary transition-colors">Documentação</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><Link to="/termos-de-uso" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-primary transition-colors">Privacidade</Link></li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:suporte@genesis-ia.cloud" className="hover:text-primary transition-colors">Contato</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Genesis IA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Component
const GenesisCommercial = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <PartnersSection />
      <PricingSection />
      <VendaFAQ />
      <FooterSection />
    </div>
  );
};

export default GenesisCommercial;
