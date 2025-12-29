import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useSubscription, FeatureName, FEATURE_BLOCKING_INFO } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface FeatureLockProps {
  feature: FeatureName;
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
  compact?: boolean;
}

const FeatureLock = ({ 
  feature, 
  children, 
  className = '',
  showOverlay = true,
  compact = false
}: FeatureLockProps) => {
  const { isFeatureAllowed, showUpgradeModal } = useSubscription();

  const isAllowed = isFeatureAllowed(feature);

  if (isAllowed) {
    return <>{children}</>;
  }

  const featureInfo = FEATURE_BLOCKING_INFO[feature];

  const handleClick = () => {
    showUpgradeModal(feature);
  };

  if (compact) {
    // Compact version - just shows a lock icon button
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border cursor-pointer transition-all group",
          className
        )}
      >
        <Lock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {featureInfo?.title || 'Recurso Premium'}
        </span>
      </button>
    );
  }

  if (showOverlay) {
    // Overlay version - shows content blurred with lock overlay
    return (
      <div className={cn("relative", className)}>
        {/* Blurred content */}
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Lock overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl cursor-pointer"
          onClick={handleClick}
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {featureInfo?.title || 'Recurso Premium'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              {featureInfo?.description || 'Este recurso está disponível apenas para assinantes Premium.'}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <Lock className="w-4 h-4" />
              Desbloquear
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Button version - replaces content with a button
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "w-full p-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-center",
        className
      )}
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {featureInfo?.title || 'Recurso Premium'}
      </h3>
      <p className="text-sm text-muted-foreground">
        Clique para desbloquear
      </p>
    </motion.button>
  );
};

export default FeatureLock;
