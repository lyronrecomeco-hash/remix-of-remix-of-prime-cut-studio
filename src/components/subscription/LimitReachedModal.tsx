import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Crown, MessageCircle, X, TrendingUp, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LimitReachedModal = ({ isOpen, onClose }: LimitReachedModalProps) => {
  const { currentPlan, usage, allPlans } = useSubscription();

  const premiumPlan = allPlans.find(p => p.name === 'premium');
  const lifetimePlan = allPlans.find(p => p.name === 'lifetime');

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Atingi o limite de agendamentos do plano gratuito (${usage?.appointments_count || 50} agendamentos). Gostaria de fazer upgrade para o plano Premium para continuar atendendo meus clientes!`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-lg"
            >
              <div className="glass-card rounded-2xl overflow-hidden border border-amber-500/30">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-6 pb-8">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Você está bombando! 🔥</h2>
                    <p className="text-muted-foreground">
                      Parabéns! Você atingiu {usage?.appointments_count || 50} agendamentos este mês!
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Warning */}
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive mb-1">Limite do plano gratuito atingido</p>
                        <p className="text-sm text-muted-foreground">
                          Novos agendamentos estão sendo ocultados. Seus clientes podem estar tentando agendar e não conseguindo!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-bold text-foreground">{usage?.appointments_count || 50}</div>
                      <div className="text-xs text-muted-foreground">Agendamentos</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50">
                      <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-bold text-foreground">{usage?.clients_count || 0}+</div>
                      <div className="text-xs text-muted-foreground">Clientes</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-500/10">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                      <div className="text-lg font-bold text-foreground">100%</div>
                      <div className="text-xs text-muted-foreground">Usado</div>
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="space-y-3 mb-6">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-foreground">Premium</div>
                          <div className="text-sm text-muted-foreground">Agendamentos ilimitados</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-foreground">R$ {premiumPlan?.price || 49}</div>
                          <div className="text-xs text-muted-foreground">/mês</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          <div>
                            <div className="font-bold text-foreground">Vitalício</div>
                            <div className="text-sm text-muted-foreground">Pague uma vez, use para sempre</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-foreground">R$ {lifetimePlan?.price || 600}</div>
                          <div className="text-xs text-muted-foreground">único</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <Button
                      variant="hero"
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleWhatsAppContact}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Liberar agendamentos ilimitados
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={onClose}
                    >
                      Continuar com limite
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LimitReachedModal;
