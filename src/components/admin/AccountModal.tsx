import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Crown, Trash2, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountInfo {
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
}

const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const { user, signOut } = useAuth();
  const { currentPlan, allPlans, showUpgradeModal } = useSubscription();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpgradeCards, setShowUpgradeCards] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadAccountInfo();
    }
  }, [isOpen, user]);

  const loadAccountInfo = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminUser) {
        setAccountInfo({
          name: adminUser.name,
          email: adminUser.email,
          whatsapp: '',
          createdAt: adminUser.created_at,
        });
      } else {
        setAccountInfo({
          name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          whatsapp: '',
          createdAt: user.created_at || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar');
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user data from tables
      if (user) {
        await supabase.from('user_profiles').delete().eq('user_id', user.id);
        await supabase.from('shop_subscriptions').delete().eq('user_id', user.id);
        await supabase.from('usage_metrics').delete().eq('user_id', user.id);
        await supabase.from('admin_users').delete().eq('user_id', user.id);
        await supabase.from('user_roles').delete().eq('user_id', user.id);
      }

      toast.success('Conta excluída com sucesso');
      signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao excluir conta. Contate o suporte.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getPlanInfo = () => {
    if (!currentPlan) return { name: 'FREE', color: 'bg-muted', icon: null };
    switch (currentPlan.name) {
      case 'lifetime':
        return { name: 'VITALÍCIO', color: 'bg-gradient-to-r from-amber-500 to-yellow-500', icon: Crown };
      case 'premium':
        return { name: 'PREMIUM', color: 'bg-primary', icon: Sparkles };
      default:
        return { name: 'FREE', color: 'bg-muted', icon: null };
    }
  };

  const planInfo = getPlanInfo();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta" size="md">
        <ModalBody className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Account Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium text-foreground">{accountInfo?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{accountInfo?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="font-medium text-foreground">
                      {accountInfo?.createdAt
                        ? format(new Date(accountInfo.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Level */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nível da Conta</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${planInfo.color} text-sm px-3 py-1`}>
                        {planInfo.icon && <planInfo.icon className="w-3 h-3 mr-1" />}
                        {planInfo.name}
                      </Badge>
                    </div>
                  </div>
                  {currentPlan?.name !== 'lifetime' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpgradeCards(true)}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Crown className="w-4 h-4 mr-1" />
                      Upgrade
                    </Button>
                  )}
                </div>

                {currentPlan && (
                  <div className="text-sm text-muted-foreground">
                    {currentPlan.name === 'free' && (
                      <p>Limite de {(currentPlan.limits as { appointments_per_month?: number })?.appointments_per_month || 50} agendamentos/mês</p>
                    )}
                    {currentPlan.name === 'premium' && (
                      <p>Agendamentos ilimitados • Todas as funcionalidades</p>
                    )}
                    {currentPlan.name === 'lifetime' && (
                      <p>Acesso vitalício • Todas as funcionalidades para sempre</p>
                    )}
                  </div>
                )}
              </div>

              {/* Upgrade Cards */}
              {showUpgradeCards && currentPlan?.name !== 'lifetime' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  {allPlans
                    .filter(p => p.name !== 'free' && p.name !== currentPlan?.name)
                    .map(plan => (
                      <div
                        key={plan.id}
                        className={`border rounded-xl p-4 ${
                          plan.name === 'lifetime'
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-primary/50 bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-2">
                              {plan.name === 'lifetime' && <Crown className="w-4 h-4 text-amber-500" />}
                              {plan.display_name}
                            </p>
                            <p className="text-2xl font-bold text-foreground mt-1">
                              R$ {plan.price.toFixed(2)}
                              <span className="text-sm font-normal text-muted-foreground">
                                {plan.billing_cycle === 'monthly' ? '/mês' : ' único'}
                              </span>
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              onClose();
                              showUpgradeModal('marketing');
                            }}
                            className={plan.name === 'lifetime' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                          >
                            Contratar
                          </Button>
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}

              {/* Delete Account */}
              <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Zona de Perigo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Excluir sua conta é permanente e não pode ser desfeito.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir Conta
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText('');
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        <ModalBody className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-foreground font-medium">
              Tem certeza que deseja excluir sua conta?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação é irreversível. Todos os seus dados serão permanentemente deletados.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              placeholder="EXCLUIR"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteConfirmText('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'EXCLUIR' || isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Excluir Permanentemente
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AccountModal;
