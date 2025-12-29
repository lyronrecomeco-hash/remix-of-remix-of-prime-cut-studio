import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAppointments: number;
  monthlyAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  recentLogins: number;
  failedLogins: number;
}

interface ChartData {
  date: string;
  appointments: number;
}

const OwnerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAppointments: 0,
    monthlyAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    recentLogins: 0,
    failedLogins: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const last7Days = subDays(now, 7);

      // Fetch admin users
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('*');

      // Fetch all appointments
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('*');

      // Fetch monthly appointments
      const { data: monthlyAppts } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      // Fetch login attempts
      const { data: loginAttempts } = await supabase
        .from('login_attempts')
        .select('*')
        .gte('attempted_at', last7Days.toISOString());

      // Calculate stats
      const completed = allAppointments?.filter(a => a.status === 'completed').length || 0;
      const cancelled = allAppointments?.filter(a => a.status === 'cancelled').length || 0;
      const successfulLogins = loginAttempts?.filter(l => l.success).length || 0;
      const failedLogins = loginAttempts?.filter(l => !l.success).length || 0;

      setStats({
        totalUsers: adminUsers?.length || 0,
        activeUsers: adminUsers?.filter(u => u.is_active).length || 0,
        totalAppointments: allAppointments?.length || 0,
        monthlyAppointments: monthlyAppts?.length || 0,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        recentLogins: successfulLogins,
        failedLogins: failedLogins,
      });

      // Generate chart data for last 7 days
      const chartDays: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const count = allAppointments?.filter(a => a.date === dayStr).length || 0;
        chartDays.push({
          date: format(day, 'dd/MM', { locale: ptBR }),
          appointments: count,
        });
      }
      setChartData(chartDays);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Usuários Totais',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} ativos`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Agendamentos (Mês)',
      value: stats.monthlyAppointments,
      subtitle: `${stats.totalAppointments} total`,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Concluídos',
      value: stats.completedAppointments,
      subtitle: `${Math.round((stats.completedAppointments / (stats.totalAppointments || 1)) * 100)}% do total`,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Cancelados',
      value: stats.cancelledAppointments,
      subtitle: `${Math.round((stats.cancelledAppointments / (stats.totalAppointments || 1)) * 100)}% do total`,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Logins (7 dias)',
      value: stats.recentLogins,
      subtitle: 'Bem-sucedidos',
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Logins Falhos',
      value: stats.failedLogins,
      subtitle: 'Últimos 7 dias',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm">{stat.title}</CardDescription>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Agendamentos (Últimos 7 dias)</CardTitle>
            <CardDescription>Volume diário de agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Volume por Dia</CardTitle>
            <CardDescription>Distribuição de agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Edge Functions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
