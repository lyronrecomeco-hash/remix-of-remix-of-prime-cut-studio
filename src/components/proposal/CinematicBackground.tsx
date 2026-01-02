import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

interface CinematicBackgroundProps {
  variant?: 'genesis' | 'aurora' | 'minimal';
  intensity?: 'low' | 'medium' | 'high';
}

export const CinematicBackground = memo(({ 
  variant = 'genesis',
  intensity = 'medium'
}: CinematicBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Genesis Blue Theme Background
    const drawGenesisBackground = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deep Genesis Blue base
      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      bgGradient.addColorStop(0, '#0c1929');
      bgGradient.addColorStop(0.4, '#0a1525');
      bgGradient.addColorStop(0.8, '#060d18');
      bgGradient.addColorStop(1, '#030810');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const opacityMultiplier = intensity === 'high' ? 1.2 : intensity === 'low' ? 0.6 : 1;

      // Floating particles
      for (let i = 0; i < 80; i++) {
        const x = (Math.sin(i * 234.5 + time * 0.0003) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 567.8 + time * 0.0002) * 0.5 + 0.5) * canvas.height;
        const size = (Math.sin(i * 123) * 0.5 + 0.5) * 2 + 0.5;
        const pulse = Math.sin(time * 0.003 + i) * 0.4 + 0.6;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${pulse * 0.3 * opacityMultiplier})`;
        ctx.fill();
      }

      // Primary Blue Wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.6);
      
      for (let x = 0; x <= canvas.width; x += 8) {
        const wave1 = Math.sin((x * 0.003) + time * 0.0008) * 60;
        const wave2 = Math.sin((x * 0.006) + time * 0.0012) * 30;
        const wave3 = Math.sin((x * 0.002) + time * 0.0005) * 45;
        const y = canvas.height * 0.55 + wave1 + wave2 + wave3;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      
      const waveGradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      waveGradient.addColorStop(0, `rgba(59, 130, 246, ${0.08 * opacityMultiplier})`);
      waveGradient.addColorStop(0.5, `rgba(37, 99, 235, ${0.04 * opacityMultiplier})`);
      waveGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = waveGradient;
      ctx.fill();

      // Secondary accent wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.7);
      
      for (let x = 0; x <= canvas.width; x += 8) {
        const wave1 = Math.sin((x * 0.004) + time * 0.001 + 2) * 40;
        const wave2 = Math.sin((x * 0.007) + time * 0.0015 + 1) * 25;
        const y = canvas.height * 0.65 + wave1 + wave2;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      
      const wave2Gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
      wave2Gradient.addColorStop(0, `rgba(99, 102, 241, ${0.06 * opacityMultiplier})`);
      wave2Gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = wave2Gradient;
      ctx.fill();

      // Glowing orbs
      const orbs = [
        { x: 0.15, y: 0.2, size: 300, color: '59, 130, 246' },
        { x: 0.85, y: 0.3, size: 250, color: '99, 102, 241' },
        { x: 0.5, y: 0.7, size: 350, color: '37, 99, 235' },
      ];

      orbs.forEach((orb, i) => {
        const offsetX = Math.sin(time * 0.0003 + i * 2) * 50;
        const offsetY = Math.cos(time * 0.0004 + i * 2) * 30;
        const pulse = Math.sin(time * 0.002 + i) * 0.2 + 0.8;
        
        const orbGradient = ctx.createRadialGradient(
          canvas.width * orb.x + offsetX, canvas.height * orb.y + offsetY, 0,
          canvas.width * orb.x + offsetX, canvas.height * orb.y + offsetY, orb.size * pulse
        );
        orbGradient.addColorStop(0, `rgba(${orb.color}, ${0.15 * opacityMultiplier})`);
        orbGradient.addColorStop(0.5, `rgba(${orb.color}, ${0.05 * opacityMultiplier})`);
        orbGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = orbGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Grid pattern overlay (subtle)
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.02 * opacityMultiplier})`;
      ctx.lineWidth = 1;
      const gridSize = 100;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      time++;
      animationFrameId = requestAnimationFrame(drawGenesisBackground);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawGenesisBackground();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant, intensity]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      
      {/* Vignette Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/50 to-transparent" />
        
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Side vignettes */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,hsl(var(--background)/0.8)_100%)]" />
      </div>

      {/* Subtle floating accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
            left: '5%',
            top: '15%',
            filter: 'blur(60px)'
          }}
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)',
            right: '10%',
            bottom: '25%',
            filter: 'blur(50px)'
          }}
          animate={{
            x: [0, -60, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Noise texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </>
  );
});

CinematicBackground.displayName = 'CinematicBackground';