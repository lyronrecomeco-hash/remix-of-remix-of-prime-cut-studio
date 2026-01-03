import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Clock,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Check,
  Star,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { cn } from '@/lib/utils';

const creditPackages = [
  { id: 1, credits: 100, price: 19.90, popular: false, bonus: 0 },
  { id: 2, credits: 500, price: 79.90, popular: true, bonus: 50 },
  { id: 3, credits: 1000, price: 149.90, popular: false, bonus: 150 },
  { id: 4, credits: 5000, price: 599.90, popular: false, bonus: 1000 },
];

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    description: 'Ideal para começar',
    features: [
      '3 instâncias WhatsApp',
      '10 fluxos de automação',
      '500 créditos/mês',
      'Suporte por email',
    ],
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 197,
    description: 'Para negócios em crescimento',
    features: [
      '10 instâncias WhatsApp',
      '50 fluxos de automação',
      '2.000 créditos/mês',
      'Suporte prioritário',
      'API Access',
      'Relatórios avançados',
    ],
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 497,
    description: 'Solução completa',
    features: [
      'Instâncias ilimitadas',
      'Fluxos ilimitados',
      '10.000 créditos/mês',
      'Suporte 24/7',
      'API Access completo',
      'White-label',
      'Gerente dedicado',
    ],
    icon: Rocket,
    color: 'from-amber-500 to-orange-500',
  },
];

const transactionHistory = [
  { id: 1, type: 'purchase', amount: 500, description: 'Compra de créditos', date: '2026-01-03T10:30:00' },
  { id: 2, type: 'usage', amount: -50, description: 'Envio de mensagens', date: '2026-01-03T09:15:00' },
  { id: 3, type: 'bonus', amount: 100, description: 'Bônus de fidelidade', date: '2026-01-02T14:00:00' },
  { id: 4, type: 'usage', amount: -25, description: 'Automação executada', date: '2026-01-02T11:30:00' },
];

export function CreditsManager() {
  const { credits, subscription } = useGenesisAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const usagePercentage = credits ? 
    ((credits.used_credits / (credits.used_credits + credits.available_credits)) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-7 h-7 text-primary" />
          </motion.div>
          Créditos & Planos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus créditos e assinatura
        </p>
      </motion.div>

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-4xl font-bold text-primary">
                    {credits?.available_credits?.toLocaleString() || 0}
                  </span>
                  <span className="text-muted-foreground">créditos</span>
                </motion.div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Utilizados este mês</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {credits?.used_credits?.toLocaleString() || 0}
                  </span>
                </div>
                <Progress value={usagePercentage} className="mt-2 h-2" />
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
                <Badge variant="secondary" className="text-lg px-3 py-1 gap-2">
                  <Crown className="w-4 h-4" />
                  {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'Free'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="credits" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="credits">Comprar Créditos</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Credits Tab */}
        <TabsContent value="credits">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {creditPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300 relative overflow-hidden",
                    selectedPackage === pkg.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "hover:border-primary/50",
                    pkg.popular && "border-primary/50"
                  )}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none">
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="pt-6 text-center">
                    <motion.div
                      animate={{ rotate: selectedPackage === pkg.id ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <CreditCard className="w-10 h-10 mx-auto text-primary mb-4" />
                    </motion.div>
                    
                    <div className="text-3xl font-bold">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">créditos</p>
                    
                    {pkg.bonus > 0 && (
                      <Badge variant="secondary" className="mt-2 gap-1">
                        <Sparkles className="w-3 h-3" />
                        +{pkg.bonus} bônus
                      </Badge>
                    )}
                    
                    <div className="mt-4 text-2xl font-semibold">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </div>
                    
                    <Button 
                      className="w-full mt-4 gap-2"
                      variant={selectedPackage === pkg.id ? "default" : "outline"}
                    >
                      {selectedPackage === pkg.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Selecionado
                        </>
                      ) : (
                        'Selecionar'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {selectedPackage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-6"
            >
              <Button size="lg" className="gap-2">
                <Zap className="w-5 h-5" />
                Finalizar Compra
              </Button>
            </motion.div>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {plans.map((plan, index) => {
              const PlanIcon = plan.icon;
              const isCurrentPlan = subscription?.plan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <Card className={cn(
                    "relative overflow-hidden h-full",
                    plan.popular && "border-primary",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}>
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0">
                        <div className={cn(
                          "py-1 text-center text-xs font-medium text-white bg-gradient-to-r",
                          plan.color
                        )}>
                          Mais Popular
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className={plan.popular ? "pt-10" : ""}>
                      <motion.div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br",
                          plan.color
                        )}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <PlanIcon className="w-6 h-6 text-white" />
                      </motion.div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">R$ {plan.price}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.05) }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                            {feature}
                          </motion.li>
                        ))}
                      </ul>
                      
                      <Button 
                        className={cn("w-full mt-6", plan.popular && "bg-gradient-to-r " + plan.color)}
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Plano Atual' : 'Assinar'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {transactionHistory.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
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
                            {new Date(tx.date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-semibold",
                        tx.amount > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} créditos
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
