import { memo } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Mouse, Zap, Save, Undo2, Copy, Trash2, LayoutGrid, Maximize2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = memo(({ isOpen, onClose }: HelpModalProps) => {
  const shortcuts = [
    { category: 'Geral', items: [
      { keys: ['⌘', 'S'], description: 'Salvar fluxo', icon: Save },
      { keys: ['⌘', 'Z'], description: 'Desfazer', icon: Undo2 },
      { keys: ['⌘', '⇧', 'Z'], description: 'Refazer', icon: Undo2 },
      { keys: ['Esc'], description: 'Desselecionar / Fechar painel', icon: null },
      { keys: ['F11'], description: 'Tela cheia', icon: Maximize2 }
    ]},
    { category: 'Edição', items: [
      { keys: ['⌘', 'C'], description: 'Copiar nó(s) selecionado(s)', icon: Copy },
      { keys: ['⌘', 'V'], description: 'Colar nó(s)', icon: Copy },
      { keys: ['Del'], description: 'Excluir nó(s) selecionado(s)', icon: Trash2 },
      { keys: ['⌘', 'A'], description: 'Selecionar todos os nós', icon: null }
    ]},
    { category: 'Navegação', items: [
      { keys: ['Scroll'], description: 'Zoom in/out', icon: Mouse },
      { keys: ['Arrastar'], description: 'Mover canvas (clique vazio)', icon: Mouse },
      { keys: ['⌘', 'Arrastar'], description: 'Selecionar múltiplos nós', icon: Mouse }
    ]}
  ];

  const tips = [
    { icon: Zap, title: 'Arraste componentes', description: 'Arraste da barra lateral para adicionar ao fluxo' },
    { icon: LayoutGrid, title: 'Auto-organizar', description: 'Use o botão de layout para organizar nós automaticamente' },
    { icon: Mouse, title: 'Conecte nós', description: 'Arraste de um handle (círculo) para outro para conectar' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Atalhos e Dicas
          </DialogTitle>
          <DialogDescription>
            Domine o Flow Builder com esses atalhos de teclado e dicas
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Shortcuts */}
          {shortcuts.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{section.category}</h4>
              <div className="grid gap-2">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                            {key}
                          </Badge>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="text-muted-foreground mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          <Separator />

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Dicas Rápidas</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <tip.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h5 className="font-medium text-sm mb-1">{tip.title}</h5>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

HelpModal.displayName = 'HelpModal';
