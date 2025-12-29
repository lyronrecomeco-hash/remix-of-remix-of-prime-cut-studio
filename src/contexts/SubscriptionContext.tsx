import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays } from 'date-fns';
// Feature names for blocking
export type FeatureName = 
  | 'dashboard' 
  | 'agenda' 
  | 'schedules' 
  | 'feedbacks' 
  | 'direct_booking' 
  | 'basic_templates' 
  | 'users_view' 
  | 'audit_logs'
  | 'marketing'
  | 'chatpro'
  | 'themes'
  | 'gallery'
  | 'services'
  | 'performance'
  | 'goals'
  | 'queue'
  | 'backup'
  | 'social_media'
  | 'api'
  | 'advanced_templates'
  | 'full_website'
  | 'leaves'
  | 'financial';

// Plan types
export type PlanName = 'free' | 'premium' | 'lifetime';

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  display_name: string;
  price: number;
  billing_cycle: 'monthly' | 'lifetime';
  limits: {
    appointments_per_month: number;
    barbers: number;
    clients: number;
  };
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  starts_at: string;
  expires_at: string | null;
  payment_method: string | null;
  notes: string | null;
}

export interface UsageMetrics {
  appointments_count: number;
  clients_count: number;
  month: number;
  year: number;
}

// Feature blocking info with persuasive messages
export const FEATURE_BLOCKING_INFO: Record<string, { title: string; stat: string; description: string }> = {
  feedbacks: {
    title: 'Gestão de Feedbacks',
    stat: 'Avaliações aumentam confiança em 65%!',
    description: 'Gerencie avaliações dos clientes e publique depoimentos no seu site.'
  },
  marketing: {
    title: 'Marketing Automático',
    stat: 'Barbearias que usam Marketing faturam 40% mais!',
    description: 'Envie campanhas via WhatsApp para seus clientes e aumente seu faturamento.'
  },
  chatpro: {
    title: 'Integração ChatPro',
    stat: 'Reduza o tempo de resposta em 80% com automação!',
    description: 'Conecte seu WhatsApp Business e automatize mensagens de confirmação e lembrete.'
  },
  themes: {
    title: 'Temas Personalizados',
    stat: 'Barbearias com identidade visual própria têm 25% mais clientes recorrentes!',
    description: 'Personalize as cores e o visual do seu painel e site de agendamentos.'
  },
  gallery: {
    title: 'Galeria de Fotos',
    stat: 'Clientes visualizam trabalhos anteriores antes de agendar!',
    description: 'Mostre seu portfólio de cortes e estilos para atrair mais clientes.'
  },
  services: {
    title: 'Gerenciamento de Serviços',
    stat: 'Personalize preços e duração para aumentar lucros!',
    description: 'Adicione, edite e remova serviços com preços e durações personalizadas.'
  },
  performance: {
    title: 'Análise de Desempenho',
    stat: 'Barbeiros que monitoram métricas aumentam produtividade em 30%!',
    description: 'Veja estatísticas detalhadas de cada barbeiro e identifique oportunidades.'
  },
  goals: {
    title: 'Metas Mensais',
    stat: 'Estabelecer metas aumenta faturamento em 45%!',
    description: 'Defina metas de receita e acompanhamento para cada barbeiro.'
  },
  queue: {
    title: 'Fila de Espera',
    stat: 'A fila de espera reduz cancelamentos em 60%!',
    description: 'Gerencie clientes em espera e notifique quando for a vez deles.'
  },
  backup: {
    title: 'Backup de Dados',
    stat: 'Proteja seus dados contra perdas!',
    description: 'Faça backup automático de todos os seus dados e restaure quando precisar.'
  },
  social_media: {
    title: 'Redes Sociais',
    stat: 'Integração com redes sociais aumenta agendamentos em 35%!',
    description: 'Conecte Instagram e Facebook para atrair mais clientes.'
  },
  api: {
    title: 'API e Integrações',
    stat: 'Automatize processos e economize tempo!',
    description: 'Integre com outros sistemas via API para automação completa.'
  },
  advanced_templates: {
    title: 'Templates Avançados',
    stat: 'Mensagens personalizadas aumentam engajamento em 50%!',
    description: 'Crie mensagens personalizadas para cada tipo de evento.'
  },
  full_website: {
    title: 'Site Completo',
    stat: 'Ter um site profissional aumenta credibilidade em 70%!',
    description: 'Tenha seu próprio site com todas as informações da sua barbearia.'
  },
  leaves: {
    title: 'Gestão de Folgas',
    stat: 'Organize férias e folgas da equipe!',
    description: 'Gerencie folgas, férias e licenças dos seus barbeiros.'
  },
  financial: {
    title: 'Dashboard Financeiro',
    stat: 'Controle financeiro aumenta lucro em 25%!',
    description: 'Veja relatórios detalhados de receita, despesas e lucro.'
  },
};

