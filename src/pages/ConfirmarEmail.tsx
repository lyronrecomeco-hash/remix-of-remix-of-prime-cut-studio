import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const ConfirmarEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token de confirmação não encontrado.');
      return;
    }

    confirmEmail(token);
  }, [searchParams]);

  const confirmEmail = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-email-token', {
        body: { token },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email confirmado com sucesso!');
        setEmail(data.email || '');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao confirmar email.');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setStatus('error');
      setMessage('Erro ao confirmar email. O token pode estar expirado ou ser inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Confirmando seu email...</h1>
                <p className="text-muted-foreground mt-2">Aguarde um momento</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Email Confirmado!</h1>
                <p className="text-muted-foreground mt-2">{message}</p>
                {email && (
                  <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {email}
                  </p>
                )}
              </div>
              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => navigate('/admin/login')}
                  variant="hero"
                  className="w-full"
                >
                  Acessar Painel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Agora você pode fazer login com suas credenciais
                </p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Erro na Confirmação</h1>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => navigate('/admin/login')}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Login
                </Button>
                <p className="text-xs text-muted-foreground">
                  Tente fazer login novamente para receber um novo email
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmarEmail;
