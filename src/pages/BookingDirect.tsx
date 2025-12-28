import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, Clock, User, Scissors, ChevronLeft, ChevronRight, MapPin, Info, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { usePhoneMask } from '@/hooks/usePhoneMask';
import { useIsMobile } from '@/hooks/use-mobile';
import { TimeSlot } from '@/lib/data';
import { Service, Barber } from '@/contexts/AppContext';

const steps = [
  { id: 1, title: 'Serviço', icon: Scissors },
  { id: 2, title: 'Profissional', icon: User },
  { id: 3, title: 'Data', icon: CalendarIcon },
  { id: 4, title: 'Horário', icon: Clock },
  { id: 5, title: 'Confirmar', icon: Check },
];

const iconMap: Record<string, any> = {
  Scissors: Scissors,
  Brush: User,
  Crown: Scissors,
  Zap: Scissors,
  Palette: Scissors,
  Sparkles: Scissors,
};

const BookingDirect = () => {
  const { services, barbers, addAppointment, getAvailableTimeSlots, addToQueue, queueEnabled, shopSettings } = useApp();
  const { notify } = useNotification();
  const phoneMask = usePhoneMask();
  const isMobileOrTablet = useIsMobile();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      const slots = getAvailableTimeSlots(selectedDate, selectedBarber.id, selectedService.duration);
      setTimeSlots(slots);
      setSelectedTime(null);
    }
  }, [selectedDate, selectedBarber, selectedService, getAvailableTimeSlots]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedService !== null;
      case 2: return selectedBarber !== null;
      case 3: return selectedDate !== null;
      case 4: return selectedTime !== null;
      case 5: return clientName.length > 2 && phoneMask.isValid;
      default: return false;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;
    if (isLoading) return;

    setIsLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    try {
      const newAppointment = await addAppointment({
        clientName,
        clientPhone: phoneMask.value,
        service: selectedService,
        barber: selectedBarber,
        date: dateStr,
        time: selectedTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem('barbershop-client-phone', phoneMask.rawValue);

      let position = null;
      if (queueEnabled) {
        const queueEntry = await addToQueue(newAppointment.id);
        position = queueEntry.position;
      }

      setCreatedAppointment(newAppointment);
      setQueuePosition(position);
      setIsConfirmed(true);

      notify.booking('Agendamento Confirmado!', `${selectedService.name} dia ${formatDate(selectedDate)} às ${selectedTime}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      notify.error('Erro ao criar agendamento', 'Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5 && canProceed()) {
      handleConfirmBooking();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleAddToCalendar = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + selectedService.duration);

    const formatForCalendar = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedService.name + ' - ' + shopSettings.name)}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${encodeURIComponent('Agendamento confirmado com ' + selectedBarber?.name)}&location=${encodeURIComponent(shopSettings.address)}`;
    
    window.open(calendarUrl, '_blank');
    notify.success('Abrindo calendário', 'Adicione o evento ao seu Google Calendar');
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        {/* Minimal Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold">{shopSettings.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">Agendamento Direto</div>
          </div>
        </header>

        <div className="pt-24 pb-12 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-primary" />
              </motion.div>
              
              <h1 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h1>
              <p className="text-muted-foreground mb-6">
                {queueEnabled ? 'Você está na fila de espera' : 'Te aguardamos no horário marcado'}
              </p>

              {queuePosition && queueEnabled && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-secondary rounded-2xl p-6 mb-6"
                >
                  <p className="text-sm text-muted-foreground mb-1">Sua posição na fila</p>
                  <p className="text-5xl font-bold text-primary">{queuePosition}°</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimativa: ~{queuePosition * 20} minutos
                  </p>
                </motion.div>
              )}

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 text-left bg-secondary/50 rounded-xl p-4 mb-6"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium capitalize">{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary text-lg">R$ {selectedService?.price}</span>
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <Button variant="hero" size="lg" className="w-full" onClick={handleAddToCalendar}>
                  <CalendarPlus className="w-5 h-5" />
                  Adicionar ao Calendário
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 pt-6 border-t border-border"
              >
                <a
                  href={shopSettings.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Ver localização no mapa
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold">{shopSettings.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">Agendamento Direto</div>
        </div>
      </header>
      
      <div className="pt-24 pb-32 md:pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-0.5 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Service Selection */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha o serviço</h2>
                  <p className="text-muted-foreground mb-6">Selecione o serviço desejado</p>
                  
                  <div className="grid gap-3">
                    {services.map((service) => {
                      const Icon = iconMap[service.icon] || Scissors;
                      return (
                        <motion.button
                          key={service.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedService(service);
                            if (isMobileOrTablet) {
                              setTimeout(() => setCurrentStep(2), 150);
                            }
                          }}
                          className={`glass-card rounded-xl p-4 text-left transition-all hover:border-primary/50 ${
                            selectedService?.id === service.id
                              ? 'border-primary bg-primary/5'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold">{service.name}</h3>
                                <span className="text-primary font-bold">R$ {service.price}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">⏱ {service.duration} min</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Barber Selection */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha o profissional</h2>
                  <p className="text-muted-foreground mb-6">Selecione quem vai te atender</p>
                  
                  <div className="grid gap-3">
                    {barbers.map((barber) => (
                      <motion.button
                        key={barber.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (barber.available) {
                            setSelectedBarber(barber);
                            if (isMobileOrTablet) {
                              setTimeout(() => setCurrentStep(3), 150);
                            }
                          }
                        }}
                        disabled={!barber.available}
                        className={`glass-card rounded-xl p-4 text-left transition-all ${
                          !barber.available
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:border-primary/50'
                        } ${
                          selectedBarber?.id === barber.id
                            ? 'border-primary bg-primary/5'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary">
                            {barber.photo ? (
                              <img src={barber.photo} alt={barber.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{barber.name}</h3>
                            <p className="text-sm text-muted-foreground">{barber.specialties?.join(', ')}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-primary">★</span>
                              <span className="text-sm">{barber.rating}</span>
                            </div>
                          </div>
                          {!barber.available && (
                            <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">
                              Indisponível
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Date Selection */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha a data</h2>
                  <p className="text-muted-foreground mb-6">Selecione o melhor dia para você</p>
                  
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="font-semibold capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-xs text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonth(currentMonth).map((day, index) => (
                        <button
                          key={index}
                          onClick={() => day && isDateSelectable(day) && setSelectedDate(day)}
                          disabled={!day || !isDateSelectable(day)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                            !day || !isDateSelectable(day)
                              ? 'text-muted-foreground/30 cursor-not-allowed'
                              : selectedDate?.toDateString() === day?.toDateString()
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-secondary'
                          }`}
                        >
                          {day?.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Time Selection */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha o horário</h2>
                  <p className="text-muted-foreground mb-6">
                    Horários disponíveis para {selectedDate && formatDate(selectedDate)}
                  </p>
                  
                  {timeSlots.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum horário disponível nesta data</p>
                      <Button variant="outline" className="mt-4" onClick={prevStep}>
                        Escolher outra data
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`py-3 rounded-xl text-center transition-all ${
                            !slot.available
                              ? 'bg-secondary/50 text-muted-foreground/30 cursor-not-allowed'
                              : selectedTime === slot.time
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Confirme seus dados</h2>
                  <p className="text-muted-foreground mb-6">Revise e finalize seu agendamento</p>
                  
                  <div className="space-y-4">
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-semibold mb-4">Resumo do Agendamento</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serviço</span>
                          <span className="font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profissional</span>
                          <span className="font-medium">{selectedBarber?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data</span>
                          <span className="font-medium capitalize">{selectedDate && formatDate(selectedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horário</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duração</span>
                          <span className="font-medium">{selectedService?.duration} minutos</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-border">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-bold text-primary text-lg">R$ {selectedService?.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-semibold mb-4">Seus Dados</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground block mb-1">Nome completo</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground block mb-1">WhatsApp</label>
                          <input
                            type="tel"
                            value={phoneMask.value}
                            onChange={phoneMask.onChange}
                            placeholder="(11) 99999-0000"
                            className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border md:relative md:p-0 md:mt-8 md:bg-transparent md:backdrop-blur-none md:border-none">
            <div className="max-w-2xl mx-auto flex gap-3">
              {currentStep > 1 && (
                <Button variant="outline" size="lg" onClick={prevStep} className="flex-1 md:flex-none">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              <Button 
                variant="hero" 
                size="lg" 
                onClick={nextStep} 
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  'Processando...'
                ) : currentStep === 5 ? (
                  'Confirmar Agendamento'
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDirect;
