import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  CreditCard,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'credit';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Local storage keys for persistence
const NOTIFICATIONS_KEY = 'genesis_notifications';
const NOTIFICATIONS_INITIALIZED_KEY = 'genesis_notifications_initialized';

export function NotificationsPanel() {
  const { genesisUser } = useGenesisAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Get user-specific storage key
  const getStorageKey = useCallback((key: string) => {
    return genesisUser ? `${key}_${genesisUser.id}` : key;
  }, [genesisUser]);

  // Load notifications from localStorage
  useEffect(() => {
    if (!genesisUser) return;

    const storageKey = getStorageKey(NOTIFICATIONS_KEY);
    const initializedKey = getStorageKey(NOTIFICATIONS_INITIALIZED_KEY);

    // Check if we already have stored notifications
    const stored = localStorage.getItem(storageKey);
    const initialized = localStorage.getItem(initializedKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch {
        setNotifications([]);
      }
    } else if (!initialized) {
      // First time - create welcome notifications
      const welcomeNotifications: Notification[] = [
        {
          id: `welcome-bonus-${Date.now()}`,
          type: 'credit',
          title: '🎉 Bônus de Boas-Vindas!',
          message: 'Você recebeu 300 créditos de bônus para começar a usar a plataforma!',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: `welcome-info-${Date.now() + 1}`,
          type: 'info',
          title: 'Bem-vindo ao Genesis Hub!',
          message: 'Configure sua primeira instância WhatsApp para começar a automatizar.',
          is_read: false,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ];
      
      setNotifications(welcomeNotifications);
      localStorage.setItem(storageKey, JSON.stringify(welcomeNotifications));
      localStorage.setItem(initializedKey, 'true');
    }
  }, [genesisUser, getStorageKey]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!genesisUser) return;
    const storageKey = getStorageKey(NOTIFICATIONS_KEY);
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, genesisUser, getStorageKey]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('Todas as notificações marcadas como lidas');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notificação removida');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'credit': return CreditCard;
      case 'warning': return AlertTriangle;
      case 'success': return Zap;
      default: return Info;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-amber-500 bg-amber-500/10';
      case 'warning': return 'text-red-500 bg-red-500/10';
      case 'success': return 'text-green-500 bg-green-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} novas
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors relative group",
                        !notification.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          getIconColor(notification.type)
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              !notification.is_read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {!notification.is_read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}