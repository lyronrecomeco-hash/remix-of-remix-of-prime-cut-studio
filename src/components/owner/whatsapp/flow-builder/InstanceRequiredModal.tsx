// =====================================================
// INSTANCE REQUIRED MODAL - Avisa quando não há instância conectada
// =====================================================

import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff, ArrowRight, QrCode, Zap } from 'lucide-react';

interface InstanceRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToInstances: () => void;
  componentName: string;
}

export const InstanceRequiredModal = ({ 
  open, 
  onClose, 
  onNavigateToInstances,
  componentName 
}: InstanceRequiredModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center"
            >
              <WifiOff className="w-7 h-7 text-amber-500" />
            </motion.div>
            <div>
              <DialogTitle className="text-xl">Instância Necessária</DialogTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                Componente: {componentName}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base pt-2">
            Para usar componentes nativos do WhatsApp, você precisa ter uma <span className="text-primary font-medium">instância conectada</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Crie uma instância</p>
                <p className="text-xs text-muted-foreground">Vá até a aba "Instâncias" no menu</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Escaneie o QR Code</p>
                <p className="text-xs text-muted-foreground">Conecte seu WhatsApp à instância</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#25D366]">
                ✓
              </div>
              <div>
                <p className="font-medium text-sm">Pronto para automatizar!</p>
                <p className="text-xs text-muted-foreground">Seus fluxos funcionarão automaticamente</p>
              </div>
            </div>
          </div>

          {/* Visual representation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 py-4"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Seu WhatsApp</span>
            </div>
            
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>
            
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            >
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#25D366]" />
              </div>
              <span className="text-xs text-muted-foreground">Automação</span>
            </div>
          </motion.div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={onNavigateToInstances}
            className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <Wifi className="w-4 h-4" />
            Ir para Instâncias
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
