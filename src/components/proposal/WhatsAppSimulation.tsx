import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Clock, Phone, Video, MoreVertical, Mic } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  time: string;
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface WhatsAppSimulationProps {
  mode: 'chaos' | 'automated';
  niche?: string;
  onComplete?: () => void;
  onMessageShow?: () => void;
}

// Mensagens por nicho - realistas e naturais
const getNicheMessages = (niche: string): { chaos: Message[]; automated: Message[] } => {
  const nicheMap: Record<string, { chaos: Message[]; automated: Message[] }> = {
    barbearia: {
      chaos: [
        { id: 1, text: "Opa, tudo bem? Qual o valor do corte?", time: "09:15", isMe: false },
        { id: 2, text: "Oi! 35 reais o corte simples", time: "11:42", isMe: true, status: 'read' },
        { id: 3, text: "E pra degradê com barba?", time: "11:43", isMe: false },
        { id: 4, text: "Esse sai 65", time: "14:20", isMe: true, status: 'read' },
        { id: 5, text: "Blz, tem horário sábado de manhã?", time: "14:21", isMe: false },
        { id: 6, text: "Peraí q to atendendo, já vejo", time: "15:45", isMe: true, status: 'read' },
        { id: 7, text: "E aí mano?? Tem ou não", time: "17:30", isMe: false },
        { id: 8, text: "Desculpa cara! Só tem 16h agora", time: "18:15", isMe: true, status: 'read' },
        { id: 9, text: "Relaxa, já marquei em outra", time: "18:16", isMe: false },
      ],
      automated: [
        { id: 1, text: "Opa, tudo bem? Qual o valor do corte?", time: "09:15", isMe: false },
        { id: 2, text: "E aí! 👋 Sou o assistente da barbearia.\n\nCorte simples: R$ 35\nDegradê: R$ 45\nDegradê + Barba: R$ 65\n\nQual você quer?", time: "09:15", isMe: true, status: 'read' },
        { id: 3, text: "Degradê com barba, tem sábado?", time: "09:16", isMe: false },
        { id: 4, text: "Show! 💈 Sábado tem:\n\n🕐 09:00 - Carlos\n🕐 10:30 - Rafael\n🕐 14:00 - Carlos\n\nQual tu prefere?", time: "09:16", isMe: true, status: 'read' },
        { id: 5, text: "10:30 com o Rafa", time: "09:16", isMe: false },
        { id: 6, text: "✅ Fechado!\n\n📅 Sábado 10:30\n💈 Degradê + Barba\n✂️ Com Rafael\n\nTe mando lembrete antes! 🔔", time: "09:16", isMe: true, status: 'read' },
        { id: 7, text: "Perfeito valeu!", time: "09:17", isMe: false },
      ]
    },
    clinica: {
      chaos: [
        { id: 1, text: "Boa tarde, gostaria de agendar uma consulta com o Dr. Silva", time: "14:10", isMe: false },
        { id: 2, text: "Boa tarde! Qual especialidade?", time: "16:30", isMe: true, status: 'read' },
        { id: 3, text: "Cardiologia. Preciso de um retorno", time: "16:31", isMe: false },
        { id: 4, text: "Vou verificar a agenda dele", time: "17:45", isMe: true, status: 'read' },
        { id: 5, text: "Ok, aguardo", time: "17:46", isMe: false },
        { id: 6, text: "Olá? Conseguiu ver?", time: "19:20", isMe: false },
        { id: 7, text: "Desculpe! Amanhã tenho a agenda, pode ligar?", time: "08:15", isMe: true, status: 'read' },
        { id: 8, text: "Obrigada mas já consegui em outra clínica", time: "08:20", isMe: false },
      ],
      automated: [
        { id: 1, text: "Boa tarde, gostaria de agendar com Dr. Silva", time: "14:10", isMe: false },
        { id: 2, text: "Boa tarde! 😊 Sou a assistente virtual.\n\nDr. Silva - Cardiologia\n\nConsulta ou retorno?", time: "14:10", isMe: true, status: 'read' },
        { id: 3, text: "Retorno", time: "14:11", isMe: false },
        { id: 4, text: "Perfeito! Horários disponíveis:\n\n📅 Terça 15/01\n🕐 09:00 | 11:00 | 15:00\n\n📅 Quarta 16/01\n🕐 08:30 | 14:00\n\nQual prefere?", time: "14:11", isMe: true, status: 'read' },
        { id: 5, text: "Terça às 15h", time: "14:11", isMe: false },
        { id: 6, text: "✅ Confirmado!\n\n👨‍⚕️ Dr. Silva - Cardiologia\n📅 Terça 15/01 às 15:00\n📍 Sala 203\n\nLeve exames anteriores.\nEnviarei lembrete 24h antes! 💙", time: "14:11", isMe: true, status: 'read' },
        { id: 7, text: "Muito obrigada, atendimento excelente!", time: "14:12", isMe: false },
      ]
    },
    restaurante: {
      chaos: [
        { id: 1, text: "Oi, vocês fazem entrega?", time: "12:05", isMe: false },
        { id: 2, text: "Fazemos sim!", time: "12:45", isMe: true, status: 'read' },
        { id: 3, text: "Qual o cardápio?", time: "12:46", isMe: false },
        { id: 4, text: "Vou mandar foto", time: "13:10", isMe: true, status: 'read' },
        { id: 5, text: "Tô esperando...", time: "13:40", isMe: false },
        { id: 6, text: "Oi? Cadê o cardápio?", time: "14:15", isMe: false },
        { id: 7, text: "Desculpa o movimento tá grande! Segue", time: "14:30", isMe: true, status: 'read' },
        { id: 8, text: "Já pedi em outro lugar, obrigado", time: "14:31", isMe: false },
      ],
      automated: [
        { id: 1, text: "Oi, vocês fazem entrega?", time: "12:05", isMe: false },
        { id: 2, text: "Oii! 🍽️ Sim, entregamos!\n\nCardápio do dia:\n🥘 Executivo R$ 25\n🍖 Picanha R$ 45\n🐟 Peixe R$ 38\n\nEntrega grátis acima de R$ 40!\n\nO que vai ser?", time: "12:05", isMe: true, status: 'read' },
        { id: 3, text: "Quero a picanha com fritas", time: "12:06", isMe: false },
        { id: 4, text: "Ótima escolha! 🥩\n\nPicanha + Fritas: R$ 45\nEntrega: GRÁTIS\n\nEndereço?", time: "12:06", isMe: true, status: 'read' },
        { id: 5, text: "Rua das Flores 123 apt 45", time: "12:06", isMe: false },
        { id: 6, text: "✅ Pedido confirmado!\n\n🥩 Picanha + Fritas\n📍 Rua das Flores 123/45\n⏱️ 30-40 min\n💰 R$ 45 (PIX ou cartão na entrega)\n\nBom apetite! 😋", time: "12:06", isMe: true, status: 'read' },
        { id: 7, text: "Maravilha! Rápido demais!", time: "12:07", isMe: false },
      ]
    },
    servicos: {
      chaos: [
        { id: 1, text: "Oi, vocês fazem manutenção de ar condicionado?", time: "10:30", isMe: false },
        { id: 2, text: "Fazemos sim, qual o problema?", time: "13:15", isMe: true, status: 'read' },
        { id: 3, text: "Tá pingando água dentro de casa", time: "13:16", isMe: false },
        { id: 4, text: "Entendi, vou ver agenda do técnico", time: "15:20", isMe: true, status: 'read' },
        { id: 5, text: "E aí, tem pra quando?", time: "17:00", isMe: false },
        { id: 6, text: "Olá?", time: "18:30", isMe: false },
        { id: 7, text: "Desculpa! Só semana que vem", time: "09:00", isMe: true, status: 'read' },
        { id: 8, text: "Não dá, chamei outro. Obrigado", time: "09:05", isMe: false },
      ],
      automated: [
        { id: 1, text: "Oi, fazem manutenção de ar condicionado?", time: "10:30", isMe: false },
        { id: 2, text: "Olá! 🔧 Sim, somos especialistas!\n\nQual o problema?\n\n1️⃣ Não gela\n2️⃣ Pingando água\n3️⃣ Barulho estranho\n4️⃣ Limpeza/Revisão", time: "10:30", isMe: true, status: 'read' },
        { id: 3, text: "2", time: "10:31", isMe: false },
        { id: 4, text: "Entendi! Problema no dreno.\n\n🗓️ Agenda disponível:\n\n📅 Hoje às 15:00\n📅 Amanhã às 09:00\n📅 Amanhã às 14:00\n\n💰 Visita + diagnóstico: R$ 80\n\nQual horário?", time: "10:31", isMe: true, status: 'read' },
        { id: 5, text: "Hoje 15h, por favor!", time: "10:31", isMe: false },
        { id: 6, text: "✅ Agendado!\n\n🔧 Manutenção - Dreno\n📅 Hoje às 15:00\n👷 Técnico João\n📞 (11) 99999-0000\n\nEle liga quando estiver a caminho! 👍", time: "10:31", isMe: true, status: 'read' },
        { id: 7, text: "Excelente, muito obrigado!", time: "10:32", isMe: false },
      ]
    }
  };

  // Fallback para barbearia se nicho não encontrado
  return nicheMap[niche] || nicheMap.barbearia;
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2 bg-[#1f2c34] rounded-2xl rounded-bl-md w-fit">
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

export const WhatsAppSimulation = ({ mode, niche = 'barbearia', onComplete, onMessageShow }: WhatsAppSimulationProps) => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lostClient, setLostClient] = useState(false);
  
  const nicheMessages = useMemo(() => getNicheMessages(niche), [niche]);
  const messages = mode === 'chaos' ? nicheMessages.chaos : nicheMessages.automated;
  
  useEffect(() => {
    setVisibleMessages([]);
    setLostClient(false);
    let currentIndex = 0;
    
    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        if (mode === 'chaos') setLostClient(true);
        onComplete?.();
        return;
      }
      
      const message = messages[currentIndex];
      
      // Timing realista baseado no modo
      const delay = mode === 'chaos' 
        ? (message.isMe ? 3500 : 1200) // Demora MUITO no caos
        : (message.isMe ? 400 : 800); // Resposta rápida na automação
      
      if (message.isMe) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, message]);
          onMessageShow?.();
          currentIndex++;
          setTimeout(showNextMessage, 600);
        }, delay);
      } else {
        setVisibleMessages(prev => [...prev, message]);
        onMessageShow?.();
        currentIndex++;
        setTimeout(showNextMessage, delay);
      }
    };
    
    setTimeout(showNextMessage, 1500);
  }, [mode, messages, onComplete, onMessageShow]);

  const getContactName = () => {
    switch (niche) {
      case 'clinica': return 'Clínica';
      case 'restaurante': return 'Restaurante';
      case 'servicos': return 'Empresa';
      default: return 'Barbearia';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[360px] mx-auto"
    >
      {/* Phone Frame */}
      <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-xl z-10" />
        
        {/* Screen */}
        <div className="bg-[#0b141a] rounded-[2rem] overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-3 py-2 pt-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {mode === 'chaos' ? 'C' : 'G'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {mode === 'chaos' ? `Cliente - ${getContactName()}` : 'Genesis Assistente'}
              </p>
              <p className="text-emerald-400 text-xs">
                {isTyping ? 'digitando...' : 'online'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Video className="w-4 h-4" />
              <Phone className="w-4 h-4" />
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>
          
          {/* Chat Area */}
          <div 
            className="h-[360px] overflow-y-auto p-2 space-y-1.5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Timestamp */}
            <div className="text-center mb-3">
              <span className="bg-[#1f2c34] text-gray-400 text-[10px] px-2 py-0.5 rounded">
                {mode === 'chaos' ? 'ONTEM' : 'HOJE'}
              </span>
            </div>
            
            <AnimatePresence>
              {visibleMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 25 }}
                  className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-2.5 py-1.5 rounded-lg ${
                      message.isMe
                        ? 'bg-[#005c4b] rounded-br-sm'
                        : 'bg-[#1f2c34] rounded-bl-sm'
                    }`}
                  >
                    <p className="text-white text-[13px] whitespace-pre-line leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[9px] text-gray-400">{message.time}</span>
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
          <div className="bg-[#1f2c34] px-2 py-1.5 flex items-center gap-2">
            <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center">
              <span className="text-gray-500 text-xs">Mensagem</span>
            </div>
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Status indicators */}
      {mode === 'chaos' && lostClient && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm">Cliente perdido</span>
          </div>
        </motion.div>
      )}
      
      {mode === 'automated' && visibleMessages.length === messages.length && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm">Cliente convertido</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Múltiplas conversas simultâneas (inbox caótico)
export const WhatsAppMultipleChats = ({ niche = 'barbearia' }: { niche?: string }) => {
  const [notifications, setNotifications] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => Math.min(prev + Math.floor(Math.random() * 2) + 1, 99));
    }, 1200);
    
    return () => clearInterval(interval);
  }, []);

  const getChats = () => {
    const baseChats = [
      { name: 'Maria Silva', msg: 'Tem horário hoje?', time: '09:15', unread: 3 },
      { name: 'João Santos', msg: 'Quanto custa?', time: '09:12', unread: 2 },
      { name: 'Ana Costa', msg: 'Oi, boa tarde!', time: '09:10', unread: 4 },
      { name: 'Pedro Lima', msg: 'Vocês abrem sábado?', time: '09:08', unread: 1 },
      { name: 'Lucas Oliveira', msg: 'Preciso remarcar', time: '09:05', unread: 3 },
    ];
    return baseChats;
  };

  const chats = getChats();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-[360px] mx-auto"
    >
      <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-xl z-10" />
        
        <div className="bg-[#0b141a] rounded-[2rem] overflow-hidden">
          {/* Header */}
          <div className="bg-[#1f2c34] px-3 py-2 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-bold">WhatsApp</h2>
              <div className="relative">
                <span className="text-gray-400 text-sm">Conversas</span>
                {notifications > 0 && (
                  <motion.div
                    key={notifications}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  >
                    {notifications}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          {/* Chat List */}
          <div className="h-[360px] overflow-hidden">
            {chats.map((chat, i) => (
              <motion.div
                key={chat.name}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5"
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-sm">
                    {chat.name[0]}
                  </div>
                  {chat.unread > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
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
                  <p className="text-gray-400 text-xs truncate">{chat.msg}</p>
                </div>
              </motion.div>
            ))}
            
            {/* Stress indicator */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-4 py-5 text-center"
            >
              <p className="text-red-400 text-sm font-medium">
                ⚠️ {notifications} mensagens não respondidas
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Tempo médio: 3h 42min
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WhatsAppSimulation;
