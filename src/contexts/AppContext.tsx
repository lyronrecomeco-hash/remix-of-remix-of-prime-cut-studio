import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { triggerWebhook, sendPushNotification } from '@/lib/webhooks';

// Types
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon: string;
  visible?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  photo: string;
  specialties: string[];
  experience: string;
  rating: number;
  available: boolean;
}

export interface Appointment {
  id: string;
  protocol?: string;
  clientName: string;
  clientPhone: string;
  service: Service;
  barber: Barber;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'inqueue' | 'called' | 'onway' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

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
  overloadAlertEnabled?: boolean;
  dailyAppointmentLimit?: number;
}

export interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  barberId: string;
  reason?: string;
}

export interface BarberAvailability {
  barberId: string;
  date: string;
  availableSlots: string[];
}

export interface QueueEntry {
  id: string;
  appointmentId: string;
  position: number;
  estimatedWait: number;
  status: 'waiting' | 'called' | 'onway' | 'attended';
  calledAt?: string;
  onwayAt?: string;
}

export type ThemeType = 'dark' | 'light' | 'gold' | 'gold-shine' | 'gold-metallic';

interface AppState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceVisibility: (id: string) => void;
  barbers: Barber[];
  updateBarber: (id: string, barber: Partial<Barber>) => void;
  toggleBarberAvailability: (id: string) => void;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  confirmAppointment: (id: string) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByBarber: (barberId: string, date: string) => Appointment[];
  queueEnabled: boolean;
  setQueueEnabled: (enabled: boolean) => void;
  maxQueueSize: number;
  setMaxQueueSize: (size: number) => void;
  queue: QueueEntry[];
  addToQueue: (appointmentId: string) => Promise<QueueEntry>;
  removeFromQueue: (appointmentId: string) => Promise<void>;
  callNextInQueue: () => QueueEntry | null;
  callSpecificClient: (appointmentId: string) => void;
  markClientOnWay: (appointmentId: string) => void;
  updateQueuePosition: (id: string, position: number) => void;
  getQueuePosition: (appointmentId: string) => number | null;
  getQueueEntry: (appointmentId: string) => QueueEntry | null;
  blockedSlots: BlockedSlot[];
  addBlockedSlot: (slot: Omit<BlockedSlot, 'id'>) => void;
  removeBlockedSlot: (id: string) => void;
  barberAvailability: BarberAvailability[];
  setBarberDayAvailability: (barberId: string, date: string, slots: string[]) => void;
  getBarberDayAvailability: (barberId: string, date: string) => string[] | null;
  shopSettings: ShopSettings;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  getAvailableTimeSlots: (date: Date, barberId: string, serviceDuration: number) => TimeSlot[];
  isSlotAvailable: (date: string, time: string, barberId: string, duration: number) => boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  hasClientAppointments: () => boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

