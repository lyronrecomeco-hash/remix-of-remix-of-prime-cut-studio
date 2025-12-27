import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useFeedback, Feedback } from '@/contexts/FeedbackContext';
import { useGallery } from '@/contexts/GalleryContext';
import { useNotification } from '@/contexts/NotificationContext';

import Dashboard from '@/components/admin/Dashboard';
import UserManagement from '@/components/admin/UserManagement';
import AgendaList from '@/components/admin/AppointmentCard';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign } from 'lucide-react';

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
  const { notify } = useNotification();
  const { signOut, user, isSuperAdmin } = useAuth();
  
  // App context
  const {
    appointments,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
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
  } = useApp();

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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Agenda de Hoje</h2>
              <div className="text-sm text-muted-foreground">
                {todayAppointments.length} agendamento(s)
              </div>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((apt) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{apt.time}</div>
                          <div className="text-xs text-muted-foreground">{apt.service.duration} min</div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{apt.clientName}</h3>
                          <p className="text-sm text-muted-foreground">{apt.service.name}</p>
                          <p className="text-xs text-muted-foreground">{apt.clientPhone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-primary/20 text-primary' :
                          apt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          apt.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmado' :
                           apt.status === 'completed' ? 'Concluído' :
                           apt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </span>
                        
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAppointmentAction(apt.id, 'confirm')}
                              className="w-8 h-8 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center"
                              title="Confirmar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAppointmentAction(apt.id, 'complete')}
                              className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center"
                              title="Concluir"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAppointmentAction(apt.id, 'cancel')}
                              className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Configurações</h2>
            
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Tema Visual
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'gold', label: 'Black & Gold', colors: ['bg-black', 'bg-amber-500'], isNative: true },
                    { id: 'gold-shine', label: 'Gold Brilhante', colors: ['bg-black', 'bg-yellow-400'] },
                    { id: 'gold-metallic', label: 'Gold Metálico', colors: ['bg-black', 'bg-amber-300'] },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === t.id ? 'border-primary gold-glow' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        {t.colors.map((c, i) => (
                          <div key={i} className={`w-6 h-6 rounded-full ${c}`} />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{t.label}</p>
                      {(t as any).isNative && (
                        <span className="text-[10px] text-primary">Nativo</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Informações da Barbearia</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Nome</label>
                    <Input
                      value={shopSettings.name}
                      onChange={(e) => updateShopSettings({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Telefone</label>
                    <Input
                      value={shopSettings.phone}
                      onChange={(e) => updateShopSettings({ phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Endereço</label>
                    <Input
                      value={shopSettings.address}
                      onChange={(e) => updateShopSettings({ address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden fixed inset-0 lg:relative lg:h-auto lg:overflow-auto">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
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

        <nav className="flex-1 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all relative ${
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
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors w-full"
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
              className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 lg:hidden"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold">Admin</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="px-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all relative ${
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen lg:min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="font-semibold">Painel Administrativo</h2>
            <p className="text-sm text-muted-foreground">Gerencie sua barbearia</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                {newFeedbacksCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center">
                    {newFeedbacksCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8 overscroll-contain">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background backdrop-blur-lg border-t border-border lg:hidden z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
              {item.id === 'feedbacks' && newFeedbacksCount > 0 && (
                <span className="absolute -top-1 right-0 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {newFeedbacksCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
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
