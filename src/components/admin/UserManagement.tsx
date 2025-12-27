import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Shield, 
  ShieldCheck,
  Scissors,
  Mail,
  Lock,
  Calendar,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type AppRole = 'super_admin' | 'admin' | 'barber';

const UserManagement = () => {
  const { adminUsers, createAdminUser, updateAdminUser, deleteAdminUser, isSuperAdmin, user } = useAuth();
  const { notify } = useNotification();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'barber' as AppRole,
    expiresAt: '',
  });

  const roleLabels: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
    super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-primary' },
    admin: { label: 'Administrador', icon: Shield, color: 'text-blue-500' },
    barber: { label: 'Barbeiro', icon: Scissors, color: 'text-green-500' },
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', role: 'barber', expiresAt: '' });
    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const handleCreate = async () => {
    setError('');
    
    const validation = userSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await createAdminUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.expiresAt || undefined
      );

      if (error) {
        setError(error.message);
        return;
      }

      notify.success('Usuário criado com sucesso!');
      resetForm();
    } catch {
      setError('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (userId: string) => {
    setIsLoading(true);

    try {
      const { error } = await updateAdminUser(userId, {
        name: formData.name,
        expiresAt: formData.expiresAt || null,
      });

      if (error) {
        notify.error('Erro ao atualizar', error.message);
        return;
      }

      notify.success('Usuário atualizado!');
      resetForm();
    } catch {
      notify.error('Erro', 'Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${userName}?`)) return;

    setIsLoading(true);

    try {
      const { error } = await deleteAdminUser(userId);

      if (error) {
        notify.error('Erro ao excluir', error.message);
        return;
      }

      notify.success('Usuário excluído!');
    } catch {
      notify.error('Erro', 'Erro ao excluir usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setIsLoading(true);

    try {
      const { error } = await updateAdminUser(userId, { isActive: !currentStatus });

      if (error) {
        notify.error('Erro', error.message);
        return;
      }

      notify.success(currentStatus ? 'Usuário desativado' : 'Usuário ativado');
    } catch {
      notify.error('Erro', 'Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (adminUser: typeof adminUsers[0]) => {
    setEditingId(adminUser.userId);
    setFormData({
      email: adminUser.email,
      password: '',
      name: adminUser.name,
      role: 'admin',
      expiresAt: adminUser.expiresAt || '',
    });
    setIsCreating(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
        <p className="text-muted-foreground">
          Apenas super administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">{adminUsers.length} usuário(s) cadastrado(s)</p>
        </div>
        <Button 
          variant="hero" 
          onClick={() => { setIsCreating(true); setEditingId(null); }}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(isCreating || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-xl p-6 border border-primary/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      disabled={!!editingId}
                    />
                  </div>
                </div>

                {!editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {!editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Acesso</label>
                    <div className="flex gap-2">
                      {(['admin', 'barber'] as AppRole[]).map((role) => {
                        const roleInfo = roleLabels[role];
                        return (
                          <button
                            key={role}
                            onClick={() => setFormData(prev => ({ ...prev, role }))}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                              formData.role === role
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <roleInfo.icon className="w-4 h-4" />
                            <span className="text-sm">{roleInfo.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Validade do Acesso (opcional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Deixe vazio para acesso permanente</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="hero"
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users List */}
      <div className="space-y-3">
        {adminUsers.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          adminUsers.map((adminUser) => {
            const isCurrentUser = adminUser.userId === user?.id;
            const isExpired = adminUser.expiresAt && new Date(adminUser.expiresAt) < new Date();
            
            return (
              <motion.div
                key={adminUser.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-xl p-4 ${!adminUser.isActive || isExpired ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      adminUser.isActive && !isExpired ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <span className="text-lg font-bold text-primary">
                        {adminUser.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{adminUser.name}</h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                            Você
                          </span>
                        )}
                        {!adminUser.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                            Desativado
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">
                            Expirado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{adminUser.email}</p>
                      {adminUser.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expira em: {new Date(adminUser.expiresAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCurrentUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(adminUser.userId, adminUser.isActive)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          adminUser.isActive 
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                        title={adminUser.isActive ? 'Desativar' : 'Ativar'}
                        disabled={isLoading}
                      >
                        {adminUser.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(adminUser)}
                        className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(adminUser.userId, adminUser.name)}
                        className="w-10 h-10 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center"
                        title="Excluir"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserManagement;
