import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, UserPlus, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useFeedback } from '@/contexts/FeedbackContext';

interface Notification {
  id: string;
  type: 'appointment' | 'queue' | 'feedback' | 'alert';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const { appointments, queue } = useApp();
  const { feedbacks } = useFeedback();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate notifications from real data
  useEffect(() => {
    const newNotifications: Notification[] = [];
    
    // Pending appointments notifications
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingToday = appointments.filter(a => 
      a.date === todayStr && a.status === 'pending'
    );
    
    pendingToday.forEach(apt => {
      newNotifications.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: 'Novo Agendamento',
        message: `${apt.clientName} agendou ${apt.service.name} às ${apt.time}`,
        time: new Date(apt.createdAt),
        read: false,
      });
    });

    // Queue notifications
    const waitingQueue = queue.filter(q => q.status === 'waiting');
    if (waitingQueue.length > 5) {
      newNotifications.push({
        id: 'queue-full',
        type: 'alert',
        title: 'Fila com Muitos Clientes',
        message: `${waitingQueue.length} clientes aguardando na fila`,
        time: new Date(),
        read: false,
      });
    }

    // Called clients that haven't arrived
    const calledQueue = queue.filter(q => q.status === 'called');
    calledQueue.forEach(q => {
      const apt = appointments.find(a => a.id === q.appointmentId);
      if (apt && q.calledAt) {
        const calledTime = new Date(q.calledAt);
        const diff = Date.now() - calledTime.getTime();
        if (diff > 5 * 60 * 1000) { // More than 5 minutes
          newNotifications.push({
            id: `waiting-${q.id}`,
            type: 'queue',
            title: 'Cliente Chamado',
            message: `${apt.clientName} foi chamado há ${Math.floor(diff / 60000)} minutos`,
            time: calledTime,
            read: false,
          });
        }
      }
    });

    // New feedbacks
    const newFeedbacks = feedbacks.filter(f => f.status === 'new');
    newFeedbacks.forEach(f => {
      newNotifications.push({
        id: `fb-${f.id}`,
        type: 'feedback',
        title: 'Novo Feedback',
        message: `${f.name} deixou uma avaliação de ${f.rating} estrelas`,
        time: new Date(f.createdAt),
        read: false,
      });
    });

    // Sort by time
    newNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());
    setNotifications(newNotifications);
  }, [appointments, queue, feedbacks]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <UserPlus className="w-4 h-4" />;
      case 'queue': return <Clock className="w-4 h-4" />;
      case 'feedback': return <MessageSquare className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return 'bg-primary/20 text-primary';
      case 'queue': return 'bg-blue-500/20 text-blue-400';
      case 'feedback': return 'bg-green-500/20 text-green-400';
      case 'alert': return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Notificações</h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <Check className="w-4 h-4" />
                    Marcar lidas
                  </Button>
                )}
                <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.time)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;