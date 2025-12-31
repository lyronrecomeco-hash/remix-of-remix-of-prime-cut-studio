import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Loader2,
  Search,
  RefreshCw,
  UserCog,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CRMTenant {
  id: string;
  name: string;
  segment: string | null;
  owner_user_id: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface CRMUser {
  id: string;
  crm_tenant_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'collaborator';
  is_active: boolean;
  created_at: string;
}

export default function CRMUsersManager() {
  const [tenants, setTenants] = useState<CRMTenant[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<CRMTenant | null>(null);
  
  // Modal states
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddUserToTenantOpen, setIsAddUserToTenantOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CRMUser | null>(null);
  const [addingToTenant, setAddingToTenant] = useState<CRMTenant | null>(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'manager' | 'collaborator',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, usersRes] = await Promise.all([
        supabase.from('crm_tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('crm_users').select('*').order('created_at', { ascending: false }),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (usersRes.error) throw usersRes.error;

      setTenants(tenantsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error: any) {
      console.error('Error fetching CRM data:', error);
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewLogin = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (userForm.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use edge function to create CRM user (avoids session swap and RLS issues)
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-crm-user', {
        body: {
          email: userForm.email,
          password: userForm.password,
          name: userForm.name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar login');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar login');
      }

      const { tenant, crmUser } = response.data;
      
      if (tenant) {
        setTenants([tenant, ...tenants]);
      }
      if (crmUser) {
        setUsers([crmUser, ...users]);
      }
      
      setUserForm({ name: '', email: '', password: '', role: 'admin' });
      setIsCreateUserOpen(false);
      toast.success('Login CRM criado com sucesso! O usuário completará o cadastro no primeiro acesso.');
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered') || error.message?.includes('já está cadastrado')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUserToTenant = async () => {
    if (!addingToTenant || !userForm.name || !userForm.email || !userForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (userForm.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use edge function to create CRM user for existing tenant
      const response = await supabase.functions.invoke('create-crm-user', {
        body: {
          email: userForm.email,
          password: userForm.password,
          name: userForm.name,
          tenantId: addingToTenant.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao adicionar usuário');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao adicionar usuário');
      }

      const { crmUser } = response.data;
      
      if (crmUser) {
        setUsers([crmUser, ...users]);
      }
      
      setUserForm({ name: '', email: '', password: '', role: 'admin' });
      setIsAddUserToTenantOpen(false);
      setAddingToTenant(null);
      toast.success('Usuário adicionado à empresa com sucesso!');
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.message?.includes('already registered') || error.message?.includes('já está cadastrado')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao adicionar usuário');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserActive = async (user: CRMUser) => {
    try {
      const { error } = await supabase
        .from('crm_users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(`Usuário ${user.is_active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      console.error('Error toggling user:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('crm_users')
        .update({ role: userForm.role })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: userForm.role } : u));
      setEditingUser(null);
      setIsEditUserOpen(false);
      toast.success('Função atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar função');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      // Check if this is the last user of the tenant
      const tenantUsers = users.filter(u => u.crm_tenant_id === user.crm_tenant_id);
      
      const { error } = await supabase.from('crm_users').delete().eq('id', userId);
      if (error) throw error;

      // If it was the last user, delete the tenant too
      if (tenantUsers.length === 1) {
        await supabase.from('crm_tenants').delete().eq('id', user.crm_tenant_id);
        setTenants(tenants.filter(t => t.id !== user.crm_tenant_id));
      }

      setUsers(users.filter(u => u.id !== userId));
      toast.success('Usuário excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      // First delete all users of this tenant
      await supabase.from('crm_users').delete().eq('crm_tenant_id', tenantId);
      
      // Then delete the tenant
      const { error } = await supabase.from('crm_tenants').delete().eq('id', tenantId);
      if (error) throw error;

      setTenants(tenants.filter(t => t.id !== tenantId));
      setUsers(users.filter(u => u.crm_tenant_id !== tenantId));
      toast.success('Empresa e todos os usuários excluídos com sucesso!');
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.segment && t.segment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = selectedTenant
    ? users.filter(u => u.crm_tenant_id === selectedTenant.id)
    : users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Admin</Badge>;
      case 'manager':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Gestor</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Colaborador</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão CRM</h2>
          <p className="text-muted-foreground">
            Crie logins e gerencie usuários do CRM
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Login CRM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Login CRM</DialogTitle>
                <DialogDescription>
                  Crie um acesso para o CRM. O usuário completará o cadastro da empresa no primeiro acesso.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome do Usuário *</Label>
                  <Input
                    id="user-name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email de Acesso *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="user-password"
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Ao criar o login, uma empresa será criada automaticamente. 
                    O usuário poderá personalizar o nome da empresa e segmento no primeiro acesso ao CRM.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNewLogin} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Login
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-sm text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <XCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.filter(t => !t.onboarding_completed).length}</p>
                <p className="text-sm text-muted-foreground">Onboarding Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas ou usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedTenant?.id || 'all'}
          onValueChange={(value) => setSelectedTenant(value === 'all' ? null : tenants.find(t => t.id === value) || null)}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" asChild>
          <a href="/crm/login" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Acessar CRM
          </a>
        </Button>
      </div>

      {/* Tenants Table */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Empresas CRM
          </CardTitle>
          <CardDescription>
            {filteredTenants.length} empresa(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma empresa encontrada. Crie um novo login para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => {
                    const tenantUserCount = users.filter(u => u.crm_tenant_id === tenant.id).length;
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          {tenant.segment ? (
                            <Badge variant="outline">{tenant.segment}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tenantUserCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {tenant.onboarding_completed ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Onboarding Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(tenant.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(tenant.id)}
                              title="Copiar ID"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Dialog 
                              open={isAddUserToTenantOpen && addingToTenant?.id === tenant.id} 
                              onOpenChange={(open) => {
                                setIsAddUserToTenantOpen(open);
                                if (open) {
                                  setAddingToTenant(tenant);
                                  setUserForm({ name: '', email: '', password: '', role: 'collaborator' });
                                } else {
                                  setAddingToTenant(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Adicionar usuário">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adicionar Usuário</DialogTitle>
                                  <DialogDescription>
                                    Adicionar novo usuário à empresa "{tenant.name}"
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="add-user-name">Nome *</Label>
                                    <Input
                                      id="add-user-name"
                                      value={userForm.name}
                                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                      placeholder="Nome completo"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="add-user-email">Email *</Label>
                                    <Input
                                      id="add-user-email"
                                      type="email"
                                      value={userForm.email}
                                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                      placeholder="email@exemplo.com"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="add-user-password">Senha *</Label>
                                    <div className="relative">
                                      <Input
                                        id="add-user-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full"
                                        onClick={() => setShowPassword(!showPassword)}
                                      >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="add-user-role">Função *</Label>
                                    <Select
                                      value={userForm.role}
                                      onValueChange={(value: 'admin' | 'manager' | 'collaborator') => 
                                        setUserForm({ ...userForm, role: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="manager">Gestor</SelectItem>
                                        <SelectItem value="collaborator">Colaborador</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setIsAddUserToTenantOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleAddUserToTenant} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Adicionar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive" title="Excluir empresa">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso excluirá permanentemente "{tenant.name}" e {tenantUserCount} usuário(s). Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTenant(tenant.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Logins CRM
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} login(s) {selectedTenant ? `de "${selectedTenant.name}"` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum login encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const tenant = tenants.find(t => t.id === user.crm_tenant_id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{user.email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(user.email)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Dialog open={isEditUserOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                              setIsEditUserOpen(open);
                              if (open) {
                                setEditingUser(user);
                                setUserForm({ ...userForm, role: user.role });
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Editar função">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Função</DialogTitle>
                                  <DialogDescription>
                                    Alterar função de {user.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Função</Label>
                                    <Select
                                      value={userForm.role}
                                      onValueChange={(value: 'admin' | 'manager' | 'collaborator') => 
                                        setUserForm({ ...userForm, role: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="manager">Gestor</SelectItem>
                                        <SelectItem value="collaborator">Colaborador</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleUpdateUserRole} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Salvar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleUserActive(user)}
                              title={user.is_active ? 'Desativar' : 'Ativar'}
                            >
                              {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive" title="Excluir">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Login?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso excluirá permanentemente o login de "{user.name}". Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}