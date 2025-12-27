import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverloadAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'explanation' | 'warning';
  onConfirm?: () => void;
}

const OverloadAlertModal = ({ isOpen, onClose, type, onConfirm }: OverloadAlertModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'explanation' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Alerta de Sobrecarga</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-muted-foreground">
                  O sistema de <strong>Alerta de Sobrecarga</strong> notifica automaticamente os clientes quando há muitos agendamentos no mesmo dia.
                </p>
                
                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Como funciona:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                    <li>Quando o limite diário é atingido, um aviso é exibido para novos clientes</li>
                    <li>O cliente pode optar por continuar ou escolher outro dia</li>
                    <li>Ajuda a distribuir melhor os agendamentos ao longo da semana</li>
                    <li>Você define o limite máximo de agendamentos por dia</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>Dica:</strong> Recomendamos definir o limite baseado na capacidade real da equipe para evitar atrasos.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="hero" className="flex-1" onClick={() => { onConfirm?.(); onClose(); }}>
                  Ativar Alertas
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Dia Muito Movimentado!</h2>
                <p className="text-muted-foreground mb-6">
                  Este dia já possui muitos agendamentos. O tempo de espera pode ser maior que o normal.
                </p>
                
                <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                  <p className="text-sm">
                    Sugerimos escolher outro dia para uma experiência mais tranquila, mas você pode continuar se preferir.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Escolher Outro Dia
                  </Button>
                  <Button variant="hero" className="flex-1" onClick={() => { onConfirm?.(); onClose(); }}>
                    Continuar Mesmo Assim
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OverloadAlertModal;