import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator = ({ 
  pullDistance, 
  isRefreshing, 
  progress 
}: PullToRefreshIndicatorProps) => {
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
      style={{ 
        top: Math.max(pullDistance - 40, 8),
        opacity: Math.min(progress * 2, 1)
      }}
      initial={{ scale: 0 }}
      animate={{ scale: isRefreshing || progress > 0.3 ? 1 : progress }}
    >
      <div className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: isRefreshing ? 360 : progress * 180 
          }}
          transition={{ 
            duration: isRefreshing ? 0.8 : 0,
            repeat: isRefreshing ? Infinity : 0,
            ease: 'linear'
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 ${
              progress >= 1 || isRefreshing ? 'text-primary' : 'text-muted-foreground'
            }`} 
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
