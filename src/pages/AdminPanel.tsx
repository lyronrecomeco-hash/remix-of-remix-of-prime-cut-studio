import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Megaphone,
  PanelLeftClose,
  PanelLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useApp, Appointment, AppContext } from '@/contexts/AppContext';
import { useFeedback, Feedback } from '@/contexts/FeedbackContext';
import { useGallery } from '@/contexts/GalleryContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/contexts/NotificationContext';

import Dashboard from '@/components/admin/Dashboard';
import UserManagement from '@/components/admin/UserManagement';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import NotificationsPanel from '@/components/admin/NotificationsPanel';
import OverloadAlertModal from '@/components/admin/OverloadAlertModal';
import InteractiveBackground from '@/components/admin/InteractiveBackground';
import SettingsPanel from '@/components/admin/SettingsPanel';
import MarketingPanel from '@/components/admin/MarketingPanel';
import AuditLogsSection from '@/components/admin/AuditLogsSection';
import BarberPerformance from '@/components/admin/BarberPerformance';
import LeaveManagement from '@/components/admin/LeaveManagement';
import MonthlyGoals from '@/components/admin/MonthlyGoals';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, BarChart3, Palmtree, Target } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/admin/PullToRefreshIndicator';
import { useContext } from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Calendar },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'fila', label: 'Fila de Espera', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'desempenho', label: 'Desempenho', icon: BarChart3 },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'folgas', label: 'Folgas/Férias', icon: Palmtree },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'logs', label: 'Logs de Auditoria', icon: AlertTriangle },
  { id: 'usuarios', label: 'Usuários', icon: Lock },
  { id: 'config', label: 'Configurações', icon: Settings },
];

