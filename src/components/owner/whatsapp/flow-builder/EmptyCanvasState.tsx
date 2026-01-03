import { motion } from 'framer-motion';
import { Plus, Sparkles, GitBranch, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@xyflow/react';

interface EmptyCanvasStateProps {
  onAddComponent: () => void;
  onCreateWithLuna: () => void;
}

export const EmptyCanvasState = ({ onAddComponent, onCreateWithLuna }: EmptyCanvasStateProps) => {
  return (
    <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10">
            <GitBranch className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold mb-2"
        >
          Comece seu fluxo
        </motion.h3>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8 max-w-sm"
        >
          Adicione componentes para construir sua automação ou deixe a Luna IA criar para você
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={onAddComponent}
            size="lg"
            className="gap-2 shadow-lg min-w-[200px]"
          >
            <Plus className="w-5 h-5" />
            Adicionar Componente
          </Button>
          
          <Button
            onClick={onCreateWithLuna}
            variant="outline"
            size="lg"
            className="gap-2 min-w-[200px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:from-blue-500/20 hover:to-cyan-500/20"
          >
            <Sparkles className="w-5 h-5 text-blue-500" />
            Criar com Luna IA
          </Button>
        </motion.div>

        {/* Arrow hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown className="w-6 h-6 text-muted-foreground/50" />
          </motion.div>
          <p className="text-xs text-muted-foreground/50 mt-2">
            Ou arraste componentes do menu
          </p>
        </motion.div>
      </motion.div>
    </Panel>
  );
};
