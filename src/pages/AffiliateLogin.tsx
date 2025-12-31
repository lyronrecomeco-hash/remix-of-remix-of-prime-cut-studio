import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AffiliateRegisterForm from '@/components/affiliate/AffiliateRegisterForm';
import RegistrationSuccessModal from '@/components/affiliate/RegistrationSuccessModal';

type ViewMode = 'login' | 'register';

const AffiliateLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.toLowerCase().trim();
    const isAffiliateSubdomain = window.location.hostname === 'parceiros.genesishub.cloud';
    const panelPath = isAffiliateSubdomain ? '/painel' : '/afiliado';

    try {
      // 1) Tenta autenticar primeiro (RLS impede consultar affiliates antes do login)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError || !authData.user) {
        toast.error('Credenciais inválidas');
        return;
      }

      // 2) Valida se o usuário autenticado é um afiliado ativo
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('status')
        .eq('user_id', authData.user.id)
        .single();

      if (affiliateError || !affiliate) {
        await supabase.auth.signOut();
        toast.error('Acesso não autorizado');
        return;
      }

      if (affiliate.status === 'blocked') {
        await supabase.auth.signOut();
        toast.error('Sua conta foi bloqueada. Entre em contato com o suporte.');
        return;
      }

      if (affiliate.status === 'pending') {
        await supabase.auth.signOut();
        toast.error('Sua conta ainda está pendente de aprovação.');
        return;
      }

      toast.success('Login realizado com sucesso!');
      navigate(panelPath);
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setShowSuccessModal(true);
    setViewMode('login');
  };

  return (
    <div className="theme-affiliate-blue min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-border/50 bg-card/90 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {viewMode === 'login' ? 'Portal de Parceiros' : 'Criar Conta'}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {viewMode === 'login' 
                  ? 'Genesis Hub - Área exclusiva para afiliados'
                  : 'Torne-se um parceiro e comece a ganhar'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {viewMode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        E-mail
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-input border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-input border-border"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Entrando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Acessar Painel
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                      </div>
                    </div>

                    {/* Register Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setViewMode('register')}
                      className="w-full py-6"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Conta de Afiliado
                    </Button>
                  </form>
                </motion.div>
              )}

              {viewMode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AffiliateRegisterForm
                    onBackToLogin={() => setViewMode('login')}
                    onSuccess={handleRegistrationSuccess}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Genesis Hub. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AffiliateLogin;
