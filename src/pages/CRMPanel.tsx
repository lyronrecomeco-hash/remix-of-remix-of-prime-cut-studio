import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Kanban,
  GitBranch,
  CheckSquare,
  DollarSign,
  UserCog,
  BarChart3,
  Settings,
  Menu,
  X,
  Building2,
  LogOut,
  Search,
  ChevronRight,
  Sparkles,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCRM } from '@/contexts/CRMContext';
import { cn } from '@/lib/utils';

// Import CRM Components
import CRMDashboard from '@/components/crm/CRMDashboard';
import CRMLeads from '@/components/crm/CRMLeads';
import CRMKanban from '@/components/crm/CRMKanban';
import CRMPipelines from '@/components/crm/CRMPipelines';
import CRMTasks from '@/components/crm/CRMTasks';
import CRMFinancial from '@/components/crm/CRMFinancial';
import CRMUsers from '@/components/crm/CRMUsers';
import CRMReports from '@/components/crm/CRMReports';
import CRMSettings from '@/components/crm/CRMSettings';
import CRMOnboardingModal from '@/components/crm/CRMOnboardingModal';
import CRMCompanyAccount from '@/components/crm/CRMCompanyAccount';
import CRMCollaborators from '@/components/crm/CRMCollaborators';
import CRMUserProfile from '@/components/crm/CRMUserProfile';
import CRMProfileMenu from '@/components/crm/CRMProfileMenu';
import CRMSecurityProvider from '@/components/crm/CRMSecurityProvider';
import CRMInteractiveBackground from '@/components/crm/CRMInteractiveBackground';
import CRMGlobalSearch from '@/components/crm/CRMGlobalSearch';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  category: string;
}

const navItems: NavItem[] = [
  // Visão Geral
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Visão Geral' },
  
  // Vendas
  { id: 'kanban', label: 'Pipeline', icon: Kanban, category: 'Vendas' },
  { id: 'leads', label: 'Leads', icon: Users, category: 'Vendas' },
  { id: 'pipelines', label: 'Funis', icon: GitBranch, category: 'Vendas' },
  
  // Operações
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare, category: 'Operações' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, category: 'Operações' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, category: 'Operações' },
  
  // Gestão
  { id: 'collaborators', label: 'Colaboradores', icon: Users, category: 'Gestão', adminOnly: true },
  { id: 'users', label: 'Usuários', icon: UserCog, category: 'Gestão', adminOnly: true },
  { id: 'company', label: 'Empresa', icon: Building2, category: 'Gestão' },
  { id: 'settings', label: 'Config.', icon: Settings, category: 'Gestão', adminOnly: true },
];

type MenuItemId = string;

