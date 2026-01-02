import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageSquare,
  Bot,
  Zap,
  Bell,
  BarChart3,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface Activity {
  id: number;
  type: 'booking' | 'message' | 'automation' | 'reminder';
  title: string;
  subtitle: string;
  time: string;
}

export const PanelSimulation = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    todayBookings: 0,
    automatedResponses: 0,
    satisfaction: 0,
    revenue: 0
  });

  const activityTemplates: Omit<Activity, 'id' | 'time'>[] = [
    { type: 'booking', title: 'Novo agendamento', subtitle: 'Maria Silva - Corte + Barba às 14:00' },
    { type: 'message', title: 'Resposta automática enviada', subtitle: 'João Santos recebeu confirmação' },
    { type: 'automation', title: 'Lembrete disparado', subtitle: '15 clientes notificados para amanhã' },
    { type: 'booking', title: 'Agendamento confirmado', subtitle: 'Ana Costa - Coloração às 16:30' },
    { type: 'message', title: 'Atendimento concluído', subtitle: 'Pedro confirmou presença via WhatsApp' },
    { type: 'automation', title: 'Campanha ativa', subtitle: '47 mensagens de promoção enviadas' },
    { type: 'booking', title: 'Reagendamento automático', subtitle: 'Lucas movido de 10:00 para 11:30' },
    { type: 'reminder', title: 'Meta do dia atingida!', subtitle: '🎯 Parabéns! R$ 2.500 em agendamentos' },
  ];

  useEffect(() => {
    let activityId = 0;
    
    // Simular atividades chegando
    const activityInterval = setInterval(() => {
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const newActivity: Activity = {
        ...template,
        id: activityId++,
        time: 'agora'
      };
      
      setActivities(prev => [newActivity, ...prev].slice(0, 6));
    }, 2000);

    // Simular stats aumentando
    const statsInterval = setInterval(() => {
      setStats(prev => ({
        todayBookings: Math.min(prev.todayBookings + 1, 24),
        automatedResponses: Math.min(prev.automatedResponses + Math.floor(Math.random() * 3) + 1, 156),
        satisfaction: Math.min(prev.satisfaction + 0.5, 98.5),
        revenue: Math.min(prev.revenue + Math.floor(Math.random() * 200) + 50, 4850)
      }));
    }, 500);

    return () => {
      clearInterval(activityInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'automation': return <Bot className="w-4 h-4 text-purple-400" />;
      case 'reminder': return <Bell className="w-4 h-4 text-amber-400" />;
      default: return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Browser Frame */}
      <div className="bg-[#1a1a2e] rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/10">
        {/* Browser Header */}
        <div className="bg-[#0d0d1a] px-4 py-3 flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-black/30 rounded-lg px-4 py-1.5 flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-gray-400 text-sm">app.genesishub.com.br/painel</span>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-16 bg-[#0d0d1a] p-3 flex flex-col gap-4 items-center border-r border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
              <Users className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="mt-auto w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
              <Settings className="w-5 h-5" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  Dashboard
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </motion.div>
                </h2>
                <p className="text-gray-400 text-sm">Tudo funcionando automaticamente</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Sistema Ativo</span>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <motion.p
                  key={stats.todayBookings}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {stats.todayBookings}
                </motion.p>
                <p className="text-gray-400 text-xs">Agendamentos hoje</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </div>
                <motion.p
                  key={stats.automatedResponses}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {stats.automatedResponses}
                </motion.p>
                <p className="text-gray-400 text-xs">Respostas automáticas</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <ArrowUpRight className="w-4 h-4 text-purple-400" />
                </div>
                <motion.p
                  key={stats.satisfaction}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {stats.satisfaction.toFixed(1)}%
                </motion.p>
                <p className="text-gray-400 text-xs">Satisfação</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl p-4 border border-amber-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-400 font-bold text-sm">R$</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </div>
                <motion.p
                  key={stats.revenue}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {stats.revenue.toLocaleString('pt-BR')}
                </motion.p>
                <p className="text-gray-400 text-xs">Faturamento hoje</p>
              </motion.div>
            </div>

            {/* Activity Feed */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Atividade em tempo real
                </h3>
                <span className="text-xs text-gray-500">Atualização automática</span>
              </div>
              
              <div className="space-y-2 h-[200px] overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-xs truncate">{activity.subtitle}</p>
                      </div>
                      <span className="text-gray-500 text-xs">{activity.time}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-3 bg-purple-500/20 border border-purple-500/30 rounded-full px-6 py-3">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="text-purple-300 font-medium">
            Tudo isso funcionando 24/7, sem você precisar fazer nada
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PanelSimulation;
