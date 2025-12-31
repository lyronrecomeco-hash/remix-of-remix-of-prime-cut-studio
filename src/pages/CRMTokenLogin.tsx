import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Key, ArrowRight, Loader2, Building2, AlertTriangle } from 'lucide-react';

export default function CRMTokenLogin() {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setAccessDenied(false);

    try {
      // Verify token
      const { data: tokenData, error: tokenError } = await supabase
        .from('crm_collaborator_tokens')
        .select('*, crm_tenants(*)')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setAccessDenied(true);
        toast.error('Token inválido ou expirado');
        return;
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        setAccessDenied(true);
        toast.error('Este token expirou. Entre em contato com sua empresa.');
        return;
      }

      // Check if token was already used
      if (tokenData.is_used) {
        // Token already used, try to login with existing credentials
        toast.info('Este token já foi utilizado. Faça login com suas credenciais.');
        navigate('/crm/login');
        return;
      }

      // Mark token as used
      await supabase
        .from('crm_collaborator_tokens')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      // Create auth user for collaborator
      const tempPassword = Math.random().toString(36).substring(2, 10) + 'A1!';
      const tempEmail = `collab-${tokenData.id}@crm-genesis.local`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            name: tokenData.name,
            user_type: 'crm_collaborator',
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error('Erro ao criar acesso');
      }

      // Create CRM user linked to the tenant
      await supabase.from('crm_users').insert({
        crm_tenant_id: tokenData.crm_tenant_id,
        auth_user_id: authData.user.id,
        name: tokenData.name,
        email: tempEmail,
        role: 'collaborator',
        is_active: true,
        permissions: tokenData.access_level === 'full' ? {} : { whatsapp_only: true },
      });

      toast.success('Acesso ativado com sucesso!');
      navigate('/crmpainel');
    } catch (error: any) {
      console.error('Token login error:', error);
      toast.error('Erro ao validar token');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"
            >
              <Key className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Acesso por Token</CardTitle>
            <CardDescription className="text-muted-foreground">
              Digite o token de acesso que você recebeu via WhatsApp
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {accessDenied && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Acesso Negado</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seu acesso foi revogado ou o token é inválido.
                      Entre em contato com a empresa para mais informações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-medium">
                  Token de Acesso
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="crm@genesishub-token-XXXXXXXX"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-10 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={isSubmitting || !token}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Acessar CRM
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                Você é administrador? Faça login com email e senha.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/crm/login')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Login de Administrador
              </Button>
            </div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Sistema de CRM Empresarial
        </motion.p>
      </motion.div>
    </div>
  );
}
