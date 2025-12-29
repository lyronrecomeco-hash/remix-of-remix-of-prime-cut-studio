import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Crown } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface UsageProgressProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

const UsageProgress = ({ compact = false, showUpgradeButton = true }: UsageProgressProps) => {
  const { currentPlan, usage, getRemainingAppointments, isLimitReached, showUpgradeModal } = useSubscription();

  // Premium/Lifetime users don't need to see usage
  if (currentPlan?.features.includes('all')) {
    if (compact) return null;
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">{currentPlan.display_name}</span>
        <span className="text-xs text-muted-foreground">• Agendamentos ilimitados</span>
      </div>
    );
  }

  if (!usage || !currentPlan) return null;

  const limit = currentPlan.limits.appointments_per_month;
  const used = usage.appointments_count;
  const remaining = getRemainingAppointments();
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const limitReached = isLimitReached();

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-amber-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getTextColor = () => {
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-amber-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-primary';
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
          limitReached ? "bg-destructive/10 border border-destructive/20" : "bg-secondary/50 hover:bg-secondary"
        )}
        onClick={() => limitReached && showUpgradeModal('dashboard')}
      >
        {limitReached ? (
          <AlertTriangle className="w-4 h-4 text-destructive" />
        ) : (
          <TrendingUp className={cn("w-4 h-4", getTextColor())} />
        )}
        <span className={cn("text-sm font-medium", limitReached ? "text-destructive" : getTextColor())}>
          {used}/{limit}
        </span>
        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
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
      limitReached ? "bg-destructive/10 border-destructive/30" : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {limitReached ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <TrendingUp className={cn("w-5 h-5", getTextColor())} />
          )}
          <span className="font-medium text-foreground">Agendamentos do Mês</span>
        </div>
        <div className={cn("text-sm font-semibold", getTextColor())}>
          {used}/{limit}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>

      {/* Status message */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {limitReached ? (
            <span className="text-destructive font-medium">Limite atingido! Novos agendamentos estão ocultos.</span>
          ) : remaining <= 10 ? (
            <span className="text-amber-500 font-medium">Apenas {remaining} agendamentos restantes!</span>
          ) : (
            <span>{remaining} agendamentos restantes este mês</span>
          )}
        </div>
        
        {showUpgradeButton && (percentage >= 60 || limitReached) && (
          <button
            onClick={() => showUpgradeModal('dashboard')}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Fazer upgrade →
          </button>
        )}
      </div>

      {/* Limit reached warning */}
      {limitReached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/20 border border-destructive/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive mb-1">Você está bombando! 🔥</p>
              <p className="text-sm text-muted-foreground">
                Clientes tentando agendar não estão conseguindo! Libere agendamentos ilimitados para não perder receita.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UsageProgress;
