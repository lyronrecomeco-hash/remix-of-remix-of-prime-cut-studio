import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PhaseTransitionProps {
  children: ReactNode;
  phaseKey: string;
  direction?: 'up' | 'down' | 'fade';
}

export const PhaseTransition = ({ children, phaseKey, direction = 'fade' }: PhaseTransitionProps) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    up: {
      initial: { opacity: 0, y: 100, scale: 0.95, filter: 'blur(10px)' },
      animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, y: -50, scale: 1.02, filter: 'blur(5px)' }
    },
    down: {
      initial: { opacity: 0, y: -100, scale: 0.95, filter: 'blur(10px)' },
      animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, y: 50, scale: 1.02, filter: 'blur(5px)' }
    }
  };

  const variant = variants[direction];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface CinematicEnterProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const CinematicEnter = ({ children, delay = 0, className = '' }: CinematicEnterProps) => {
  return (
    <motion.div
      className={className}
      initial={{ 
        opacity: 0, 
        y: 40, 
        scale: 0.9,
        filter: 'blur(10px)'
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: 'blur(0px)'
      }}
      transition={{
        duration: 1,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

interface PulseGlowProps {
  children: ReactNode;
  color?: string;
  intensity?: 'soft' | 'medium' | 'strong';
  className?: string;
}

export const PulseGlow = ({ 
  children, 
  color = 'violet',
  intensity = 'medium',
  className = ''
}: PulseGlowProps) => {
  const glowSizes = {
    soft: { min: '0 0 20px', max: '0 0 40px' },
    medium: { min: '0 0 30px', max: '0 0 60px' },
    strong: { min: '0 0 40px', max: '0 0 80px' }
  };

  const colors = {
    violet: 'rgba(168,85,247,',
    pink: 'rgba(236,72,153,',
    cyan: 'rgba(59,130,246,',
    emerald: 'rgba(16,185,129,'
  };

  const colorBase = colors[color as keyof typeof colors] || colors.violet;
  const glow = glowSizes[intensity];

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `${glow.min} ${colorBase}0.4)`,
          `${glow.max} ${colorBase}0.6)`,
          `${glow.min} ${colorBase}0.4)`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};

interface FloatingElementProps {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}

export const FloatingElement = ({ 
  children, 
  amplitude = 10,
  duration = 4,
  className = ''
}: FloatingElementProps) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};
