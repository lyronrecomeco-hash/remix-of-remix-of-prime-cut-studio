import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  XCircle, 
  TrendingDown, 
  AlertTriangle,
  Users,
  MessageSquare,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ChaosMetricsProps {
  onComplete?: () => void;
}

export const ChaosMetrics = ({ onComplete }: ChaosMetricsProps) => {
  const [metrics, setMetrics] = useState({
    lostClients: 0,
    unansweredMessages: 0,
    avgResponseTime: 0,
    canceledAppointments: 0,
    lostRevenue: 0
  });

  useEffect(() => {
    // Simular métricas de caos aumentando
    const interval = setInterval(() => {
      setMetrics(prev => ({
        lostClients: Math.min(prev.lostClients + 1, 47),
        unansweredMessages: Math.min(prev.unansweredMessages + Math.floor(Math.random() * 5) + 2, 234),
        avgResponseTime: Math.min(prev.avgResponseTime + 0.5, 4.2),
        canceledAppointments: Math.min(prev.canceledAppointments + 1, 23),
        lostRevenue: Math.min(prev.lostRevenue + Math.floor(Math.random() * 500) + 100, 12450)
      }));
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  const metricCards = [
    {
      icon: Users,
      label: 'Clientes perdidos este mês',
      value: metrics.lostClients,
      suffix: '',
      color: 'red',
      pulse: true
    },
    {
      icon: MessageSquare,
      label: 'Mensagens não respondidas',
      value: metrics.unansweredMessages,
      suffix: '',
      color: 'orange',
      pulse: true
    },
    {
      icon: Clock,
      label: 'Tempo médio de resposta',
      value: metrics.avgResponseTime.toFixed(1),
      suffix: 'h',
      color: 'yellow',
      pulse: false
    },
    {
      icon: Calendar,
      label: 'Agendamentos cancelados',
      value: metrics.canceledAppointments,
      suffix: '',
      color: 'red',
      pulse: true
    },
    {
      icon: DollarSign,
      label: 'Faturamento perdido',
      value: `R$ ${metrics.lostRevenue.toLocaleString('pt-BR')}`,
      suffix: '',
      color: 'red',
      pulse: true,
      isMoney: true
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'from-red-500/30 to-red-500/10 border-red-500/40 text-red-400';
      case 'orange': return 'from-orange-500/30 to-orange-500/10 border-orange-500/40 text-orange-400';
      case 'yellow': return 'from-yellow-500/30 to-yellow-500/10 border-yellow-500/40 text-yellow-400';
      default: return 'from-gray-500/30 to-gray-500/10 border-gray-500/40 text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header de alerta */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="inline-flex items-center gap-3 bg-red-500/20 border border-red-500/40 rounded-2xl px-6 py-3"
        >
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-red-300 font-bold text-lg">Diagnóstico do seu negócio</span>
        </motion.div>
      </motion.div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.15 }}
            className={`relative bg-gradient-to-br ${getColorClasses(card.color)} border rounded-2xl p-6 overflow-hidden`}
          >
            {/* Efeito de pulse */}
            {card.pulse && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-current rounded-2xl"
                style={{ opacity: 0.1 }}
              />
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <card.icon className="w-8 h-8" />
                <TrendingDown className="w-5 h-5 opacity-60" />
              </div>
              
              <motion.p
                key={String(card.value)}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-white mb-1"
              >
                {card.isMoney ? card.value : `${card.value}${card.suffix}`}
              </motion.p>
              
              <p className="text-sm opacity-80">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mensagem de impacto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 text-center"
      >
        <p className="text-gray-400 text-lg">
          Isso acontece quando você depende de{' '}
          <span className="text-red-400 font-semibold">processos manuais</span>
        </p>
      </motion.div>
    </div>
  );
};

export default ChaosMetrics;
