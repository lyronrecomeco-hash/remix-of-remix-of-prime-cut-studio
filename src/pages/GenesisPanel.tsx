import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  LayoutDashboard, 
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
  Crown,
  ChevronRight,
  Search,
  HelpCircle,
  Sparkles,
  Activity,
  Gift
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
import { NotificationsPanel } from '@/components/genesis/NotificationsPanel';
import { GenesisChatbots } from '@/components/genesis/GenesisChatbots';
import { WelcomeModal } from '@/components/genesis/WelcomeModal';

// Dashboard component with real data
const GenesisDashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { genesisUser, credits, subscription, isSuperAdmin } = useGenesisAuth();
  const [realStats, setRealStats] = useState({
    instances: 0,
    flows: 0,
    creditsAvailable: 0,
  });

  useEffect(() => {
    const fetchRealStats = async () => {
      if (!genesisUser) return;

      const [instancesRes, flowsRes] = await Promise.all([
        supabase.from('genesis_instances').select('id', { count: 'exact' }).eq('user_id', genesisUser.id),
        supabase.from('whatsapp_automation_rules').select('id', { count: 'exact' }),
      ]);

      setRealStats({
        instances: instancesRes.count || 0,
        flows: flowsRes.count || 0,
        creditsAvailable: credits?.available_credits || 0,
      });
    };

    fetchRealStats();
  }, [genesisUser, credits]);

  const stats = [
    { label: 'Instâncias Ativas', value: realStats.instances, max: subscription?.max_instances || 1, icon: Smartphone, color: 'text-green-500' },
    { label: 'Fluxos Criados', value: realStats.flows, max: subscription?.max_flows || 5, icon: GitBranch, color: 'text-blue-500' },
    { label: 'Créditos Disponíveis', value: realStats.creditsAvailable, icon: CreditCard, color: 'text-amber-500' },
    { label: 'Status', value: 'Ativo', icon: Activity, color: 'text-purple-500' },
  ];

  const quickActions = [
    { title: 'Nova Instância', description: 'Conecte um WhatsApp', icon: Smartphone, onClick: () => onNavigate('instances') },
    { title: 'Criar Fluxo', description: 'Monte automações visuais', icon: GitBranch, onClick: () => onNavigate('flows') },
    { title: 'Chatbot IA', description: 'Respostas inteligentes', icon: Bot, onClick: () => onNavigate('chatbots') },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Animated Welcome */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold"
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
            className="text-muted-foreground mt-1 text-sm sm:text-base"
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

      {/* Animated Stats Grid - 4 equal cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <AnimatedStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            max={stat.max}
            icon={stat.icon}
            color={stat.color}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Animated Quick Actions */}
      <div>
        <motion.h2 
          className="text-base font-semibold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Ações Rápidas
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              delay={500 + (index * 100)}
            />
          ))}
        </div>
      </div>

      {/* Animated Plan Info - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <CardContent className="relative z-10 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Seu Plano:</span>
                    <span className="text-primary font-bold capitalize">{subscription?.plan || 'Free'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscription?.plan === 'free' 
                      ? 'Faça upgrade para mais recursos'
                      : 'Aproveite todos os recursos'}
                  </p>
                </div>
              </div>
              
              {/* Compact stats row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{realStats.instances}/{subscription?.max_instances || 1}</p>
                  <p className="text-[10px] text-muted-foreground">Instâncias</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-semibold">{realStats.flows}/{subscription?.max_flows || 5}</p>
                  <p className="text-[10px] text-muted-foreground">Fluxos</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-semibold">{realStats.creditsAvailable}</p>
                  <p className="text-[10px] text-muted-foreground">Créditos</p>
                </div>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 hidden sm:flex">
                  Ativo
                </Badge>
              </div>
              
              <Button variant="outline" size="sm" className="gap-2 group" onClick={() => onNavigate('credits')}>
                <Crown className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
                Upgrade
              </Button>
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
  const [hideSidebar, setHideSidebar] = useState(false);
  const [instances, setInstances] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isEditingFlow, setIsEditingFlow] = useState(false);

  // Check if first time user
  useEffect(() => {
    const checkFirstTime = async () => {
      if (!genesisUser) return;
      
      const welcomeKey = `genesis_welcome_shown_${genesisUser.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeKey);
      
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    };
    checkFirstTime();
  }, [genesisUser]);

  const handleWelcomeComplete = () => {
    if (genesisUser) {
      localStorage.setItem(`genesis_welcome_shown_${genesisUser.id}`, 'true');
    }
    setShowWelcome(false);
  };

  // Fetch instances for Chatbots
  useEffect(() => {
    const fetchInstances = async () => {
      if (!genesisUser) return;
      const { data } = await supabase
        .from('genesis_instances')
        .select('id, name, status')
        .eq('user_id', genesisUser.id);
      if (data) setInstances(data);
    };
    fetchInstances();
  }, [genesisUser]);

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
        return <WAFlowBuilder onBack={() => setActiveTab('dashboard')} onEditingChange={setIsEditingFlow} />;
      case 'chatbots':
        return <GenesisChatbots instances={instances} />;
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

  // Hide sidebar when editing flow
  const shouldHideSidebar = activeTab === 'flows' && isEditingFlow;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Logo for desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Genesis Hub</span>
            </div>
            
            <h2 className="font-semibold capitalize lg:ml-4">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bonus Badge */}
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20 hidden sm:flex">
              <Gift className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">300 créditos para conta nova!</span>
            </Badge>

            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
            
            {/* Notifications Panel */}
            <NotificationsPanel />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={genesisUser?.avatar_url} />
                    <AvatarFallback className="text-xs">{genesisUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{genesisUser?.name}</p>
                    <p className="text-xs text-muted-foreground">{genesisUser?.email}</p>
                  </div>
                </DropdownMenuLabel>
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
        </header>

        {/* Content */}
        <div
          className={cn(
            'flex-1 overflow-auto pb-24 lg:pb-6',
            activeTab === 'flows'
              ? (isEditingFlow ? 'p-0' : 'p-4 md:p-6')
              : 'p-4 md:p-6'
          )}
        >
          {renderContent()}
        </div>
      </main>

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
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">Genesis Hub</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
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

      {/* MacOS Style Dock - Desktop - Centered */}
      <AnimatePresence>
        {!shouldHideSidebar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="hidden lg:flex fixed bottom-4 z-50 w-full justify-center pointer-events-none"
          >
            <div className="flex items-end gap-1.5 px-3 py-2 bg-card/80 backdrop-blur-xl border rounded-2xl shadow-2xl pointer-events-auto">
              {navItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 group",
                      isActive ? "bg-primary/10" : "hover:bg-muted"
                    )}
                    whileHover={{ scale: 1.15, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <div className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-xl transition-colors",
                      isActive 
                        ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/30" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div 
                        layoutId="dock-indicator"
                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="px-2 py-1 bg-popover border rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal for first-time users */}
      <WelcomeModal 
        open={showWelcome} 
        onComplete={handleWelcomeComplete}
        userName={genesisUser?.name?.split(' ')[0]}
      />
    </div>
  );
}
