import { motion } from 'framer-motion';
import { Bot, MessageSquare, GitBranch, Zap, CheckCircle2, Clock, Users, Send } from 'lucide-react';

const nodes = [
  { id: 'start', x: 50, y: 80, icon: MessageSquare, label: 'Mensagem', color: 'from-green-500 to-emerald-600' },
  { id: 'bot', x: 200, y: 40, icon: Bot, label: 'IA', color: 'from-blue-500 to-cyan-600' },
  { id: 'branch', x: 200, y: 140, icon: GitBranch, label: 'Condição', color: 'from-purple-500 to-violet-600' },
  { id: 'action1', x: 350, y: 40, icon: Send, label: 'Resposta', color: 'from-primary to-primary/80' },
  { id: 'action2', x: 350, y: 140, icon: Users, label: 'Transferir', color: 'from-orange-500 to-amber-600' },
  { id: 'end', x: 480, y: 90, icon: CheckCircle2, label: 'Sucesso', color: 'from-green-500 to-emerald-600' },
];

const connections = [
  { from: 'start', to: 'bot', path: 'M90,95 Q145,50 185,55' },
  { from: 'start', to: 'branch', path: 'M90,95 Q145,140 185,150' },
  { from: 'bot', to: 'action1', path: 'M240,55 L335,55' },
  { from: 'branch', to: 'action2', path: 'M240,155 L335,155' },
  { from: 'action1', to: 'end', path: 'M390,55 Q430,70 465,100' },
  { from: 'action2', to: 'end', path: 'M390,155 Q430,130 465,110' },
];

export function FlowAnimation() {
  return (
    <div className="relative w-full h-[220px] overflow-hidden">
      {/* Background Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((conn, index) => (
          <g key={conn.from + conn.to}>
            {/* Base path */}
            <motion.path
              d={conn.path}
              fill="none"
              stroke="hsl(var(--primary) / 0.2)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.15 }}
            />
            {/* Animated glow */}
            <motion.path
              d={conn.path}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{ 
                pathLength: [0, 0.3, 0],
                pathOffset: [0, 0.7, 1]
              }}
              transition={{ 
                duration: 2.5,
                delay: 1.5 + index * 0.3,
                repeat: Infinity,
                repeatDelay: 1.5
              }}
              style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary)))' }}
            />
          </g>
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          className="absolute"
          style={{ left: node.x, top: node.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.3 + index * 0.1,
            type: 'spring',
            stiffness: 200
          }}
        >
          <motion.div
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.1 }}
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              y: {
                duration: 2 + index * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }
            }}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${node.color} blur-lg opacity-30 group-hover:opacity-50 transition-opacity`} />
            
            {/* Node card */}
            <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${node.color} flex flex-col items-center justify-center shadow-lg border border-white/10`}>
              <node.icon className="w-6 h-6 text-white" />
              <span className="text-[8px] text-white/90 font-medium mt-0.5">{node.label}</span>
            </div>

            {/* Pulse animation for start node */}
            {node.id === 'start' && (
              <motion.div
                className="absolute -inset-2 rounded-2xl border-2 border-green-500/50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Success check for end node */}
            {node.id === 'end' && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2, type: 'spring' }}
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      ))}

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Message bubbles animation */}
      <motion.div
        className="absolute left-8 top-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-20, 0, 30, 50] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 border border-primary/30">
          <Clock className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-primary">Olá!</span>
        </div>
      </motion.div>
    </div>
  );
}
