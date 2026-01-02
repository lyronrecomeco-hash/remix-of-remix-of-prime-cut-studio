import { motion } from 'framer-motion';
import lunaImage from '@/assets/luna-avatar.png';

interface LunaAvatarProps {
  state?: 'idle' | 'talking' | 'thinking' | 'analyzing' | 'revealing' | 'confident';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LunaAvatar = ({ 
  state = 'idle', 
  size = 'md',
  className = '' 
}: LunaAvatarProps) => {
  const sizeConfig = {
    sm: { container: 'w-12 h-12', glow: 15, border: 2 },
    md: { container: 'w-20 h-20', glow: 25, border: 2 },
    lg: { container: 'w-32 h-32', glow: 35, border: 3 },
    xl: { container: 'w-44 h-44', glow: 50, border: 3 }
  };

  const config = sizeConfig[size];

  const getStateAnimation = () => {
    switch (state) {
      case 'talking':
        return { scale: [1, 1.02, 1] };
      case 'thinking':
        return { y: [0, -3, 0] };
      case 'analyzing':
        return { scale: [1, 1.01, 1], opacity: [1, 0.95, 1] };
      case 'revealing':
        return { scale: [1, 1.04, 1] };
      case 'confident':
        return { y: [0, -2, 0] };
      default:
        return { y: [0, -3, 0] };
    }
  };

  const getStateTransition = () => {
    switch (state) {
      case 'talking':
        return { duration: 0.8, repeat: Infinity };
      case 'thinking':
        return { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
      case 'analyzing':
        return { duration: 1.5, repeat: Infinity };
      case 'revealing':
        return { duration: 2, repeat: Infinity };
      case 'confident':
        return { duration: 3, repeat: Infinity, ease: 'easeInOut' as const };
      default:
        return { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };
    }
  };

  const getGlowColor = () => {
    switch (state) {
      case 'thinking':
      case 'analyzing':
        return 'hsl(var(--primary))';
      case 'revealing':
        return 'hsl(270 75% 60%)';
      case 'confident':
        return 'hsl(160 84% 39%)';
      default:
        return 'hsl(var(--primary))';
    }
  };

  const getGlowOpacity = () => {
    switch (state) {
      case 'revealing':
      case 'confident':
        return 0.5;
      default:
        return 0.35;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer glow ring */}
      <motion.div
        className={`absolute ${config.container} rounded-full`}
        style={{
          boxShadow: `0 0 ${config.glow}px ${config.glow / 2}px ${getGlowColor()}`,
          opacity: getGlowOpacity()
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [getGlowOpacity() * 0.7, getGlowOpacity(), getGlowOpacity() * 0.7]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Secondary pulse ring */}
      <motion.div
        className={`absolute ${config.container} rounded-full border-2`}
        style={{
          borderColor: getGlowColor(),
          opacity: 0.2
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0, 0.2]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      />

      {/* Main avatar container */}
      <motion.div
        className={`relative ${config.container} rounded-full overflow-hidden`}
        animate={getStateAnimation()}
        transition={getStateTransition()}
        style={{
          boxShadow: `
            0 0 0 ${config.border}px hsl(var(--primary) / 0.4),
            0 0 ${config.glow / 2}px hsl(var(--primary) / 0.3),
            0 8px 32px -8px rgba(0,0,0,0.5)
          `
        }}
      >
        {/* Gradient border overlay */}
        <div
          className="absolute inset-0 rounded-full z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
          }}
        />

        {/* Avatar image - no white background */}
        <motion.img
          src={lunaImage}
          alt="Luna - Assistente Genesis"
          className="w-full h-full object-cover object-center rounded-full"
          style={{
            filter: state === 'thinking' ? 'brightness(0.95) saturate(1.1)' : 'brightness(1) saturate(1.05)'
          }}
          draggable={false}
        />

        {/* State overlay effects */}
        {state === 'analyzing' && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 50%, hsl(var(--primary) / 0.15) 100%)'
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {state === 'revealing' && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 30%, hsl(270 75% 60% / 0.2) 100%)'
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Thinking indicator */}
      {state === 'thinking' && (
        <motion.div
          className="absolute -top-1 -right-1 z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-4 h-4 bg-primary rounded-full shadow-lg"
            style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* Confident/Online indicator */}
      {state === 'confident' && (
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div 
            className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-background shadow-lg"
            style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default LunaAvatar;