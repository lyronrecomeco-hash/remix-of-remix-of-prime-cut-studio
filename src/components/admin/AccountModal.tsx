import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Crown, Trash2, AlertTriangle, Loader2, Sparkles, Check, MessageCircle, Shield } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountInfo {
  name: string;
  email: string;
  createdAt: string;
}

const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const { user, signOut } = useAuth();
  const { currentPlan, subscription } = useSubscription();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
          createdAt: adminUser.created_at,
        });
      } else {
        setAccountInfo({
          name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
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
    if (!currentPlan) return { name: 'FREE', color: 'bg-muted text-muted-foreground', icon: Shield };
    switch (currentPlan.name) {
      case 'lifetime':
        return { name: 'VITALÍCIO', color: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black', icon: Crown };
      case 'premium':
        return { name: 'PREMIUM', color: 'bg-primary text-primary-foreground', icon: Sparkles };
      default:
        return { name: 'FREE', color: 'bg-muted text-muted-foreground', icon: Shield };
    }
  };

  const planInfo = getPlanInfo();

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os planos Premium e Vitalício do Barber Studio.');
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  // Calculate trial days remaining
  const getTrialInfo = () => {
    if (!subscription || currentPlan?.name !== 'free') return null;
    const startDate = new Date(subscription.starts_at);
    const daysUsed = differenceInDays(new Date(), startDate);
    const daysRemaining = Math.max(0, 7 - daysUsed);
    return { daysUsed, daysRemaining };
  };

  const trialInfo = getTrialInfo();

  // Features lists
  const premiumFeatures = [
    'Agendamentos ilimitados',
    'Marketing via WhatsApp',
    'Relatórios avançados',
    'Galeria de fotos',
    'Metas mensais',
    'Suporte prioritário',
  ];

  const lifetimeFeatures = [
    'Tudo do Premium',
    'Acesso vitalício',
    'Atualizações gratuitas para sempre',
    'Sem mensalidade nunca mais',
    'Suporte VIP',
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta" size="md">
        <ModalBody className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Account Info Cards */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="text-lg font-semibold text-foreground">{accountInfo?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-medium text-foreground">{accountInfo?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="text-lg font-medium text-foreground">
                      {accountInfo?.createdAt
                        ? format(new Date(accountInfo.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Plan Section */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${currentPlan?.name === 'lifetime' ? 'bg-amber-500/20' : currentPlan?.name === 'premium' ? 'bg-primary/20' : 'bg-muted'} flex items-center justify-center`}>
                      <planInfo.icon className={`w-6 h-6 ${currentPlan?.name === 'lifetime' ? 'text-amber-500' : currentPlan?.name === 'premium' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plano Atual</p>
                      <Badge className={`${planInfo.color} text-sm px-3 py-1 mt-1`}>
                        {planInfo.name}
                      </Badge>
                    </div>
                  </div>
                  {currentPlan?.name !== 'lifetime' && (
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  )}
                </div>

                {/* Trial Progress for Free users */}
                {trialInfo && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Período de Teste</span>
                      <span className={`text-sm font-bold ${trialInfo.daysRemaining <= 2 ? 'text-destructive' : 'text-primary'}`}>
                        {trialInfo.daysRemaining} dias restantes
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(trialInfo.daysUsed / 7) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${trialInfo.daysRemaining <= 2 ? 'bg-destructive' : 'bg-primary'}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Zona de Perigo</p>
                      <p className="text-sm text-muted-foreground">Excluir conta permanentemente</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} className="px-6">
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upgrade Modal - Professional Design */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Escolha seu Plano"
        size="lg"
      >
        <ModalBody className="py-6">
          <p className="text-center text-muted-foreground mb-8">
            Desbloqueie todo o potencial do Barber Studio e leve sua barbearia para o próximo nível
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex flex-col border-2 border-primary/30 rounded-2xl p-6 bg-gradient-to-b from-primary/5 to-transparent hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Premium</h3>
                  <p className="text-sm text-muted-foreground">Mensal</p>
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 49</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              
              <ul className="space-y-3 mb-6 flex-1">
                {premiumFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                onClick={handleWhatsAppContact}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Assinar Premium
              </Button>
            </motion.div>

            {/* Lifetime Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex flex-col border-2 border-amber-500/50 rounded-2xl p-6 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-500/70 transition-colors"
            >
              <div className="absolute -top-3 right-4">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold px-3 py-1">
                  MELHOR VALOR
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Vitalício</h3>
                  <p className="text-sm text-muted-foreground">Pagamento único</p>
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 497</span>
                <span className="text-muted-foreground"> único</span>
              </div>
              
              <ul className="space-y-3 mb-6 flex-1">
                {lifetimeFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold"
                onClick={handleWhatsAppContact}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Comprar Vitalício
              </Button>
            </motion.div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            💳 Pagamento seguro • 🛡️ Garantia de 7 dias • 📞 Suporte dedicado
          </p>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="px-6">
            Talvez depois
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
        <ModalBody className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">Tem certeza absoluta?</p>
            <p className="text-muted-foreground mt-2">
              Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-destructive/50"
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
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'EXCLUIR' || isDeleting}
            className="px-6"
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