interface SubscriptionContextType {
  // Current state
  currentPlan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  usage: UsageMetrics | null;
  isLoading: boolean;
  
  // Checks
  isFeatureAllowed: (feature: FeatureName) => boolean;
  getRemainingAppointments: () => number;
  isLimitReached: () => boolean;
  isTrialExpired: () => boolean;
  getTrialDaysRemaining: () => number;
  
  // Actions
  showUpgradeModal: (feature: FeatureName) => void;
  hideUpgradeModal: () => void;
  refreshSubscription: () => Promise<void>;
  incrementAppointmentCount: () => Promise<void>;
  
  // Modal state
  upgradeModalOpen: boolean;
  upgradeModalFeature: FeatureName | null;
  
  // Plans
  allPlans: SubscriptionPlan[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSuperAdmin } = useAuth();
  
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<FeatureName | null>(null);

  // Fetch all plans
  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);
    
    if (!error && data) {
      const parsedPlans = data.map(plan => ({
        ...plan,
        name: plan.name as PlanName,
        billing_cycle: plan.billing_cycle as 'monthly' | 'lifetime',
        limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      }));
      setAllPlans(parsedPlans);
    }
  }, []);

  // Fetch user subscription and usage
  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setCurrentPlan(null);
      setSubscription(null);
      setUsage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('shop_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      if (subData) {
        const planData = subData.subscription_plans as any;
        setSubscription({
          id: subData.id,
          user_id: subData.user_id,
          plan_id: subData.plan_id,
          status: subData.status as any,
          starts_at: subData.starts_at,
          expires_at: subData.expires_at,
          payment_method: subData.payment_method,
          notes: subData.notes,
        });
        
        if (planData) {
          setCurrentPlan({
            id: planData.id,
            name: planData.name as PlanName,
            display_name: planData.display_name,
            price: planData.price,
            billing_cycle: planData.billing_cycle as 'monthly' | 'lifetime',
            limits: typeof planData.limits === 'string' ? JSON.parse(planData.limits) : planData.limits,
            features: typeof planData.features === 'string' ? JSON.parse(planData.features) : planData.features,
          });
        }
      } else {
        // No subscription - default to free (shouldn't happen if registration works)
        const freePlan = allPlans.find(p => p.name === 'free');
        if (freePlan) {
          setCurrentPlan(freePlan);
        }
      }

      // Fetch usage metrics for current month
      const now = new Date();
      const { data: usageData, error: usageError } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Usage fetch error:', usageError);
      }

      if (usageData) {
        setUsage({
          appointments_count: usageData.appointments_count,
          clients_count: usageData.clients_count,
          month: usageData.month,
          year: usageData.year,
        });
      } else {
        // Create initial usage record
        const { data: newUsage } = await supabase
          .from('usage_metrics')
          .insert({
            user_id: user.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            appointments_count: 0,
            clients_count: 0,
          })
          .select()
          .single();

        if (newUsage) {
          setUsage({
            appointments_count: newUsage.appointments_count,
            clients_count: newUsage.clients_count,
            month: newUsage.month,
            year: newUsage.year,
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }

    setIsLoading(false);
  }, [user, allPlans]);

  // Increment appointment count
  const incrementAppointmentCount = useCallback(async () => {
    if (!user || !usage) return;

    const now = new Date();
    await supabase
      .from('usage_metrics')
      .upsert({
        user_id: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        appointments_count: usage.appointments_count + 1,
        clients_count: usage.clients_count,
      }, {
        onConflict: 'user_id,month,year'
      });

    setUsage(prev => prev ? { ...prev, appointments_count: prev.appointments_count + 1 } : null);
  }, [user, usage]);

  // Check if trial is expired (for free plan)
  const isTrialExpired = useCallback((): boolean => {
    if (!subscription || !currentPlan) return false;
    if (currentPlan.name !== 'free') return false;
    
    const startDate = new Date(subscription.starts_at);
    const daysUsed = differenceInDays(new Date(), startDate);
    return daysUsed >= 7;
  }, [subscription, currentPlan]);

  // Get trial days remaining
  const getTrialDaysRemaining = useCallback((): number => {
    if (!subscription || !currentPlan) return 0;
    if (currentPlan.name !== 'free') return Infinity;
    
    const startDate = new Date(subscription.starts_at);
    const daysUsed = differenceInDays(new Date(), startDate);
    return Math.max(0, 7 - daysUsed);
  }, [subscription, currentPlan]);

  // Check if feature is allowed
  const isFeatureAllowed = useCallback((feature: FeatureName): boolean => {
    // Super admin (owner) has access to everything
    if (isSuperAdmin) return true;
    
    // No plan = no access (except basic features)
    if (!currentPlan) {
      const basicFeatures: FeatureName[] = ['dashboard', 'agenda', 'schedules', 'direct_booking', 'basic_templates', 'users_view', 'audit_logs'];
      return basicFeatures.includes(feature);
    }

    // Premium/Lifetime has all features
    if (currentPlan.features.includes('all')) return true;

    // Check if trial expired for free plan
    if (currentPlan.name === 'free' && isTrialExpired()) {
      // Only dashboard access when trial expired
      return feature === 'dashboard';
    }

    // Check specific feature
    return currentPlan.features.includes(feature);
  }, [currentPlan, isSuperAdmin, isTrialExpired]);

  // Get remaining appointments for the month
  const getRemainingAppointments = useCallback((): number => {
    if (!currentPlan || !usage) return 0;
    
    const limit = currentPlan.limits.appointments_per_month;
    if (limit === -1) return Infinity; // Unlimited
    
    return Math.max(0, limit - usage.appointments_count);
  }, [currentPlan, usage]);

  // Check if appointment limit is reached
  const isLimitReached = useCallback((): boolean => {
    if (!currentPlan || !usage) return false;
    
    const limit = currentPlan.limits.appointments_per_month;
    if (limit === -1) return false; // Unlimited
    
    return usage.appointments_count >= limit;
  }, [currentPlan, usage]);

  // Show upgrade modal
  const showUpgradeModal = useCallback((feature: FeatureName) => {
    setUpgradeModalFeature(feature);
    setUpgradeModalOpen(true);
  }, []);

  // Hide upgrade modal
  const hideUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setUpgradeModalFeature(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (allPlans.length > 0) {
      refreshSubscription();
    }
  }, [allPlans, user, refreshSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        subscription,
        usage,
        isLoading,
        isFeatureAllowed,
        getRemainingAppointments,
        isLimitReached,
        isTrialExpired,
        getTrialDaysRemaining,
        showUpgradeModal,
        hideUpgradeModal,
        refreshSubscription,
        incrementAppointmentCount,
        upgradeModalOpen,
        upgradeModalFeature,
        allPlans,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
