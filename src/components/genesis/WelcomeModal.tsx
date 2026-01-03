import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Bot, 
  GitBranch, 
  MessageSquare, 
  Gift,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
  userName?: string;
}

const slides = [
  {
    icon: Zap,
    title: 'Bem-vindo ao Genesis Hub!',
    description: 'A plataforma mais avançada de automação WhatsApp. Vamos te mostrar tudo que você pode fazer aqui.',
    gradient: 'from-primary to-primary/60',
    showCredits: false
  },
  {
    icon: Bot,
    title: 'Chatbots Inteligentes',
    description: 'Crie chatbots com IA avançada que atendem seus clientes 24/7. Configure respostas automáticas e fluxos personalizados.',
    gradient: 'from-green-500 to-emerald-500',
    showCredits: false
  },
  {
    icon: GitBranch,
    title: 'Flow Builder Visual',
    description: 'Construa fluxos de atendimento arrastando e soltando. A Luna IA pode criar fluxos complexos para você em segundos!',
    gradient: 'from-blue-500 to-cyan-500',
    showCredits: false
  },
  {
    icon: MessageSquare,
    title: 'Multi-Instâncias',
    description: 'Conecte múltiplos números de WhatsApp e gerencie todos em um só lugar. Monitore status em tempo real.',
    gradient: 'from-orange-500 to-amber-500',
    showCredits: false
  },
  {
    icon: Gift,
    title: '🎁 Presente de Boas-Vindas!',
    description: 'Você ganhou 300 créditos grátis para começar! Use para criar fluxos com a Luna IA e testar todas as funcionalidades.',
    gradient: 'from-primary to-primary/60',
    showCredits: true
  }
];

export const WelcomeModal = ({ open, onComplete, userName }: WelcomeModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-gradient-to-b from-background to-background/95" hideClose>
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative p-8"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex justify-center mb-6"
              >
                <div className={cn(
                  "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  slide.gradient
                )}>
                  <slide.icon className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-center mb-3"
              >
                {currentSlide === 0 && userName ? `Olá, ${userName}! 👋` : slide.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-center mb-6 leading-relaxed"
              >
                {slide.description}
              </motion.p>

              {/* Credits Badge */}
              {slide.showCredits && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/60 text-white shadow-lg shadow-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6" />
                        <div>
                          <div className="text-3xl font-bold">300</div>
                          <div className="text-sm opacity-90">Créditos Grátis</div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs"
                    >
                      🎉
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {slides.map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === currentSlide 
                        ? "w-8 bg-primary" 
                        : i < currentSlide 
                          ? "w-2 bg-primary/50" 
                          : "w-2 bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={cn(currentSlide === 0 && "invisible")}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <Button
                  onClick={nextSlide}
                  className="flex-1 max-w-[200px] bg-gradient-to-r from-primary to-primary/80"
                >
                  {isLastSlide ? (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Começar Agora!
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>

                {!isLastSlide && (
                  <Button
                    variant="ghost"
                    onClick={onComplete}
                    className="text-muted-foreground"
                  >
                    Pular
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
