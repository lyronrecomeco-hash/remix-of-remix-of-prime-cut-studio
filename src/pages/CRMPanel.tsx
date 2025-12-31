import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronLeft,
  Building2,
  LogOut,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'kanban', label: 'Funis & Kanban', icon: Kanban },
  { id: 'pipelines', label: 'Pipelines', icon: GitBranch },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'users', label: 'Usuários', icon: UserCog, adminOnly: true },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings, adminOnly: true },
];

export default function CRMPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { crmUser, crmTenant, isAuthenticated, isLoading, logout, isAdmin } = useCRM();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/crm/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/crm/login');
  };

  const handleProfileNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <CRMSecurityProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando CRM...</p>
          </div>
        </div>
      </CRMSecurityProvider>
    );
  }

  if (!isAuthenticated || !crmUser || !crmTenant) {
    return null;
  }

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CRMDashboard />;
      case 'leads':
        return <CRMLeads />;
      case 'kanban':
        return <CRMKanban />;
      case 'pipelines':
        return <CRMPipelines />;
      case 'tasks':
        return <CRMTasks />;
      case 'financial':
        return <CRMFinancial />;
      case 'users':
        return <CRMUsers />;
      case 'reports':
        return <CRMReports />;
      case 'settings':
        return <CRMSettings />;
      case 'company':
        return <CRMCompanyAccount />;
      case 'collaborators':
        return <CRMCollaborators />;
      case 'profile':
        return <CRMUserProfile />;
      default:
        return <CRMDashboard />;
    }
  };

  return (
    <CRMSecurityProvider>
      {/* Interactive Background */}
      <CRMInteractiveBackground />
      
      {/* Global Search */}
      <CRMGlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Onboarding Modal */}
      {!crmTenant.onboarding_completed && <CRMOnboardingModal />}

      <div className="min-h-screen bg-background relative">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 256 : 72 }}
          className={cn(
            'hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300',
            'fixed left-0 top-0 h-screen z-40'
          )}
        >
          {/* Sidebar Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-4">
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-6 h-6 text-primary" />
                  <span className="font-semibold text-lg truncate">
                    {crmTenant.name || 'CRM'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="shrink-0"
            >
              <ChevronLeft
                className={cn(
                  'w-4 h-4 transition-transform',
                  !isSidebarOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-11',
                  !isSidebarOpen && 'justify-center px-0',
                  activeTab === item.id && 'bg-primary/10 text-primary'
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </Button>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-border p-4">
            {isSidebarOpen && (
              <div className="mb-3">
                <p className="font-medium text-sm truncate">{crmUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {crmUser.role === 'admin'
                    ? 'Administrador'
                    : crmUser.role === 'manager'
                    ? 'Gestor'
                    : 'Colaborador'}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size={isSidebarOpen ? 'default' : 'icon'}
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {isSidebarOpen && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </motion.aside>

        {/* Desktop Top Header with Profile Menu */}
        <div className="hidden lg:flex fixed top-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-b border-border z-30 items-center justify-end px-6 gap-3"
             style={{ left: isSidebarOpen ? '256px' : '72px', transition: 'left 0.3s' }}>
          <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)} className="gap-2">
            <Search className="w-4 h-4" />
            <span className="text-muted-foreground">Buscar...</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-muted text-[10px]">⌘K</kbd>
          </Button>
          <CRMProfileMenu onNavigate={handleProfileNavigate} onLogout={handleLogout} />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold">{crmTenant.name || 'CRM'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CRMProfileMenu onNavigate={handleProfileNavigate} onLogout={handleLogout} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
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
                className="lg:hidden fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col"
              >
                <div className="h-16 border-b border-border flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    <span className="font-semibold">{crmTenant.name || 'CRM'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-11',
                        activeTab === item.id && 'bg-primary/10 text-primary'
                      )}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </nav>

                <div className="border-t border-border p-4">
                  <div className="mb-3">
                    <p className="font-medium text-sm">{crmUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {crmUser.role === 'admin'
                        ? 'Administrador'
                        : crmUser.role === 'manager'
                        ? 'Gestor'
                        : 'Colaborador'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 min-h-screen transition-all duration-300',
            'pt-16',
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'
          )}
        >
          <div className="p-4 md:p-6 lg:p-8 lg:pt-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </CRMSecurityProvider>
  );
}
