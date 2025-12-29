import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailConfirmationProps {
  email: string;
  onBackToLogin: () => void;
}

const EmailConfirmation = ({ email, onBackToLogin }: EmailConfirmationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        toast.error('Erro ao reenviar email. Tente novamente.');
      } else {
        toast.success('Email de confirmação reenviado!');
        setResendCooldown(60);
        
        // Countdown
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      toast.error('Erro ao reenviar email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      {/* Success Icon */}
      <div className="relative inline-block mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mx-auto">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
        >
          <CheckCircle className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2">Cadastro Realizado!</h2>
      <p className="text-muted-foreground mb-6">
        Enviamos um email de confirmação para:
      </p>

      {/* Email Display */}
      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 mb-6">
        <Mail className="w-5 h-5 text-primary" />
        <span className="font-medium text-foreground">{email}</span>
      </div>

      {/* Instructions */}
      <div className="bg-secondary/50 rounded-xl p-5 mb-6 text-left">
        <h3 className="font-semibold text-foreground mb-3">Próximos passos:</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
            <span>Acesse sua caixa de entrada do email</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
            <span>Abra o email de confirmação (verifique também a pasta spam)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
            <span>Clique no link de confirmação</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">4</span>
            <span>Pronto! Você já pode acessar o painel</span>
          </li>
        </ol>
      </div>

      {/* Resend Button */}
      <Button
        variant="outline"
        onClick={handleResendEmail}
        disabled={isResending || resendCooldown > 0}
        className="w-full mb-4"
      >
        {isResending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Reenviando...
          </>
        ) : resendCooldown > 0 ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reenviar em {resendCooldown}s
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reenviar email de confirmação
          </>
        )}
      </Button>

      {/* Back to Login */}
      <Button
        variant="ghost"
        onClick={onBackToLogin}
        className="w-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para o login
      </Button>

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-6">
        Não recebeu o email? Verifique sua pasta de spam ou entre em contato com o suporte.
      </p>
    </motion.div>
  );
};

export default EmailConfirmation;
