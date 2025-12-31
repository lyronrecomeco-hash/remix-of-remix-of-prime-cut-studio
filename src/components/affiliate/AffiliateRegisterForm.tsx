import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schemas
const step1Schema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: z.string()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo'),
  whatsapp: z.string()
    .min(10, 'WhatsApp inválido')
    .max(15, 'WhatsApp inválido')
    .regex(/^\d+$/, 'Apenas números'),
});

const step2Schema = z.object({
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/\d/, 'Senha deve conter número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

interface AffiliateRegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

const AffiliateRegisterForm = ({ onBackToLogin, onSuccess }: AffiliateRegisterFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  
  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneLast4, setPhoneLast4] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 11);
  };

  const validateStep1 = () => {
    const result = step1Schema.safeParse({
      name: formData.name,
      email: formData.email,
      whatsapp: formData.whatsapp.replace(/\D/g, '')
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = step2Schema.safeParse({
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const sendVerificationCode = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-affiliate-verification', {
        body: {
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
          password: formData.password
        }
      });

      if (error) {
        toast.error(error.message || 'Erro ao enviar código');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setPhoneLast4(data?.phone || formData.whatsapp.slice(-4));
      setStep(3);
      setResendCooldown(60);
      setOtpCode(['', '', '', '', '', '']);
      toast.success('Código enviado para seu WhatsApp!');
      
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyCode(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtpCode(newOtp);
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (code: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-affiliate-code', {
        body: {
          phone: formData.whatsapp.replace(/\D/g, ''),
          code: code
        }
      });

      if (error) {
        toast.error(error.message || 'Erro ao verificar código');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success('Cadastro realizado! Aguarde aprovação do administrador.');
      onSuccess();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Erro ao verificar código. Tente novamente.');
      setOtpCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-affiliate-verification', {
        body: {
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
          password: formData.password
        }
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Erro ao reenviar código');
        return;
      }

      setResendCooldown(60);
      setOtpCode(['', '', '', '', '', '']);
      toast.success('Novo código enviado!');
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error('Erro ao reenviar código');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Dados Pessoais',
    'Criar Senha',
    'Verificar WhatsApp'
  ];

  return (
    <div className="space-y-6">
      {/* Header with Step Info */}
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Criar Conta de Parceiro</h2>
        <p className="text-sm text-muted-foreground">
          Etapa {step} de 3: {stepTitles[step - 1]}
        </p>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-1 max-w-xs mx-auto">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Personal Data */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`pl-10 h-11 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 h-11 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-medium">
                  WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="11999999999"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                    className={`pl-10 h-11 ${errors.whatsapp ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    maxLength={11}
                  />
                </div>
                {errors.whatsapp ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.whatsapp}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    DDD + número, apenas números
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-11"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="space-y-4">
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Crie uma senha forte"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 h-11 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
                
                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {strengthLabels[Math.max(0, passwordStrength - 1)] || 'Muito fraca'}
                    </p>
                  </div>
                )}

                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1 pt-2">
                  {[
                    { check: formData.password.length >= 8, label: '8+ caracteres' },
                    { check: /[A-Z]/.test(formData.password), label: 'Maiúscula' },
                    { check: /[a-z]/.test(formData.password), label: 'Minúscula' },
                    { check: /\d/.test(formData.password), label: 'Número' },
                  ].map((req, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-1 text-xs ${req.check ? 'text-green-500' : 'text-muted-foreground'}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Senhas coincidem
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="button"
                onClick={sendVerificationCode}
                disabled={loading}
                className="flex-1 h-11"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Código
                    <MessageCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verifique seu WhatsApp</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Código enviado para ****{phoneLast4}
                </p>
              </div>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  disabled={loading}
                  className="w-11 h-12 text-center text-xl font-bold rounded-lg border-2 border-border bg-input text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {/* Resend */}
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Reenviar em <span className="font-mono text-primary">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reenviar código
                </button>
              )}
            </div>

            {loading && (
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              disabled={loading}
              className="w-full h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Alterar dados
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Login Link */}
      <div className="text-center pt-4 border-t border-border">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Já tem conta? <span className="text-primary font-medium">Fazer login</span>
        </button>
      </div>
    </div>
  );
};

export default AffiliateRegisterForm;
