// =====================================================
// KEYBOARD SHORTCUTS PANEL - Painel de atalhos
// =====================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Command, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutProps {
  keys: string[];
  description: string;
}

const Shortcut = ({ keys, description }: ShortcutProps) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <span className="text-sm text-muted-foreground">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="text-xs text-muted-foreground mx-1">+</span>}
          <kbd className={cn(
            'px-2 py-1 text-xs font-mono rounded bg-muted border shadow-sm',
            key.length === 1 ? 'min-w-[28px] text-center' : ''
          )}>
            {key === 'Cmd' ? <Command className="w-3 h-3 inline" /> : key}
          </kbd>
        </span>
      ))}
    </div>
  </div>
);

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel = memo(({ isOpen, onClose }: KeyboardShortcutsPanelProps) => {
  if (!isOpen) return null;

  const shortcuts = {
    'Geral': [
      { keys: ['Cmd', 'S'], description: 'Salvar fluxo' },
      { keys: ['Cmd', 'Z'], description: 'Desfazer' },
      { keys: ['Cmd', 'Shift', 'Z'], description: 'Refazer' },
      { keys: ['F11'], description: 'Tela cheia' },
      { keys: ['Esc'], description: 'Desselecionar / Fechar' },
      { keys: ['?'], description: 'Ajuda' },
    ],
    'Seleção': [
      { keys: ['Cmd', 'A'], description: 'Selecionar todos' },
      { keys: ['Cmd', 'C'], description: 'Copiar selecionados' },
      { keys: ['Cmd', 'V'], description: 'Colar' },
      { keys: ['Delete'], description: 'Excluir selecionados' },
      { keys: ['Cmd', 'D'], description: 'Duplicar' },
    ],
    'Navegação': [
      { keys: ['Scroll'], description: 'Zoom' },
      { keys: ['Space', 'Drag'], description: 'Mover canvas' },
      { keys: ['+'], description: 'Zoom in' },
      { keys: ['-'], description: 'Zoom out' },
      { keys: ['0'], description: 'Ajustar à tela' },
    ],
    'Canvas': [
      { keys: ['V'], description: 'Modo seleção' },
      { keys: ['H'], description: 'Modo pan' },
      { keys: ['G'], description: 'Toggle snap grid' },
      { keys: ['L'], description: 'Auto layout' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Atalhos de Teclado</h2>
            <p className="text-sm text-muted-foreground">Aumente sua produtividade</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-medium text-sm text-primary mb-3">{category}</h3>
              <div className="space-y-1">
                {items.map((shortcut, i) => (
                  <Shortcut key={i} {...shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Pressione <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border">Esc</kbd> para fechar
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});

KeyboardShortcutsPanel.displayName = 'KeyboardShortcutsPanel';
