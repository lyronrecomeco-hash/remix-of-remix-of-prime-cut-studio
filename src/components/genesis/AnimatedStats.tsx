import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  max?: number;
  icon: LucideIcon;
  color: string;
  suffix?: string;
  delay?: number;
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1500, delay: number = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return count;
}

export function AnimatedStatCard({ label, value, max, icon: Icon, color, suffix = '', delay = 0 }: StatCardProps) {
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : value;
  const animatedValue = useAnimatedCounter(numericValue, 1500, delay);
  const progressValue = max ? (animatedValue / max) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay / 1000, 
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="relative overflow-hidden group">
        {/* Animated background gradient */}
        <motion.div 
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
            color.includes('green') && "bg-gradient-to-br from-green-500 to-emerald-600",
            color.includes('blue') && "bg-gradient-to-br from-blue-500 to-indigo-600",
            color.includes('purple') && "bg-gradient-to-br from-purple-500 to-violet-600",
            color.includes('amber') && "bg-gradient-to-br from-amber-500 to-orange-600",
            color.includes('primary') && "bg-gradient-to-br from-primary to-primary/60"
          )}
        />
        
        {/* Animated glow effect */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"
          style={{
            background: color.includes('green') ? '#22c55e' : 
                       color.includes('blue') ? '#3b82f6' : 
                       color.includes('purple') ? '#a855f7' : 
                       color.includes('amber') ? '#f59e0b' : 'var(--primary)'
          }}
        />

        <CardContent className="pt-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Icon className={cn("w-8 h-8", color)} />
            </motion.div>
            <motion.span 
              className="text-3xl font-bold tabular-nums"
              key={animatedValue}
            >
              {animatedValue.toLocaleString()}{suffix}
            </motion.span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {max && (
            <div className="mt-3">
              <Progress 
                value={progressValue} 
                className="h-1.5" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {animatedValue} / {max}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Quick action card with animations
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  delay?: number;
}

export function QuickActionCard({ title, description, icon: Icon, onClick, delay = 0 }: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Animated plan card
interface PlanFeatureProps {
  label: string;
  current: number;
  max: number;
  delay?: number;
}

export function AnimatedPlanFeature({ label, current, max, delay = 0 }: PlanFeatureProps) {
  const animatedCurrent = useAnimatedCounter(current, 1000, delay);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      className="space-y-2"
    >
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{animatedCurrent} / {max}</p>
      </div>
      <Progress value={(animatedCurrent / max) * 100} className="h-2" />
    </motion.div>
  );
}

// Loading skeleton with shimmer
export function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="w-16 h-8 rounded bg-muted animate-pulse" />
        </div>
        <div className="w-24 h-4 rounded bg-muted animate-pulse" />
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-muted animate-pulse" />
        </div>
      </CardContent>
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </Card>
  );
}
