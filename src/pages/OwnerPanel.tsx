import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Shield, 
  LayoutDashboard, 
  Mail, 
  FileText, 
  Settings, 
  Users, 
  CreditCard, 
  MessageCircle, 
  HardDrive, 
  UserPlus,
  ChevronRight,
  Sparkles,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import EmailTemplatesManager from '@/components/owner/EmailTemplatesManager';
import GlobalLogsViewer from '@/components/owner/GlobalLogsViewer';
import SystemSettings from '@/components/owner/SystemSettings';
import UsersOverview from '@/components/owner/UsersOverview';
import SubscriptionManager from '@/components/owner/SubscriptionManager';
import WhatsAppTemplatesManager from '@/components/owner/WhatsAppTemplatesManager';
import UserDatabaseSection from '@/components/owner/UserDatabaseSection';
import LeadsManager from '@/components/owner/LeadsManager';

const OWNER_EMAIL = 'lyronrp@gmail.com';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const navSections: NavSection[] = [
  {
    title: 'Visão Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'leads', label: 'Leads', icon: UserPlus, badge: 'Novo', badgeVariant: 'default' },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'database', label: 'Banco de Dados', icon: HardDrive },
    ]
  },
  {
    title: 'Comunicação',
    items: [
      { id: 'emails', label: 'Templates Email', icon: Mail },
      { id: 'whatsapp', label: 'Templates WhatsApp', icon: MessageCircle },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { id: 'logs', label: 'Logs Globais', icon: FileText },
      { id: 'settings', label: 'Configurações', icon: Settings },
    ]
  }
];

const OwnerPanel = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const verifyOwner = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      if (userEmail !== OWNER_EMAIL) {
        navigate('/', { replace: true });
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError || !roleData || roleData.role !== 'super_admin') {
        navigate('/', { replace: true });
        return;
      }

      setIsOwner(true);
      setIsVerifying(false);
    };

    verifyOwner();
  }, [user, authLoading, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OwnerDashboard />;
      case 'leads':
        return <LeadsManager />;
      case 'subscriptions':
        return <SubscriptionManager />;
      case 'users':
        return <UsersOverview />;
      case 'database':
        return <UserDatabaseSection />;
      case 'emails':
        return <EmailTemplatesManager />;
      case 'whatsapp':
        return <WhatsAppTemplatesManager />;
      case 'logs':
        return <GlobalLogsViewer />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <OwnerDashboard />;
    }
  };

  const getActiveLabel = () => {
    for (const section of navSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item.label;
    }
    return 'Dashboard';
  };

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/50 animate-ping" />
          </div>
          <div>
            <p className="text-foreground font-medium">Verificando acesso</p>
            <p className="text-sm text-muted-foreground">Aguarde um momento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar - Fixed */}
      <aside className="w-60 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col fixed left-0 top-0 bottom-0 z-50">
        {/* Logo/Header */}
        <div className="h-14 px-4 border-b border-border flex items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground">Owner Panel</h1>
              <p className="text-[10px] text-muted-foreground">Genesis Hub SaaS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={isActive ? "secondary" : item.badgeVariant} 
                            className="text-[9px] px-1 py-0 h-4"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer Status */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <Activity className="w-3.5 h-3.5 text-green-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-green-600 dark:text-green-400">Sistema Online</p>
              <p className="text-[9px] text-muted-foreground truncate">Serviços ativos</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin for fixed sidebar */}
      <div className="flex-1 flex flex-col min-h-screen ml-60">
        {/* Top Header - Fixed */}
        <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-5 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Owner</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium text-foreground">{getActiveLabel()}</span>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-5">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerPanel;
