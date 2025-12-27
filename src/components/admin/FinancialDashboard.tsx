import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Scissors, 
  Clock,
  Target,
  CreditCard,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const FinancialDashboard = () => {
  const { appointments, services } = useApp();

  // Calculate financial metrics
  const financialData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get completed appointments
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const todayCompleted = completedAppointments.filter(a => a.date === todayStr);
    
    // Get this month's data
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthCompleted = completedAppointments.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Get last month's data for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthCompleted = completedAppointments.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // Calculate revenues
    const todayRevenue = todayCompleted.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    const monthRevenue = monthCompleted.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    const lastMonthRevenue = lastMonthCompleted.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    
    // Calculate average ticket
    const avgTicket = monthCompleted.length > 0 ? monthRevenue / monthCompleted.length : 0;
    
    // Calculate growth percentage
    const growthPercentage = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Daily revenue for the last 7 days
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = completedAppointments.filter(a => a.date === dateStr);
      const revenue = dayAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
      dailyRevenue.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        date: date.getDate(),
        revenue,
        count: dayAppointments.length,
      });
    }

    // Revenue by service
    const serviceRevenue: Record<string, { name: string; revenue: number; count: number }> = {};
    monthCompleted.forEach(a => {
      if (a.service) {
        if (!serviceRevenue[a.service.id]) {
          serviceRevenue[a.service.id] = { name: a.service.name, revenue: 0, count: 0 };
        }
        serviceRevenue[a.service.id].revenue += a.service.price;
        serviceRevenue[a.service.id].count += 1;
      }
    });
    const serviceRevenueArray = Object.values(serviceRevenue).sort((a, b) => b.revenue - a.revenue);

    // Appointments by status
    const todayAppointments = appointments.filter(a => a.date === todayStr);
    const pendingCount = todayAppointments.filter(a => a.status === 'pending').length;
    const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'inqueue').length;
    const completedCount = todayCompleted.length;
    const cancelledCount = todayAppointments.filter(a => a.status === 'cancelled').length;

    return {
      todayRevenue,
      monthRevenue,
      avgTicket,
      growthPercentage: Number(growthPercentage),
      todayCount: todayCompleted.length,
      monthCount: monthCompleted.length,
      dailyRevenue,
      serviceRevenue: serviceRevenueArray,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalTodayAppointments: todayAppointments.length,
    };
  }, [appointments, services]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const statusData = [
    { name: 'Pendentes', value: financialData.pendingCount, color: 'hsl(45, 100%, 50%)' },
    { name: 'Confirmados', value: financialData.confirmedCount, color: 'hsl(var(--primary))' },
    { name: 'Concluídos', value: financialData.completedCount, color: 'hsl(142, 76%, 36%)' },
    { name: 'Cancelados', value: financialData.cancelledCount, color: 'hsl(0, 84%, 60%)' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão Financeira</h2>
        <p className="text-sm text-muted-foreground">Controle completo de receitas e métricas</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Hoje</span>
          </div>
          <p className="text-2xl font-bold text-green-500">R$ {financialData.todayRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{financialData.todayCount} atendimento(s)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Este mês</span>
          </div>
          <p className="text-2xl font-bold">R$ {financialData.monthRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{financialData.monthCount} atendimento(s)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="text-2xl font-bold">R$ {financialData.avgTicket.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">por atendimento</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              financialData.growthPercentage >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {financialData.growthPercentage >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">Crescimento</span>
          </div>
          <p className={`text-2xl font-bold ${
            financialData.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {financialData.growthPercentage >= 0 ? '+' : ''}{financialData.growthPercentage}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">vs. mês anterior</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Receita dos Últimos 7 Dias</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Agendamentos de Hoje</h3>
          </div>
          {financialData.totalTodayAppointments === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum agendamento para hoje
            </div>
          ) : (
            <div className="h-[250px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue by Service */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Scissors className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Receita por Serviço (Este Mês)</h3>
        </div>
        {financialData.serviceRevenue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum serviço concluído neste mês
          </div>
        ) : (
          <div className="space-y-4">
            {financialData.serviceRevenue.map((service, index) => {
              const percentage = (service.revenue / financialData.monthRevenue) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{service.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{service.count} atendimento(s)</span>
                      <span className="text-sm font-bold text-primary">R$ {service.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{financialData.pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pendentes Hoje</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{financialData.confirmedCount}</p>
          <p className="text-xs text-muted-foreground">Em Espera</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{financialData.completedCount}</p>
          <p className="text-xs text-muted-foreground">Concluídos Hoje</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <TrendingUp className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{financialData.totalTodayAppointments}</p>
          <p className="text-xs text-muted-foreground">Total Hoje</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
