import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard, 
  MessageSquare, 
  GitBranch, 
  Settings, 
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bot,
  Smartphone,
  Plus,
  Crown,
  ChevronRight,
  Bell,
  Search,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WAFlowBuilder } from '@/components/owner/whatsapp/flow-builder';
import { AnimatedStatCard, QuickActionCard, AnimatedPlanFeature } from '@/components/genesis/AnimatedStats';
import { InstancesManager } from '@/components/genesis/InstancesManager';
import { CreditsManager } from '@/components/genesis/CreditsManager';
import { AnalyticsDashboard } from '@/components/genesis/AnalyticsDashboard';

// Dashboard component with enhanced animations
const GenesisDashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { genesisUser, credits, subscription, isSuperAdmin } = useGenesisAuth();

  const stats = [
    { label: 'Instâncias Ativas', value: 3, max: subscription?.max_instances || 1, icon: Smartphone, color: 'text-green-500' },
    { label: 'Fluxos Criados', value: 12, max: subscription?.max_flows || 5, icon: GitBranch, color: 'text-blue-500' },
    { label: 'Mensagens Hoje', value: 1234, icon: MessageSquare, color: 'text-purple-500' },
    { label: 'Créditos', value: credits?.available_credits || 0, icon: CreditCard, color: 'text-amber-500' },
  ];

  const quickActions = [
    { title: 'Nova Instância', description: 'Conecte uma nova conta WhatsApp', icon: Plus, onClick: () => onNavigate('instances') },
    { title: 'Criar Fluxo', description: 'Monte um novo fluxo de automação', icon: GitBranch, onClick: () => onNavigate('flows') },
    { title: 'Chatbot IA', description: 'Configure respostas inteligentes', icon: Bot, onClick: () => onNavigate('chatbots') },
  ];

  return (
    <div className="space-y-8">
      {/* Animated Welcome */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <motion.h1 
            className="text-3xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Olá, {genesisUser?.name?.split(' ')[0] || 'Usuário'}! 
            <motion.span 
              className="inline-block ml-2"
              animate={{ rotate: [0, 20, 0] }}
              transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}
            >
              👋
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Bem-vindo ao seu painel de automação.
          </motion.p>
        </div>
        {isSuperAdmin && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
          >
            <Badge variant="secondary" className="gap-1 px-3 py-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              Super Admin
            </Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Animated Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <AnimatedStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            max={stat.max}
            icon={stat.icon}
            color={stat.color}
            delay={index * 150}
          />
        ))}
      </div>

      {/* Animated Quick Actions */}
      <div>
        <motion.h2 
          className="text-lg font-semibold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Ações Rápidas
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              delay={600 + (index * 100)}
            />
          ))}
        </div>
      </div>

      {/* Animated Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <CardHeader className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                  Seu Plano: 
                  <span className="text-primary capitalize">{subscription?.plan || 'Free'}</span>
                </CardTitle>
                <CardDescription>
                  {subscription?.plan === 'free' 
                    ? 'Faça upgrade para desbloquear mais recursos'
                    : 'Aproveite todos os recursos do seu plano'}
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2 group" onClick={() => onNavigate('credits')}>
                <Crown className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                Fazer Upgrade
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedPlanFeature 
                label="Instâncias" 
                current={3} 
                max={subscription?.max_instances || 1} 
                delay={900}
              />
              <AnimatedPlanFeature 
                label="Fluxos" 
                current={12} 
                max={subscription?.max_flows || 5} 
                delay={1000}
              />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Créditos</p>
                  <p className="text-sm font-semibold">{credits?.available_credits || 0}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Ativo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Main Panel
export default function GenesisPanel() {
  const navigate = useNavigate();
  const { user, genesisUser, loading, isSuperAdmin, signOut } = useGenesisAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !genesisUser)) {
      navigate('/genesis/login');
    }
  }, [loading, user, genesisUser, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/genesis/login');
    toast.success('Até logo!');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'instances', label: 'Instâncias', icon: Smartphone },
    { id: 'flows', label: 'Flow Builder', icon: GitBranch },
    { id: 'chatbots', label: 'Chatbots', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'credits', label: 'Créditos', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (isSuperAdmin) {
    navItems.push({ id: 'users', label: 'Usuários', icon: Users });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <GenesisDashboard onNavigate={setActiveTab} />;
      case 'instances':
        return <InstancesManager />;
      case 'flows':
        return <WAFlowBuilder onBack={() => setActiveTab('dashboard')} />;
      case 'chatbots':
        return <div className="text-center py-20 text-muted-foreground">Em desenvolvimento...</div>;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'credits':
        return <CreditsManager />;
      case 'settings':
        return <div className="text-center py-20 text-muted-foreground">Em desenvolvimento...</div>;
      case 'users':
        return <div className="text-center py-20 text-muted-foreground">Em desenvolvimento...</div>;
      default:
        return <GenesisDashboard onNavigate={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold">Genesis Hub</h1>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* User */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={genesisUser?.avatar_url} />
                  <AvatarFallback>{genesisUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{genesisUser?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{genesisUser?.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold">Genesis Hub</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-3">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        activeTab === item.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </ScrollArea>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold capitalize">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
