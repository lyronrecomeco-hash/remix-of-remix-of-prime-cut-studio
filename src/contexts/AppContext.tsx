import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Service, Barber, Appointment, TimeSlot, services as defaultServices, barbers as defaultBarbers, shopInfo as defaultShopInfo } from '@/lib/data';

// Types
export interface ShopSettings {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  mapsLink: string;
  logo?: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  lunchBreak: {
    start: string;
    end: string;
  };
  social: {
    instagram: string;
    facebook: string;
  };
}

export interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  barberId: string;
  reason?: string;
}

export interface QueueEntry {
  id: string;
  appointmentId: string;
  position: number;
  estimatedWait: number;
  status: 'waiting' | 'called' | 'attended';
  calledAt?: string;
}

export type ThemeType = 'dark' | 'light' | 'gold';

interface AppState {
  // Theme
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  
  // Services
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceVisibility: (id: string) => void;
  
  // Barbers
  barbers: Barber[];
  updateBarber: (id: string, barber: Partial<Barber>) => void;
  toggleBarberAvailability: (id: string) => void;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByBarber: (barberId: string, date: string) => Appointment[];
  
  // Queue
  queueEnabled: boolean;
  setQueueEnabled: (enabled: boolean) => void;
  maxQueueSize: number;
  setMaxQueueSize: (size: number) => void;
  queue: QueueEntry[];
  addToQueue: (appointmentId: string) => QueueEntry;
  callNextInQueue: () => QueueEntry | null;
  updateQueuePosition: (id: string, position: number) => void;
  getQueuePosition: (appointmentId: string) => number | null;
  
  // Blocked Slots
  blockedSlots: BlockedSlot[];
  addBlockedSlot: (slot: Omit<BlockedSlot, 'id'>) => void;
  removeBlockedSlot: (id: string) => void;
  
  // Shop Settings
  shopSettings: ShopSettings;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  
  // Time slots
  getAvailableTimeSlots: (date: Date, barberId: string, serviceDuration: number) => TimeSlot[];
  isSlotAvailable: (date: string, time: string, barberId: string, duration: number) => boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

// LocalStorage helpers
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme
  const [theme, setThemeState] = useState<ThemeType>(() => 
    loadFromStorage('barbershop-theme', 'dark')
  );

  // Services (with visibility flag)
  const [services, setServices] = useState<(Service & { visible?: boolean })[]>(() => 
    loadFromStorage('barbershop-services', defaultServices.map(s => ({ ...s, visible: true })))
  );

