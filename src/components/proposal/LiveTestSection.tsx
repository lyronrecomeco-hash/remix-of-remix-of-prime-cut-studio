import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Send, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { LunaAvatar } from './LunaAvatar';
import { toast } from 'sonner';

interface LiveTestSectionProps {
  proposalId: string;
  companyName: string;
  niche: string;
  affiliateName?: string;
}

type TestState = 'intro' | 'input' | 'sending' | 'success' | 'error';

export const LiveTestSection = ({ proposalId, companyName, niche, affiliateName }: LiveTestSectionProps) => {
  const [state, setState] = useState<TestState>('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lunaState, setLunaState] = useState<'idle' | 'talking' | 'thinking'>('idle');
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const lunaIntroMessages = [
    { text: `Oi! Sou a Luna, sua consultora digital.`, emoji: '👋' },
    { text: `Já te mostrei como o Genesis transforma negócios...`, emoji: '✨' },
    { text: `Agora, quero te provar na prática.`, emoji: '🎯' },
    { text: `Coloca seu WhatsApp aí embaixo.`, emoji: '📱' },
    { text: `Vou te enviar uma mensagem em SEGUNDOS.`, emoji: '⚡' }
  ];

  const [currentIntroIndex, setCurrentIntroIndex] = useState(0);

  useEffect(() => {
    if (state !== 'intro') return;
    
    setLunaState('talking');

    const timer = setInterval(() => {
      setCurrentIntroIndex(prev => {
        if (prev >= lunaIntroMessages.length - 1) {
          setTimeout(() => {
            setState('input');
            setLunaState('idle');
          }, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state === 'input' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [state]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneNumber(formatted);
  };

  const isValidPhone = () => {
    const numbers = phoneNumber.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  };

  const sendTestMessage = async () => {
    if (!isValidPhone()) {
      toast.error('Digite um número válido');
      return;
    }

    setState('sending');
    setLunaState('thinking');

    try {
      let phone = phoneNumber.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      const message = `✨ *Teste Ao Vivo — Genesis Hub*

Oi! Sou a Luna, e acabei de te enviar essa mensagem em *SEGUNDOS*.

Se você está lendo isso, significa que:

✅ Automação funcionando perfeitamente
✅ Clientes seriam respondidos instantaneamente  
✅ Você não perderia mais vendas por demora

Isso é só uma *amostra* do que o Genesis faz pela *${companyName}*.

🚀 Pronto(a) para transformar seu negócio?

_Enviado automaticamente pela IA Luna_`;

      const { data, error } = await supabase.functions.invoke('send-proposal-whatsapp', {
        body: { 
          proposalId,
          customPhone: phone,
          customMessage: message,
          isTest: true
        }
      });

      if (error) throw error;

      // Countdown animation
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setState('success');
            setLunaState('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 800);

    } catch (err) {
      console.error('Test message error:', err);
      setState('error');
      setLunaState('idle');
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-xl mx-auto py-12 px-4"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4"
          animate={{ 
            boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0)', '0 0 20px 5px rgba(16, 185, 129, 0.15)', '0 0 0 0 rgba(16, 185, 129, 0)'] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">Teste ao Vivo</span>
        </motion.div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Quer <span className="text-primary">sentir</span> a diferença?
        </h2>
        <p className="text-muted-foreground text-sm">
          Nada de promessas. Teste agora, no seu próprio WhatsApp.
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        layout
        className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border shadow-2xl shadow-primary/5"
      >
        {/* Luna Avatar */}
        <div className="flex justify-center mb-6">
          <LunaAvatar 
            state={lunaState === 'thinking' ? 'thinking' : lunaState === 'talking' ? 'talking' : state === 'success' ? 'confident' : 'idle'} 
            size="lg" 
          />
        </div>

        <AnimatePresence mode="wait">
          {/* INTRO STATE */}
          {state === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center min-h-[120px] flex flex-col items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIntroIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-2xl">{lunaIntroMessages[currentIntroIndex].emoji}</span>
                  <p className="text-lg md:text-xl text-foreground font-medium">
                    {lunaIntroMessages[currentIntroIndex].text}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* Progress dots */}
              <div className="flex gap-2 mt-6">
                {lunaIntroMessages.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i <= currentIntroIndex ? 'bg-primary' : 'bg-muted'}`}
                    animate={i === currentIntroIndex ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* INPUT STATE */}
          {state === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <p className="text-center text-foreground/80 text-base mb-4">
                Digite seu WhatsApp e receba uma mensagem <span className="text-primary font-semibold">instantânea</span>
              </p>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  ref={inputRef}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full h-14 pl-12 pr-4 text-lg bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary focus:ring-primary"
                  maxLength={15}
                />
              </div>

              <Button
                onClick={sendTestMessage}
                disabled={!isValidPhone()}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" />
                Testar Agora
                <Send className="w-5 h-5" />
              </Button>

              <p className="text-center text-muted-foreground text-xs flex items-center justify-center gap-1.5">
                <span className="text-emerald-400">🔒</span> Seu número não será armazenado
              </p>
            </motion.div>
          )}

          {/* SENDING STATE */}
          {state === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-6"
              >
                <Loader2 className="w-16 h-16 text-primary" />
              </motion.div>
              
              <p className="text-foreground text-lg font-medium">
                {countdown > 0 && countdown < 3 ? (
                  <motion.span
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-primary"
                  >
                    {countdown}
                  </motion.span>
                ) : (
                  'Enviando sua mensagem...'
                )}
              </p>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-6 bg-emerald-500/15 rounded-full flex items-center justify-center"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Mensagem Enviada! 🎉
              </motion.h3>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-6"
              >
                Confere seu WhatsApp. Isso levou <span className="text-primary font-bold">menos de 3 segundos</span>.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-muted/50 rounded-xl p-4 border border-border mb-6"
              >
                <p className="text-foreground/80 text-sm">
                  💡 <span className="font-medium">Imagina</span> isso acontecendo com cada cliente que entra em contato com a <span className="text-primary font-semibold">{companyName}</span>.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => {
                    setState('input');
                    setPhoneNumber('');
                    setLunaState('idle');
                  }}
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                >
                  Testar Novamente
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-destructive/15 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>

              <p className="text-foreground text-lg mb-2 font-medium">
                Ops! Algo deu errado.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                O sistema de WhatsApp pode estar offline no momento.
              </p>

              <Button
                onClick={() => {
                  setState('input');
                  setLunaState('idle');
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Tentar Novamente
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 mt-6"
      >
        {[
          { icon: '🔒', text: 'Dados seguros' },
          { icon: '⚡', text: 'Resposta < 3s' },
          { icon: '🤖', text: '100% automático' }
        ].map((badge, i) => (
          <div 
            key={i} 
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border text-sm"
          >
            <span>{badge.icon}</span>
            <span className="text-muted-foreground text-xs">{badge.text}</span>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default LiveTestSection;