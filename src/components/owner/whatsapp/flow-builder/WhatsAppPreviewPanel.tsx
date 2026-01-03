// =====================================================
// WHATSAPP PREVIEW PANEL - Preview em tempo real do fluxo
// =====================================================

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  X, 
  MessageSquare, 
  Send,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlowNode } from './types';

interface Message {
  id: string;
  type: 'sent' | 'received';
  content: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  isButtons?: boolean;
  buttons?: string[];
  isList?: boolean;
  listItems?: { title: string; description?: string }[];
  isMedia?: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

interface WhatsAppPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  selectedNode?: FlowNode | null;
  onSimulateResponse?: (response: string) => void;
}

export const WhatsAppPreviewPanel = memo(({ 
  isOpen, 
  onClose, 
  nodes,
  selectedNode,
  onSimulateResponse
}: WhatsAppPreviewPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Generate preview messages from nodes
  useEffect(() => {
    if (!nodes.length) {
      setMessages([]);
      return;
    }

    const generatedMessages: Message[] = [];
    const now = new Date();

    // Find the start node
    const startNode = nodes.find(n => 
      n.data.type === 'trigger' || 
      n.data.type === 'wa_start'
    );

    // Process nodes in order (simplified for preview)
    nodes.forEach((node, index) => {
      const time = new Date(now.getTime() + index * 60000)
        .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (node.data.type === 'wa_send_text' || node.data.type === 'message') {
        generatedMessages.push({
          id: node.id,
          type: 'received',
          content: node.data.config?.message || node.data.label || 'Mensagem...',
          time,
          status: 'read'
        });
      }

      if (node.data.type === 'wa_send_buttons') {
        generatedMessages.push({
          id: node.id,
          type: 'received',
          content: node.data.config?.message || 'Escolha uma opção:',
          time,
          status: 'read',
          isButtons: true,
          buttons: node.data.config?.buttons?.map((b: any) => b.text) || ['Opção 1', 'Opção 2']
        });
      }

      if (node.data.type === 'wa_send_list') {
        generatedMessages.push({
          id: node.id,
          type: 'received',
          content: node.data.config?.message || 'Selecione da lista:',
          time,
          status: 'read',
          isList: true,
          listItems: node.data.config?.sections?.[0]?.items || [
            { title: 'Item 1', description: 'Descrição' }
          ]
        });
      }

      if (node.data.type === 'wa_wait_response' || node.data.type === 'wa_receive') {
        generatedMessages.push({
          id: `user-${node.id}`,
          type: 'sent',
          content: 'Resposta do cliente...',
          time,
          status: 'read'
        });
      }
    });

    // Highlight selected node message
    if (selectedNode) {
      const selectedMessage = generatedMessages.find(m => m.id === selectedNode.id);
      if (selectedMessage) {
        // Could add highlight styling here
      }
    }

    setMessages(generatedMessages);
  }, [nodes, selectedNode]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'sent',
      content: inputValue,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    onSimulateResponse?.(inputValue);

    // Simulate typing and response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          type: 'received',
          content: 'Resposta automática do bot...',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }]);
      }, 1500);
    }, 500);
  };

  const handleButtonClick = (buttonText: string) => {
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'sent',
      content: buttonText,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };
    setMessages(prev => [...prev, newMessage]);
    onSimulateResponse?.(buttonText);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
      >
        {/* iPhone Frame */}
        <div className="relative">
          {/* Close Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 rounded-full bg-background shadow-lg h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Phone Frame */}
          <div className="w-[320px] h-[640px] bg-black rounded-[40px] p-2 shadow-2xl">
            <div className="w-full h-full bg-[#0b141a] rounded-[32px] overflow-hidden flex flex-col">
              
              {/* WhatsApp Header */}
              <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-3">
                <ArrowLeft className="w-5 h-5 text-[#00a884]" />
                <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#00a884]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Genesis Bot</p>
                  <p className="text-[#8696a0] text-xs">
                    {isTyping ? 'digitando...' : 'online'}
                  </p>
                </div>
                <Video className="w-5 h-5 text-[#aebac1]" />
                <Phone className="w-5 h-5 text-[#aebac1] ml-4" />
                <MoreVertical className="w-5 h-5 text-[#aebac1] ml-4" />
              </div>

              {/* Chat Area */}
              <div 
                className="flex-1 overflow-y-auto p-3 space-y-2"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23182229" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  backgroundColor: '#0b141a'
                }}
              >
                {/* Date Chip */}
                <div className="flex justify-center">
                  <span className="bg-[#1f2c34] text-[#8696a0] text-[10px] px-3 py-1 rounded-lg">
                    Hoje
                  </span>
                </div>

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      msg.type === 'sent' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div 
                      className={cn(
                        "max-w-[80%] rounded-lg p-2 relative",
                        msg.type === 'sent' 
                          ? 'bg-[#005c4b] rounded-tr-none' 
                          : 'bg-[#1f2c34] rounded-tl-none',
                        selectedNode?.id === msg.id && 'ring-2 ring-[#00a884]'
                      )}
                    >
                      <p className="text-[#e9edef] text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {/* Buttons */}
                      {msg.isButtons && msg.buttons && (
                        <div className="mt-2 space-y-1">
                          {msg.buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleButtonClick(btn)}
                              className="w-full py-2 text-sm text-[#00a884] border border-[#00a884]/30 rounded-lg hover:bg-[#00a884]/10 transition-colors"
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* List */}
                      {msg.isList && msg.listItems && (
                        <div className="mt-2 border-t border-[#2a3942] pt-2">
                          {msg.listItems.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleButtonClick(item.title)}
                              className="w-full py-2 px-2 text-left hover:bg-[#2a3942] rounded transition-colors"
                            >
                              <p className="text-[#e9edef] text-sm">{item.title}</p>
                              {item.description && (
                                <p className="text-[#8696a0] text-xs">{item.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Time and Status */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[#8696a0] text-[10px]">{msg.time}</span>
                        {msg.type === 'sent' && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#1f2c34] rounded-lg rounded-tl-none p-3">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                            className="w-2 h-2 bg-[#8696a0] rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="w-2 h-2 bg-[#8696a0] rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="w-2 h-2 bg-[#8696a0] rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty State */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-[#8696a0]/50 mb-3" />
                    <p className="text-[#8696a0] text-sm">
                      Adicione nós ao fluxo para ver o preview
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-[#1f2c34] px-2 py-2 flex items-center gap-2">
                <button className="p-2 text-[#8696a0] hover:text-white transition-colors">
                  <Smile className="w-6 h-6" />
                </button>
                <button className="p-2 text-[#8696a0] hover:text-white transition-colors">
                  <Paperclip className="w-6 h-6" />
                </button>
                <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Mensagem"
                    className="w-full bg-transparent text-[#e9edef] text-sm placeholder-[#8696a0] outline-none"
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  className="p-2 text-[#8696a0] hover:text-white transition-colors"
                >
                  {inputValue ? (
                    <Send className="w-6 h-6 text-[#00a884]" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

WhatsAppPreviewPanel.displayName = 'WhatsAppPreviewPanel';
