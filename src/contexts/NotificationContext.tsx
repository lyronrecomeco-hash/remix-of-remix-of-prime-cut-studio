import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, AlertCircle, Info, Calendar, Users } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'queue' | 'booking';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  sound?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  notify: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    queue: (title: string, message?: string) => void;
    booking: (title: string, message?: string) => void;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Notification sound (short beep)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
};

const iconMap: Record<NotificationType, typeof Bell> = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertCircle,
  queue: Users,
  booking: Calendar,
};

const colorMap: Record<NotificationType, string> = {
  success: 'bg-green-500/20 text-green-400',
  error: 'bg-destructive/20 text-destructive',
  info: 'bg-primary/20 text-primary',
  warning: 'bg-yellow-500/20 text-yellow-400',
  queue: 'bg-primary/20 text-primary',
  booking: 'bg-primary/20 text-primary',
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const duration = notification.duration ?? 5000;
    
    // Play sound if enabled
    if (notification.sound !== false) {
      playNotificationSound();
    }

    setNotifications(prev => {
      // Limit to 5 notifications max
      const limited = prev.slice(-4);
      return [...limited, { ...notification, id }];
    });

    // Auto-remove after duration
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, duration);
      timeoutRefs.current.set(id, timeout);
    }
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  const notify = {
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message }),
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    queue: (title: string, message?: string) => 
      addNotification({ type: 'queue', title, message }),
    booking: (title: string, message?: string) => 
      addNotification({ type: 'booking', title, message }),
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll, notify }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type];
            const colorClass = colorMap[notification.type];
            
            return (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto"
              >
                <div className="glass-card rounded-xl p-4 flex items-start gap-3 shadow-card border border-border/50">
                  <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{notification.title}</p>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
