import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, LayoutDashboard, Mail, FileText, Settings, Activity, Users, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import EmailTemplatesManager from '@/components/owner/EmailTemplatesManager';
import GlobalLogsViewer from '@/components/owner/GlobalLogsViewer';
import SystemSettings from '@/components/owner/SystemSettings';
import UsersOverview from '@/components/owner/UsersOverview';

const OWNER_EMAIL = 'lyronrp@gmail.com';

const OwnerPanel = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const verifyOwner = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Get current user email
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;

      // Must be logged in, be super_admin, and have the correct email
      if (!user || !isSuperAdmin || userEmail !== OWNER_EMAIL) {
        // Silently redirect - user should never know this page exists
        navigate('/', { replace: true });
        return;
      }

      setIsOwner(true);
      setIsVerifying(false);
    };

    verifyOwner();
  }, [user, authLoading, isSuperAdmin, navigate]);

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Owner Panel</h1>
                <p className="text-xs text-muted-foreground">Central de Gerenciamento SaaS</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Sistema Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-card border border-border">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <OwnerDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersOverview />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <EmailTemplatesManager />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <GlobalLogsViewer />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerPanel;
