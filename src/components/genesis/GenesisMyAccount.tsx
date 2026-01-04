import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Building2,
  Phone,
  Mail,
  Shield,
  MessageSquare,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { supabase } from '@/integrations/supabase/client';

export function GenesisMyAccount() {
  const { genesisUser, subscription, credits } = useGenesisAuth();
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: genesisUser?.name || '',
    email: genesisUser?.email || '',
    company: '',
  });
  
  // Business settings
  const [businessSettings, setBusinessSettings] = useState({
    officialWhatsApp: '',
    personalWhatsApp: '',
    notifyOnConnection: true,
    notifyOnDisconnection: true,
    notifyOnNewLead: true,
    dailyReport: false,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800)); // Simulated
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar perfil');
    }
    setSaving(false);
  };

  const handleSaveBusinessSettings = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800)); // Simulated
      toast.success('Configurações comerciais salvas!');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
    setSaving(false);
  };

  const getPlanBadge = () => {
    const plan = subscription?.plan || 'free';
    switch (plan) {
      case 'professional':
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 gap-1"><Crown className="w-3 h-3" /> {plan === 'enterprise' ? 'Enterprise' : 'Pro'}</Badge>;
      case 'starter':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1"><Crown className="w-3 h-3" /> Starter</Badge>;
      default:
        return <Badge variant="secondary">Gratuito</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground text-sm">Gerencie seu perfil e configurações comerciais</p>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            Comercial
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Seus dados básicos da conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-4 border-primary/20">
                    <AvatarImage src={genesisUser?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      {genesisUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{genesisUser?.name}</p>
                    <div className="flex items-center gap-2">
                      {getPlanBadge()}
                      <Badge variant="outline" className="gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="seu@email.com"
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company">Empresa (Opcional)</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plan Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Seu Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold capitalize">{subscription?.plan || 'Free'}</p>
                      <p className="text-xs text-muted-foreground">Plano atual</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                      <p className="text-2xl font-bold">{subscription?.max_instances || 1}</p>
                      <p className="text-xs text-muted-foreground">Instâncias</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                      <p className="text-2xl font-bold">{credits?.available_credits || 0}</p>
                      <p className="text-xs text-muted-foreground">Créditos</p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Crown className="w-4 h-4" />
                    Fazer Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  WhatsApp para Negócios
                </CardTitle>
                <CardDescription>Configure seus números de WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Official WhatsApp */}
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Oficial</p>
                      <p className="text-xs text-muted-foreground">Número que será usado para automações e envio de mensagens</p>
                    </div>
                  </div>
                  <Input
                    value={businessSettings.officialWhatsApp}
                    onChange={(e) => setBusinessSettings(s => ({ ...s, officialWhatsApp: e.target.value }))}
                    placeholder="55 11 99999-9999"
                    className="bg-background"
                  />
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Este número será conectado às suas instâncias
                  </div>
                </div>

                {/* Personal WhatsApp */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Pessoal</p>
                      <p className="text-xs text-muted-foreground">Apenas para receber notificações e avisos importantes</p>
                    </div>
                  </div>
                  <Input
                    value={businessSettings.personalWhatsApp}
                    onChange={(e) => setBusinessSettings(s => ({ ...s, personalWhatsApp: e.target.value }))}
                    placeholder="55 11 88888-8888"
                    className="bg-background"
                  />
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <AlertTriangle className="w-3 h-3" />
                    Este número NÃO será usado para automações
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notificações
                </CardTitle>
                <CardDescription>Configure quando deseja receber alertas no seu WhatsApp pessoal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Conexão de WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Aviso quando uma instância conectar</p>
                    </div>
                  </div>
                  <Switch 
                    checked={businessSettings.notifyOnConnection}
                    onCheckedChange={(checked) => setBusinessSettings(s => ({ ...s, notifyOnConnection: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Desconexão de WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Alerta quando uma instância desconectar</p>
                    </div>
                  </div>
                  <Switch 
                    checked={businessSettings.notifyOnDisconnection}
                    onCheckedChange={(checked) => setBusinessSettings(s => ({ ...s, notifyOnDisconnection: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Novo Lead</p>
                      <p className="text-xs text-muted-foreground">Notificação ao receber um novo contato</p>
                    </div>
                  </div>
                  <Switch 
                    checked={businessSettings.notifyOnNewLead}
                    onCheckedChange={(checked) => setBusinessSettings(s => ({ ...s, notifyOnNewLead: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Relatório Diário</p>
                      <p className="text-xs text-muted-foreground">Resumo diário de métricas no WhatsApp</p>
                    </div>
                  </div>
                  <Switch 
                    checked={businessSettings.dailyReport}
                    onCheckedChange={(checked) => setBusinessSettings(s => ({ ...s, dailyReport: checked }))}
                  />
                </div>

                <Separator />

                <Button onClick={handleSaveBusinessSettings} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