export default function CRMPanel() {
  const [activeTab, setActiveTab] = useState<MenuItemId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { crmUser, crmTenant, isAuthenticated, isLoading, logout, isAdmin, refreshData } = useCRM();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/crm/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [filteredItems]);

  const getActiveLabel = () => {
    const fromNav = filteredItems.find((i) => i.id === activeTab)?.label;
    if (fromNav) return fromNav;
    switch (activeTab) {
      case 'profile': return 'Meu Perfil';
      default: return 'CRM';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gestor';
      default: return 'Colaborador';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/crm/login');
  };

  const handleProfileNavigate = (tab: string) => {
    setActiveTab(tab as MenuItemId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CRMDashboard />;
      case 'leads': return <CRMLeads />;
      case 'kanban': return <CRMKanban />;
      case 'pipelines': return <CRMPipelines />;
      case 'tasks': return <CRMTasks />;
      case 'financial': return <CRMFinancial />;
      case 'users': return <CRMUsers />;
      case 'reports': return <CRMReports />;
      case 'settings': return <CRMSettings />;
      case 'company': return <CRMCompanyAccount />;
      case 'collaborators': return <CRMCollaborators />;
      case 'profile': return <CRMUserProfile />;
      default: return <CRMDashboard />;
    }
  };

  if (isLoading) {
    return (
      <CRMSecurityProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </CRMSecurityProvider>
    );
  }

  // Evita tela branca: se a sessão expirar ou os dados do tenant não carregarem,
  // mostramos um fallback com ação para recuperar.
  if (!isAuthenticated) {
    return (
      <CRMSecurityProvider>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <p className="text-sm font-semibold">Sessão expirada</p>
            <p className="text-xs text-muted-foreground mt-1">
              Faça login novamente para acessar o CRM.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/crm/login')}>
                Ir para login
              </Button>
            </div>
          </div>
        </div>
      </CRMSecurityProvider>
    );
  }

  if (!crmUser || !crmTenant) {
    return (
      <CRMSecurityProvider>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <p className="text-sm font-semibold">Carregando dados do CRM</p>
            <p className="text-xs text-muted-foreground mt-1">
              Se isso persistir, recarregue a sessão.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refreshData()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </CRMSecurityProvider>
    );
  }

  return (
    <CRMSecurityProvider>
      {/* Interactive Background - Medium intensity */}
      <CRMInteractiveBackground />

      {/* Global Search */}
      <CRMGlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab as MenuItemId)}
      />

      {/* Onboarding Modal */}
      {!crmTenant.onboarding_completed && <CRMOnboardingModal />}

      <div className="min-h-screen bg-background/80 relative flex w-full">
        {/* Desktop Sidebar - Professional Layout */}
        <aside className="hidden lg:flex w-56 border-r border-border bg-card/70 backdrop-blur-md fixed left-0 top-0 bottom-0 z-40 flex-col">
          {/* Logo/Brand */}
          <div className="h-12 px-3 border-b border-border flex items-center shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate uppercase tracking-wider">CRM</p>
                <p className="font-semibold text-xs text-foreground truncate">
                  {crmTenant.name || 'Empresa'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Categorized */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-3">
                <p className="px-2 mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-start gap-2 h-8 text-xs font-normal',
                        activeTab === item.id && 'bg-primary/10 text-primary font-medium border border-primary/20'
                      )}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User Footer */}
          <div className="border-t border-border p-2 shrink-0">
            <div className="px-1 mb-2">
              <p className="font-medium text-xs truncate">{crmUser.name}</p>
              <p className="text-[9px] text-muted-foreground truncate">
                {getRoleName(crmUser.role)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleLogout}>
              <LogOut className="w-3 h-3 mr-1.5" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-card/95 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="min-w-0">
              <p className="text-[9px] text-muted-foreground truncate uppercase tracking-wider">
                {crmTenant.name}
              </p>
              <p className="font-semibold text-sm truncate">{getActiveLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearchOpen(true)}>
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">3</span>
            </Button>
            <CRMProfileMenu onNavigate={handleProfileNavigate} onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col"
              >
                <div className="h-12 px-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground truncate uppercase tracking-wider">CRM</p>
                      <p className="font-semibold text-xs truncate">{crmTenant.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <nav className="flex-1 overflow-y-auto py-2 px-2">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="mb-3">
                      <p className="px-2 mb-1 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                        {category}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => (
                          <Button
                            key={item.id}
                            variant={activeTab === item.id ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn(
                              'w-full justify-start gap-2 h-8 text-xs font-normal',
                              activeTab === item.id && 'bg-primary/10 text-primary font-medium border border-primary/20'
                            )}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="border-t border-border p-2 shrink-0">
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleLogout}>
                    <LogOut className="w-3 h-3 mr-1.5" />
                    Sair
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-56">
          {/* Desktop Top Header */}
          <header className="hidden lg:flex h-10 border-b border-border bg-card/80 backdrop-blur-md items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">CRM</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <h1 className="text-xs font-semibold text-foreground truncate">{getActiveLabel()}</h1>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-3 h-3" />
                <span className="text-[10px]">Buscar</span>
                <kbd className="h-4 items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground hidden sm:flex">
                  ⌘K
                </kbd>
              </Button>
              
              <Button variant="ghost" size="icon" className="h-7 w-7 relative">
                <Bell className="w-3 h-3" />
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">3</span>
              </Button>
              
              <CRMProfileMenu onNavigate={handleProfileNavigate} onLogout={handleLogout} />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-muted/20 pt-12 lg:pt-0">
            <div className="p-3 lg:p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </CRMSecurityProvider>
  );
}