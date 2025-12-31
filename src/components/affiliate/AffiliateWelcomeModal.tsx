import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, TrendingUp, Link2, Wallet, CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AffiliateWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateName: string;
  affiliateCode: string;
}

const AffiliateWelcomeModal = ({ isOpen, onClose, affiliateName, affiliateCode }: AffiliateWelcomeModalProps) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      icon: PartyPopper,
      title: 'Bem-vindo ao Programa de Afiliados!',
      description: `Olá ${affiliateName}! Estamos muito felizes em tê-lo como parceiro. Prepare-se para começar a ganhar comissões incríveis!`,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Link2,
      title: 'Seu Link Exclusivo',
      description: 'Você tem um link único de afiliado. Compartilhe com sua audiência e ganhe comissões por cada venda realizada.',
      highlight: `Seu código: ${affiliateCode}`,
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Comissões Atrativas',
      description: 'Ganhe 30% em planos mensais e 25% em planos vitalícios. Comissões são liberadas após 7 dias de confirmação.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Wallet,
      title: 'Saques Fáceis',
      description: 'Solicite seus saques a qualquer momento via PIX. Processamento em até 3 dias úteis.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Gift,
      title: 'Materiais de Divulgação',
      description: 'Acesse banners, textos prontos e até nossa IA para gerar conteúdo personalizado para suas campanhas!',
      color: 'from-rose-500 to-red-500'
    }
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-blue-500/30 shadow-2xl shadow-blue-500/20"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className={`absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br ${currentStep.color} opacity-20 blur-3xl`}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className={`absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl ${currentStep.color} opacity-20 blur-3xl`}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-8 bg-blue-500' : i < step ? 'w-2 bg-blue-500/50' : 'w-2 bg-white/20'
                  }`}
                  animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${currentStep.color} mb-6 shadow-lg`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                >
                  <currentStep.icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-2xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentStep.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-white/70 text-lg mb-6 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentStep.description}
                </motion.p>

                {/* Highlight */}
                {currentStep.highlight && (
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {currentStep.highlight}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-0"
              >
                Voltar
              </Button>

              <Button
                onClick={handleNext}
                className={`bg-gradient-to-r ${currentStep.color} hover:opacity-90 text-white font-semibold px-6 py-2 rounded-full shadow-lg`}
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Começar!
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AffiliateWelcomeModal;
