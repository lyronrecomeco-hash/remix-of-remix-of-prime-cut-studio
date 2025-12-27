import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Phone, Clock, User, Scissors, Bell, Check, XCircle, Play, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp, Appointment } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onCallClient: () => void;
}

const AppointmentCard = ({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onComplete,
  onCallClient 
}: AppointmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { queue } = useApp();

  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
    confirmed: { label: 'Confirmado', color: 'bg-primary/20 text-primary' },
    inqueue: { label: 'Na Fila', color: 'bg-blue-500/20 text-blue-400' },
    called: { label: 'Chamado', color: 'bg-purple-500/20 text-purple-400' },
    onway: { label: 'A Caminho', color: 'bg-cyan-500/20 text-cyan-400' },
    completed: { label: 'Concluído', color: 'bg-green-500/20 text-green-400' },
    cancelled: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;
  const isActive = appointment.status !== 'completed' && appointment.status !== 'cancelled';
  const canCall = appointment.status === 'confirmed' || appointment.status === 'inqueue';
  
  // Get queue position for this appointment
  const queueEntry = queue.find(q => q.appointmentId === appointment.id);
  const queuePosition = queueEntry?.status === 'waiting' ? queueEntry.position : null;

  const handlePhoneCall = () => {
    window.open(`tel:${appointment.clientPhone}`, '_self');
  };

  return (
    <motion.div
      layout
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Main Row */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[60px]">
            <div className="text-2xl font-bold text-primary">{appointment.time}</div>
            <div className="text-xs text-muted-foreground">{appointment.service.duration} min</div>
          </div>
          <div>
            <h3 className="font-semibold">{appointment.clientName}</h3>
            <p className="text-sm text-muted-foreground">{appointment.service.name}</p>
            {queuePosition && (
              <p className="text-xs text-primary font-medium">Posição na fila: {queuePosition}°</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{appointment.clientPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{appointment.barber.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <span>R$ {appointment.service.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{appointment.service.duration} minutos</span>
                </div>
              </div>

              {appointment.protocol && (
                <div className="text-xs text-muted-foreground mb-4">
                  Protocolo: <span className="font-mono">{appointment.protocol}</span>
                </div>
              )}

              {/* Actions */}
              {isActive && (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {appointment.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                      className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="truncate">Aceitar</span>
                    </Button>
                  )}
                  
                  {canCall && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onCallClient(); }}
                      className="w-full sm:w-auto min-h-[44px] touch-manipulation border-primary text-primary hover:bg-primary/10"
                    >
                      <Bell className="w-4 h-4 shrink-0" />
                      <span className="truncate">Chamar</span>
                    </Button>
                  )}

                  {/* Direct phone call button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handlePhoneCall(); }}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                  >
                    <PhoneCall className="w-4 h-4 shrink-0" />
                    <span className="truncate">Ligar</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); onComplete(); }}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation border-green-500 text-green-500 hover:bg-green-500/10"
                  >
                    <Play className="w-4 h-4 shrink-0" />
                    <span className="truncate">Concluir</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation text-destructive hover:bg-destructive/10 col-span-2 sm:col-span-1"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">Recusar</span>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Exported component for the agenda with all cards
const AgendaList = () => {
  const { appointments, confirmAppointment, cancelAppointment, completeAppointment, callSpecificClient } = useApp();
  const { notify } = useNotification();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleConfirm = (id: string, clientName: string) => {
    confirmAppointment(id);
    notify.success(`Agendamento de ${clientName} confirmado e adicionado à fila!`);
  };

  const handleCancel = (id: string) => {
    cancelAppointment(id);
    notify.info('Agendamento cancelado');
  };

  const handleComplete = (id: string) => {
    completeAppointment(id);
    notify.success('Atendimento concluído!');
  };

  const handleCallClient = (appointment: Appointment) => {
    // Call specific client in queue
    callSpecificClient(appointment.id);

    // Send browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Chamando Cliente', {
        body: `${appointment.clientName}, sua vez chegou!`,
        icon: '/favicon.ico',
        tag: `call-${appointment.id}`,
        requireInteraction: true,
      });
    }

    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});

    notify.queue(`${appointment.clientName} foi chamado!`, 'Cliente notificado');
  };

  if (todayAppointments.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todayAppointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onConfirm={() => handleConfirm(appointment.id, appointment.clientName)}
          onCancel={() => handleCancel(appointment.id)}
          onComplete={() => handleComplete(appointment.id)}
          onCallClient={() => handleCallClient(appointment)}
        />
      ))}
    </div>
  );
};

export { AppointmentCard, AgendaList };
export default AgendaList;