const AdminPanel = () => {
  // Check context availability first to prevent hot reload errors
  const appContext = useContext(AppContext);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [agendaDateFilter, setAgendaDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<string>('all');
  const [agendaPage, setAgendaPage] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    return stored === 'true';
  });
  const [menuStyle, setMenuStyle] = useState<'sidebar' | 'dock'>(() => {
    const stored = localStorage.getItem('menu_style');
    return (stored as 'sidebar' | 'dock') || 'sidebar';
  });
  const { notify } = useNotification();
  const { signOut, user, isSuperAdmin } = useAuth();

  // Show loading if context not available (happens during HMR)
  if (!appContext) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  // Sync sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Cross-panel navigation (ex: open logs from settings modal)
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const ce = e as CustomEvent<{ tab?: string }>;
      const tab = ce.detail?.tab;
      if (tab) setActiveTab(tab);
    };

    window.addEventListener('genesis:navigate', onNavigate as EventListener);
    return () => window.removeEventListener('genesis:navigate', onNavigate as EventListener);
  }, []);

  // Sync menu style
  useEffect(() => {
    localStorage.setItem('menu_style', menuStyle);
  }, [menuStyle]);
  
  // App context (now safe to destructure)
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
    removeFromQueue,
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
  } = appContext;

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
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  
  // Gallery pagination (moved out of render to avoid hook rules violation)
  const [galleryPage, setGalleryPage] = useState(0);
  const GALLERY_PER_PAGE = 12;

  // Horários modals (moved out of render to avoid hook rules violation)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Barber availability management
  const [selectedBarberForAvailability, setSelectedBarberForAvailability] = useState(barbers[0]?.id || '');
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const AUDIT_LOGS_PER_PAGE = 10;
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

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.error('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploadingGalleryImage(true);
    try {
      const fileName = `gallery-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(fileName);

      addImage({
        url: publicUrl,
        title: newImageTitle || undefined,
      });
      setNewImageTitle('');
      notify.success('Imagem enviada e adicionada à galeria!');
    } catch (error) {
      console.error('Upload error:', error);
      notify.error('Erro ao enviar imagem');
    }
    setUploadingGalleryImage(false);
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
        // Pagination - 5 items per page to fit sidebar height
        const ITEMS_PER_PAGE = 5;
        
        // Filter appointments
        const allFilteredAppointments = appointments
          .filter(a => {
            if (a.date !== agendaDateFilter) return false;
            if (agendaStatusFilter !== 'all' && a.status !== agendaStatusFilter) return false;
            return true;
          })
          .sort((a, b) => a.time.localeCompare(b.time));
        
        // Calculate pagination
        const totalPages = Math.ceil(allFilteredAppointments.length / ITEMS_PER_PAGE);
        const currentPageIndex = Math.min(agendaPage, Math.max(0, totalPages - 1));
        const startIndex = currentPageIndex * ITEMS_PER_PAGE;
        const filteredAppointments = allFilteredAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        
        // Count for daily limit check
        const dateAppointmentCount = appointments.filter(a => 
          a.date === agendaDateFilter && a.status !== 'cancelled'
        ).length;

        return (
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Agenda</h2>
                <div className="text-sm text-muted-foreground">
                  {allFilteredAppointments.length} agendamento(s) em {new Date(agendaDateFilter + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
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
                      setAgendaPage(0);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Input
                    type="date"
                    value={agendaDateFilter}
                    onChange={(e) => {
                      setAgendaDateFilter(e.target.value);
                      setAgendaPage(0);
                    }}
                    className="w-auto"
                  />
                  <button 
                    onClick={() => {
                      const d = new Date(agendaDateFilter);
                      d.setDate(d.getDate() + 1);
                      setAgendaDateFilter(d.toISOString().split('T')[0]);
                      setAgendaPage(0);
                    }}
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setAgendaDateFilter(new Date().toISOString().split('T')[0]);
                      setAgendaPage(0);
                    }}
                  >
                    Hoje
                  </Button>
                </div>

                <select
                  value={agendaStatusFilter}
                  onChange={(e) => {
                    setAgendaStatusFilter(e.target.value);
                    setAgendaPage(0);
                  }}
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
              <div className="glass-card rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 flex-1 overflow-y-auto">
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
                                  onClick={async () => {
                                    try {
                                      await completeAppointment(apt.id);
                                      notify.success('Atendimento concluído!');
                                    } catch (e) {
                                      notify.error('Erro ao concluir', 'Tente novamente.');
                                    }
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
                
                {/* Pagination - always visible at bottom */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPageIndex + 1} de {Math.max(1, totalPages)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAgendaPage(Math.max(0, agendaPage - 1))}
                      disabled={agendaPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => {
                      // Show max 5 page buttons
                      if (totalPages <= 5 || i < 2 || i >= totalPages - 2 || Math.abs(i - currentPageIndex) <= 1) {
                        return (
                          <Button
                            key={i}
                            variant={currentPageIndex === i ? "hero" : "outline"}
                            size="sm"
                            onClick={() => setAgendaPage(i)}
                            className="w-8 h-8 p-0"
                          >
                            {i + 1}
                          </Button>
                        );
                      } else if (i === 2 && currentPageIndex > 3) {
                        return <span key={i} className="px-1 text-muted-foreground">...</span>;
                      } else if (i === totalPages - 3 && currentPageIndex < totalPages - 4) {
                        return <span key={i} className="px-1 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAgendaPage(Math.min(totalPages - 1, agendaPage + 1))}
                      disabled={agendaPage >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Estimativa</p>
                        <p className="font-medium">~{q.estimatedWait} min</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          try {
                            await removeFromQueue(apt.id);
                            notify.success('Cliente removido da fila');
                          } catch (e) {
                            notify.error('Erro ao remover', 'Tente novamente.');
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10 border-destructive/30"
                        title="Remover da fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass-card rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Segunda a Sexta</h3>
                <p className="text-xl text-primary font-bold">{shopSettings.hours.weekdays}</p>
              </div>
              <div className="glass-card rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Sábado</h3>
                <p className="text-xl text-primary font-bold">{shopSettings.hours.saturday}</p>
              </div>
              <div className="glass-card rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Intervalo</h3>
                <p className="text-xl text-primary font-bold">{shopSettings.lunchBreak.start} - {shopSettings.lunchBreak.end}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="glass-card rounded-xl p-6 hover:bg-secondary/50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Disponibilidade do Barbeiro</h3>
                  <p className="text-sm text-muted-foreground">Configure horários por profissional e data</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto" />
              </button>
              
              <button
                onClick={() => setShowBlockModal(true)}
                className="glass-card rounded-xl p-6 hover:bg-secondary/50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Bloquear Horários</h3>
                  <p className="text-sm text-muted-foreground">Bloqueie datas ou horários específicos</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto" />
              </button>
            </div>

            {/* Blocked Slots List */}
            {blockedSlots.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Bloqueios Ativos</h3>
                <div className="space-y-2">
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
              </div>
            )}

            {/* Availability Modal */}
            {typeof document !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {showAvailabilityModal && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={() => setShowAvailabilityModal(false)}
                      />
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Disponibilidade do Profissional</h3>
                            <button onClick={() => setShowAvailabilityModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
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
                              <Input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
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

                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
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

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">{selectedTimeSlots.length} horário(s) selecionado(s)</p>
                            <Button
                              variant="hero"
                              onClick={() => {
                                handleSaveAvailability();
                                setShowAvailabilityModal(false);
                              }}
                            >
                              <Check className="w-4 h-4" />
                              Salvar
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}

            {/* Block Modal */}
            {typeof document !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {showBlockModal && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={() => setShowBlockModal(false)}
                      />
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-lg bg-card border border-border rounded-2xl p-6"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">Bloquear Horários</h3>
                            <button onClick={() => setShowBlockModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <p className="text-sm text-muted-foreground mb-6">
                            Ao adicionar um bloqueio, este intervalo ficará indisponível para novos agendamentos e não aparecerá como horário livre para clientes.
                          </p>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-muted-foreground block mb-1">Data</label>
                                <Input
                                  type="date"
                                  value={blockSlotForm.date}
                                  onChange={(e) => setBlockSlotForm((prev) => ({ ...prev, date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground block mb-1">Motivo</label>
                                <Input
                                  placeholder="Ex: Reunião"
                                  value={blockSlotForm.reason}
                                  onChange={(e) => setBlockSlotForm((prev) => ({ ...prev, reason: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-muted-foreground block mb-1">Início</label>
                                <Input
                                  type="time"
                                  value={blockSlotForm.startTime}
                                  onChange={(e) => setBlockSlotForm((prev) => ({ ...prev, startTime: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground block mb-1">Fim</label>
                                <Input
                                  type="time"
                                  value={blockSlotForm.endTime}
                                  onChange={(e) => setBlockSlotForm((prev) => ({ ...prev, endTime: e.target.value }))}
                                />
                              </div>
                            </div>
                            <Button
                              variant="hero"
                              onClick={() => {
                                handleAddBlockedSlot();
                                setShowBlockModal(false);
                              }}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar Bloqueio
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
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
                          service.visible !== false
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        title={service.visible !== false ? 'Ocultar' : 'Exibir'}
                      >
                        {service.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
        const totalGalleryPages = Math.ceil(galleryImages.length / GALLERY_PER_PAGE);
        const paginatedImages = galleryImages.slice(
          galleryPage * GALLERY_PER_PAGE,
          (galleryPage + 1) * GALLERY_PER_PAGE
        );

        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Gerenciar Galeria</h2>
            
            {/* Add new image */}
            <div className="glass-card rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Adicionar Imagem
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Título (opcional)"
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="hero"
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={uploadingGalleryImage}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingGalleryImage ? 'Enviando...' : 'Upload'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ou cole URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleAddGalleryImage} disabled={!newImageUrl.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery grid */}
            {galleryImages.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma imagem na galeria</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {paginatedImages.map((image) => (
                    <div key={image.id} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img
                        src={image.url}
                        alt={image.title || 'Galeria'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => removeImage(image.id)}
                          className="w-8 h-8 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {image.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1">
                          <p className="text-[10px] font-medium truncate">{image.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalGalleryPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGalleryPage(p => Math.max(0, p - 1))}
                      disabled={galleryPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {galleryPage + 1} / {totalGalleryPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGalleryPage(p => Math.min(totalGalleryPages - 1, p + 1))}
                      disabled={galleryPage >= totalGalleryPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
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

      case 'marketing':
        return <MarketingPanel />;

      case 'logs':
        return <AuditLogsSection />;

      case 'desempenho':
        return <BarberPerformance />;

      case 'folgas':
        return <LeaveManagement />;

      case 'metas':
        return <MonthlyGoals />;

      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background flex overflow-hidden relative">
      {/* Interactive Background */}
      <InteractiveBackground />
      
      {/* Dock Style Menu (Mac style) - Desktop only */}
      {menuStyle === 'dock' && (
        <div className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex items-center gap-1 px-3 py-2 bg-background/90 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.div 
                  key={item.id} 
                  className="relative group"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <motion.button
                    onClick={() => setActiveTab(item.id)}
                    whileHover={{ scale: 1.3, y: -12 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`relative p-3 rounded-xl transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.id === 'feedbacks' && newFeedbacksCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                        {newFeedbacksCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="dock-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-background/95 border border-border rounded-lg text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none backdrop-blur-sm"
                  >
                    {item.label}
                  </motion.div>
                </motion.div>
              );
            })}
            <div className="w-px h-8 bg-border/50 mx-2" />
            <motion.button
              onClick={() => signOut()}
              whileHover={{ scale: 1.2, y: -8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Sidebar Desktop */}
      {menuStyle === 'sidebar' && (
        <aside className={`hidden lg:flex flex-col bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border relative z-10 h-screen sticky top-0 transition-all duration-300 overflow-hidden min-h-0 ${
          isSidebarCollapsed ? 'w-[68px]' : 'w-64'
        }`}>
          <div className={`p-4 ${isSidebarCollapsed ? 'px-3' : 'p-6'}`}>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Scissors className="w-5 h-5 text-primary" />
                </div>
                {!isSidebarCollapsed && (
                  <div>
                    <h1 className="font-bold">Painel Admin</h1>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{shopSettings.name}</p>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-2 rounded-lg hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Colapsar menu"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Botão para expandir quando colapsado - sempre visível na parte inferior do header */}
          {isSidebarCollapsed && (
            <div className="px-2 pb-2">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-full p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center"
                title="Expandir menu"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          <nav className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide py-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {menuItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl mb-1 transition-all relative touch-manipulation ${
                    isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                  } ${
                    activeTab === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="text-base">{item.label}</span>}
                  {item.id === 'feedbacks' && newFeedbacksCount > 0 && (
                    <span className={`px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full ${
                      isSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px]' : 'absolute right-4'
                    }`}>
                      {newFeedbacksCount}
                    </span>
                  )}
                </button>
                {isSidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-background border border-border rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          {/* Logout Button - Separated at bottom */}
          <div className={`shrink-0 border-t border-sidebar-border ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <button
              onClick={() => signOut()}
              className={`flex items-center gap-3 text-muted-foreground hover:text-destructive transition-colors w-full touch-manipulation rounded-xl ${
                isSidebarCollapsed ? 'px-3 py-3 justify-center hover:bg-destructive/10' : 'px-4 py-3 hover:bg-destructive/10'
              }`}
            >
              <LogOut className="w-5 h-5" />
              {!isSidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>
      )}

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
              className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border z-50 lg:hidden flex flex-col min-h-0"
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

              <nav className="flex-1 min-h-0 px-3 sm:px-4 overflow-y-auto scrollbar-hide">
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

              {/* Spacer */}
              <div className="flex-1" />
              
              {/* Logout Button - Separated */}
              <div className="p-3 sm:p-4 border-t border-sidebar-border shrink-0 safe-area-inset-bottom mt-auto">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors w-full touch-manipulation min-h-[48px] rounded-xl hover:bg-destructive/10"
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
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
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
          className={`flex-1 min-h-0 p-3 sm:p-4 lg:p-8 admin-scroll-container relative z-10 ${
            activeTab === 'config' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
          style={{ 
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
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
