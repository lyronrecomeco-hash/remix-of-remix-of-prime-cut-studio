import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Eye, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '@/contexts/AppContext';
import UsageProgress from '@/components/subscription/UsageProgress';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard = React.memo(({ onNavigate }: DashboardProps) => {
  const { appointments, queue, services, barbers } = useApp();

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    const confirmedToday = todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed');
    const pendingToday = todayAppointments.filter(a => a.status === 'pending');
    const cancelledToday = todayAppointments.filter(a => a.status === 'cancelled');
    const waitingQueue = queue.filter(q => q.status === 'waiting');

    // Last 7 days appointments
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(a => a.date === dateStr);
      last7Days.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        agendamentos: dayAppointments.length,
        confirmados: dayAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length,
      });
    }

    // Service distribution
    const serviceStats = services.map(service => {
      const count = appointments.filter(a => a.service.id === service.id).length;
      return { name: service.name, value: count };
    }).filter(s => s.value > 0);

    // Barber performance
    const barberStats = barbers.map(barber => {
      const barberAppointments = appointments.filter(a => a.barber.id === barber.id);
      const completed = barberAppointments.filter(a => a.status === 'completed').length;
      return { name: barber.name, agendamentos: barberAppointments.length, concluidos: completed };
    });

    return {
      todayTotal: todayAppointments.length,
      confirmed: confirmedToday.length,
      pending: pendingToday.length,
      cancelled: cancelledToday.length,
      queueSize: waitingQueue.length,
      last7Days,
      serviceStats,
      barberStats,
      occupancyRate: todayAppointments.length > 0 
        ? Math.round((confirmedToday.length / todayAppointments.length) * 100) 
        : 0,
    };
  }, [appointments, queue, services, barbers]);

  const COLORS = ['hsl(43, 74%, 49%)', 'hsl(43, 74%, 35%)', 'hsl(43, 74%, 60%)', 'hsl(0, 0%, 40%)'];

  const statCards = [
    { 
      label: 'Agendamentos Hoje', 
      value: metrics.todayTotal, 
      icon: Calendar, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => onNavigate?.('agenda')
    },
    { 
      label: 'Confirmados', 
      value: metrics.confirmed, 
      icon: CheckCircle, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Pendentes', 
      value: metrics.pending, 
      icon: Clock, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      label: 'Na Fila', 
      value: metrics.queueSize, 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      onClick: () => onNavigate?.('fila')
    },
  ];

  return (
    <div className="space-y-6">
      {/* Usage Progress - subscription tracking */}
      <UsageProgress showUpgradeButton />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className={`glass-card rounded-xl p-4 ${stat.onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Agendamentos - Últimos 7 Dias</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.last7Days}>
              <defs>
                <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
              <XAxis dataKey="date" stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 7%)', 
                  border: '1px solid hsl(43, 30%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(45, 20%, 95%)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="agendamentos" 
                stroke="hsl(43, 74%, 49%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAgendamentos)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Service Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Serviços Mais Populares</h3>
          </div>
          {metrics.serviceStats.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={metrics.serviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.serviceStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {metrics.serviceStats.slice(0, 4).map((service, index) => (
                  <div key={service.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm truncate flex-1">{service.name}</span>
                    <span className="text-sm font-medium">{service.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground">
              Sem dados de serviços
            </div>
          )}
        </motion.div>
      </div>

      {/* Occupancy Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Taxa de Ocupação Hoje</h3>
          <span className="text-2xl font-bold text-primary">{metrics.occupancyRate}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.occupancyRate}%` }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'var(--gradient-primary)' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{metrics.confirmed} confirmados</span>
          <span>{metrics.todayTotal} total</span>
        </div>
      </motion.div>

    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
