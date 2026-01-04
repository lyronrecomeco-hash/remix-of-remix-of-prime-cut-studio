import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  Calendar,
  Zap,
  MessageSquare,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreditUsage {
  id: string;
  credits_used: number;
  usage_type: string;
  description: string | null;
  usage_date: string;
  created_at: string;
}

interface GenesisCreditUsageProps {
  userId: string;
  totalCredits?: number;
}

export function GenesisCreditUsage({ userId, totalCredits = 300 }: GenesisCreditUsageProps) {
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [summary, setSummary] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byType: {} as Record<string, number>,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const { data, error } = await supabase
        .from('genesis_credit_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('usage_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usageData = (data || []) as CreditUsage[];
      setUsage(usageData);

      // Calculate summary
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');

      const todayTotal = usageData
        .filter(u => u.usage_date === todayStr)
        .reduce((sum, u) => sum + u.credits_used, 0);

      const weekTotal = usageData
        .filter(u => u.usage_date >= weekAgoStr)
        .reduce((sum, u) => sum + u.credits_used, 0);

      const monthTotal = usageData.reduce((sum, u) => sum + u.credits_used, 0);

      const byType = usageData.reduce((acc, u) => {
        acc[u.usage_type] = (acc[u.usage_type] || 0) + u.credits_used;
        return acc;
      }, {} as Record<string, number>);

      setSummary({
        today: todayTotal,
        thisWeek: weekTotal,
        thisMonth: monthTotal,
        byType,
      });
    } catch (error) {
      console.error('Error fetching credit usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [userId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'instance_daily':
        return <Zap className="w-4 h-4" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4" />;
      case 'ai_usage':
        return <Bot className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'instance_daily':
        return 'Instância Ativa';
      case 'message_sent':
        return 'Mensagens';
      case 'ai_usage':
        return 'IA';
      case 'api_call':
        return 'API';
      default:
        return type;
    }
  };

  const usedCredits = summary.thisMonth;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const usagePercent = Math.min(100, (usedCredits / totalCredits) * 100);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Consumo de Créditos
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchUsage}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uso mensal</span>
            <span className="font-medium">
              {usedCredits} / {totalCredits} créditos
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={cn(
              "h-3",
              usagePercent > 80 ? "[&>div]:bg-red-500" : 
              usagePercent > 50 ? "[&>div]:bg-yellow-500" : 
              "[&>div]:bg-green-500"
            )}
          />
          <p className="text-xs text-muted-foreground text-right">
            {remainingCredits} créditos restantes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hoje', value: summary.today, icon: Calendar },
            { label: '7 dias', value: summary.thisWeek, icon: TrendingUp },
            { label: 'Mês', value: summary.thisMonth, icon: Coins },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-lg bg-muted/30 text-center"
            >
              <stat.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Usage by Type */}
        {Object.keys(summary.byType).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Por Categoria</h4>
            <div className="space-y-2">
              {Object.entries(summary.byType).map(([type, credits]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span className="text-sm">{getTypeLabel(type)}</span>
                  </div>
                  <Badge variant="secondary">{credits} créditos</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Usage */}
        {usage.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Últimas Transações</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {usage.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/20"
                >
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.usage_type)}
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {item.description || getTypeLabel(item.usage_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">-{item.credits_used}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.usage_date), 'dd/MM', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
