import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours } from 'date-fns';

interface UsageProgressProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

const UsageProgress = ({ compact = false, showUpgradeButton = true }: UsageProgressProps) => {
  const { currentPlan, subscription, showUpgradeModal } = useSubscription();

  // Premium/Lifetime users don't need to see usage
  if (currentPlan?.features.includes('all')) {
    if (compact) return null;
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">{currentPlan.display_name}</span>
        <span className="text-xs text-muted-foreground">• Acesso ilimitado</span>
      </div>
    );
  }

  if (!subscription || !currentPlan) return null;

  // Calculate trial days
  const startDate = new Date(subscription.starts_at);
  const now = new Date();
  const daysUsed = differenceInDays(now, startDate);
  const hoursUsed = differenceInHours(now, startDate);
  const totalDays = 7;
  const daysRemaining = Math.max(0, totalDays - daysUsed);
  const hoursRemaining = Math.max(0, (totalDays * 24) - hoursUsed);
  const percentage = Math.min((daysUsed / totalDays) * 100, 100);
  const isExpired = daysRemaining === 0;
  const isExpiringSoon = daysRemaining <= 2 && !isExpired;

  // Color based on remaining time
  const getColor = () => {
    if (isExpired) return 'bg-destructive';
    if (daysRemaining <= 1) return 'bg-destructive';
    if (daysRemaining <= 2) return 'bg-amber-500';
    if (daysRemaining <= 4) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getTextColor = () => {
    if (isExpired) return 'text-destructive';
    if (daysRemaining <= 1) return 'text-destructive';
    if (daysRemaining <= 2) return 'text-amber-500';
    if (daysRemaining <= 4) return 'text-yellow-500';
    return 'text-primary';
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
          isExpired ? "bg-destructive/10 border border-destructive/20" : "bg-secondary/50 hover:bg-secondary"
        )}
        onClick={() => isExpired && showUpgradeModal('dashboard')}
      >
        {isExpired ? (
          <AlertTriangle className="w-4 h-4 text-destructive" />
        ) : (
          <Clock className={cn("w-4 h-4", getTextColor())} />
        )}
        <span className={cn("text-sm font-medium", isExpired ? "text-destructive" : getTextColor())}>
          {isExpired ? 'Expirado' : `${daysRemaining}d`}
        </span>
        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn("h-full rounded-full", getColor())}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isExpired ? "bg-destructive/10 border-destructive/30" : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Clock className={cn("w-5 h-5", getTextColor())} />
          )}
          <span className="font-medium text-foreground">Período de Teste</span>
        </div>
        <div className={cn("text-sm font-semibold", getTextColor())}>
          {isExpired ? 'Expirado' : `${daysRemaining} dias restantes`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>

      {/* Status message */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isExpired ? (
            <span className="text-destructive font-medium">Seu período de teste expirou!</span>
          ) : isExpiringSoon ? (
            <span className="text-amber-500 font-medium">
              {daysRemaining === 1 
                ? `Expira em ${hoursRemaining} horas!` 
                : `Apenas ${daysRemaining} dias restantes!`}
            </span>
          ) : (
            <span>Aproveite {daysRemaining} dias de acesso completo</span>
          )}
        </div>
        
        {showUpgradeButton && (percentage >= 50 || isExpired) && (
          <button
            onClick={() => showUpgradeModal('dashboard')}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Fazer upgrade →
          </button>
        )}
      </div>

      {/* Expired warning */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/20 border border-destructive/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive mb-1">Teste encerrado!</p>
              <p className="text-sm text-muted-foreground">
                Faça upgrade agora para continuar usando todas as funcionalidades do Barber Studio.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UsageProgress;
