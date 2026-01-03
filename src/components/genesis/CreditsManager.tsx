import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  History,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Check,
  Star,
  Rocket,
  Package,
  Clock,
  ChevronRight,
  Shield,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const creditPackages = [
  { id: 1, credits: 100, price: 9.90, popular: false, bonus: 0, perCredit: 0.099 },
  { id: 2, credits: 500, price: 39.90, popular: true, bonus: 50, perCredit: 0.073 },
  { id: 3, credits: 1500, price: 99.90, popular: false, bonus: 200, perCredit: 0.059 },
  { id: 4, credits: 5000, price: 249.90, popular: false, bonus: 1000, perCredit: 0.042 },
];

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 47,
    description: 'Para quem está começando',
    features: [
      { text: '2 instâncias WhatsApp', included: true },
      { text: '5 fluxos de automação', included: true },
      { text: '300 créditos/mês', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'API Access', included: false },
      { text: 'White-label', included: false },
    ],
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 97,
    description: 'Para negócios em crescimento',
    features: [
      { text: '5 instâncias WhatsApp', included: true },
      { text: '25 fluxos de automação', included: true },
      { text: '1.000 créditos/mês', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'API Access', included: true },
      { text: 'White-label', included: false },
    ],
    icon: Star,
    color: 'from-primary to-primary/60',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 247,
    description: 'Solução completa para empresas',
    features: [
      { text: 'Instâncias ilimitadas', included: true },
      { text: 'Fluxos ilimitados', included: true },
      { text: '5.000 créditos/mês', included: true },
      { text: 'Suporte 24/7 dedicado', included: true },
      { text: 'API Access completo', included: true },
      { text: 'White-label + Gerente', included: true },
    ],
    icon: Rocket,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
];

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
}

export function CreditsManager() {
  const { credits, subscription, genesisUser } = useGenesisAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!genesisUser) return;
      
      const { data, error } = await supabase
        .from('genesis_credit_transactions')
        .select('*')
        .eq('user_id', genesisUser.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setTransactions(data as Transaction[]);
      }
      setLoadingTransactions(false);
    };
    
    fetchTransactions();
  }, [genesisUser]);

  const currentPlan = subscription?.plan || 'free';
  const availableCredits = credits?.available_credits || 0;
  const usedCredits = credits?.used_credits || 0;
  const totalCredits = availableCredits + usedCredits;
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Cards - Compact */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Balance Card */}
        <Card className="md:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <CardContent className="pt-5 pb-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex items-baseline gap-2 mt-1"
                >
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {availableCredits.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">créditos</span>
                </motion.div>
                
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Utilizados este mês</span>
                    <span className="font-medium">{usedCredits.toLocaleString()}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-1.5" />
                </div>
              </div>
              
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
              >
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10" />
          <CardContent className="pt-5 pb-5 relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano Atual</p>
                <p className="font-bold capitalize">{currentPlan}</p>
              </div>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowPlanModal(true)}>
              <TrendingUp className="w-4 h-4" />
              Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="credits" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-10">
          <TabsTrigger value="credits" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-3.5 h-3.5" />
            Créditos
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Crown className="w-3.5 h-3.5" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <History className="w-3.5 h-3.5" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-5">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {creditPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300 relative",
                    selectedPackage === pkg.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "hover:border-primary/50",
                    pkg.popular && "border-primary/50"
                  )}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-2">
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="pt-6 pb-4 px-3 flex flex-col items-center">
                    <div className="text-2xl font-bold">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-muted-foreground">créditos</p>
                    
                    {pkg.bonus > 0 && (
                      <Badge variant="secondary" className="mt-2 text-[10px] gap-1 bg-green-500/10 text-green-600">
                        <Sparkles className="w-2.5 h-2.5" />
                        +{pkg.bonus}
                      </Badge>
                    )}
                    
                    <div className="mt-3 text-center">
                      <div className="text-lg font-bold">
                        R$ {pkg.price.toFixed(2).replace('.', ',')}
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        R$ {pkg.perCredit.toFixed(3).replace('.', ',')}/cred
                      </p>
                    </div>
                    
                    <div className={cn(
                      "w-full mt-3 py-1.5 rounded-lg text-center text-[10px] font-medium transition-colors",
                      selectedPackage === pkg.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {selectedPackage === pkg.id ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          Selecionado
                        </span>
                      ) : 'Selecionar'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {selectedPackage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-muted/50 rounded-xl border"
              >
                <div className="text-center sm:text-left">
                  <p className="font-semibold text-sm">
                    Total: {(creditPackages.find(p => p.id === selectedPackage)?.credits || 0) + (creditPackages.find(p => p.id === selectedPackage)?.bonus || 0)} créditos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pagamento seguro via Pix, cartão ou boleto
                  </p>
                </div>
                <Button size="sm" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Finalizar Compra
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Plans Tab - Compact */}
        <TabsContent value="plans">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {plans.map((plan, index) => {
              const PlanIcon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className={cn(
                    "relative h-full transition-all duration-300",
                    plan.popular && "border-primary shadow-lg shadow-primary/10",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}>
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2">
                          <Star className="w-2.5 h-2.5 mr-1" />
                          Recomendado
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className={cn("pb-2 px-4", plan.popular && "pt-6")}>
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            plan.color
                          )}
                          whileHover={{ rotate: 10, scale: 1.05 }}
                        >
                          <PlanIcon className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          <CardDescription className="text-xs">{plan.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 px-4 pb-4">
                      <div>
                        <span className="text-2xl font-bold">R$ {plan.price}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                      
                      <ul className="space-y-1.5">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-xs">
                            {feature.included ? (
                              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-muted shrink-0" />
                            )}
                            <span className={cn(!feature.included && "text-muted-foreground")}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className={cn(
                          "w-full",
                          plan.popular && "bg-gradient-to-r " + plan.color + " hover:opacity-90"
                        )}
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan}
                        size="sm"
                      >
                        {isCurrentPlan ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Check className="w-3 h-3" />
                            Plano Atual
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs">
                            Assinar Agora
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Features Comparison - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 bg-muted/30 rounded-xl border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Todos os planos incluem</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                <span>SSL Gratuito</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                <span>Backup Diário</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                <span>Uptime 99.9%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-500" />
                <span>Atualizações Grátis</span>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Histórico de Transações</CardTitle>
                    <CardDescription>Últimas movimentações de créditos</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {loadingTransactions ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map((tx, index) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"
                          )}>
                            {tx.amount > 0 ? (
                              <ArrowDownRight className="w-5 h-5 text-green-500" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "font-semibold text-lg",
                          tx.amount > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
