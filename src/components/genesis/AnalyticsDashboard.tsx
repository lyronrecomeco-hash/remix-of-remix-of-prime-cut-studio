import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare, 
  Users, 
  Clock,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  delay?: number;
  color?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, delay = 0, color = 'text-primary' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay / 1000, type: 'spring' }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Card className="relative overflow-hidden group">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <motion.div
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className={cn("w-7 h-7", color)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const { genesisUser, credits, subscription } = useGenesisAuth();
  const [stats, setStats] = useState({
    instances: 0,
    flows: 0,
    chatbots: 0,
    creditsUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!genesisUser) return;

      try {
        // Fetch real data from database
        const [instancesRes, flowsRes, chatbotsRes] = await Promise.all([
          supabase.from('genesis_instances').select('id', { count: 'exact' }).eq('user_id', genesisUser.id),
          supabase.from('whatsapp_automation_rules').select('id', { count: 'exact' }),
          supabase.from('whatsapp_automations').select('id', { count: 'exact' }),
        ]);

        setStats({
          instances: instancesRes.count || 0,
          flows: flowsRes.count || 0,
          chatbots: chatbotsRes.count || 0,
          creditsUsed: credits?.used_credits || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [genesisUser, credits]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayStats = [
    { 
      title: 'Instâncias Ativas', 
      value: stats.instances, 
      subtitle: `de ${subscription?.max_instances || 1} disponíveis`,
      icon: MessageSquare, 
      color: 'text-green-500' 
    },
    { 
      title: 'Fluxos Criados', 
      value: stats.flows, 
      subtitle: `de ${subscription?.max_flows || 5} disponíveis`,
      icon: Zap, 
      color: 'text-blue-500' 
    },
    { 
      title: 'Chatbots', 
      value: stats.chatbots, 
      subtitle: 'automações configuradas',
      icon: Users, 
      color: 'text-purple-500' 
    },
    { 
      title: 'Créditos Utilizados', 
      value: stats.creditsUsed, 
      subtitle: `de ${credits?.available_credits || 0} disponíveis`,
      icon: Target, 
      color: 'text-amber-500' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 className="w-7 h-7 text-primary" />
            </motion.div>
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas e insights do seu negócio
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Activity className="w-3 h-3" />
          Tempo real
        </Badge>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Empty State / Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center"
            >
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </motion.div>
            <h3 className="font-semibold text-lg mb-2">Gráficos detalhados em breve</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos trabalhando em métricas avançadas com gráficos de desempenho, 
              taxa de resposta e análise de conversas.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
