import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Crown, Star, MessageCircle, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription, FEATURE_BLOCKING_INFO, FeatureName } from '@/contexts/SubscriptionContext';

const UpgradeModal = () => {
  const { upgradeModalOpen, upgradeModalFeature, hideUpgradeModal, currentPlan, allPlans } = useSubscription();

  if (!upgradeModalOpen || !upgradeModalFeature) return null;

  const featureInfo = FEATURE_BLOCKING_INFO[upgradeModalFeature] || {
    title: 'Recurso Premium',
    stat: 'Desbloqueie este recurso com o plano Premium!',
    description: 'Este recurso está disponível apenas para assinantes Premium.',
  };

  const premiumPlan = allPlans.find(p => p.name === 'premium');
  const lifetimePlan = allPlans.find(p => p.name === 'lifetime');

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse em assinar o plano Premium para minha barbearia. Gostaria de saber mais sobre os benefícios e como realizar o pagamento.`
    );
    // Replace with the actual owner's WhatsApp number
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {upgradeModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hideUpgradeModal}
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
              <div className="glass-card rounded-2xl overflow-hidden border border-primary/30">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-8">
                  <button
                    onClick={hideUpgradeModal}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{featureInfo.title}</h2>
                      <p className="text-sm text-muted-foreground">Recurso exclusivo Premium</p>
                    </div>
                  </div>

                  {/* Persuasive stat */}
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">Você sabia?</span>
                    </div>
                    <p className="text-foreground font-semibold">{featureInfo.stat}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-4">
                  <p className="text-muted-foreground mb-6">{featureInfo.description}</p>

                  {/* Plans comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Current Plan (FREE) */}
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Seu plano</div>
                      <div className="font-bold text-foreground mb-2">{currentPlan?.display_name || 'Gratuito'}</div>
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <X className="w-4 h-4" />
                        <span>Recurso bloqueado</span>
                      </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 relative">
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          POPULAR
                        </div>
                      </div>
                      <div className="text-sm text-primary mb-1">Premium</div>
                      <div className="font-bold text-foreground mb-2">
                        R$ {premiumPlan?.price || 49}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-500 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Tudo liberado</span>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime option */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="font-bold text-foreground">Vitalício</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Pague uma vez, use para sempre!</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">R$ {lifetimePlan?.price || 600}</div>
                        <div className="text-xs text-muted-foreground">pagamento único</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="hero"
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleWhatsAppContact}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Falar no WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={hideUpgradeModal}
                    >
                      Talvez depois
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

export default UpgradeModal;
