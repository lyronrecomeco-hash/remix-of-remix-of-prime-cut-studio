import { motion } from 'framer-motion';
import { AlertCircle, Settings, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfigureNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
}

export function ConfigureNumberModal({ isOpen, onClose, onGoToSettings }: ConfigureNumberModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4"
          >
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </motion.div>
          <DialogTitle className="text-center">Configure seu número primeiro</DialogTitle>
          <DialogDescription className="text-center">
            Antes de conectar uma instância WhatsApp, você precisa configurar seu número comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-xl bg-muted/50 border">
            <h4 className="font-medium mb-2">Por que preciso fazer isso?</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Cada instância deve ser conectada a um número único
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                O número configurado será usado para enviar mensagens
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Garante isolamento total entre suas instâncias
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <strong>Próximo passo:</strong> Vá em "Minha Conta" e configure seu número comercial ou de teste para continuar.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Depois
          </Button>
          <Button onClick={onGoToSettings} className="flex-1 gap-2">
            <Settings className="w-4 h-4" />
            Ir para Minha Conta
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
