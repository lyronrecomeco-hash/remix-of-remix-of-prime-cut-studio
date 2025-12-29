import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { usePhoneMask } from '@/hooks/usePhoneMask';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(14, 'WhatsApp inválido'),
  email: z.string().email('Email inválido'),
  emailConfirm: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  passwordConfirm: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos de uso' }),
  }),
}).refine(data => data.email === data.emailConfirm, {
  message: 'Os emails não conferem',
  path: ['emailConfirm'],
}).refine(data => data.password === data.passwordConfirm, {
  message: 'As senhas não conferem',
  path: ['passwordConfirm'],
});

interface RegisterFormProps {
  onSuccess: (email: string) => void;
  onBackToLogin: () => void;
}

const RegisterForm = ({ onSuccess, onBackToLogin }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    emailConfirm: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const phoneMask = usePhoneMask(formData.whatsapp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate form
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // Get IP address for anti-fraud
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch {
        console.log('Could not get IP address');
      }

      const userAgent = navigator.userAgent;

      // Check if IP already has an account (anti-fraud)
      const { data: existingFraud } = await supabase
        .from('fraud_protection')
        .select('id')
        .eq('ip_address', ipAddress)
        .eq('attempt_type', 'registration')
        .eq('is_blocked', false);

      if (existingFraud && existingFraud.length > 0) {
        setError('Já existe uma conta registrada neste dispositivo. Faça login ou entre em contato com o suporte.');
        setIsLoading(false);
        return;
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        setError('Este email já está cadastrado. Faça login ou recupere sua senha.');
        setIsLoading(false);
        return;
      }

      // Create user in Supabase Auth (with auto-confirm disabled so we use our custom flow)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmado`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            whatsapp: formData.whatsapp,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está cadastrado. Faça login ou recupere sua senha.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar conta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Record in fraud protection
      await supabase.from('fraud_protection').insert({
        ip_address: ipAddress,
        user_id: authData.user.id,
        email: formData.email,
        user_agent: userAgent,
        attempt_type: 'registration',
        is_blocked: false,
      });

      // Create admin_users entry
      await supabase.from('admin_users').insert({
        user_id: authData.user.id,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        is_active: true,
      });

      // Create user_roles entry (admin role for shop owners)
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin',
      });

      // Get free plan and create subscription
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'free')
        .single();

      if (freePlan) {
        await supabase.from('shop_subscriptions').insert({
          user_id: authData.user.id,
          plan_id: freePlan.id,
          status: 'active',
        });
      }

      // Create initial usage metrics
      const now = new Date();
      await supabase.from('usage_metrics').insert({
        user_id: authData.user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        appointments_count: 0,
        clients_count: 0,
      });

      // Generate custom confirmation token
      const confirmationToken = crypto.randomUUID();
      
      // Save token in database
      await supabase.from('email_confirmation_tokens').insert({
        user_id: authData.user.id,
        email: formData.email,
        token: confirmationToken,
      });

      // Build confirmation URL
      const confirmationUrl = `${window.location.origin}/confirmar-email?token=${confirmationToken}`;

      // Send confirmation email via Resend using Owner's custom template
      const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: formData.email,
          name: formData.firstName,
          confirmationUrl: confirmationUrl,
        },
      });

      if (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail registration, just log the error
      }

      onSuccess(formData.email);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
        >
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="João"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.firstName ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.firstName && (
            <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Sobrenome</label>
          <Input
            type="text"
            placeholder="Silva"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={`h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.lastName ? 'border-destructive' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.lastName && (
            <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">WhatsApp</label>
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="tel"
            placeholder="(11) 99999-9999"
            value={phoneMask.value}
            onChange={(e) => {
              phoneMask.onChange(e);
              updateField('whatsapp', e.target.value);
            }}
            className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.whatsapp ? 'border-destructive' : ''}`}
            disabled={isLoading}
          />
        </div>
        {fieldErrors.whatsapp && (
          <p className="text-xs text-destructive">{fieldErrors.whatsapp}</p>
        )}
      </div>

      {/* Email Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.email ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirme o Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={formData.emailConfirm}
              onChange={(e) => updateField('emailConfirm', e.target.value)}
              className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.emailConfirm ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
          </div>
          {fieldErrors.emailConfirm && (
            <p className="text-xs text-destructive">{fieldErrors.emailConfirm}</p>
          )}
        </div>
      </div>

      {/* Password Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Senha</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className={`pl-12 pr-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.password ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirme a Senha</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={(e) => updateField('passwordConfirm', e.target.value)}
              className={`pl-12 pr-12 h-12 bg-secondary/50 border-border focus:border-primary ${fieldErrors.passwordConfirm ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.passwordConfirm && (
            <p className="text-xs text-destructive">{fieldErrors.passwordConfirm}</p>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={formData.acceptTerms}
          onCheckedChange={(checked) => updateField('acceptTerms', !!checked)}
          disabled={isLoading}
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
          Li e aceito os{' '}
          <a href="/termos" target="_blank" className="text-primary hover:underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacidade" target="_blank" className="text-primary hover:underline">
            Política de Privacidade
          </a>
        </label>
      </div>
      {fieldErrors.acceptTerms && (
        <p className="text-xs text-destructive">{fieldErrors.acceptTerms}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="hero"
        className="w-full h-12 text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Criando conta...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Criar Conta Grátis
          </>
        )}
      </Button>

      {/* Back to login */}
      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-primary hover:underline font-medium"
        >
          Faça login
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