  // Barbers
  const [barbers, setBarbers] = useState<Barber[]>(() => 
    loadFromStorage('barbershop-barbers', defaultBarbers)
  );

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() => 
    loadFromStorage('barbershop-appointments', [])
  );

  // Queue
  const [queueEnabled, setQueueEnabledState] = useState<boolean>(() => 
    loadFromStorage('barbershop-queue-enabled', true)
  );
  const [maxQueueSize, setMaxQueueSizeState] = useState<number>(() => 
    loadFromStorage('barbershop-max-queue', 10)
  );
  const [queue, setQueue] = useState<QueueEntry[]>(() => 
    loadFromStorage('barbershop-queue', [])
  );

  // Blocked Slots
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => 
    loadFromStorage('barbershop-blocked-slots', [])
  );

  // Shop Settings
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => 
    loadFromStorage('barbershop-settings', {
      ...defaultShopInfo,
      lunchBreak: { start: '12:00', end: '13:00' },
    })
  );

  // Persist to localStorage
  useEffect(() => {
    saveToStorage('barbershop-theme', theme);
    // Apply theme class to document
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-gold');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => { saveToStorage('barbershop-services', services); }, [services]);
  useEffect(() => { saveToStorage('barbershop-barbers', barbers); }, [barbers]);
  useEffect(() => { saveToStorage('barbershop-appointments', appointments); }, [appointments]);
  useEffect(() => { saveToStorage('barbershop-queue-enabled', queueEnabled); }, [queueEnabled]);
  useEffect(() => { saveToStorage('barbershop-max-queue', maxQueueSize); }, [maxQueueSize]);
  useEffect(() => { saveToStorage('barbershop-queue', queue); }, [queue]);
  useEffect(() => { saveToStorage('barbershop-blocked-slots', blockedSlots); }, [blockedSlots]);
  useEffect(() => { saveToStorage('barbershop-settings', shopSettings); }, [shopSettings]);

  // Theme setter
  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  // Services CRUD
  const addService = useCallback((service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: generateId(), visible: true };
    setServices(prev => [...prev, newService as Service]);
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleServiceVisibility = useCallback((id: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, visible: !(s as any).visible } : s
    ));
  }, []);

  // Barbers
  const updateBarber = useCallback((id: string, updates: Partial<Barber>) => {
    setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const toggleBarberAvailability = useCallback((id: string) => {
    setBarbers(prev => prev.map(b => 
      b.id === id ? { ...b, available: !b.available } : b
    ));
  }, []);

  // Appointments
  const addAppointment = useCallback((appointment: Omit<Appointment, 'id'>): Appointment => {
    const newAppointment = { ...appointment, id: generateId() };
    setAppointments(prev => [...prev, newAppointment as Appointment]);
    return newAppointment as Appointment;
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'cancelled' as const } : a
    ));
    setQueue(prev => prev.filter(q => q.appointmentId !== id));
  }, []);

  const completeAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'completed' as const } : a
    ));
    setQueue(prev => {
      const filtered = prev.filter(q => q.appointmentId !== id);
      // Recalculate positions
      return filtered.map((q, index) => ({ ...q, position: index + 1 }));
    });
  }, []);

  const confirmAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'confirmed' as const } : a
    ));
  }, []);

  const getAppointmentsByDate = useCallback((date: string): Appointment[] => {
    return appointments.filter(a => a.date === date && a.status !== 'cancelled');
  }, [appointments]);

  const getAppointmentsByBarber = useCallback((barberId: string, date: string): Appointment[] => {
    return appointments.filter(a => 
      a.barber.id === barberId && 
      a.date === date && 
      a.status !== 'cancelled'
    );
  }, [appointments]);

  // Queue management
  const setQueueEnabled = useCallback((enabled: boolean) => {
    setQueueEnabledState(enabled);
  }, []);

  const setMaxQueueSize = useCallback((size: number) => {
    setMaxQueueSizeState(size);
  }, []);

  const addToQueue = useCallback((appointmentId: string): QueueEntry => {
    const position = queue.filter(q => q.status === 'waiting').length + 1;
    const avgServiceTime = 25; // minutes
    const newEntry: QueueEntry = {
      id: generateId(),
      appointmentId,
      position,
      estimatedWait: position * avgServiceTime,
      status: 'waiting',
    };
    setQueue(prev => [...prev, newEntry]);
    return newEntry;
  }, [queue]);

  const callNextInQueue = useCallback((): QueueEntry | null => {
    const next = queue.find(q => q.status === 'waiting');
    if (next) {
      setQueue(prev => prev.map(q => 
        q.id === next.id 
          ? { ...q, status: 'called' as const, calledAt: new Date().toISOString() } 
          : q
      ));
      // Recalculate positions for remaining
      setTimeout(() => {
        setQueue(prev => {
          const waiting = prev.filter(q => q.status === 'waiting');
          const others = prev.filter(q => q.status !== 'waiting');
          const reordered = waiting.map((q, index) => ({
            ...q,
            position: index + 1,
            estimatedWait: (index + 1) * 25,
          }));
          return [...others, ...reordered];
        });
      }, 100);
      return next;
    }
    return null;
  }, [queue]);

  const updateQueuePosition = useCallback((id: string, position: number) => {
    setQueue(prev => prev.map(q => 
      q.id === id ? { ...q, position } : q
    ));
  }, []);

  const getQueuePosition = useCallback((appointmentId: string): number | null => {
    const entry = queue.find(q => q.appointmentId === appointmentId && q.status === 'waiting');
    return entry?.position ?? null;
  }, [queue]);

  // Blocked Slots
  const addBlockedSlot = useCallback((slot: Omit<BlockedSlot, 'id'>) => {
    const newSlot = { ...slot, id: generateId() };
    setBlockedSlots(prev => [...prev, newSlot]);
  }, []);

  const removeBlockedSlot = useCallback((id: string) => {
    setBlockedSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  // Shop Settings
  const updateShopSettings = useCallback((updates: Partial<ShopSettings>) => {
    setShopSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Time slot availability
  const isSlotAvailable = useCallback((date: string, time: string, barberId: string, duration: number): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = hours * 60 + minutes;
    const slotEnd = slotStart + duration;

    // Check lunch break
    const [lunchStartH, lunchStartM] = shopSettings.lunchBreak.start.split(':').map(Number);
    const [lunchEndH, lunchEndM] = shopSettings.lunchBreak.end.split(':').map(Number);
    const lunchStart = lunchStartH * 60 + lunchStartM;
    const lunchEnd = lunchEndH * 60 + lunchEndM;
    
    if ((slotStart < lunchEnd && slotEnd > lunchStart)) {
      return false;
    }

    // Check blocked slots
    const blocked = blockedSlots.filter(b => b.date === date && b.barberId === barberId);
    for (const block of blocked) {
      const [bStartH, bStartM] = block.startTime.split(':').map(Number);
      const [bEndH, bEndM] = block.endTime.split(':').map(Number);
      const blockStart = bStartH * 60 + bStartM;
      const blockEnd = bEndH * 60 + bEndM;
      if (slotStart < blockEnd && slotEnd > blockStart) {
        return false;
      }
    }

    // Check existing appointments
    const barberAppointments = getAppointmentsByBarber(barberId, date);
    for (const apt of barberAppointments) {
      const [aptH, aptM] = apt.time.split(':').map(Number);
      const aptStart = aptH * 60 + aptM;
      const aptEnd = aptStart + apt.service.duration;
      if (slotStart < aptEnd && slotEnd > aptStart) {
        return false;
      }
    }

    return true;
  }, [blockedSlots, shopSettings, getAppointmentsByBarber]);

  const getAvailableTimeSlots = useCallback((date: Date, barberId: string, serviceDuration: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Get operating hours
    let startHour = 9;
    let endHour = 20;
    if (dayOfWeek === 6) { // Saturday
      endHour = 18;
    } else if (dayOfWeek === 0) { // Sunday - closed
      return [];
    }

    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const available = isSlotAvailable(dateStr, time, barberId, serviceDuration);
        slots.push({ time, available });
      }
    }

    return slots;
  }, [isSlotAvailable]);

  const value: AppState = {
    theme,
    setTheme,
    services: services.filter((s: any) => s.visible !== false),
    addService,
    updateService,
    deleteService,
    toggleServiceVisibility,
    barbers,
    updateBarber,
    toggleBarberAvailability,
    appointments,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    confirmAppointment,
    getAppointmentsByDate,
    getAppointmentsByBarber,
    queueEnabled,
    setQueueEnabled,
    maxQueueSize,
    setMaxQueueSize,
    queue,
    addToQueue,
    callNextInQueue,
    updateQueuePosition,
    getQueuePosition,
    blockedSlots,
    addBlockedSlot,
    removeBlockedSlot,
    shopSettings,
    updateShopSettings,
    getAvailableTimeSlots,
    isSlotAvailable,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
