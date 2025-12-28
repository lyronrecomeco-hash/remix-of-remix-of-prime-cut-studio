import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Award,
  Target,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface BarberStats {
  barberId: string;
  barberName: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  avgRating: number;
  avgServiceTime: number;
  newClients: number;
  returningClients: number;
  completionRate: number;
  topServices: { name: string; count: number }[];
}

const BarberPerformance = () => {
  const { appointments, barbers, services } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBarber, setSelectedBarber] = useState<string | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const COLORS = ['hsl(43, 74%, 49%)', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)', 'hsl(0, 72%, 51%)', 'hsl(280, 65%, 60%)'];

  // Calculate stats for each barber
  const barberStats = useMemo(() => {
    const stats: BarberStats[] = [];
    
    barbers.forEach(barber => {
      const barberAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return (
          a.barber.id === barber.id &&
          appointmentDate.getMonth() === selectedMonth &&
          appointmentDate.getFullYear() === selectedYear
        );
      });

      const completed = barberAppointments.filter(a => a.status === 'completed');
      const cancelled = barberAppointments.filter(a => a.status === 'cancelled');
      const noShow: typeof barberAppointments = []; // no_show status not implemented yet

      // Calculate revenue from completed appointments
      const revenue = completed.reduce((sum, a) => sum + (a.service?.price || 0), 0);

      // Track unique clients
      const clientPhones = new Set<string>();
      const allTimeClientPhones = new Set<string>();
      
      // Get all-time clients for this barber
      appointments.forEach(a => {
        if (a.barber.id === barber.id) {
          allTimeClientPhones.add(a.clientPhone);
        }
      });

      // Count new vs returning for this month
      let newClients = 0;
      let returningClients = 0;
      
      barberAppointments.forEach(a => {
        if (!clientPhones.has(a.clientPhone)) {
          clientPhones.add(a.clientPhone);
          // Check if this client has appointments before this month
          const hasEarlierAppointments = appointments.some(
            prev => prev.barber.id === barber.id && 
                    prev.clientPhone === a.clientPhone && 
                    new Date(prev.date) < new Date(a.date)
          );
          if (hasEarlierAppointments) {
            returningClients++;
          } else {
            newClients++;
          }
        }
      });

      // Count top services
      const serviceCount: Record<string, number> = {};
      barberAppointments.forEach(a => {
        const serviceName = a.service?.name || 'Desconhecido';
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      });
      const topServices = Object.entries(serviceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      stats.push({
        barberId: barber.id,
        barberName: barber.name,
        totalAppointments: barberAppointments.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        noShowAppointments: noShow.length,
        totalRevenue: revenue,
        avgRating: barber.rating || 5.0,
        avgServiceTime: 30, // Default, could be calculated from service durations
        newClients,
        returningClients,
        completionRate: barberAppointments.length > 0 
          ? Math.round((completed.length / barberAppointments.length) * 100) 
          : 0,
        topServices,
      });
    });

    return stats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [appointments, barbers, selectedMonth, selectedYear]);

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = selectedBarber === 'all' 
      ? barberStats 
      : barberStats.filter(s => s.barberId === selectedBarber);
    
    return filtered.reduce(
      (acc, stat) => ({
        appointments: acc.appointments + stat.totalAppointments,
        completed: acc.completed + stat.completedAppointments,
        cancelled: acc.cancelled + stat.cancelledAppointments,
        revenue: acc.revenue + stat.totalRevenue,
        newClients: acc.newClients + stat.newClients,
        returningClients: acc.returningClients + stat.returningClients,
      }),
      { appointments: 0, completed: 0, cancelled: 0, revenue: 0, newClients: 0, returningClients: 0 }
    );
  }, [barberStats, selectedBarber]);

  // Chart data for comparison
  const comparisonData = useMemo(() => {
    return barberStats.map(stat => ({
      name: stat.barberName.split(' ')[0],
      atendimentos: stat.totalAppointments,
      receita: stat.totalRevenue,
      taxa: stat.completionRate,
    }));
  }, [barberStats]);

  // Daily performance for selected barber (last 30 days)
  const dailyData = useMemo(() => {
    const data: { date: string; count: number; revenue: number }[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(a => {
        if (a.date !== dateStr) return false;
        if (selectedBarber !== 'all' && a.barber.id !== selectedBarber) return false;
        return a.status === 'completed';
      });
      
      data.push({
        date: String(day),
        count: dayAppointments.length,
        revenue: dayAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0),
      });
    }
    
    return data;
  }, [appointments, selectedBarber, selectedMonth, selectedYear]);

  // Radar chart data for selected barber
  const radarData = useMemo(() => {
    const stat = selectedBarber === 'all' 
      ? null 
      : barberStats.find(s => s.barberId === selectedBarber);
    
    if (!stat) return [];
    
    const maxInCategory = {
      appointments: Math.max(...barberStats.map(s => s.totalAppointments)) || 1,
      revenue: Math.max(...barberStats.map(s => s.totalRevenue)) || 1,
      completion: 100,
      rating: 5,
      newClients: Math.max(...barberStats.map(s => s.newClients)) || 1,
    };

    return [
      { metric: 'Atendimentos', value: (stat.totalAppointments / maxInCategory.appointments) * 100, fullMark: 100 },
      { metric: 'Receita', value: (stat.totalRevenue / maxInCategory.revenue) * 100, fullMark: 100 },
      { metric: 'Taxa Conclusão', value: stat.completionRate, fullMark: 100 },
      { metric: 'Avaliação', value: (stat.avgRating / 5) * 100, fullMark: 100 },
      { metric: 'Novos Clientes', value: (stat.newClients / maxInCategory.newClients) * 100, fullMark: 100 },
    ];
  }, [barberStats, selectedBarber]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulated refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const exportReport = () => {
    const report = barberStats.map(stat => ({
      Barbeiro: stat.barberName,
      'Total Atendimentos': stat.totalAppointments,
      Concluídos: stat.completedAppointments,
      Cancelados: stat.cancelledAppointments,
      'Receita (R$)': stat.totalRevenue.toFixed(2),
      'Taxa Conclusão (%)': stat.completionRate,
      'Avaliação Média': stat.avgRating.toFixed(1),
      'Novos Clientes': stat.newClients,
      'Clientes Retornantes': stat.returningClients,
    }));

    const csv = [
      Object.keys(report[0] || {}).join(','),
      ...report.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-desempenho-${monthNames[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Relatório de Desempenho
          </h2>
          <p className="text-muted-foreground text-sm">
            Análise detalhada do desempenho por barbeiro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePreviousMonth} className="p-2 hover:bg-secondary rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium min-w-[150px] text-center">
            {monthNames[selectedMonth]} {selectedYear}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <select
          value={selectedBarber}
          onChange={(e) => setSelectedBarber(e.target.value)}
          className="bg-secondary px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos os Barbeiros</option>
          {barbers.map(barber => (
            <option key={barber.id} value={barber.id}>{barber.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totals.appointments}</p>
          <p className="text-sm text-muted-foreground">Total Atendimentos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-500">R$ {totals.revenue.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Receita Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totals.newClients}</p>
          <p className="text-sm text-muted-foreground">Novos Clientes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {totals.appointments > 0 ? Math.round((totals.completed / totals.appointments) * 100) : 0}%
          </p>
          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Barber Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Comparativo de Barbeiros
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
              <XAxis dataKey="name" stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 7%)',
                  border: '1px solid hsl(43, 30%, 18%)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="atendimentos" fill="hsl(43, 74%, 49%)" name="Atendimentos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Receita por Barbeiro
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
              <XAxis dataKey="name" stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 7%)',
                  border: '1px solid hsl(43, 30%, 18%)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
              />
              <Bar dataKey="receita" fill="hsl(142, 71%, 45%)" name="Receita (R$)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Daily Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Atendimentos Diários - {monthNames[selectedMonth]}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
            <XAxis dataKey="date" stroke="hsl(0, 0%, 50%)" fontSize={10} />
            <YAxis stroke="hsl(0, 0%, 50%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 7%)',
                border: '1px solid hsl(43, 30%, 18%)',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="count" stroke="hsl(43, 74%, 49%)" strokeWidth={2} dot={false} name="Atendimentos" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Radar Chart for Selected Barber */}
      {selectedBarber !== 'all' && radarData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Perfil de Desempenho - {barbers.find(b => b.id === selectedBarber)?.name}
          </h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(0, 0%, 30%)" />
                <PolarAngleAxis dataKey="metric" stroke="hsl(0, 0%, 60%)" fontSize={12} />
                <PolarRadiusAxis stroke="hsl(0, 0%, 40%)" fontSize={10} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="hsl(43, 74%, 49%)"
                  fill="hsl(43, 74%, 49%)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Detailed Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card rounded-xl p-6 overflow-x-auto"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Detalhamento por Barbeiro
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2">Barbeiro</th>
              <th className="text-center py-3 px-2">Atend.</th>
              <th className="text-center py-3 px-2">Concluídos</th>
              <th className="text-center py-3 px-2">Cancel.</th>
              <th className="text-center py-3 px-2">Taxa</th>
              <th className="text-right py-3 px-2">Receita</th>
              <th className="text-center py-3 px-2">Avaliação</th>
              <th className="text-center py-3 px-2">Novos</th>
            </tr>
          </thead>
          <tbody>
            {barberStats.map((stat, index) => (
              <tr key={stat.barberId} className="border-b border-border/50 hover:bg-secondary/50">
                <td className="py-3 px-2 font-medium flex items-center gap-2">
                  {index === 0 && <Award className="w-4 h-4 text-yellow-500" />}
                  {stat.barberName}
                </td>
                <td className="text-center py-3 px-2">{stat.totalAppointments}</td>
                <td className="text-center py-3 px-2 text-green-500">{stat.completedAppointments}</td>
                <td className="text-center py-3 px-2 text-red-500">{stat.cancelledAppointments}</td>
                <td className="text-center py-3 px-2">
                  <span className={stat.completionRate >= 80 ? 'text-green-500' : stat.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                    {stat.completionRate}%
                  </span>
                </td>
                <td className="text-right py-3 px-2 font-medium text-green-500">
                  R$ {stat.totalRevenue.toFixed(2)}
                </td>
                <td className="text-center py-3 px-2">
                  <span className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {stat.avgRating.toFixed(1)}
                  </span>
                </td>
                <td className="text-center py-3 px-2">{stat.newClients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default BarberPerformance;