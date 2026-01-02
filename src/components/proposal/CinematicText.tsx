import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SeductiveTextProps {
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  glowColor?: string;
}

export const SeductiveText = ({ 
  text, 
  delay = 0,
  className = '',
  onComplete,
  glowColor = 'rgba(168,85,247,0.5)'
}: SeductiveTextProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const words = text.split(' ');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    let wordIndex = 0;
    const interval = setInterval(() => {
      if (wordIndex <= words.length) {
        setDisplayedWords(words.slice(0, wordIndex));
        wordIndex++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isVisible, words, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.p 
      className={`${className} leading-relaxed`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {displayedWords.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="inline-block mr-[0.3em]"
          style={{
            textShadow: index === displayedWords.length - 1 ? `0 0 20px ${glowColor}` : 'none'
          }}
        >
          {word}
        </motion.span>
      ))}
      {displayedWords.length < words.length && displayedWords.length > 0 && (
        <motion.span
          className="inline-block w-0.5 h-[1em] bg-violet-400 ml-1"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.p>
  );
};

interface DramaticRevealProps {
  lines: string[];
  className?: string;
  lineDelay?: number;
  onComplete?: () => void;
}

export const DramaticReveal = ({ 
  lines, 
  className = '',
  lineDelay = 2000,
  onComplete
}: DramaticRevealProps) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [completedLines, setCompletedLines] = useState<number[]>([]);

  useEffect(() => {
    // Start first line after initial delay
    const startTimer = setTimeout(() => {
      setCurrentLineIndex(0);
    }, 500);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
      const timer = setTimeout(() => {
        setCompletedLines(prev => [...prev, currentLineIndex]);
        
        if (currentLineIndex < lines.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
        } else {
          setTimeout(() => onComplete?.(), 1000);
        }
      }, lineDelay);

      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, lines.length, lineDelay, onComplete]);

  return (
    <div className={`space-y-6 ${className}`}>
      <AnimatePresence mode="wait">
        {lines.map((line, index) => {
          if (index > currentLineIndex) return null;
          
          const isActive = index === currentLineIndex;
          const isCompleted = completedLines.includes(index);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ 
                opacity: isActive ? 1 : 0.5,
                y: 0,
                scale: isActive ? 1 : 0.98
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`transition-all duration-500 ${
                isActive ? '' : 'blur-[1px]'
              }`}
            >
              <SeductiveText 
                text={line}
                glowColor={isActive ? 'rgba(168,85,247,0.6)' : 'transparent'}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

interface ImpactNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  delay?: number;
}

export const ImpactNumber = ({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
  className = '',
  delay = 0
}: ImpactNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, value, duration]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={hasStarted ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.span
        className="inline-block"
        animate={hasStarted ? { 
          textShadow: [
            '0 0 20px rgba(168,85,247,0.8)',
            '0 0 40px rgba(168,85,247,0.4)',
            '0 0 20px rgba(168,85,247,0.8)'
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {prefix}{displayValue.toLocaleString('pt-BR')}{suffix}
      </motion.span>
    </motion.div>
  );
};

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlitchText = ({ text, className = '', intensity = 'low' }: GlitchTextProps) => {
  const glitchOffset = intensity === 'high' ? 4 : intensity === 'medium' ? 2 : 1;

  return (
    <div className={`relative ${className}`}>
      <motion.span
        className="absolute inset-0 text-cyan-400 opacity-70"
        animate={{
          x: [-glitchOffset, glitchOffset, -glitchOffset],
          opacity: [0.7, 0.3, 0.7]
        }}
        transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-pink-400 opacity-70"
        animate={{
          x: [glitchOffset, -glitchOffset, glitchOffset],
          opacity: [0.7, 0.3, 0.7]
        }}
        transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3, delay: 0.05 }}
      >
        {text}
      </motion.span>
      <span className="relative">{text}</span>
    </div>
  );
};
