import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

interface CinematicBackgroundProps {
  variant?: 'aurora' | 'cosmic' | 'minimal';
}

export const CinematicBackground = memo(({ variant = 'aurora' }: CinematicBackgroundProps) => {
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

    const drawAurora = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deep space background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(0.5, '#0d0d24');
      bgGradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 567) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 234) * 0.5 + 0.5) * canvas.height;
        const twinkle = Math.sin(time * 0.002 + i) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, twinkle * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
        ctx.fill();
      }

      // Aurora layers
      const auroraColors = [
        { color: 'rgba(168, 85, 247, 0.15)', offset: 0 },
        { color: 'rgba(236, 72, 153, 0.1)', offset: 0.3 },
        { color: 'rgba(59, 130, 246, 0.08)', offset: 0.6 }
      ];

      auroraColors.forEach(({ color, offset }, index) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.3);
        
        for (let x = 0; x <= canvas.width; x += 10) {
          const wave1 = Math.sin((x * 0.003) + time * 0.001 + offset) * 80;
          const wave2 = Math.sin((x * 0.005) + time * 0.0015 + offset) * 40;
          const wave3 = Math.sin((x * 0.002) + time * 0.0008 + offset) * 60;
          const y = canvas.height * 0.4 + wave1 + wave2 + wave3 + (index * 50);
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Volumetric light beams
      for (let i = 0; i < 3; i++) {
        const beamX = canvas.width * (0.2 + i * 0.3) + Math.sin(time * 0.0005 + i) * 100;
        const gradient = ctx.createRadialGradient(
          beamX, 0, 0,
          beamX, canvas.height * 0.6, canvas.width * 0.3
        );
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      time++;
      animationFrameId = requestAnimationFrame(drawAurora);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawAurora();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        
        {/* Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* Side Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
            left: '10%',
            top: '20%'
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)',
            right: '15%',
            bottom: '30%'
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
            left: '50%',
            top: '60%'
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
    </>
  );
});

CinematicBackground.displayName = 'CinematicBackground';
