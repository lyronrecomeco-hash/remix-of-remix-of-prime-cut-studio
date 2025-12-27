import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  MapPin, 
  Phone, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import Header from '@/components/landing/Header';
import { Appointment } from '@/contexts/AppContext';
import { CardSkeleton } from '@/components/ui/skeleton';

const MyAppointments = () => {
  const { appointments, cancelAppointment, queue, shopSettings, queueEnabled, markClientOnWay } = useApp();
  const { notify } = useNotification();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [clientPhone, setClientPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  // Load client phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('barbershop-client-phone');
    if (savedPhone) {
      setClientPhone(savedPhone);
    }
    setIsLoading(false);
  }, []);

  // Filter appointments for this client
  useEffect(() => {
    if (clientPhone) {
      const filtered = appointments.filter(
        apt => apt.clientPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, '')
      );
      setMyAppointments(filtered.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      }));
    } else {
      setMyAppointments([]);
    }
  }, [clientPhone, appointments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const getStatusInfo = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return { 
          label: 'Confirmado', 
          icon: CheckCircle2, 
          color: 'bg-primary/20 text-primary' 
        };
      case 'pending':
        return { 
          label: 'Pendente', 
          icon: AlertCircle, 
          color: 'bg-yellow-500/20 text-yellow-400' 
        };
      case 'inqueue':
        return { 
          label: 'Na Fila', 
          icon: Users, 
          color: 'bg-blue-500/20 text-blue-400' 
        };
      case 'called':
        return { 
          label: 'Chamado! Sua vez!', 
          icon: AlertCircle, 
          color: 'bg-purple-500/20 text-purple-400' 
        };
      case 'onway':
        return { 
          label: 'A Caminho', 
          icon: CheckCircle2, 
          color: 'bg-cyan-500/20 text-cyan-400' 
        };
      case 'completed':
        return { 
          label: 'Concluído', 
          icon: CheckCircle2, 
          color: 'bg-green-500/20 text-green-400' 
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          icon: XCircle, 
          color: 'bg-destructive/20 text-destructive' 
        };
      default:
        return { 
          label: status, 
          icon: AlertCircle, 
          color: 'bg-muted text-muted-foreground' 
        };
    }
  };

  const getQueuePosition = (appointmentId: string) => {
    const entry = queue.find(q => q.appointmentId === appointmentId && q.status === 'waiting');
    return entry?.position ?? null;
  };

  const handleCancelAppointment = async (apt: Appointment) => {
    const confirmed = await confirm({
      title: 'Cancelar Agendamento',
      description: `Tem certeza que deseja cancelar seu agendamento de ${apt.service.name} no dia ${formatDate(apt.date)} às ${apt.time}?`,
      confirmText: 'Sim, cancelar',
      cancelText: 'Manter agendamento',
      variant: 'danger',
    });

    if (confirmed) {
      cancelAppointment(apt.id);
      notify.success('Agendamento cancelado', 'Seu agendamento foi cancelado com sucesso.');
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).phone.value;
    const digits = input.replace(/\D/g, '');
    if (digits.length >= 10) {
      setClientPhone(digits);
      localStorage.setItem('barbershop-client-phone', digits);
    }
  };

  const activeAppointments = myAppointments.filter(
    apt => apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'inqueue' || apt.status === 'called' || apt.status === 'onway'
  );
  const pastAppointments = myAppointments.filter(
    apt => apt.status === 'completed' || apt.status === 'cancelled'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-12 px-4">
          <div className="container-narrow max-w-2xl mx-auto">
            <CardSkeleton />
            <CardSkeleton className="mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // If no phone saved, show input
  if (!clientPhone) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-12 px-4">
          <div className="container-narrow max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Meus Agendamentos</h1>
              <p className="text-muted-foreground mb-6">
                Digite seu WhatsApp para visualizar seus agendamentos
              </p>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <input
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-0000"
                  className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors text-center text-lg"
                />
                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Ver Agendamentos
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/agendar">
                    <Plus className="w-4 h-4" />
                    Fazer novo agendamento
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ConfirmDialog />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container-narrow max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Meus Agendamentos</h1>
            <p className="text-muted-foreground">
              Acompanhe seus horários e posição na fila
            </p>
          </motion.div>

          {/* Queue Status Banner */}
          {queueEnabled && activeAppointments.some(apt => getQueuePosition(apt.id)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mb-6 border-primary/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Fila de Espera Ativa</h3>
                  <p className="text-muted-foreground text-sm">
                    Você será notificado quando for sua vez
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Appointments */}
          {activeAppointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Próximos Agendamentos
              </h2>
              <div className="space-y-4">
                <AnimatePresence>
                  {activeAppointments.map((apt, index) => {
                    const statusInfo = getStatusInfo(apt.status);
                    const queuePos = getQueuePosition(apt.id);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-2xl overflow-hidden"
                      >
                        {/* Queue Position Banner */}
                        {queuePos && (
                          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">
                                Posição na fila: <span className="text-primary">{queuePos}°</span>
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ~{queuePos * 20} min
                            </span>
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Scissors className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{apt.service.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  com {apt.barber.name}
                                </p>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-3 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="capitalize">{formatDate(apt.date)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{apt.time} • {apt.service.duration} minutos</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border gap-2 flex-wrap">
                            <span className="text-xl font-bold text-primary">
                              R$ {apt.service.price}
                            </span>
                            <div className="flex gap-2">
                              {/* Botão A Caminho - aparece quando cliente é chamado */}
                              {apt.status === 'called' && (
                                <Button 
                                  variant="hero"
                                  size="sm"
                                  onClick={() => {
                                    markClientOnWay(apt.id);
                                    notify.success('Estamos te esperando!', 'Chegue em breve.');
                                  }}
                                >
                                  <Navigation className="w-4 h-4" />
                                  Estou a Caminho
                                </Button>
                              )}
                              {(apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'inqueue') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleCancelAppointment(apt)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* No Active Appointments */}
          {activeAppointments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center mb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Nenhum agendamento ativo</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Você não tem nenhum agendamento pendente ou confirmado
              </p>
              <Button asChild variant="hero">
                <Link to="/agendar">
                  <Plus className="w-4 h-4" />
                  Agendar Agora
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                Histórico
              </h2>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map((apt, index) => {
                  const statusInfo = getStatusInfo(apt.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card rounded-xl p-4 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Scissors className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{apt.service.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(apt.date)} • {apt.time}
                            </p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 mt-8"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Localização
            </h3>
            <p className="text-muted-foreground mb-4">{shopSettings.address}</p>
            <Button asChild variant="outline" className="w-full">
              <a href={shopSettings.mapsLink} target="_blank" rel="noopener noreferrer">
                <MapPin className="w-4 h-4" />
                Como Chegar
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-6 rounded-2xl bg-secondary/50"
          >
            <h3 className="font-semibold mb-4">📋 Informações Importantes</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Chegue com 5 minutos de antecedência
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Cancelamentos devem ser feitos com no mínimo 2 horas de antecedência
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Em caso de atraso, entre em contato pelo WhatsApp
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                A fila de espera é atualizada em tempo real
              </li>
            </ul>
          </motion.div>

          {/* Change Phone */}
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setClientPhone('');
                localStorage.removeItem('barbershop-client-phone');
              }}
            >
              Usar outro número
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