const defaultShopSettings: ShopSettings = {
  name: 'Barber Studio',
  tagline: 'Tradição e Estilo',
  description: 'A melhor experiência em barbearia',
  address: 'Rua das Flores, 123 - Centro',
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  mapsLink: 'https://maps.google.com',
  hours: {
    weekdays: '09:00 - 20:00',
    saturday: '09:00 - 18:00',
    sunday: 'Fechado',
  },
  lunchBreak: {
    start: '12:00',
    end: '13:00',
  },
  social: {
    instagram: '@barberstudio',
    facebook: 'barberstudio',
  },
  overloadAlertEnabled: false,
  dailyAppointmentLimit: 20,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [barberAvailability, setBarberAvailabilityState] = useState<BarberAvailability[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultShopSettings);
  const [queueEnabled, setQueueEnabledState] = useState(true);
  const [maxQueueSize, setMaxQueueSizeState] = useState(10);

  // Fetch all data from database
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('created_at');
      
      if (servicesData) {
        setServices(servicesData.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          duration: s.duration,
          price: Number(s.price),
          icon: s.icon || 'Scissors',
          visible: s.visible,
        })));
      }

      // Fetch barbers
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .order('created_at');
      
      if (barbersData) {
        setBarbers(barbersData.map(b => ({
          id: b.id,
          name: b.name,
          photo: b.photo || '',
          specialties: b.specialties || [],
          experience: b.experience || '',
          rating: Number(b.rating),
          available: b.available,
        })));
      }

      // Fetch appointments with service and barber data
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*, services(*), barbers(*)')
        .order('created_at', { ascending: false });
      
      if (appointmentsData && servicesData && barbersData) {
        setAppointments(appointmentsData.map(a => {
          const service = servicesData.find(s => s.id === a.service_id);
          const barber = barbersData.find(b => b.id === a.barber_id);
          
          // Fallback para serviço não encontrado
          const defaultService: Service = {
            id: a.service_id || '',
            name: 'Serviço removido',
            description: '',
            duration: 30,
            price: 0,
            icon: 'Scissors',
            visible: false,
          };
          
          // Fallback para barbeiro não encontrado
          const defaultBarber: Barber = {
            id: a.barber_id || '',
            name: 'Profissional removido',
            photo: '',
            specialties: [],
            experience: '',
            rating: 0,
            available: false,
          };
          
          return {
            id: a.id,
            protocol: a.protocol,
            clientName: a.client_name,
            clientPhone: a.client_phone,
            service: service ? {
              id: service.id,
              name: service.name,
              description: service.description || '',
              duration: service.duration,
              price: Number(service.price),
              icon: service.icon || 'Scissors',
              visible: service.visible ?? true,
            } : defaultService,
            barber: barber ? {
              id: barber.id,
              name: barber.name,
              photo: barber.photo || '',
              specialties: barber.specialties || [],
              experience: barber.experience || '',
              rating: Number(barber.rating) || 0,
              available: barber.available ?? true,
            } : defaultBarber,
            date: a.date,
            time: a.time,
            status: a.status as Appointment['status'],
            createdAt: a.created_at,
          };
        }));
      }

      // Fetch queue (com status do agendamento para blindagem)
      const { data: queueData } = await supabase
        .from('queue')
        .select(`
          id,
          appointment_id,
          position,
          estimated_wait,
          status,
          called_at,
          onway_at,
          appointments:appointment_id ( status )
        `)
        .order('position');

      if (queueData) {
        // Se houver qualquer resíduo na fila de agendamento já concluído/cancelado,
        // remove automaticamente para não “voltar” após reload.
        const staleAppointmentIds = queueData
          .filter((q: any) => ['completed', 'cancelled'].includes(q?.appointments?.status))
          .map((q: any) => q.appointment_id);

        if (staleAppointmentIds.length > 0) {
          await supabase.from('queue').delete().in('appointment_id', staleAppointmentIds);
        }

        const filteredQueue = queueData.filter((q: any) => !['completed', 'cancelled'].includes(q?.appointments?.status));

        setQueue(filteredQueue.map((q: any) => ({
          id: q.id,
          appointmentId: q.appointment_id,
          position: q.position,
          estimatedWait: q.estimated_wait,
          status: q.status as QueueEntry['status'],
          calledAt: q.called_at || undefined,
          onwayAt: q.onway_at || undefined,
        })));
      }

      // Fetch blocked slots
      const { data: blockedData } = await supabase
        .from('blocked_slots')
        .select('*');
      
      if (blockedData) {
        setBlockedSlots(blockedData.map(b => ({
          id: b.id,
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          barberId: b.barber_id,
          reason: b.reason || undefined,
        })));
      }

      // Fetch barber availability
      const { data: availabilityData } = await supabase
        .from('barber_availability')
        .select('*');
      
      if (availabilityData) {
        setBarberAvailabilityState(availabilityData.map(a => ({
          barberId: a.barber_id,
          date: a.date,
          availableSlots: a.available_slots || [],
        })));
      }

      // Fetch shop settings
      const { data: settingsData } = await supabase
        .from('shop_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (settingsData) {
        setShopSettings({
          name: settingsData.name,
          tagline: settingsData.tagline || '',
          description: settingsData.description || '',
          address: settingsData.address || '',
          phone: settingsData.phone || '',
          whatsapp: settingsData.whatsapp || '',
          mapsLink: settingsData.maps_link || '',
          logo: settingsData.logo || undefined,
          hours: {
            weekdays: settingsData.hours_weekdays || '09:00 - 20:00',
            saturday: settingsData.hours_saturday || '09:00 - 18:00',
            sunday: settingsData.hours_sunday || 'Fechado',
          },
          lunchBreak: {
            start: settingsData.lunch_break_start || '12:00',
            end: settingsData.lunch_break_end || '13:00',
          },
          social: {
            instagram: settingsData.instagram || '',
            facebook: settingsData.facebook || '',
          },
          overloadAlertEnabled: settingsData.overload_alert_enabled ?? false,
          dailyAppointmentLimit: settingsData.daily_appointment_limit ?? 20,
        });
        setQueueEnabledState(settingsData.queue_enabled);
        setMaxQueueSizeState(settingsData.max_queue_size);
        setThemeState(settingsData.theme as ThemeType || 'dark');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Realtime subscriptions
  useEffect(() => {
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        refreshData();
      })
      .subscribe();

    const queueChannel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [refreshData]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-gold');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await supabase.from('shop_settings').update({ theme: newTheme }).neq('id', '00000000-0000-0000-0000-000000000000');
  }, []);

  // Services CRUD
  const addService = useCallback(async (service: Omit<Service, 'id'>) => {
    const { data } = await supabase.from('services').insert({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      icon: service.icon,
      visible: true,
    }).select().single();
    
    if (data) {
      setServices(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        duration: data.duration,
        price: Number(data.price),
        icon: data.icon || 'Scissors',
        visible: data.visible,
      }]);
    }
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<Service>) => {
    await supabase.from('services').update({
      name: updates.name,
      description: updates.description,
      duration: updates.duration,
      price: updates.price,
      icon: updates.icon,
      visible: updates.visible,
    }).eq('id', id);
    
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteService = useCallback(async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleServiceVisibility = useCallback(async (id: string) => {
    const service = services.find(s => s.id === id);
    if (service) {
      const newVisible = !service.visible;
      await supabase.from('services').update({ visible: newVisible }).eq('id', id);
      setServices(prev => prev.map(s => s.id === id ? { ...s, visible: newVisible } : s));
    }
  }, [services]);

  // Barbers
  const updateBarber = useCallback(async (id: string, updates: Partial<Barber>) => {
    await supabase.from('barbers').update({
      name: updates.name,
      photo: updates.photo,
      specialties: updates.specialties,
      experience: updates.experience,
      rating: updates.rating,
      available: updates.available,
    }).eq('id', id);
    
    setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const toggleBarberAvailability = useCallback(async (id: string) => {
    const barber = barbers.find(b => b.id === id);
    if (barber) {
      const newAvailable = !barber.available;
      await supabase.from('barbers').update({ available: newAvailable }).eq('id', id);
      setBarbers(prev => prev.map(b => b.id === id ? { ...b, available: newAvailable } : b));
    }
  }, [barbers]);

  // Appointments - now async to get real ID
  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    const protocol = `GEN${Date.now().toString(36).toUpperCase()}`;
    
    // Insert into database and wait for real ID
    const { data, error } = await supabase.from('appointments').insert({
      protocol,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      service_id: appointment.service.id,
      barber_id: appointment.barber.id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
    }).select().single();
    
    if (error || !data) {
      throw new Error('Failed to create appointment');
    }

    const newAppointment: Appointment = {
      ...appointment,
      id: data.id,
      protocol,
    };

    setAppointments(prev => [...prev, newAppointment]);

    // Trigger webhook for appointment created
    triggerWebhook({
      event_type: 'appointment_created',
      appointment_id: data.id,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      service_name: appointment.service.name,
      barber_name: appointment.barber.name,
      date: appointment.date,
      time: appointment.time,
    });

    // Send push notification to admin
    sendPushNotification(
      'Novo Agendamento',
      `${appointment.clientName} agendou ${appointment.service.name} para ${appointment.date} às ${appointment.time}`,
      'admin'
    );

    return newAppointment;
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    await supabase.from('appointments').update({
      client_name: updates.clientName,
      client_phone: updates.clientPhone,
      status: updates.status,
    }).eq('id', id);
    
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const cancelAppointment = useCallback(async (id: string) => {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    await supabase.from('queue').delete().eq('appointment_id', id);
    
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    setQueue(prev => prev.filter(q => q.appointmentId !== id));
  }, []);

  const completeAppointment = useCallback(async (id: string) => {
    const apt = appointments.find(a => a.id === id);

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', id);

    // Mesmo que o usuário recarregue, o banco agora também limpa a fila via trigger.
    const { error: queueDeleteError } = await supabase
      .from('queue')
      .delete()
      .eq('appointment_id', id);

    if (updateError || queueDeleteError) {
      console.error('Failed to complete appointment:', { updateError, queueDeleteError, id });
      throw new Error('Falha ao concluir o atendimento.');
    }

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    setQueue(prev => {
      const filtered = prev.filter(q => q.appointmentId !== id);
      return filtered.map((q, index) => ({ ...q, position: index + 1 }));
    });

    // Trigger webhook for appointment completed
    if (apt) {
      triggerWebhook({
        event_type: 'appointment_completed',
        appointment_id: id,
        client_name: apt.clientName,
        client_phone: apt.clientPhone,
        service_name: apt.service.name,
        barber_name: apt.barber.name,
        date: apt.date,
        time: apt.time,
      });

      sendPushNotification(
        'Atendimento Concluído',
        `Obrigado pela visita! Esperamos vê-lo novamente.`,
        'client',
        apt.clientPhone
      );
    }
  }, [appointments]);

  // Confirm appointment and auto-add to queue if enabled
  const confirmAppointment = useCallback(async (id: string) => {
    const apt = appointments.find(a => a.id === id);
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
    
    // Auto-add to queue if queue is enabled and not already in queue
    if (queueEnabled) {
      const existingEntry = queue.find(q => q.appointmentId === id);
      if (!existingEntry) {
        const position = queue.filter(q => q.status === 'waiting').length + 1;
        const avgServiceTime = 25;
        
        const { data } = await supabase.from('queue').insert({
          appointment_id: id,
          position,
          estimated_wait: position * avgServiceTime,
          status: 'waiting',
        }).select().single();
        
        if (data) {
          const newEntry: QueueEntry = {
            id: data.id,
            appointmentId: id,
            position,
            estimatedWait: position * avgServiceTime,
            status: 'waiting',
          };
          setQueue(prev => [...prev, newEntry]);
          
          // Update appointment status to inqueue
          await supabase.from('appointments').update({ status: 'inqueue' }).eq('id', id);
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'inqueue' } : a));
        }
      }
    }

    // Trigger webhook for appointment confirmed
    if (apt) {
      triggerWebhook({
        event_type: 'appointment_confirmed',
        appointment_id: id,
        client_name: apt.clientName,
        client_phone: apt.clientPhone,
        service_name: apt.service.name,
        barber_name: apt.barber.name,
        date: apt.date,
        time: apt.time,
      });

      sendPushNotification(
        'Agendamento Confirmado',
        `Seu agendamento para ${apt.date} às ${apt.time} foi confirmado!`,
        'client',
        apt.clientPhone
      );
    }
  }, [queueEnabled, queue, appointments]);

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
  const setQueueEnabled = useCallback(async (enabled: boolean) => {
    setQueueEnabledState(enabled);
    await supabase.from('shop_settings').update({ queue_enabled: enabled }).neq('id', '00000000-0000-0000-0000-000000000000');
  }, []);

  const setMaxQueueSize = useCallback(async (size: number) => {
    setMaxQueueSizeState(size);
    await supabase.from('shop_settings').update({ max_queue_size: size }).neq('id', '00000000-0000-0000-0000-000000000000');
  }, []);

  const addToQueue = useCallback(async (appointmentId: string): Promise<QueueEntry> => {
    const position = queue.filter(q => q.status === 'waiting').length + 1;
    const avgServiceTime = 25;

    const { data, error } = await supabase.from('queue').insert({
      appointment_id: appointmentId,
      position,
      estimated_wait: position * avgServiceTime,
      status: 'waiting',
    }).select().single();
    
    if (error || !data) {
      throw new Error('Failed to add to queue');
    }

    const newEntry: QueueEntry = {
      id: data.id,
      appointmentId,
      position,
      estimatedWait: position * avgServiceTime,
      status: 'waiting',
    };

    setQueue(prev => [...prev, newEntry]);
    return newEntry;
  }, [queue]);

  // Remover cliente da fila manualmente (para clientes já atendidos/concluídos)
  const removeFromQueue = useCallback(async (appointmentId: string): Promise<void> => {
    const { error } = await supabase.from('queue').delete().eq('appointment_id', appointmentId);
    
    if (error) {
      console.error('Failed to remove from queue:', error);
      throw new Error('Falha ao remover da fila');
    }

    // Atualizar estado local e reordenar posições
    setQueue(prev => {
      const filtered = prev.filter(q => q.appointmentId !== appointmentId);
      const waiting = filtered.filter(q => q.status === 'waiting');
      const others = filtered.filter(q => q.status !== 'waiting');
      
      // Reordenar posições dos que ainda estão esperando
      const reordered = waiting.map((q, index) => ({
        ...q,
        position: index + 1,
        estimatedWait: (index + 1) * 25,
      }));

      // Atualizar posições no banco
      reordered.forEach(q => {
        supabase.from('queue').update({ 
          position: q.position, 
          estimated_wait: q.estimatedWait 
        }).eq('id', q.id);
      });

      return [...others, ...reordered];
    });
  }, []);

  const callNextInQueue = useCallback((): QueueEntry | null => {
    const next = queue.find(q => q.status === 'waiting');
    if (next) {
      const now = new Date().toISOString();
      const apt = appointments.find(a => a.id === next.appointmentId);
      
      supabase.from('queue').update({ 
        status: 'called', 
        called_at: now 
      }).eq('id', next.id);

      // Update appointment status
      supabase.from('appointments').update({ status: 'called' }).eq('id', next.appointmentId);

      setQueue(prev => prev.map(q => 
        q.id === next.id 
          ? { ...q, status: 'called', calledAt: now } 
          : q
      ));

      setAppointments(prev => prev.map(a => 
        a.id === next.appointmentId 
          ? { ...a, status: 'called' } 
          : a
      ));

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

      // Trigger webhook for client called
      if (apt) {
        triggerWebhook({
          event_type: 'client_called',
          appointment_id: next.appointmentId,
          client_name: apt.clientName,
          client_phone: apt.clientPhone,
          service_name: apt.service.name,
          barber_name: apt.barber.name,
          date: apt.date,
          time: apt.time,
        });

        sendPushNotification(
          'Chegou sua vez!',
          `Dirija-se ao salão agora para seu atendimento.`,
          'client',
          apt.clientPhone
        );
      }

      return next;
    }
    return null;
  }, [queue, appointments]);

  // Call specific client in queue
  const callSpecificClient = useCallback(async (appointmentId: string) => {
    const entry = queue.find(q => q.appointmentId === appointmentId && q.status === 'waiting');
    const apt = appointments.find(a => a.id === appointmentId);
    if (entry) {
      const now = new Date().toISOString();
      
      await supabase.from('queue').update({ 
        status: 'called', 
        called_at: now 
      }).eq('id', entry.id);

      await supabase.from('appointments').update({ status: 'called' }).eq('id', appointmentId);

      setQueue(prev => prev.map(q => 
        q.id === entry.id 
          ? { ...q, status: 'called', calledAt: now } 
          : q
      ));

      setAppointments(prev => prev.map(a => 
        a.id === appointmentId 
          ? { ...a, status: 'called' } 
          : a
      ));

      setTimeout(() => {
        setQueue(prev => {
          const waiting = prev.filter(q => q.status === 'waiting');
          const others = prev.filter(q => q.status !== 'waiting');
          const reordered = waiting.map((q, index) => ({
            ...q,
            position: index + 1,
            estimatedWait: (index + 1) * 25,
          }));
          
          reordered.forEach(q => {
            supabase.from('queue').update({ position: q.position, estimated_wait: q.estimatedWait }).eq('id', q.id);
          });
          
          return [...others, ...reordered];
        });
      }, 100);

      // Trigger webhook for client called
      if (apt) {
        triggerWebhook({
          event_type: 'client_called',
          appointment_id: appointmentId,
          client_name: apt.clientName,
          client_phone: apt.clientPhone,
          service_name: apt.service.name,
          barber_name: apt.barber.name,
          date: apt.date,
          time: apt.time,
        });

        sendPushNotification(
          'Chegou sua vez!',
          `Dirija-se ao salão agora para seu atendimento.`,
          'client',
          apt.clientPhone
        );
      }
    }
  }, [queue, appointments]);

  const updateQueuePosition = useCallback(async (id: string, position: number) => {
    await supabase.from('queue').update({ position }).eq('id', id);
    setQueue(prev => prev.map(q => q.id === id ? { ...q, position } : q));
  }, []);

  const getQueuePosition = useCallback((appointmentId: string): number | null => {
    const entry = queue.find(q => q.appointmentId === appointmentId && q.status === 'waiting');
    return entry?.position ?? null;
  }, [queue]);

  const getQueueEntry = useCallback((appointmentId: string): QueueEntry | null => {
    return queue.find(q => q.appointmentId === appointmentId) ?? null;
  }, [queue]);

  const markClientOnWay = useCallback(async (appointmentId: string) => {
    const now = new Date().toISOString();
    
    await supabase.from('queue').update({ status: 'onway', onway_at: now }).eq('appointment_id', appointmentId);
    await supabase.from('appointments').update({ status: 'onway' }).eq('id', appointmentId);

    setQueue(prev => prev.map(q =>
      q.appointmentId === appointmentId
        ? { ...q, status: 'onway', onwayAt: now }
        : q
    ));
    setAppointments(prev => prev.map(a =>
      a.id === appointmentId
        ? { ...a, status: 'onway' }
        : a
    ));
  }, []);

  // Blocked Slots
  const addBlockedSlot = useCallback(async (slot: Omit<BlockedSlot, 'id'>) => {
    const { data } = await supabase.from('blocked_slots').insert({
      barber_id: slot.barberId,
      date: slot.date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      reason: slot.reason,
    }).select().single();
    
    if (data) {
      setBlockedSlots(prev => [...prev, {
        id: data.id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        barberId: data.barber_id,
        reason: data.reason || undefined,
      }]);
    }
  }, []);

  const removeBlockedSlot = useCallback(async (id: string) => {
    await supabase.from('blocked_slots').delete().eq('id', id);
    setBlockedSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  // Barber Availability
  const setBarberDayAvailability = useCallback(async (barberId: string, date: string, slots: string[]) => {
    await supabase.from('barber_availability').upsert({
      barber_id: barberId,
      date: date,
      available_slots: slots,
    }, { onConflict: 'barber_id,date' });

    setBarberAvailabilityState(prev => {
      const existing = prev.findIndex(a => a.barberId === barberId && a.date === date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { barberId, date, availableSlots: slots };
        return updated;
      }
      return [...prev, { barberId, date, availableSlots: slots }];
    });
  }, []);

  const getBarberDayAvailability = useCallback((barberId: string, date: string): string[] | null => {
    const found = barberAvailability.find(a => a.barberId === barberId && a.date === date);
    return found ? found.availableSlots : null;
  }, [barberAvailability]);

  // Shop Settings
  const updateShopSettings = useCallback(async (settings: Partial<ShopSettings>) => {
    const updates: Record<string, any> = {};
    
    if (settings.name !== undefined) updates.name = settings.name;
    if (settings.tagline !== undefined) updates.tagline = settings.tagline;
    if (settings.description !== undefined) updates.description = settings.description;
    if (settings.address !== undefined) updates.address = settings.address;
    if (settings.phone !== undefined) updates.phone = settings.phone;
    if (settings.whatsapp !== undefined) updates.whatsapp = settings.whatsapp;
    if (settings.mapsLink !== undefined) updates.maps_link = settings.mapsLink;
    if (settings.logo !== undefined) updates.logo = settings.logo;
    if (settings.hours?.weekdays !== undefined) updates.hours_weekdays = settings.hours.weekdays;
    if (settings.hours?.saturday !== undefined) updates.hours_saturday = settings.hours.saturday;
    if (settings.hours?.sunday !== undefined) updates.hours_sunday = settings.hours.sunday;
    if (settings.lunchBreak?.start !== undefined) updates.lunch_break_start = settings.lunchBreak.start;
    if (settings.lunchBreak?.end !== undefined) updates.lunch_break_end = settings.lunchBreak.end;
    if (settings.social?.instagram !== undefined) updates.instagram = settings.social.instagram;
    if (settings.social?.facebook !== undefined) updates.facebook = settings.social.facebook;
    if (settings.overloadAlertEnabled !== undefined) updates.overload_alert_enabled = settings.overloadAlertEnabled;
    if (settings.dailyAppointmentLimit !== undefined) updates.daily_appointment_limit = settings.dailyAppointmentLimit;
    
    await supabase.from('shop_settings').update(updates).neq('id', '00000000-0000-0000-0000-000000000000');
    setShopSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Time slots calculation
  const getAvailableTimeSlots = useCallback((date: Date, barberId: string, serviceDuration: number): TimeSlot[] => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Get operating hours based on day of week
    let hours = shopSettings.hours.weekdays;
    if (dayOfWeek === 6) hours = shopSettings.hours.saturday;
    if (dayOfWeek === 0) hours = shopSettings.hours.sunday;
    
    if (hours === 'Fechado') return [];

    const [openTime, closeTime] = hours.split(' - ').map(t => t.trim());
    const lunchStart = shopSettings.lunchBreak.start;
    const lunchEnd = shopSettings.lunchBreak.end;

    // Generate all possible slots
    const slots: TimeSlot[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    for (let hour = openHour; hour < closeHour || (hour === closeHour && 0 < closeMin); hour++) {
      for (const minute of [0, 30]) {
        if (hour === openHour && minute < openMin) continue;
        if (hour === closeHour && minute >= closeMin) continue;
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if slot is during lunch
        if (timeStr >= lunchStart && timeStr < lunchEnd) continue;
        
        // Check if slot is blocked
        const isBlocked = blockedSlots.some(b => 
          b.barberId === barberId && 
          b.date === dateStr && 
          timeStr >= b.startTime && 
          timeStr < b.endTime
        );
        if (isBlocked) continue;
        
        // Check barber custom availability
        const customAvailability = getBarberDayAvailability(barberId, dateStr);
        if (customAvailability && customAvailability.length > 0 && !customAvailability.includes(timeStr)) continue;
        
        // Check if slot is already booked
        const isBooked = appointments.some(a => 
          a.barber.id === barberId && 
          a.date === dateStr && 
          a.time === timeStr &&
          a.status !== 'cancelled'
        );
        
        // Check if current time has passed (for today)
        const now = new Date();
        const isToday = dateStr === now.toISOString().split('T')[0];
        const isPast = isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()));
        
        slots.push({
          time: timeStr,
          available: !isBooked && !isPast,
        });
      }
    }

    return slots;
  }, [shopSettings, blockedSlots, appointments, getBarberDayAvailability]);

  const isSlotAvailable = useCallback((date: string, time: string, barberId: string, duration: number): boolean => {
    const dateObj = new Date(date);
    const slots = getAvailableTimeSlots(dateObj, barberId, duration);
    const slot = slots.find(s => s.time === time);
    return slot?.available ?? false;
  }, [getAvailableTimeSlots]);

  // Check if client has any appointments (for showing/hiding menu items)
  const hasClientAppointments = useCallback((): boolean => {
    const savedPhone = localStorage.getItem('barbershop-client-phone');
    if (!savedPhone) return false;
    
    return appointments.some(a => a.clientPhone.replace(/\D/g, '') === savedPhone);
  }, [appointments]);

  const value: AppState = {
    theme,
    setTheme,
    services,
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
    removeFromQueue,
    callNextInQueue,
    callSpecificClient,
    markClientOnWay,
    updateQueuePosition,
    getQueuePosition,
    getQueueEntry,
    blockedSlots,
    addBlockedSlot,
    removeBlockedSlot,
    barberAvailability,
    setBarberDayAvailability,
    getBarberDayAvailability,
    shopSettings,
    updateShopSettings,
    getAvailableTimeSlots,
    isSlotAvailable,
    isLoading,
    refreshData,
    hasClientAppointments,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
