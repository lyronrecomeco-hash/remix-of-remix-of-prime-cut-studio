import { motion } from 'framer-motion';

interface LunaAvatarProps {
  state: 'idle' | 'talking' | 'thinking' | 'excited' | 'seductive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LunaAvatar = ({ state, size = 'md', className = '' }: LunaAvatarProps) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  const containerSize = {
    sm: 80,
    md: 128,
    lg: 192,
    xl: 256
  };

  return (
    <motion.div 
      className={`relative ${sizeClasses[size]} ${className}`}
      animate={state === 'talking' ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: state === 'talking' ? Infinity : 0, ease: 'easeInOut' }}
    >
      {/* Outer Aurora Ring */}
      <motion.div 
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4), rgba(59,130,246,0.4), rgba(168,85,247,0.4))',
          filter: 'blur(20px)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Pulsing Glow */}
      <motion.div 
        className="absolute inset-[-10%] rounded-full bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-cyan-500/40"
        style={{ filter: 'blur(30px)' }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner Breathing Ring */}
      <motion.div 
        className="absolute inset-0 rounded-full border-2 border-white/20"
        animate={{ 
          scale: [1, 1.05, 1],
          borderColor: ['rgba(255,255,255,0.2)', 'rgba(168,85,247,0.5)', 'rgba(255,255,255,0.2)']
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900" />
        
        {/* Animated Mesh Background */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 40%, rgba(168,85,247,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.2) 0%, transparent 50%)'
          }}
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(168,85,247,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 40% 70%, rgba(168,85,247,0.2) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(168,85,247,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.2) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Luna Face SVG - More Expressive */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full">
          <defs>
            {/* Gradients */}
            <radialGradient id="skinGlow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(255,220,210,1)" />
              <stop offset="100%" stopColor="rgba(240,190,180,1)" />
            </radialGradient>
            
            <linearGradient id="hairGradientLuna" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(168,85,247,0.8)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0)" />
            </radialGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Hair Shine */}
            <linearGradient id="hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Hair - Flowing */}
          <motion.path
            d="M15 55 Q15 20 50 18 Q85 20 85 55 Q85 35 70 30 Q55 28 50 30 Q45 28 30 30 Q15 35 15 55"
            fill="url(#hairGradientLuna)"
            animate={state === 'excited' ? { d: [
              "M15 55 Q15 20 50 18 Q85 20 85 55 Q85 35 70 30 Q55 28 50 30 Q45 28 30 30 Q15 35 15 55",
              "M13 55 Q13 18 50 16 Q87 18 87 55 Q87 33 70 28 Q55 26 50 28 Q45 26 30 28 Q13 33 13 55",
              "M15 55 Q15 20 50 18 Q85 20 85 55 Q85 35 70 30 Q55 28 50 30 Q45 28 30 30 Q15 35 15 55"
            ]} : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Hair Shine Effect */}
          <motion.path
            d="M25 30 Q50 25 75 30"
            stroke="url(#hairShine)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Face */}
          <ellipse cx="50" cy="55" rx="30" ry="34" fill="url(#skinGlow)" />
          
          {/* Subtle Face Contour */}
          <ellipse cx="50" cy="55" rx="29" ry="33" fill="none" stroke="rgba(180,120,100,0.2)" strokeWidth="0.5" />

          {/* Eyes Container - Breathing Animation */}
          <motion.g
            animate={{ 
              y: state === 'thinking' ? [-1, 1, -1] : 0
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Left Eye */}
            <g>
              {/* Eye Glow */}
              <motion.circle 
                cx="38" cy="52" r="10" 
                fill="url(#eyeGlow)"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Eye White */}
              <ellipse cx="38" cy="52" rx="7" ry="8" fill="white" />
              
              {/* Iris */}
              <motion.circle 
                cx="38" 
                cy="52" 
                r="5" 
                fill="#6d28d9"
                animate={state === 'seductive' ? { cx: [38, 40, 38] } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Pupil */}
              <motion.circle 
                cx="38" 
                cy="52" 
                r="2.5" 
                fill="#1e1b4b"
                animate={state === 'talking' ? { 
                  r: [2.5, 3, 2.5],
                  cy: [52, 51, 52]
                } : state === 'excited' ? {
                  r: [2.5, 3.5, 2.5]
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              
              {/* Eye Sparkle - Multiple */}
              <circle cx="36" cy="50" r="1.5" fill="white" />
              <circle cx="40" cy="53" r="0.8" fill="white" opacity="0.7" />
              
              {/* Eyelashes */}
              <motion.path
                d="M31 48 Q34 46 38 47 Q42 46 45 48"
                stroke="#1e1b4b"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={state === 'seductive' ? { 
                  d: "M31 49 Q34 48 38 48 Q42 48 45 49"
                } : {}}
              />
            </g>

            {/* Right Eye */}
            <g>
              {/* Eye Glow */}
              <motion.circle 
                cx="62" cy="52" r="10" 
                fill="url(#eyeGlow)"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              
              {/* Eye White */}
              <ellipse cx="62" cy="52" rx="7" ry="8" fill="white" />
              
              {/* Iris */}
              <motion.circle 
                cx="62" 
                cy="52" 
                r="5" 
                fill="#6d28d9"
                animate={state === 'seductive' ? { cx: [62, 64, 62] } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Pupil */}
              <motion.circle 
                cx="62" 
                cy="52" 
                r="2.5" 
                fill="#1e1b4b"
                animate={state === 'talking' ? { 
                  r: [2.5, 3, 2.5],
                  cy: [52, 51, 52]
                } : state === 'excited' ? {
                  r: [2.5, 3.5, 2.5]
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              
              {/* Eye Sparkle - Multiple */}
              <circle cx="60" cy="50" r="1.5" fill="white" />
              <circle cx="64" cy="53" r="0.8" fill="white" opacity="0.7" />
              
              {/* Eyelashes */}
              <motion.path
                d="M55 48 Q58 46 62 47 Q66 46 69 48"
                stroke="#1e1b4b"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={state === 'seductive' ? { 
                  d: "M55 49 Q58 48 62 48 Q66 48 69 49"
                } : {}}
              />
            </g>
          </motion.g>

          {/* Eyebrows - Expressive */}
          <motion.path
            d="M29 44 Q34 41 43 43"
            stroke="rgba(50,30,30,0.6)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            animate={state === 'excited' ? { d: "M29 42 Q34 39 43 41" } : state === 'thinking' ? { d: "M29 43 Q34 42 43 44" } : {}}
          />
          <motion.path
            d="M57 43 Q66 41 71 44"
            stroke="rgba(50,30,30,0.6)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            animate={state === 'excited' ? { d: "M57 41 Q66 39 71 42" } : state === 'thinking' ? { d: "M57 44 Q66 42 71 43" } : {}}
          />
          
          {/* Nose - Delicate */}
          <path d="M48 58 Q50 62 52 58" stroke="rgba(180,130,120,0.5)" strokeWidth="1" fill="none" />
          
          {/* Lips - Sensual */}
          <motion.g>
            {/* Upper Lip */}
            <motion.path
              d={state === 'talking' 
                ? "M40 70 Q45 68 50 69 Q55 68 60 70" 
                : state === 'seductive'
                ? "M39 69 Q45 67 50 68 Q55 67 61 69"
                : "M41 69 Q45 67 50 68 Q55 67 59 69"
              }
              fill="#e879a0"
              animate={state === 'talking' ? {
                d: [
                  "M40 70 Q45 68 50 69 Q55 68 60 70",
                  "M40 69 Q45 67 50 68 Q55 67 60 69",
                  "M40 70 Q45 68 50 69 Q55 68 60 70"
                ]
              } : {}}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            
            {/* Lower Lip */}
            <motion.path
              d={state === 'talking'
                ? "M40 70 Q50 78 60 70"
                : state === 'seductive' || state === 'excited'
                ? "M39 69 Q50 77 61 69"
                : "M41 69 Q50 75 59 69"
              }
              fill="#ec4899"
              animate={state === 'talking' ? {
                d: [
                  "M40 70 Q50 78 60 70",
                  "M40 69 Q50 74 60 69",
                  "M40 70 Q50 78 60 70"
                ]
              } : {}}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            
            {/* Lip Shine */}
            <ellipse cx="50" cy="72" rx="4" ry="1.5" fill="rgba(255,255,255,0.3)" />
          </motion.g>
          
          {/* Blush - Animated */}
          <motion.circle 
            cx="28" cy="60" r="6" 
            fill="rgba(255,150,170,0.4)"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.circle 
            cx="72" cy="60" r="6" 
            fill="rgba(255,150,170,0.4)"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </svg>
      </div>

      {/* Floating Energy Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-violet-400"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}

      {/* State-specific Effects */}
      {state === 'thinking' && (
        <motion.div 
          className="absolute -top-4 -right-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full"
              style={{
                transform: `rotate(${i * 120}deg) translateY(-15px)`
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      )}

      {state === 'excited' && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400 text-sm"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${Math.random() * 30}%`
              }}
              animate={{
                y: [0, -30],
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15
              }}
            >
              ✦
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
};
