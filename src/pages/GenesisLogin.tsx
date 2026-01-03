import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Building2,
  ArrowRight,
  Sparkles,
  Bot,
  MessageSquare,
  GitBranch,
  Shield,
  Chrome
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { FlowAnimation } from '@/components/genesis/FlowAnimation';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const googleRegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
});

export default function GenesisLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    user, 
    genesisUser, 
    loading, 
    needsRegistration, 
    googleUserData,
    signIn, 
    signUp, 
    signInWithGoogle,
    createGenesisAccountForGoogleUser 
  } = useGenesisAuth();
  
  const [mode, setMode] = useState<'login' | 'register' | 'google-complete'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle Google OAuth callback - check if user needs registration
  useEffect(() => {
    if (!loading && user && needsRegistration && googleUserData) {
      // User authenticated with Google but has no genesis account
      setMode('google-complete');
      setFormData(prev => ({
        ...prev,
        name: googleUserData.name || '',
        email: googleUserData.email || '',
      }));
    } else if (!loading && user && genesisUser) {
      navigate('/genesis');
    }
  }, [loading, user, genesisUser, needsRegistration, googleUserData, navigate]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const result = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      });
      
      setIsSubmitting(true);
      const { error } = await signIn(result.email, result.password);
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('Confirme seu email antes de fazer login');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
      } else {
        toast.success('Bem-vindo ao Genesis Hub!');
        navigate('/genesis');
      }
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.path[0]) newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const result = registerSchema.parse(formData);
      
      setIsSubmitting(true);
      const { error } = await signUp(
        result.email, 
        result.password, 
        result.name, 
        result.phone || undefined, 
        result.companyName || undefined
      );
      
      if (error) {
        if (error.message?.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message || 'Erro ao criar conta');
        }
      } else {
        toast.success('Conta criada com sucesso! Verifique seu email.');
        setMode('login');
      }
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.path[0]) newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro ao fazer login com Google');
      setIsSubmitting(false);
    }
    // Don't set isSubmitting to false here - OAuth redirects
  };

  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const result = googleRegisterSchema.parse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        acceptTerms: formData.acceptTerms,
      });
      
      setIsSubmitting(true);
      const { error } = await createGenesisAccountForGoogleUser(
        result.name,
        result.phone,
        result.companyName
      );
      
      if (error) {
        toast.error(error.message || 'Erro ao completar cadastro');
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/genesis');
      }
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.path[0]) newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const features = [
    { icon: Bot, label: 'Automação Inteligente', desc: 'Crie chatbots com IA avançada' },
    { icon: GitBranch, label: 'Flow Builder', desc: 'Construa fluxos visuais de atendimento' },
    { icon: MessageSquare, label: 'Multi-Instâncias', desc: 'Gerencie múltiplas conexões WhatsApp' },
    { icon: Shield, label: 'Segurança Total', desc: 'Dados protegidos e criptografados' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full bg-primary/5 blur-xl"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16 xl:p-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Genesis Hub</h1>
              <p className="text-muted-foreground text-sm">WhatsApp Automation Platform</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              Automatize seu
              <br />
              <span className="text-primary">WhatsApp Business</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Plataforma completa para gestão de automação, chatbots e fluxos inteligentes de atendimento.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.label}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Interactive Flow Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Fluxo de automação ativo</span>
            </div>
            <FlowAnimation />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-8 mt-8 pt-8 border-t border-border/30"
          >
            <div>
              <div className="text-3xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Mensagens/dia</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Empresas</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8 lg:hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Genesis Hub</h1>
              <p className="text-muted-foreground text-xs">WhatsApp Automation</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl">
                    {mode === 'login' 
                      ? 'Entrar na sua conta' 
                      : mode === 'google-complete'
                      ? 'Complete seu cadastro'
                      : 'Criar nova conta'
                    }
                  </CardTitle>
                  <CardDescription>
                    {mode === 'login' 
                      ? 'Bem-vindo de volta! Entre com suas credenciais.'
                      : mode === 'google-complete'
                      ? 'Quase lá! Complete as informações para começar.'
                      : 'Comece a automatizar seu WhatsApp hoje mesmo.'
                    }
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-0 space-y-6">
                  {/* Google Complete Form */}
                  {mode === 'google-complete' ? (
                    <form onSubmit={handleGoogleComplete} className="space-y-4">
                      {/* Google avatar indicator */}
                      {googleUserData?.avatarUrl && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <img 
                            src={googleUserData.avatarUrl} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{googleUserData.name}</p>
                            <p className="text-xs text-muted-foreground">{googleUserData.email}</p>
                          </div>
                          <Chrome className="w-5 h-5 text-primary" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Seu nome"
                            value={formData.name}
                            onChange={e => updateField('name', e.target.value)}
                            className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-xs text-destructive">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => updateField('email', e.target.value)}
                            className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                            disabled
                          />
                        </div>
                        {errors.email && (
                          <p className="text-xs text-destructive">{errors.email}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">WhatsApp</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              placeholder="(00) 00000-0000"
                              value={formData.phone}
                              onChange={e => updateField('phone', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="companyName">Empresa</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="companyName"
                              placeholder="Sua empresa"
                              value={formData.companyName}
                              onChange={e => updateField('companyName', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) => updateField('acceptTerms', checked)}
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-muted-foreground cursor-pointer">
                          Eu aceito os{' '}
                          <a href="/termos" className="text-primary hover:underline">
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a href="/privacidade" className="text-primary hover:underline">
                            Política de Privacidade
                          </a>
                        </label>
                      </div>
                      {errors.acceptTerms && (
                        <p className="text-xs text-destructive">{errors.acceptTerms}</p>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-11 gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <>
                            Começar a usar
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <>
                      {/* Google Sign In */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                      >
                        <Chrome className="w-5 h-5" />
                        Continuar com Google
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            ou continue com email
                          </span>
                        </div>
                      </div>

                      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                        {mode === 'register' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="name">Nome completo</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="name"
                                  placeholder="Seu nome"
                                  value={formData.name}
                                  onChange={e => updateField('name', e.target.value)}
                                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                                />
                              </div>
                              {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    id="phone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="companyName">Empresa</Label>
                                <div className="relative">
                                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    id="companyName"
                                    placeholder="Sua empresa"
                                    value={formData.companyName}
                                    onChange={e => updateField('companyName', e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={formData.email}
                              onChange={e => updateField('email', e.target.value)}
                              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-destructive">{errors.email}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={e => updateField('password', e.target.value)}
                              className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-xs text-destructive">{errors.password}</p>
                          )}
                        </div>

                        {mode === 'register' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirmar senha</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="confirmPassword"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  value={formData.confirmPassword}
                                  onChange={e => updateField('confirmPassword', e.target.value)}
                                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              {errors.confirmPassword && (
                                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <Checkbox
                                id="acceptTerms"
                                checked={formData.acceptTerms}
                                onCheckedChange={(checked) => updateField('acceptTerms', checked)}
                              />
                              <label htmlFor="acceptTerms" className="text-sm text-muted-foreground cursor-pointer">
                                Eu aceito os{' '}
                                <a href="/termos" className="text-primary hover:underline">
                                  Termos de Uso
                                </a>{' '}
                                e a{' '}
                                <a href="/privacidade" className="text-primary hover:underline">
                                  Política de Privacidade
                                </a>
                              </label>
                            </div>
                            {errors.acceptTerms && (
                              <p className="text-xs text-destructive">{errors.acceptTerms}</p>
                            )}
                          </>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full h-11 gap-2"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <>
                              {mode === 'login' ? 'Entrar' : 'Criar conta'}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </form>

                      <div className="text-center text-sm">
                        {mode === 'login' ? (
                          <>
                            Não tem uma conta?{' '}
                            <button
                              type="button"
                              onClick={() => setMode('register')}
                              className="text-primary font-medium hover:underline"
                            >
                              Criar agora
                            </button>
                          </>
                        ) : (
                          <>
                            Já tem uma conta?{' '}
                            <button
                              type="button"
                              onClick={() => setMode('login')}
                              className="text-primary font-medium hover:underline"
                            >
                              Fazer login
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Genesis Hub. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
