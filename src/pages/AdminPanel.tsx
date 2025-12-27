import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Bell,
  Scissors,
  LogOut,
  Menu,
  X,
  Check,
  XCircle,
  Play,
  Pause,
  Plus,
  ChevronRight,
  Moon,
  Sun,
  Palette,
  Image,
  MessageSquare,
  Star,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Link as LinkIcon,
  Upload,
  Filter,
  ChevronLeft,
  ChevronDown,
  Phone,
  Navigation,
  AlertTriangle,
  Instagram,
  Facebook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { useApp, Appointment } from '@/contexts/AppContext';
import { useFeedback, Feedback } from '@/contexts/FeedbackContext';
import { useGallery } from '@/contexts/GalleryContext';
import { useNotification } from '@/contexts/NotificationContext';

import Dashboard from '@/components/admin/Dashboard';
import UserManagement from '@/components/admin/UserManagement';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import NotificationsPanel from '@/components/admin/NotificationsPanel';
import OverloadAlertModal from '@/components/admin/OverloadAlertModal';
import InteractiveBackground from '@/components/admin/InteractiveBackground';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/admin/PullToRefreshIndicator';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Calendar },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'fila', label: 'Fila de Espera', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { id: 'usuarios', label: 'Usuários', icon: Lock },
  { id: 'config', label: 'Configurações', icon: Settings },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [agendaDateFilter, setAgendaDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<string>('all');
  const { notify } = useNotification();
  const { signOut, user, isSuperAdmin } = useAuth();
  
  // App context
  const {
    appointments,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    callSpecificClient,
    markClientOnWay,
    queueEnabled,
    setQueueEnabled,
    maxQueueSize,
    setMaxQueueSize,
    queue,
    callNextInQueue,
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceVisibility,
    barbers,
    blockedSlots,
    addBlockedSlot,
    removeBlockedSlot,
    barberAvailability,
    setBarberDayAvailability,
    getBarberDayAvailability,
    shopSettings,
    updateShopSettings,
    theme,
    setTheme,
    refreshData,
  } = useApp();

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
    notify.success('Dados atualizados!');
  }, [refreshData, notify]);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // Feedback context
  const {
    feedbacks,
    updateFeedbackStatus,
    getNewFeedbacksCount,
    deleteFeedback,
  } = useFeedback();

  // Gallery context
  const { images: galleryImages, addImage, removeImage } = useGallery();

  // New service form
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
  });

  // Block slot form
  const [blockSlotForm, setBlockSlotForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '13:00',
    reason: '',
    barberId: '1',
  });

  // New image URL
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');

  // Barber availability management
  const [selectedBarberForAvailability, setSelectedBarberForAvailability] = useState(barbers[0]?.id || '');
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  // Generate all possible time slots for a day
  const allPossibleSlots = (() => {
    const slots: string[] = [];
    for (let hour = 9; hour < 20; hour++) {
      for (const minute of [0, 30]) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  })();

  // Load barber availability when date or barber changes
  useEffect(() => {
    if (selectedBarberForAvailability && availabilityDate) {
      const existing = getBarberDayAvailability(selectedBarberForAvailability, availabilityDate);
      setSelectedTimeSlots(existing || []);
    }
  }, [selectedBarberForAvailability, availabilityDate, getBarberDayAvailability]);

  const handleToggleTimeSlot = (time: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    );
  };

  const handleSaveAvailability = () => {
    setBarberDayAvailability(selectedBarberForAvailability, availabilityDate, selectedTimeSlots);
    notify.success('Disponibilidade salva', `Horários atualizados para ${availabilityDate}`);
  };

  const handleSelectAllSlots = () => {
    setSelectedTimeSlots([...allPossibleSlots]);
  };

  const handleClearAllSlots = () => {
    setSelectedTimeSlots([]);
  };

  const newFeedbacksCount = getNewFeedbacksCount();

  // Today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  // Feedback filters
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'published' | 'archived'>('all');
  const filteredFeedbacks = feedbacks.filter(f => {
    if (feedbackFilter === 'all') return f.status !== 'archived';
    return f.status === feedbackFilter;
  });

  // Notification for new feedbacks
  useEffect(() => {
    if (newFeedbacksCount > 0 && activeTab === 'feedbacks') {
      notify.info('Novos feedbacks', `Você tem ${newFeedbacksCount} feedback(s) para revisar`);
    }
  }, [activeTab]);

  const handleAppointmentAction = (id: string, action: 'confirm' | 'cancel' | 'complete') => {
    if (action === 'confirm') confirmAppointment(id);
    else if (action === 'cancel') cancelAppointment(id);
    else if (action === 'complete') completeAppointment(id);
    
    const actionText = action === 'confirm' ? 'confirmado' : action === 'cancel' ? 'cancelado' : 'concluído';
    notify.success(`Agendamento ${actionText}`);
  };

  const handleCallNext = () => {
    const next = callNextInQueue();
    if (next) {
      const apt = appointments.find(a => a.id === next.appointmentId);
      if (apt) {
        notify.queue(`${apt.clientName} chamado!`, 'Próximo cliente na fila');
      }
    }
  };

  const handleAddService = () => {
    if (!newService.name.trim()) return;
    addService({
      name: newService.name,
      description: newService.description,
      duration: newService.duration,
      price: newService.price,
      icon: 'Scissors',
    });
    setNewService({ name: '', description: '', duration: 30, price: 0 });
    notify.success('Serviço adicionado');
  };

  const handleAddBlockedSlot = () => {
    addBlockedSlot({
      date: blockSlotForm.date,
      startTime: blockSlotForm.startTime,
      endTime: blockSlotForm.endTime,
      reason: blockSlotForm.reason,
      barberId: blockSlotForm.barberId,
    });
    notify.success('Horário bloqueado');
  };

  const handleAddGalleryImage = () => {
    if (!newImageUrl.trim()) return;
    addImage({
      url: newImageUrl,
      title: newImageTitle || undefined,
    });
    setNewImageUrl('');
    setNewImageTitle('');
    notify.success('Imagem adicionada à galeria');
  };

  const handleCopyFeedbackLink = () => {
    const currentDomain = window.location.origin;
    const feedbackLink = `${currentDomain}/avaliar`;
    navigator.clipboard.writeText(feedbackLink);
    notify.success('Link copiado!', feedbackLink);
  };

  const handlePublishFeedback = (id: string) => {
    updateFeedbackStatus(id, 'published');
    notify.success('Feedback publicado no site');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
        
      case 'financeiro':
        return <FinancialDashboard />;
        
      case 'agenda':
        // Filter appointments
        const filteredAppointments = appointments
          .filter(a => {
            if (a.date !== agendaDateFilter) return false;
            if (agendaStatusFilter !== 'all' && a.status !== agendaStatusFilter) return false;
            return true;
          })
          .sort((a, b) => a.time.localeCompare(b.time));
        
        // Get unique dates with appointments for navigation
        const datesWithAppointments = [...new Set(appointments.map(a => a.date))].sort();
        
        // Count for daily limit check
        const dateAppointmentCount = appointments.filter(a => 
          a.date === agendaDateFilter && a.status !== 'cancelled'
        ).length;

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Agenda</h2>
                <div className="text-sm text-muted-foreground">
                  {filteredAppointments.length} agendamento(s) em {new Date(agendaDateFilter + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
              </div>
              
              {/* Daily limit indicator */}
              {shopSettings.dailyAppointmentLimit && (
                <div className={`px-4 py-2 rounded-xl ${dateAppointmentCount >= (shopSettings.dailyAppointmentLimit || 20) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-secondary'}`}>
                  <span className="text-sm font-medium">
                    {dateAppointmentCount}/{shopSettings.dailyAppointmentLimit} limite diário
                  </span>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const d = new Date(agendaDateFilter);
                      d.setDate(d.getDate() - 1);
                      setAgendaDateFilter(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Input
                    type="date"
                    value={agendaDateFilter}
                    onChange={(e) => setAgendaDateFilter(e.target.value)}
                    className="w-auto"
                  />
                  <button 
                    onClick={() => {
                      const d = new Date(agendaDateFilter);
                      d.setDate(d.getDate() + 1);
                      setAgendaDateFilter(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAgendaDateFilter(new Date().toISOString().split('T')[0])}
                  >
                    Hoje
                  </Button>
                </div>

                <select
                  value={agendaStatusFilter}
                  onChange={(e) => setAgendaStatusFilter(e.target.value)}
                  className="bg-secondary px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todos os status</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="inqueue">Na Fila</option>
                  <option value="called">Chamados</option>
                  <option value="onway">A Caminho</option>
                  <option value="completed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const queueEntry = queue.find(q => q.appointmentId === apt.id);
                  const statusConfig: Record<string, { label: string; color: string }> = {
                    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
                    confirmed: { label: 'Confirmado', color: 'bg-primary/20 text-primary' },
                    inqueue: { label: 'Na Fila', color: 'bg-blue-500/20 text-blue-400' },
                    called: { label: 'Chamado', color: 'bg-purple-500/20 text-purple-400' },
                    onway: { label: 'A Caminho', color: 'bg-cyan-500/20 text-cyan-400' },
                    completed: { label: 'Concluído', color: 'bg-green-500/20 text-green-400' },
                    cancelled: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
                  };
                  const status = statusConfig[apt.status] || statusConfig.pending;
                  const isActive = apt.status !== 'completed' && apt.status !== 'cancelled';
                  const canCall = apt.status === 'confirmed' || apt.status === 'inqueue';
                  const canMarkOnWay = apt.status === 'called';

                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="text-2xl font-bold text-primary">{apt.time}</div>
                            <div className="text-xs text-muted-foreground">{apt.service?.duration} min</div>
                          </div>
                          <div>
                            <h3 className="font-semibold">{apt.clientName}</h3>
                            <p className="text-sm text-muted-foreground">{apt.service?.name} - {apt.barber?.name}</p>
                            <p className="text-xs text-muted-foreground">{apt.clientPhone}</p>
                            {queueEntry?.status === 'waiting' && (
                              <p className="text-xs text-primary font-medium mt-1">Posição na fila: {queueEntry.position}°</p>
                            )}
                            {apt.protocol && (
                              <p className="text-xs text-muted-foreground mt-1">Protocolo: {apt.protocol}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          
                          {isActive && (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {apt.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="hero"
                                  onClick={() => {
                                    confirmAppointment(apt.id);
                                    notify.success(`${apt.clientName} confirmado e adicionado à fila!`);
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                  Aceitar
                                </Button>
                              )}
                              
                              {canCall && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    callSpecificClient(apt.id);
                                    // Trigger push notification
                                    if ('Notification' in window && Notification.permission === 'granted') {
                                      new Notification('🔔 Chamando Cliente', {
                                        body: `${apt.clientName}, sua vez chegou!`,
                                        icon: '/favicon.ico',
                                        tag: `call-${apt.id}`,
                                      });
                                    }
                                    notify.queue(`${apt.clientName} foi chamado!`);
                                  }}
                                  className="border-primary text-primary hover:bg-primary/10"
                                >
                                  <Bell className="w-4 h-4" />
                                  Chamar
                                </Button>
                              )}

                              {/* Botão para remover da fila manualmente */}
                              {(apt.status === 'inqueue' || apt.status === 'called' || apt.status === 'onway') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    // Remove from queue and reset status
                                    const { supabase } = await import('@/integrations/supabase/client');
                                    await supabase.from('queue').delete().eq('appointment_id', apt.id);
                                    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', apt.id);
                                    refreshData();
                                    notify.info(`${apt.clientName} removido da fila.`);
                                  }}
                                  className="border-destructive text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                  Remover Fila
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${apt.clientPhone}`, '_self')}
                                className="border-green-500 text-green-500 hover:bg-green-500/10"
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  completeAppointment(apt.id);
                                  notify.success('Atendimento concluído!');
                                }}
                                className="border-green-500 text-green-500 hover:bg-green-500/10"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  cancelAppointment(apt.id);
                                  notify.info('Agendamento cancelado');
                                }}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'fila':
        const waitingQueue = queue.filter(q => q.status === 'waiting');
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Fila de Espera</h2>
              <button
                onClick={() => setQueueEnabled(!queueEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  queueEnabled ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {queueEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {queueEnabled ? 'Ativa' : 'Desativada'}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Na fila</p>
                <p className="text-3xl font-bold text-primary">{waitingQueue.length}</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Limite máximo</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxQueueSize}
                    onChange={(e) => setMaxQueueSize(Number(e.target.value))}
                    className="w-20 text-2xl font-bold bg-transparent focus:outline-none"
                  />
                  <span className="text-muted-foreground">pessoas</span>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Tempo médio</p>
                <p className="text-3xl font-bold">~25 min</p>
              </div>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleCallNext} 
              className="w-full mb-6"
              disabled={waitingQueue.length === 0}
            >
              Chamar Próximo Cliente
            </Button>

            <div className="space-y-2">
              {waitingQueue.map((q) => {
                const apt = appointments.find(a => a.id === q.appointmentId);
                if (!apt) return null;
                return (
                  <div key={q.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {q.position}°
                      </div>
                      <div>
                        <h3 className="font-semibold">{apt.clientName}</h3>
                        <p className="text-sm text-muted-foreground">{apt.service.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estimativa</p>
                      <p className="font-medium">~{q.estimatedWait} min</p>
                    </div>
                  </div>
                );
              })}
              {waitingQueue.length === 0 && (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum cliente na fila</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'horarios':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gestão de Horários</h2>
            
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4">Horário de Funcionamento</h3>
              <div className="space-y-3">
                {[
                  { day: 'Segunda a Sexta', time: shopSettings.hours.weekdays },
                  { day: 'Sábado', time: shopSettings.hours.saturday },
                  { day: 'Domingo', time: shopSettings.hours.sunday },
                ].map((item) => (
                  <div key={item.day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span>{item.day}</span>
                    <span className="text-primary font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Barber Availability Management */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Disponibilidade do Profissional
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione os horários disponíveis para atendimento em cada dia
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Profissional</label>
                  <select
                    value={selectedBarberForAvailability}
                    onChange={(e) => setSelectedBarberForAvailability(e.target.value)}
                    className="w-full bg-secondary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Data</label>
                  <Input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleSelectAllSlots}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAllSlots}>
                  Limpar Todos
                </Button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
                {allPossibleSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleToggleTimeSlot(time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeSlots.includes(time)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedTimeSlots.length} horário(s) selecionado(s)
                </p>
                <Button variant="hero" onClick={handleSaveAvailability}>
                  <Check className="w-4 h-4" />
                  Salvar Disponibilidade
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4">Intervalo para Almoço</h3>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  value={shopSettings.lunchBreak.start}
                  onChange={(e) => updateShopSettings({ 
                    lunchBreak: { ...shopSettings.lunchBreak, start: e.target.value }
                  })}
                  className="bg-secondary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span>até</span>
                <input
                  type="time"
                  value={shopSettings.lunchBreak.end}
                  onChange={(e) => updateShopSettings({ 
                    lunchBreak: { ...shopSettings.lunchBreak, end: e.target.value }
                  })}
                  className="bg-secondary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Bloquear Horários</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Data</label>
                    <Input
                      type="date"
                      value={blockSlotForm.date}
                      onChange={(e) => setBlockSlotForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Motivo</label>
                    <Input
                      placeholder="Ex: Reunião"
                      value={blockSlotForm.reason}
                      onChange={(e) => setBlockSlotForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Início</label>
                    <Input
                      type="time"
                      value={blockSlotForm.startTime}
                      onChange={(e) => setBlockSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Fim</label>
                    <Input
                      type="time"
                      value={blockSlotForm.endTime}
                      onChange={(e) => setBlockSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <Button variant="hero" onClick={handleAddBlockedSlot} className="w-full">
                  <Plus className="w-4 h-4" />
                  Adicionar Bloqueio
                </Button>
              </div>

              {blockedSlots.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Bloqueios ativos</h4>
                  {blockedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{slot.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {slot.startTime} - {slot.endTime} {slot.reason && `(${slot.reason})`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeBlockedSlot(slot.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'servicos':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gerenciar Serviços</h2>

            {/* Add new service */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4">Adicionar Novo Serviço</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nome do serviço"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Preço (R$)"
                    value={newService.price || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Duração (min)"
                    value={newService.duration}
                    onChange={(e) => setNewService(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  />
                  <Textarea
                    placeholder="Descrição"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[40px]"
                  />
                </div>
                <Button variant="hero" onClick={handleAddService} className="w-full">
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </Button>
              </div>
            </div>

            {/* Services list */}
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">R$ {service.price}</p>
                      </div>
                      <button
                        onClick={() => toggleServiceVisibility(service.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          (service as any).visible !== false
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        title={(service as any).visible !== false ? 'Ocultar' : 'Exibir'}
                      >
                        {(service as any).visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'galeria':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gerenciar Galeria</h2>
            
            {/* Add new image */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Adicionar Imagem (somente admin)
              </h3>
              <div className="space-y-4">
                <Input
                  placeholder="URL da imagem"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <Input
                  placeholder="Título (opcional)"
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                />
                <Button variant="hero" onClick={handleAddGalleryImage} className="w-full">
                  <Upload className="w-4 h-4" />
                  Adicionar à Galeria
                </Button>
              </div>
            </div>

            {/* Gallery grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img
                    src={image.url}
                    alt={image.title || 'Galeria'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => removeImage(image.id)}
                      className="w-10 h-10 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {image.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3">
                      <p className="text-sm font-medium">{image.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'feedbacks':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gerenciar Feedbacks</h2>
              {newFeedbacksCount > 0 && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {newFeedbacksCount} novo(s)
                </span>
              )}
            </div>

            {/* Generate link */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Gerar Link de Avaliação
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compartilhe este link com seus clientes para coletar avaliações
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/avaliar`}
                  className="flex-1"
                />
                <Button variant="hero" onClick={handleCopyFeedbackLink}>
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'new', label: 'Novos' },
                { id: 'published', label: 'Publicados' },
                { id: 'archived', label: 'Arquivados' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFeedbackFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    feedbackFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feedbacks list */}
            <div className="space-y-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum feedback encontrado</p>
                </div>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onPublish={() => handlePublishFeedback(feedback.id)}
                    onArchive={() => updateFeedbackStatus(feedback.id, 'archived')}
                    onMarkRead={() => updateFeedbackStatus(feedback.id, 'read')}
                    onDelete={() => deleteFeedback(feedback.id)}
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'usuarios':
        return <UserManagement />;

      case 'config':
        return <SettingsPanel />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex overflow-hidden relative">
      {/* Interactive Background */}
      <InteractiveBackground />
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border relative z-10 h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">{shopSettings.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto admin-scroll-container">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all relative touch-manipulation ${
                activeTab === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.id === 'feedbacks' && newFeedbacksCount > 0 && (
                <span className="absolute right-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {newFeedbacksCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors w-full touch-manipulation"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border z-50 lg:hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold">Admin</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 px-3 sm:px-4 overflow-y-auto admin-scroll-container">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-all relative touch-manipulation min-h-[48px] ${
                      activeTab === item.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'feedbacks' && newFeedbacksCount > 0 && (
                      <span className="absolute right-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                        {newFeedbacksCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-3 sm:p-4 border-t border-sidebar-border shrink-0 safe-area-inset-bottom">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors w-full touch-manipulation min-h-[48px]"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-h-[100dvh] overflow-hidden relative z-10">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 lg:px-8 shrink-0 sticky top-0 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg bg-secondary flex items-center justify-center touch-manipulation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="font-semibold">Painel Administrativo</h2>
            <p className="text-sm text-muted-foreground">Gerencie sua barbearia</p>
          </div>

          {/* Mobile title */}
          <div className="lg:hidden flex-1 text-center">
            <h2 className="font-semibold text-sm">{menuItems.find(m => m.id === activeTab)?.label || 'Admin'}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg bg-secondary flex items-center justify-center relative hover:bg-secondary/80 transition-colors touch-manipulation"
              >
                <Bell className="w-5 h-5" />
                {(newFeedbacksCount > 0 || appointments.filter(a => a.status === 'pending' && a.date === new Date().toISOString().split('T')[0]).length > 0) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center">
                    {newFeedbacksCount + appointments.filter(a => a.status === 'pending' && a.date === new Date().toISOString().split('T')[0]).length}
                  </span>
                )}
              </button>
              <NotificationsPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>
          </div>
        </header>

        {/* Content with Pull-to-Refresh */}
        <div 
          ref={containerRef}
          className="flex-1 p-3 sm:p-4 lg:p-8 overflow-y-auto pb-safe admin-scroll-container relative z-10"
          style={{ 
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <PullToRefreshIndicator 
            pullDistance={pullDistance} 
            isRefreshing={isRefreshing} 
            progress={progress} 
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="gpu-accelerated"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// Feedback Card Component
const FeedbackCard = ({
  feedback,
  onPublish,
  onArchive,
  onMarkRead,
  onDelete,
}: {
  feedback: Feedback;
  onPublish: () => void;
  onArchive: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) => {
  const isNew = feedback.status === 'new';
  const isPublished = feedback.status === 'published';

  return (
    <motion.div
      layout
      className={`glass-card rounded-xl p-4 relative ${isNew ? 'ring-2 ring-primary/50' : ''}`}
    >
      {isNew && (
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
          NOVO
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
          {feedback.avatarUrl ? (
            <img src={feedback.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {feedback.isAnonymous ? '?' : feedback.name[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{feedback.name}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= feedback.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(feedback.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm">{feedback.text}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        {isNew && (
          <Button variant="ghost" size="sm" onClick={onMarkRead}>
            <Check className="w-4 h-4" />
            Marcar como lido
          </Button>
        )}
        {!isPublished && (
          <Button variant="hero" size="sm" onClick={onPublish}>
            <Eye className="w-4 h-4" />
            Publicar no site
          </Button>
        )}
        {isPublished && (
          <span className="text-sm text-primary flex items-center gap-1">
            <Check className="w-4 h-4" />
            Publicado
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={onArchive} className="ml-auto">
          Arquivar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
