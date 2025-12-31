import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  FileText, 
  Wallet, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AffiliateDashboard from '@/components/affiliate/AffiliateDashboard';
import AffiliateSales from '@/components/affiliate/AffiliateSales';
import AffiliateMaterials from '@/components/affiliate/AffiliateMaterials';
import AffiliateWithdrawals from '@/components/affiliate/AffiliateWithdrawals';
import AffiliateProfile from '@/components/affiliate/AffiliateProfile';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  affiliate_code: string;
  commission_rate_monthly: number;
  commission_rate_lifetime: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  pix_key: string | null;
  pix_type: string | null;
  status: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Minhas Vendas', icon: TrendingUp },
  { id: 'materials', label: 'Materiais', icon: FileText },
  { id: 'withdrawals', label: 'Saques', icon: Wallet },
  { id: 'profile', label: 'Meu Perfil', icon: User },
];

const AffiliatePanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAffiliateAuth();
  }, []);

  const checkAffiliateAuth = async () => {
    const isAffiliateSubdomain = window.location.hostname === 'parceiros.genesishub.cloud';
    const loginPath = isAffiliateSubdomain ? '/login' : '/afiliado/login';

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate(loginPath);
        return;
      }

      const { data: affiliateData, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !affiliateData) {
        toast.error('Acesso não autorizado');
        await supabase.auth.signOut();
        navigate(loginPath);
        return;
      }

      if (affiliateData.status !== 'active') {
        toast.error('Sua conta não está ativa');
        await supabase.auth.signOut();
        navigate(loginPath);
        return;
      }

      setAffiliate(affiliateData as Affiliate);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate(loginPath);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const isAffiliateSubdomain = window.location.hostname === 'parceiros.genesishub.cloud';
    const loginPath = isAffiliateSubdomain ? '/login' : '/afiliado/login';

    await supabase.auth.signOut();
    navigate(loginPath);
    toast.success('Logout realizado com sucesso');
  };

  const renderContent = () => {
    if (!affiliate) return null;

    switch (activeTab) {
      case 'dashboard':
        return <AffiliateDashboard affiliate={affiliate} />;
      case 'sales':
        return <AffiliateSales affiliateId={affiliate.id} />;
      case 'materials':
        return <AffiliateMaterials />;
      case 'withdrawals':
        return <AffiliateWithdrawals affiliate={affiliate} onRefresh={checkAffiliateAuth} />;
      case 'profile':
        return <AffiliateProfile affiliate={affiliate} />;
      default:
        return <AffiliateDashboard affiliate={affiliate} />;
    }
  };

  if (loading) {
    return (
      <div className="theme-affiliate-blue min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="theme-affiliate-blue min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg border border-border"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar-background border-r border-sidebar-border z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-foreground">
              Genesis Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Portal de Parceiros
            </p>
          </div>

          {/* Affiliate Info */}
          <div className="p-4 mx-4 mt-4 bg-secondary/50 rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">
              {affiliate?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Código: {affiliate?.affiliate_code}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="p-4 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AffiliatePanel;
