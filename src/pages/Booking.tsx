import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, Clock, User, Scissors, ChevronLeft, ChevronRight, MapPin, Info, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import { usePhoneMask } from '@/hooks/usePhoneMask';
import { useIsMobile } from '@/hooks/use-mobile';
import { Service, Barber, TimeSlot } from '@/lib/data';
import Header from '@/components/landing/Header';

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

const Booking = () => {
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
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load available time slots when date and barber are selected
  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      const slots = getAvailableTimeSlots(selectedDate, selectedBarber.id, selectedService.duration);
      setTimeSlots(slots);
      setSelectedTime(null); // Reset selected time when date changes
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

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Create the appointment
    const newAppointment = addAppointment({
      clientName,
      clientPhone: phoneMask.value,
      service: selectedService,
      barber: selectedBarber,
      date: dateStr,
      time: selectedTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Save client phone for "My Appointments"
    localStorage.setItem('barbershop-client-phone', phoneMask.rawValue);

    // Add to queue if enabled
    let position = null;
    if (queueEnabled) {
      const queueEntry = addToQueue(newAppointment.id);
      position = queueEntry.position;
    }

    setCreatedAppointment(newAppointment);
    setQueuePosition(position);
    setIsConfirmed(true);

    notify.booking('Agendamento Confirmado!', `${selectedService.name} dia ${formatDate(selectedDate)} às ${selectedTime}`);
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

  // Calendar helpers
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
    return date >= today && date.getDay() !== 0; // Not in the past and not Sunday
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
        <Header />
        <div className="pt-24 pb-12 px-4">
          <div className="container-narrow max-w-lg mx-auto">
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

              {/* Instructions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Instruções importantes:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Chegue 5 minutos antes do horário</li>
                      <li>• Cancelamentos com 2h de antecedência</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <Button variant="hero" size="lg" className="w-full" onClick={handleAddToCalendar}>
                  <CalendarPlus className="w-5 h-5" />
                  Adicionar ao Calendário
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to="/meus-agendamentos">
                    Ver Meus Agendamentos
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full">
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>

              {/* Location shortcut */}
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
      <Header />
      
      <div className="pt-24 pb-32 md:pb-12 px-4">
        <div className="container-narrow max-w-2xl mx-auto">
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
                          <img
                            src={barber.photo}
                            alt={barber.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{barber.name}</h3>
                              {!barber.available && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Indisponível</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {barber.specialties.join(' • ')}
                            </p>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-primary">★ {barber.rating}</span>
                              <span className="text-muted-foreground">({barber.reviewCount} avaliações)</span>
                            </div>
                          </div>
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
                  <p className="text-muted-foreground mb-6">Selecione o dia do atendimento</p>
                  
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="font-semibold capitalize">
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                        <div key={day} className="text-center text-xs text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonth(currentMonth).map((date, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (date && isDateSelectable(date)) {
                              setSelectedDate(date);
                              if (isMobileOrTablet) {
                                setTimeout(() => setCurrentStep(4), 150);
                              }
                            }
                          }}
                          disabled={!date || !isDateSelectable(date)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                            !date
                              ? ''
                              : !isDateSelectable(date)
                              ? 'text-muted-foreground/30 cursor-not-allowed'
                              : selectedDate?.toDateString() === date.toDateString()
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary'
                          }`}
                        >
                          {date?.getDate()}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Time Selection */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha o horário</h2>
                  <p className="text-muted-foreground mb-6 capitalize">
                    {selectedDate && formatDate(selectedDate)}
                  </p>
                  
                  {timeSlots.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Carregando horários disponíveis...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={
                            selectedTime === slot.time
                              ? 'pill-active'
                              : !slot.available
                              ? 'pill-disabled'
                              : 'pill'
                          }
                          onClick={() => {
                            if (slot.available) {
                              setSelectedTime(slot.time);
                              if (isMobileOrTablet) {
                                setTimeout(() => setCurrentStep(5), 150);
                              }
                            }
                          }}
                          disabled={!slot.available}
                          className="h-12"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}

                  {timeSlots.filter(s => s.available).length === 0 && timeSlots.length > 0 && (
                    <p className="text-center text-muted-foreground mt-4">
                      Não há horários disponíveis neste dia. Escolha outra data.
                    </p>
                  )}
                </div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Confirmar agendamento</h2>
                  <p className="text-muted-foreground mb-6">Revise e confirme seus dados</p>
                  
                  <div className="glass-card rounded-2xl p-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Serviço</span>
                        <span className="font-medium">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Profissional</span>
                        <span className="font-medium">{selectedBarber?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Data</span>
                        <span className="font-medium capitalize">{selectedDate && formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Horário</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-bold text-primary text-xl">R$ {selectedService?.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Seu nome *</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                      />
                      {clientName.length > 0 && clientName.length < 3 && (
                        <p className="text-xs text-destructive mt-1">Nome deve ter pelo menos 3 caracteres</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">WhatsApp *</label>
                      <input
                        type="tel"
                        value={phoneMask.value}
                        onChange={phoneMask.onChange}
                        placeholder="(11) 99999-0000"
                        className="w-full h-12 px-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                      />
                      {phoneMask.value.length > 0 && !phoneMask.isValid && (
                        <p className="text-xs text-destructive mt-1">Digite um número válido</p>
                      )}
                    </div>

                    {/* Mobile confirm button */}
                    {isMobileOrTablet && (
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={handleConfirmBooking}
                        disabled={!canProceed()}
                        className="w-full mt-4"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Agendamento
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 md:relative md:mt-8 md:p-0 md:border-0 md:bg-transparent z-40" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-3 max-w-2xl mx-auto">
              {currentStep > 1 && (
                <Button variant="outline" size="lg" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              {/* Only show navigation button on desktop or non-step-5 */}
              {(!isMobileOrTablet || currentStep !== 5) && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  {currentStep === 5 ? 'Confirmar Agendamento' : 'Continuar'}
                  {currentStep < 5 && <ArrowRight className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
