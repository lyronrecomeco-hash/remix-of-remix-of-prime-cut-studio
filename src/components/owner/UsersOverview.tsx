import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Users, Search, RefreshCw, Shield, Clock, Mail, CheckCircle, XCircle, Crown, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
  last_login?: string;
}

const UsersOverview = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch admin users
      const { data: adminUsers, error: usersError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch last login for each user
      const { data: loginAttempts, error: loginError } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', true)
        .order('attempted_at', { ascending: false });

      if (loginError) throw loginError;

      // Merge data
      const enrichedUsers = (adminUsers || []).map(user => {
        const userRole = roles?.find(r => r.user_id === user.user_id);
        const lastLogin = loginAttempts?.find(l => l.email === user.email);
        return {
          ...user,
          role: userRole?.role || 'N/A',
          last_login: lastLogin?.attempted_at,
        };
      });

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Usuário ${!user.is_active ? 'ativado' : 'desativado'} com sucesso`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'barber':
        return <UserCog className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-amber-500/10 text-amber-500">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500/10 text-blue-500">Admin</Badge>;
      case 'barber':
        return <Badge className="bg-green-500/10 text-green-500">Barbeiro</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    admins: users.filter(u => u.role === 'admin').length,
    barbers: users.filter(u => u.role === 'barber').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Visão Geral de Usuários</h2>
          <p className="text-sm text-muted-foreground">Gerencie todos os usuários do sistema</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Super Admin</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.superAdmins}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Barbeiros</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.barbers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Lista de Usuários</CardTitle>
          <CardDescription>{filteredUsers.length} usuários encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getRoleIcon(user.role || '')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{user.name}</h3>
                            {getRoleBadge(user.role || '')}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Criado: {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            {user.last_login && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                Último login: {format(new Date(user.last_login), 'dd/MM HH:mm', { locale: ptBR })}
                              </div>
                            )}
                            {user.expires_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Expira: {format(new Date(user.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => handleToggleActive(user)}
                            disabled={user.email === 'lyronrp@gmail.com'} // Can't disable owner
                          />
                        </div>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersOverview;
