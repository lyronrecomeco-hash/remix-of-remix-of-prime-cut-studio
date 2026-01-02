import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Clock, Phone, Video, MoreVertical, Send, Mic, Paperclip, Camera } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  time: string;
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  typing?: boolean;
}

interface WhatsAppSimulationProps {
  mode: 'chaos' | 'automated';
  onComplete?: () => void;
}

const chaosMessages: Message[] = [
  { id: 1, text: "Oi, quero agendar um horário", time: "09:15", isMe: false },
  { id: 2, text: "Boa tarde! Qual serviço?", time: "11:42", isMe: true, status: 'read' },
  { id: 3, text: "Corte e barba", time: "11:43", isMe: false },
  { id: 4, text: "Que dia você pode?", time: "14:20", isMe: true, status: 'read' },
  { id: 5, text: "Sábado de manhã tem?", time: "14:21", isMe: false },
  { id: 6, text: "Deixa eu ver a agenda...", time: "15:45", isMe: true, status: 'read' },
  { id: 7, text: "Oi?? Tem ou não?", time: "17:30", isMe: false },
  { id: 8, text: "Desculpa a demora! Sábado só 16h", time: "18:15", isMe: true, status: 'read' },
  { id: 9, text: "Ah deixa, já agendei em outro lugar", time: "18:16", isMe: false },
];

const automatedMessages: Message[] = [
  { id: 1, text: "Oi, quero agendar um horário", time: "09:15", isMe: false },
  { id: 2, text: "Olá! 👋 Sou a assistente virtual. Vou te ajudar a agendar agora mesmo! Qual serviço você deseja?", time: "09:15", isMe: true, status: 'read' },
  { id: 3, text: "Corte e barba", time: "09:16", isMe: false },
  { id: 4, text: "Perfeito! 💈 Horários disponíveis para amanhã:\n\n🕐 09:00\n🕐 10:30\n🕐 14:00\n🕐 15:30\n\nQual prefere?", time: "09:16", isMe: true, status: 'read' },
  { id: 5, text: "10:30", time: "09:16", isMe: false },
  { id: 6, text: "✅ Agendado!\n\n📅 Amanhã às 10:30\n💈 Corte + Barba\n📍 Barbearia Premium\n\nTe envio um lembrete 1h antes! 🔔", time: "09:16", isMe: true, status: 'read' },
  { id: 7, text: "Muito rápido! Obrigado! 🙌", time: "09:17", isMe: false },
];

const NotificationBadge = ({ count }: { count: number }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
  >
    {count > 99 ? '99+' : count}
  </motion.div>
);

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2 bg-white/10 rounded-2xl rounded-bl-md w-fit">
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
  </div>
);

const MessageStatus = ({ status }: { status?: string }) => {
  if (status === 'sending') return <Clock className="w-3 h-3 text-gray-400" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400" />;
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />;
  return null;
};

export const WhatsAppSimulation = ({ mode, onComplete }: WhatsAppSimulationProps) => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messages = mode === 'chaos' ? chaosMessages : automatedMessages;
  
  useEffect(() => {
    setVisibleMessages([]);
    setUnreadCount(0);
    let currentIndex = 0;
    
    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        onComplete?.();
        return;
      }
      
      const message = messages[currentIndex];
      const delay = mode === 'chaos' 
        ? (message.isMe ? 2500 : 800) // Demora pra responder no caos
        : (message.isMe ? 300 : 600); // Resposta instantânea na automação
      
      if (message.isMe) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, message]);
          currentIndex++;
          setTimeout(showNextMessage, 500);
        }, delay);
      } else {
        setVisibleMessages(prev => [...prev, message]);
        if (mode === 'chaos') {
          setUnreadCount(prev => prev + 1);
        }
        currentIndex++;
        setTimeout(showNextMessage, delay);
      }
    };
    
    setTimeout(showNextMessage, 1000);
  }, [mode, messages, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[380px] mx-auto"
    >
      {/* Phone Frame */}
      <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="bg-[#0b141a] rounded-[2.5rem] overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-4 py-3 pt-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
              {mode === 'chaos' ? 'C' : 'G'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {mode === 'chaos' ? 'Cliente WhatsApp' : 'Genesis Assistente'}
              </p>
              <p className="text-emerald-400 text-xs">
                {isTyping ? 'digitando...' : 'online'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <Video className="w-5 h-5" />
              <Phone className="w-5 h-5" />
              <MoreVertical className="w-5 h-5" />
            </div>
          </div>
          
          {/* Chat Area */}
          <div 
            className="h-[400px] overflow-y-auto p-3 space-y-2"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Time stamp */}
            <div className="text-center mb-4">
              <span className="bg-[#1f2c34] text-gray-400 text-[11px] px-3 py-1 rounded-lg">
                {mode === 'chaos' ? 'ONTEM' : 'HOJE'}
              </span>
            </div>
            
            <AnimatePresence>
              {visibleMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      message.isMe
                        ? 'bg-[#005c4b] rounded-br-sm'
                        : 'bg-[#1f2c34] rounded-bl-sm'
                    }`}
                  >
                    <p className="text-white text-sm whitespace-pre-line">{message.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">{message.time}</span>
                      {message.isMe && <MessageStatus status={message.status} />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <TypingIndicator />
              </motion.div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
            <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-gray-400 text-sm">Mensagem</span>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Chaos indicators */}
      {mode === 'chaos' && unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">
              Cliente perdido por demora
            </span>
          </div>
        </motion.div>
      )}
      
      {mode === 'automated' && visibleMessages.length === automatedMessages.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              Agendado em 2 minutos
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Múltiplas conversas simultâneas (para mostrar escala)
export const WhatsAppMultipleChats = () => {
  const [notifications, setNotifications] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => Math.min(prev + Math.floor(Math.random() * 3) + 1, 99));
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  const chats = [
    { name: 'Maria Silva', msg: 'Oi, quero agendar...', time: '09:15', unread: 3 },
    { name: 'João Santos', msg: 'Tem horário hoje?', time: '09:12', unread: 2 },
    { name: 'Ana Costa', msg: 'Quanto custa corte?', time: '09:10', unread: 5 },
    { name: 'Pedro Lima', msg: 'Vocês trabalham sábado?', time: '09:08', unread: 1 },
    { name: 'Lucas Oliveira', msg: 'Preciso remarcar...', time: '09:05', unread: 4 },
    { name: 'Carla Souza', msg: 'Boa tarde!', time: '09:02', unread: 2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[380px] mx-auto"
    >
      <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
        
        <div className="bg-[#0b141a] rounded-[2.5rem] overflow-hidden">
          {/* Header */}
          <div className="bg-[#1f2c34] px-4 py-3 pt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">WhatsApp</h2>
              <div className="relative">
                <span className="text-gray-400 text-sm">Conversas</span>
                {notifications > 0 && (
                  <motion.div
                    key={notifications}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    {notifications}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          {/* Chat List */}
          <div className="h-[400px] overflow-hidden">
            {chats.map((chat, i) => (
              <motion.div
                key={chat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold">
                    {chat.name[0]}
                  </div>
                  {chat.unread > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    >
                      {chat.unread}
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium text-sm truncate">{chat.name}</p>
                    <span className="text-emerald-400 text-xs">{chat.time}</span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{chat.msg}</p>
                </div>
              </motion.div>
            ))}
            
            {/* Stress indicator */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-4 py-6 text-center"
            >
              <p className="text-red-400 text-sm">
                ⚠️ {notifications} mensagens não respondidas
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Tempo médio de resposta: 3h 42min
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WhatsAppSimulation;
