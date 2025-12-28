import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  DollarSign,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Award,
  Zap,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  barber_id: string | null;
  goal_type: 'revenue' | 'appointments' | 'new_clients' | 'avg_rating';
  target_value: number;
  current_value: number;
  month: number;
  year: number;
  bonus_amount: number;
  is_active: boolean;
}

const goalTypeConfig = {
  revenue: { 
    label: 'Receita', 
    icon: DollarSign, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    format: (v: number) => `R$ ${v.toFixed(2)}`,
  },
  appointments: { 
    label: 'Atendimentos', 
    icon: Calendar, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    format: (v: number) => `${Math.round(v)}`,
  },
  new_clients: { 
    label: 'Novos Clientes', 
    icon: Users, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    format: (v: number) => `${Math.round(v)}`,
  },
  avg_rating: { 
    label: 'Avaliação Média', 
    icon: Star, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    format: (v: number) => v.toFixed(1),
  },
};

const MonthlyGoals = () => {
  const { barbers, appointments } = useApp();
  const { notify } = useNotification();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    barber_id: '' as string | null,
    goal_type: 'revenue' as 'revenue' | 'appointments' | 'new_clients' | 'avg_rating',
    target_value: 0,
    bonus_amount: 0,
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadGoals();
  }, [selectedMonth, selectedYear]);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGoals((data as Goal[]) || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      notify.error('Erro ao carregar metas');
    }
    setIsLoading(false);
  };

  // Calculate current values based on appointments
  const calculatedValues = useMemo(() => {
    const values: Record<string, Record<string, number>> = {};
    
    // Initialize for all barbers
    barbers.forEach(barber => {
      values[barber.id] = {
        revenue: 0,
        appointments: 0,
        new_clients: 0,
        avg_rating: barber.rating || 5.0,
      };
    });
    
    // Global values
    values['global'] = {
      revenue: 0,
      appointments: 0,
      new_clients: 0,
      avg_rating: 0,
    };

    const clientsPerBarber: Record<string, Set<string>> = {};
    barbers.forEach(b => { clientsPerBarber[b.id] = new Set(); });
    const allClients = new Set<string>();

    // Filter appointments for selected month
    appointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      if (aptDate.getMonth() + 1 !== selectedMonth || aptDate.getFullYear() !== selectedYear) return;
      if (apt.status !== 'completed') return;

      const barberId = apt.barber.id;
      if (!values[barberId]) return;

      // Revenue
      const price = apt.service?.price || 0;
      values[barberId].revenue += price;
      values['global'].revenue += price;

      // Appointments count
      values[barberId].appointments += 1;
      values['global'].appointments += 1;

      // New clients (unique per barber)
      if (!clientsPerBarber[barberId].has(apt.clientPhone)) {
        clientsPerBarber[barberId].add(apt.clientPhone);
        values[barberId].new_clients += 1;
      }
      if (!allClients.has(apt.clientPhone)) {
        allClients.add(apt.clientPhone);
        values['global'].new_clients += 1;
      }
    });

    // Calculate average rating for global
    const totalRating = barbers.reduce((sum, b) => sum + (b.rating || 5), 0);
    values['global'].avg_rating = barbers.length > 0 ? totalRating / barbers.length : 5;

    return values;
  }, [appointments, barbers, selectedMonth, selectedYear]);

  const handleSubmit = async () => {
    if (form.target_value <= 0) {
      notify.error('O valor da meta deve ser maior que zero');
      return;
    }

    const barberId = form.barber_id === '' ? null : form.barber_id;

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('monthly_goals')
          .update({
            barber_id: barberId,
            goal_type: form.goal_type,
            target_value: form.target_value,
            bonus_amount: form.bonus_amount,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
        notify.success('Meta atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('monthly_goals')
          .insert({
            barber_id: barberId,
            goal_type: form.goal_type,
            target_value: form.target_value,
            bonus_amount: form.bonus_amount,
            month: selectedMonth,
            year: selectedYear,
            current_value: 0,
            is_active: true,
          });

        if (error) throw error;
        notify.success('Meta criada com sucesso');
      }

      setShowModal(false);
      resetForm();
      loadGoals();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      if (error.code === '23505') {
        notify.error('Já existe uma meta deste tipo para este barbeiro/mês');
      } else {
        notify.error('Erro ao salvar meta');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      const { error } = await supabase
        .from('monthly_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      notify.success('Meta excluída');
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      notify.error('Erro ao excluir meta');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      barber_id: goal.barber_id || '',
      goal_type: goal.goal_type as typeof form.goal_type,
      target_value: goal.target_value,
      bonus_amount: goal.bonus_amount,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      barber_id: '',
      goal_type: 'revenue',
      target_value: 0,
      bonus_amount: 0,
    });
    setEditingGoal(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    const key = goal.barber_id || 'global';
    const current = calculatedValues[key]?.[goal.goal_type] || 0;
    return Math.min(100, Math.round((current / goal.target_value) * 100));
  };

  const getCurrentValue = (goal: Goal) => {
    const key = goal.barber_id || 'global';
    return calculatedValues[key]?.[goal.goal_type] || 0;
  };

  const getBarberName = (barberId: string | null) => {
    if (!barberId) return 'Barbearia (Global)';
    return barbers.find(b => b.id === barberId)?.name || 'Desconhecido';
  };

  // Stats
  const stats = {
    total: goals.length,
    completed: goals.filter(g => getProgressPercentage(g) >= 100).length,
    inProgress: goals.filter(g => {
      const p = getProgressPercentage(g);
      return p > 0 && p < 100;
    }).length,
    totalBonus: goals
      .filter(g => getProgressPercentage(g) >= 100)
      .reduce((sum, g) => sum + g.bonus_amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Metas Mensais
          </h2>
          <p className="text-muted-foreground text-sm">
            Defina e acompanhe metas de desempenho
          </p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-center gap-4">
        <button onClick={handlePreviousMonth} className="p-2 hover:bg-secondary rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg min-w-[180px] text-center">
          {monthNames[selectedMonth - 1]} {selectedYear}
        </span>
        <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Metas Definidas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Metas Atingidas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.inProgress}</p>
          <p className="text-sm text-muted-foreground">Em Progresso</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-500">R$ {stats.totalBonus.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Bônus a Pagar</p>
        </motion.div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-8 text-center"
          >
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Meta Definida</h3>
            <p className="text-muted-foreground mb-4">
              Crie metas para motivar sua equipe e acompanhar o progresso
            </p>
            <Button onClick={openNewModal}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </motion.div>
        ) : (
          goals.map((goal, index) => {
            const config = goalTypeConfig[goal.goal_type as keyof typeof goalTypeConfig];
            const progress = getProgressPercentage(goal);
            const current = getCurrentValue(goal);
            const isCompleted = progress >= 100;
            const IconComponent = config.icon;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card rounded-xl p-6 ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-7 h-7 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold">{getBarberName(goal.barber_id)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Meta Atingida!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-3">
                      <span className="text-muted-foreground">Progresso:</span>
                      <span className="font-medium">{config.format(current)}</span>
                      <span className="text-muted-foreground">de</span>
                      <span className="font-medium">{config.format(goal.target_value)}</span>
                      {goal.bonus_amount > 0 && (
                        <span className="text-purple-500 ml-2">
                          (Bônus: R$ {goal.bonus_amount.toFixed(2)})
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : 'bg-gradient-to-r from-primary to-primary/70'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{progress}% concluído</span>
                      <span>
                        {goal.target_value - current > 0 
                          ? `Faltam ${config.format(goal.target_value - current)}`
                          : 'Meta superada!'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(goal)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Para quem?</label>
                  <select
                    value={form.barber_id || ''}
                    onChange={(e) => setForm({ ...form, barber_id: e.target.value || null })}
                    className="w-full bg-secondary px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Barbearia (Meta Global)</option>
                    {barbers.map(barber => (
                      <option key={barber.id} value={barber.id}>{barber.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Meta *</label>
                  <select
                    value={form.goal_type}
                    onChange={(e) => setForm({ ...form, goal_type: e.target.value as typeof form.goal_type })}
                    className="w-full bg-secondary px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="revenue">Receita (R$)</option>
                    <option value="appointments">Atendimentos</option>
                    <option value="new_clients">Novos Clientes</option>
                    <option value="avg_rating">Avaliação Média</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Valor da Meta * 
                    {form.goal_type === 'revenue' && ' (R$)'}
                    {form.goal_type === 'avg_rating' && ' (1-5)'}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={form.goal_type === 'revenue' ? '0.01' : form.goal_type === 'avg_rating' ? '0.1' : '1'}
                    max={form.goal_type === 'avg_rating' ? 5 : undefined}
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 5000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Bônus ao Atingir (R$)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.bonus_amount}
                    onChange={(e) => setForm({ ...form, bonus_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 200"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor a ser pago ao barbeiro quando atingir a meta
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  {editingGoal ? 'Salvar' : 'Criar Meta'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyGoals;