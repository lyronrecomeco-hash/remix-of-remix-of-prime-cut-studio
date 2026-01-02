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
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56'
  };

  const glowSizes = {
    sm: { blur: 10, spread: 5 },
    md: { blur: 20, spread: 10 },
    lg: { blur: 30, spread: 15 },
    xl: { blur: 40, spread: 20 }
  };

  // Estados de animação baseados no contexto emocional
  const getStateAnimation = () => {
    switch (state) {
      case 'talking':
        return { scale: [1, 1.02, 1] };
      case 'thinking':
        return { y: [0, -3, 0] };
      case 'analyzing':
        return { scale: [1, 1.01, 1], opacity: [1, 0.95, 1] };
      case 'revealing':
        return { scale: [1, 1.05, 1] };
      case 'confident':
        return { y: [0, -2, 0] };
      default:
        return { y: [0, -4, 0] };
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

  // Cor do glow baseada no estado
  const getGlowColor = () => {
    switch (state) {
      case 'thinking':
      case 'analyzing':
        return 'rgba(59, 130, 246, 0.4)'; // Azul
      case 'revealing':
        return 'rgba(168, 85, 247, 0.5)'; // Roxo
      case 'confident':
        return 'rgba(16, 185, 129, 0.4)'; // Verde
      default:
        return 'rgba(99, 102, 241, 0.3)'; // Indigo sutil
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Aura externa animada - sutil e profissional */}
      <motion.div
        className={`absolute inset-0 rounded-full ${sizeClasses[size]}`}
        style={{
          background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Anel de luz secundário */}
      <motion.div
        className={`absolute inset-0 rounded-full ${sizeClasses[size]}`}
        style={{
          boxShadow: `0 0 ${glowSizes[size].blur}px ${glowSizes[size].spread}px ${getGlowColor()}`
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Container principal da imagem */}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}
        animate={getStateAnimation()}
        transition={getStateTransition()}
      >
        {/* Borda premium */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(59, 130, 246, 0.3) 100%)',
            padding: '2px'
          }}
        />

        {/* Imagem da Luna */}
        <motion.img
          src={lunaImage}
          alt="Luna - Assistente Genesis"
          className="w-full h-full object-cover object-top rounded-full"
          style={{
            filter: state === 'thinking' ? 'brightness(0.95)' : 'brightness(1)'
          }}
        />

        {/* Overlay sutil para estados específicos */}
        {state === 'analyzing' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, transparent 60%, rgba(59, 130, 246, 0.2) 100%)'
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {state === 'revealing' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, transparent 60%, rgba(168, 85, 247, 0.2) 100%)'
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Indicador de estado "pensando" */}
      {state === 'thinking' && (
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-4 h-4 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* Indicador "online" para estado confident */}
      {state === 'confident' && (
        <motion.div
          className="absolute -bottom-1 -right-1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950" />
        </motion.div>
      )}
    </div>
  );
};

export default LunaAvatar;
