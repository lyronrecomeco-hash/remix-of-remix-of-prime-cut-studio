import { memo, useMemo } from 'react';

interface Snowflake {
  id: number;
  size: number;
  x: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

const InteractiveBackground = memo(() => {
  const snowflakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      x: Math.random() * 100,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * -10,
      opacity: Math.random() * 0.6 + 0.2,
      drift: Math.random() * 30 - 15,
    }));
  }, []);

  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{ willChange: 'auto' }}
      aria-hidden="true"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      
      {/* Falling snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-primary/80"
          style={{
            width: flake.size,
            height: flake.size,
            left: `${flake.x}%`,
            top: '-10px',
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            filter: flake.size > 5 ? 'blur(1px)' : 'none',
            willChange: 'transform',
            ['--drift' as any]: `${flake.drift}px`,
          }}
        />
      ))}
      
      {/* Static decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/2 blur-3xl" />
    </div>
  );
});

InteractiveBackground.displayName = 'InteractiveBackground';

export default InteractiveBackground;
