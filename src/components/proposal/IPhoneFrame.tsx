import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';

interface IPhoneFrameProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'titanium';
  showDynamicIsland?: boolean;
  time?: string;
}

export const IPhoneFrame = ({ 
  children, 
  className = '', 
  variant = 'titanium',
  showDynamicIsland = true,
  time
}: IPhoneFrameProps) => {
  const currentTime = time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`relative ${className}`}>
      {/* Outer Frame - iPhone 15 Pro Max Ultra Realistic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative"
      >
        {/* Titanium Outer Shell */}
        <div 
          className="relative rounded-[55px] p-[2.5px]"
          style={{
            background: 'linear-gradient(145deg, #8a8a8c 0%, #5a5a5c 15%, #3d3d3f 50%, #4a4a4c 85%, #6a6a6c 100%)',
            boxShadow: `
              0 50px 100px -20px rgba(0,0,0,0.8),
              0 30px 60px -10px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.15),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `
          }}
        >
          {/* Inner Bezel */}
          <div 
            className="relative rounded-[52px] p-[3px]"
            style={{
              background: 'linear-gradient(180deg, #2a2a2c 0%, #1a1a1c 100%)'
            }}
          >
            {/* Screen Container */}
            <div 
              className="relative bg-black rounded-[50px] overflow-hidden"
              style={{
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}
            >
              {/* Status Bar */}
              <div className="relative h-12 bg-gradient-to-b from-black/50 to-transparent flex items-center justify-between px-7 pt-3">
                {/* Left - Time */}
                <span className="text-white text-[15px] font-semibold tracking-tight">{currentTime}</span>
                
                {/* Dynamic Island */}
                {showDynamicIsland && (
                  <div className="absolute left-1/2 top-3 -translate-x-1/2">
                    <div 
                      className="bg-black rounded-full flex items-center justify-center"
                      style={{
                        width: '126px',
                        height: '37px',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
                      }}
                    >
                      {/* Camera Lens */}
                      <div className="absolute right-[14px] w-[11px] h-[11px] rounded-full bg-[#1a1a1c]">
                        <div className="absolute inset-[2px] rounded-full bg-[#0a0a0c]">
                          <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-[#1e2530] to-[#0d1015]">
                            <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] bg-white/20 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Right - Status Icons */}
                <div className="flex items-center gap-[5px]">
                  <Signal className="w-[17px] h-[17px] text-white" strokeWidth={2.5} />
                  <Wifi className="w-[17px] h-[17px] text-white" strokeWidth={2.5} />
                  <div className="relative">
                    <Battery className="w-[26px] h-[13px] text-white" strokeWidth={1.5} />
                    <div className="absolute inset-y-[3px] left-[4px] right-[7px] bg-white rounded-[2px]" />
                  </div>
                </div>
              </div>
              
              {/* Screen Content */}
              <div className="bg-black min-h-[580px]">
                {children}
              </div>
              
              {/* Home Indicator */}
              <div className="h-9 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center pb-2">
                <div 
                  className="w-[134px] h-[5px] bg-white/80 rounded-full"
                  style={{
                    boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side Buttons - Left */}
        <div 
          className="absolute -left-[2px] top-[120px] w-[3px] h-[30px] rounded-l-sm"
          style={{
            background: 'linear-gradient(90deg, #6a6a6c 0%, #4a4a4c 100%)',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.3)'
          }}
        />
        <div 
          className="absolute -left-[2px] top-[170px] w-[3px] h-[55px] rounded-l-sm"
          style={{
            background: 'linear-gradient(90deg, #6a6a6c 0%, #4a4a4c 100%)',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.3)'
          }}
        />
        <div 
          className="absolute -left-[2px] top-[235px] w-[3px] h-[55px] rounded-l-sm"
          style={{
            background: 'linear-gradient(90deg, #6a6a6c 0%, #4a4a4c 100%)',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.3)'
          }}
        />
        
        {/* Side Buttons - Right (Power) */}
        <div 
          className="absolute -right-[2px] top-[185px] w-[3px] h-[80px] rounded-r-sm"
          style={{
            background: 'linear-gradient(90deg, #4a4a4c 0%, #6a6a6c 100%)',
            boxShadow: '2px 0 4px rgba(0,0,0,0.3)'
          }}
        />

        {/* Subtle Screen Reflection */}
        <div 
          className="absolute inset-0 rounded-[55px] pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 100%)'
          }}
        />
      </motion.div>
    </div>
  );
};

// MacBook Pro Frame Component
interface MacBookFrameProps {
  children: ReactNode;
  className?: string;
}

export const MacBookFrame = ({ children, className = '' }: MacBookFrameProps) => {
  return (
    <div className={`relative ${className}`}>
      {/* Screen Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Screen Housing */}
        <div 
          className="relative bg-[#1d1d1f] rounded-t-2xl p-[6px]"
          style={{
            boxShadow: `
              0 40px 80px -20px rgba(0,0,0,0.7),
              0 20px 40px -10px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `
          }}
        >
          {/* Camera Notch */}
          <div className="absolute top-[9px] left-1/2 -translate-x-1/2 z-10">
            <div className="w-[6px] h-[6px] rounded-full bg-[#0a0a0a] border border-[#2a2a2a]">
              <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-[#1a1a1c] to-[#0a0a0c]" />
            </div>
          </div>
          
          {/* Screen Bezel */}
          <div className="bg-black rounded-xl overflow-hidden">
            {/* Menu Bar */}
            <div className="h-7 bg-gradient-to-b from-[#3a3a3c] to-[#2d2d2f] flex items-center px-3">
              {/* Traffic Lights */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all cursor-pointer" />
              </div>
              
              {/* Title */}
              <div className="flex-1 flex justify-center">
                <span className="text-white/50 text-xs font-medium tracking-wide">
                  Genesis Hub — Painel Administrativo
                </span>
              </div>
              
              {/* Right Spacer */}
              <div className="w-14" />
            </div>
            
            {/* Content Area */}
            <div className="min-h-[400px]">
              {children}
            </div>
          </div>
        </div>
        
        {/* Keyboard/Base Section */}
        <div 
          className="relative h-[14px] mx-10"
          style={{
            background: 'linear-gradient(180deg, #2d2d2f 0%, #1d1d1f 50%, #0d0d0f 100%)',
            borderRadius: '0 0 4px 4px',
          }}
        >
          {/* Hinge Detail */}
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-24 h-[3px] rounded-full bg-[#3a3a3c]" />
        </div>
        
        {/* Bottom Base */}
        <div 
          className="relative h-[6px] mx-6"
          style={{
            background: 'linear-gradient(180deg, #1d1d1f 0%, #2a2a2c 100%)',
            borderRadius: '0 0 8px 8px',
          }}
        />
      </motion.div>
    </div>
  );
};

export default IPhoneFrame;