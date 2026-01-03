import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Panel } from '@xyflow/react';

interface EmptyCanvasStateProps {
  onAddComponent: () => void;
  onCreateWithLuna: () => void;
}

export const EmptyCanvasState = ({ onAddComponent, onCreateWithLuna }: EmptyCanvasStateProps) => {
  return (
    <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-6"
      >
        {/* Add first step - dashed box */}
        <motion.button
          onClick={onAddComponent}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer min-w-[160px]"
        >
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/40 group-hover:border-primary/60 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Adicionar passo...
          </span>
        </motion.button>

        <span className="text-muted-foreground/50 text-sm font-medium">ou</span>

        {/* Build with AI - dashed box */}
        <motion.button
          onClick={onCreateWithLuna}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 cursor-pointer min-w-[160px]"
        >
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/40 group-hover:border-blue-500/60 flex items-center justify-center transition-colors">
            <Sparkles className="w-6 h-6 text-muted-foreground/60 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Criar com IA
          </span>
        </motion.button>
      </motion.div>
    </Panel>
  );
};
