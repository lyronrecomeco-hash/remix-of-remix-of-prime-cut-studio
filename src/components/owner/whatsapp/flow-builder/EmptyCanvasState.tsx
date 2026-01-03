import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

interface EmptyCanvasStateProps {
  onAddComponent: () => void;
  onCreateWithLuna: () => void;
}

export const EmptyCanvasState = ({ onAddComponent, onCreateWithLuna }: EmptyCanvasStateProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center gap-6 pointer-events-auto"
      >
        {/* Add first step - dashed box */}
        <motion.button
          onClick={onAddComponent}
          whileHover={{ scale: 1.03, borderColor: 'hsl(var(--primary))' }}
          whileTap={{ scale: 0.98 }}
          className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 cursor-pointer min-w-[150px]"
        >
          <div className="w-11 h-11 rounded-lg border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/60 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-muted-foreground/70 group-hover:text-foreground transition-colors">
            Adicionar passo...
          </span>
        </motion.button>

        <span className="text-muted-foreground/40 text-sm font-medium select-none">ou</span>

        {/* Build with AI - dashed box */}
        <motion.button
          onClick={onCreateWithLuna}
          whileHover={{ scale: 1.03, borderColor: 'rgb(59, 130, 246)' }}
          whileTap={{ scale: 0.98 }}
          className="group flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-blue-500/60 hover:bg-blue-500/5 transition-all duration-200 cursor-pointer min-w-[150px]"
        >
          <div className="w-11 h-11 rounded-lg border-2 border-dashed border-muted-foreground/30 group-hover:border-blue-500/60 flex items-center justify-center transition-colors">
            <Sparkles className="w-5 h-5 text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-sm font-medium text-muted-foreground/70 group-hover:text-foreground transition-colors">
            Criar com IA
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};
