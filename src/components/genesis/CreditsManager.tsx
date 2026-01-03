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
  Users,
  Gift,
  Wallet,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

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
    <div className="space-y-6 w-full">
      {/* Header Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-primary/5 border p-6"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Balance Section */}
          <div className="flex items-center gap-5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30"
            >
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Saldo Disponível</p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex items-baseline gap-2"
              >
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {availableCredits.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm">créditos</span>
              </motion.div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Utilizados: {usedCredits.toLocaleString()}</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-card/80 rounded-xl border">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plano Atual</p>
                <p className="font-bold capitalize">{currentPlan}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setShowBuyModal(true)} className="gap-2 shadow-lg">
                <Sparkles className="w-4 h-4" />
                Comprar Créditos
              </Button>
              <Button variant="outline" onClick={() => setShowPlansModal(true)} className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CreditCard, label: 'Total Adquirido', value: credits?.total_purchased || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Zap, label: 'Utilizados', value: usedCredits, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: Gift, label: 'Bônus Ganhos', value: '300', color: 'text-green-500', bg: 'bg-green-500/10' },
          { icon: Receipt, label: 'Transações', value: transactions.length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Credit Packages - Horizontal Scroll for Mobile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Pacotes de Créditos
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistoryModal(true)} className="gap-2 text-muted-foreground">
            <History className="w-4 h-4" />
            Histórico
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-300 relative overflow-hidden h-full",
                  selectedPackage === pkg.id 
                    ? "border-primary ring-2 ring-primary/20 shadow-xl" 
                    : "hover:border-primary/50 hover:shadow-lg",
                  pkg.popular && "border-primary/50"
                )}
                onClick={() => { setSelectedPackage(pkg.id); setShowBuyModal(true); }}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}
                
                <CardContent className="pt-6 pb-5 flex flex-col items-center text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="text-3xl font-bold">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">créditos</p>
                  
                  {pkg.bonus > 0 && (
                    <Badge variant="secondary" className="mt-2 gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                      <Gift className="w-3 h-3" />
                      +{pkg.bonus} bônus
                    </Badge>
                  )}
                  
                  <div className="mt-4 flex-1">
                    <div className="text-2xl font-bold">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      R$ {pkg.perCredit.toFixed(3).replace('.', ',')} por crédito
                    </p>
                  </div>
                  
                  <Button 
                    className={cn(
                      "w-full mt-4",
                      pkg.popular && "bg-gradient-to-r from-primary to-primary/80"
                    )}
                    size="sm"
                  >
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Últimas Transações
            </CardTitle>
            <CardDescription>Seu histórico recente de créditos</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHistoryModal(true)}>
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      tx.type === 'purchase' || tx.type === 'bonus' ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}>
                      {tx.type === 'purchase' || tx.type === 'bonus' ? (
                        <ArrowDownRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-bold text-sm',
                    tx.type === 'purchase' || tx.type === 'bonus' ? 'text-green-500' : 'text-red-500'
                  )}>
                    {tx.type === 'purchase' || tx.type === 'bonus' ? '+' : '-'}{Math.abs(tx.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Modal */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Escolha seu Plano
            </DialogTitle>
            <DialogDescription>
              Selecione o plano ideal para escalar seu negócio
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              {plans.map((plan, index) => {
                const PlanIcon = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "relative h-full transition-all duration-300",
                      plan.popular && "border-primary shadow-lg shadow-primary/10",
                      isCurrentPlan && "ring-2 ring-primary"
                    )}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Recomendado
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className={cn("pb-3", plan.popular && "pt-8")}>
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                              plan.color
                            )}
                            whileHover={{ rotate: 10, scale: 1.05 }}
                          >
                            <PlanIcon className="w-6 h-6 text-white" />
                          </motion.div>
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="text-xs">{plan.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-3xl font-bold">R$ {plan.price}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                        
                        <ul className="space-y-2">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center gap-2 text-sm">
                              {feature.included ? (
                                <Check className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-muted shrink-0" />
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
                        >
                          {isCurrentPlan ? (
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              Plano Atual
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Assinar Agora
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Transações
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                {transactions.map((tx, idx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        tx.type === 'purchase' || tx.type === 'bonus' ? 'bg-green-500/10' : 'bg-red-500/10'
                      )}>
                        {tx.type === 'purchase' || tx.type === 'bonus' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'font-bold',
                      tx.type === 'purchase' || tx.type === 'bonus' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {tx.type === 'purchase' || tx.type === 'bonus' ? '+' : '-'}{Math.abs(tx.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Buy Credits Modal */}
      <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Finalizar Compra
            </DialogTitle>
            <DialogDescription>
              Confirme seu pacote de créditos
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="py-4 space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl border text-center">
                <p className="text-3xl font-bold text-primary">
                  {(creditPackages.find(p => p.id === selectedPackage)?.credits || 0).toLocaleString()}
                  {creditPackages.find(p => p.id === selectedPackage)?.bonus ? (
                    <span className="text-green-500 text-lg ml-2">
                      +{creditPackages.find(p => p.id === selectedPackage)?.bonus}
                    </span>
                  ) : null}
                </p>
                <p className="text-muted-foreground text-sm">créditos</p>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor total:</span>
                <span className="font-bold text-xl">
                  R$ {creditPackages.find(p => p.id === selectedPackage)?.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                Pagamento seguro via Pix, cartão ou boleto
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyModal(false)}>
              Cancelar
            </Button>
            <Button className="gap-2">
              <Zap className="w-4 h-4" />
              Pagar Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
