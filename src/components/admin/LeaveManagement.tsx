import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Palmtree,
  Stethoscope,
  Coffee,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, isWithinInterval, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Leave {
  id: string;
  barber_id: string;
  leave_type: 'dayoff' | 'vacation' | 'medical' | 'other';
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

const leaveTypeConfig = {
  dayoff: { label: 'Folga', icon: Coffee, color: 'bg-blue-500/20 text-blue-500' },
  vacation: { label: 'Férias', icon: Palmtree, color: 'bg-green-500/20 text-green-500' },
  medical: { label: 'Médico', icon: Stethoscope, color: 'bg-red-500/20 text-red-500' },
  other: { label: 'Outro', icon: Clock, color: 'bg-gray-500/20 text-gray-500' },
};

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-500' },
  approved: { label: 'Aprovado', color: 'bg-green-500/20 text-green-500' },
  rejected: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-500' },
};

const LeaveManagement = () => {
  const { barbers } = useApp();
  const { notify } = useNotification();
  
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [viewMonth, setViewMonth] = useState(new Date());

  const [form, setForm] = useState({
    barber_id: '',
    leave_type: 'dayoff' as 'dayoff' | 'vacation' | 'medical' | 'other',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('barber_leaves')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setLeaves((data as Leave[]) || []);
    } catch (error) {
      console.error('Error loading leaves:', error);
      notify.error('Erro ao carregar folgas');
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.barber_id || !form.start_date || !form.end_date) {
      notify.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      notify.error('Data final deve ser maior que inicial');
      return;
    }

    try {
      if (editingLeave) {
        const { error } = await supabase
          .from('barber_leaves')
          .update({
            barber_id: form.barber_id,
            leave_type: form.leave_type,
            start_date: form.start_date,
            end_date: form.end_date,
            reason: form.reason || null,
          })
          .eq('id', editingLeave.id);

        if (error) throw error;
        notify.success('Folga atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('barber_leaves')
          .insert({
            barber_id: form.barber_id,
            leave_type: form.leave_type,
            start_date: form.start_date,
            end_date: form.end_date,
            reason: form.reason || null,
            status: 'approved', // Auto-approve for now
          });

        if (error) throw error;
        notify.success('Folga cadastrada com sucesso');
      }

      setShowModal(false);
      resetForm();
      loadLeaves();
    } catch (error) {
      console.error('Error saving leave:', error);
      notify.error('Erro ao salvar folga');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('barber_leaves')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      notify.success('Folga aprovada');
      loadLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      notify.error('Erro ao aprovar folga');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('barber_leaves')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      notify.success('Folga rejeitada');
      loadLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      notify.error('Erro ao rejeitar folga');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta folga?')) return;

    try {
      const { error } = await supabase
        .from('barber_leaves')
        .delete()
        .eq('id', id);

      if (error) throw error;
      notify.success('Folga excluída');
      loadLeaves();
    } catch (error) {
      console.error('Error deleting leave:', error);
      notify.error('Erro ao excluir folga');
    }
  };

  const handleEdit = (leave: Leave) => {
    setEditingLeave(leave);
    setForm({
      barber_id: leave.barber_id,
      leave_type: leave.leave_type as 'dayoff' | 'vacation' | 'medical' | 'other',
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      barber_id: barbers[0]?.id || '',
      leave_type: 'dayoff',
      start_date: '',
      end_date: '',
      reason: '',
    });
    setEditingLeave(null);
  };

  const openNewModal = () => {
    resetForm();
    setForm(f => ({ ...f, barber_id: barbers[0]?.id || '' }));
    setShowModal(true);
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filterStatus !== 'all' && leave.status !== filterStatus) return false;
    if (filterBarber !== 'all' && leave.barber_id !== filterBarber) return false;
    return true;
  });

  // Calendar data for current month
  const getCalendarDays = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month to fill first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Add days from next month to complete grid
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getLeavesForDay = (date: Date) => {
    return leaves.filter(leave => {
      if (leave.status === 'rejected') return false;
      const start = parseISO(leave.start_date);
      const end = parseISO(leave.end_date);
      return isWithinInterval(date, { start, end: addDays(end, 1) });
    });
  };

  const getBarberName = (barberId: string) => {
    return barbers.find(b => b.id === barberId)?.name || 'Desconhecido';
  };

  // Stats
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    thisMonth: leaves.filter(l => {
      const start = parseISO(l.start_date);
      return start.getMonth() === new Date().getMonth() && 
             start.getFullYear() === new Date().getFullYear() &&
             l.status === 'approved';
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-green-500" />
            Gestão de Folgas e Férias
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie as ausências dos barbeiros
          </p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Folga
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total de Registros</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
          <p className="text-sm text-muted-foreground">Aprovados</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-2xl font-bold text-primary">{stats.thisMonth}</p>
          <p className="text-sm text-muted-foreground">Este Mês</p>
        </motion.div>
      </div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Calendário de Ausências
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium min-w-[140px] text-center">
              {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {getCalendarDays().map((date, index) => {
            const dayLeaves = getLeavesForDay(date);
            const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[60px] p-1 border border-border/30 rounded-lg ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>
                  {date.getDate()}
                </span>
                <div className="space-y-0.5 mt-1">
                  {dayLeaves.slice(0, 2).map(leave => {
                    const config = leaveTypeConfig[leave.leave_type as keyof typeof leaveTypeConfig];
                    return (
                      <div
                        key={leave.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${config.color}`}
                        title={`${getBarberName(leave.barber_id)} - ${config.label}`}
                      >
                        {getBarberName(leave.barber_id).split(' ')[0]}
                      </div>
                    );
                  })}
                  {dayLeaves.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayLeaves.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-secondary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
        <select
          value={filterBarber}
          onChange={(e) => setFilterBarber(e.target.value)}
          className="bg-secondary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos os Barbeiros</option>
          {barbers.map(barber => (
            <option key={barber.id} value={barber.id}>{barber.name}</option>
          ))}
        </select>
      </div>

      {/* Leaves List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma folga encontrada
          </div>
        ) : (
          filteredLeaves.map((leave, index) => {
            const typeConfig = leaveTypeConfig[leave.leave_type as keyof typeof leaveTypeConfig];
            const statusCfg = statusConfig[leave.status as keyof typeof statusConfig];
            const duration = differenceInDays(parseISO(leave.end_date), parseISO(leave.start_date)) + 1;
            const TypeIcon = typeConfig.icon;

            return (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${typeConfig.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-6 h-6 ${typeConfig.color.split(' ')[1]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{getBarberName(leave.barber_id)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(parseISO(leave.start_date), "dd/MM/yyyy")} 
                      {leave.start_date !== leave.end_date && (
                        <> até {format(parseISO(leave.end_date), "dd/MM/yyyy")}</>
                      )}
                      <span className="ml-2">({duration} dia{duration > 1 ? 's' : ''})</span>
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{leave.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {leave.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(leave.id)}
                          className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(leave.id)}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(leave)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(leave.id)}
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
              <h3 className="text-lg font-semibold mb-4">
                {editingLeave ? 'Editar Folga' : 'Nova Folga/Férias'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Barbeiro *</label>
                  <select
                    value={form.barber_id}
                    onChange={(e) => setForm({ ...form, barber_id: e.target.value })}
                    className="w-full bg-secondary px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione...</option>
                    {barbers.map(barber => (
                      <option key={barber.id} value={barber.id}>{barber.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo *</label>
                  <select
                    value={form.leave_type}
                    onChange={(e) => setForm({ ...form, leave_type: e.target.value as typeof form.leave_type })}
                    className="w-full bg-secondary px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="dayoff">Folga</option>
                    <option value="vacation">Férias</option>
                    <option value="medical">Médico</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data Início *</label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data Fim *</label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Motivo (opcional)</label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Ex: Consulta médica, viagem, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  {editingLeave ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveManagement;