import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, MessageSquare, Users, BarChart3, Zap, Shield, 
  ArrowRight, Check, Sparkles, Clock, Bell, Star,
  ChevronRight, Play, Smartphone, Globe, Lock, 
  CheckCircle, Crown, Rocket, Gift
} from 'lucide-react';

// Interactive Demo Component - Simulates real-time booking
const BookingDemo = () => {
  const [step, setStep] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  useEffect(() => {
    const steps = [
      'Cliente acessa o sistema...',
      'Seleciona serviço: Corte + Barba',
      'Escolhe horário: 14:00',
      'Confirma agendamento ✓',
      'WhatsApp enviado automaticamente!',
      'Notificação push recebida!'
    ];
    
    const interval = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % steps.length;
        if (next > 0) {
          setNotifications((n) => [...n.slice(-2), steps[prev]]);
        }
        return next;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-6 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Demonstração ao vivo</span>
        </div>
        
        {/* Simulated phone screen */}
        <div className="bg-background rounded-xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Agendamento Online</span>
            <Badge variant="outline" className="text-xs">Preview</Badge>
          </div>
          
          <div className="space-y-3">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  {['Cliente acessa...', 'Corte + Barba', '14:00', 'Confirmado!', 'WhatsApp ✓', 'Push ✓'][step]}
                </span>
              </div>
            </motion.div>
            
            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / 6) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
        
        {/* Live notifications */}
        <div className="mt-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.slice(-3).map((notif, i) => (
              <motion.div
                key={i + notif}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
                {notif}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

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

// Pricing Card Component
const PricingCard = ({ 
  name, 
  price, 
  description, 
  features, 
  popular = false,
  buttonText,
  buttonLink,
  icon: Icon 
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonLink: string;
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
          <Button 
            asChild 
            className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
          >
            <Link to={buttonLink}>{buttonText}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const GenesisLanding = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  
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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
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
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</a>
              <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentação</Link>
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                <Rocket className="w-3 h-3 mr-1" />
                Plataforma #1 para Barbearias
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Gerencie sua barbearia com{' '}
                <span className="text-gradient">inteligência</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Sistema completo de gestão com agendamentos online, automação via WhatsApp, 
                marketing com IA e muito mais. Tudo em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg h-14 px-8">
                  <Link to="/admin/login?register=true">
                    <Gift className="w-5 h-5 mr-2" />
                    Testar 7 Dias Grátis
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg h-14 px-8">
                  <a href="#demo">
                    <Play className="w-5 h-5 mr-2" />
                    Ver Demonstração
                  </a>
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Right content - Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
              id="demo"
            >
              <BookingDemo />
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Agendamento confirmado!</span>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-primary/10 border border-primary/20 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs">WhatsApp enviado!</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

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

      {/* How it Works */}
      <section className="py-20 md:py-32 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Simples e Rápido
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                description: 'Em menos de 2 minutos você configura sua barbearia no sistema.',
                icon: Rocket
              },
              {
                step: '02',
                title: 'Configure tudo',
                description: 'Adicione serviços, barbeiros e personalize seu site comercial.',
                icon: Smartphone
              },
              {
                step: '03',
                title: 'Receba clientes',
                description: 'Compartilhe o link e comece a receber agendamentos automaticamente.',
                icon: Star
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-8xl font-bold text-primary/10 absolute -top-8 left-0">{item.step}</div>
                <div className="relative pt-12">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
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
              Escolha o plano ideal
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
              buttonLink="https://wa.me/5521999999999?text=Olá! Tenho interesse no plano Premium do Genesis Hub"
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
              buttonLink="https://wa.me/5521999999999?text=Olá! Tenho interesse no plano Vitalício do Genesis Hub"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              <Button size="lg" variant="outline" asChild className="text-lg h-14 px-10">
                <a href="https://wa.me/5521999999999?text=Olá! Gostaria de saber mais sobre o Genesis Hub">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Genesis<span className="text-primary">Hub</span></span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/docs" className="hover:text-foreground transition-colors">Documentação</Link>
              <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Genesis Hub. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GenesisLanding;
