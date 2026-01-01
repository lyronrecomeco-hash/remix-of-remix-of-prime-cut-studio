import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  User,
  Clock,
  Check,
  CheckCheck,
  Image,
  File,
  Mic,
  Video,
  MapPin,
  Star,
  StarOff,
  Archive,
  ArchiveX,
  RefreshCw,
  Filter,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Conversation {
  id: string;
  instance_id: string;
  phone: string;
  contact_name: string | null;
  profile_picture_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_archived: boolean;
  is_pinned: boolean;
  is_muted: boolean;
  tags: string[];
}

interface Message {
  id: string;
  phone_from: string;
  phone_to: string | null;
  contact_name: string | null;
  message_type: string;
  message_content: string | null;
  media_url: string | null;
  is_from_me: boolean;
  is_read: boolean;
  received_at: string;
}

interface WAInboxProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

export const WAInbox = ({ instances }: WAInboxProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const fetchConversations = useCallback(async () => {
    try {
      let query = supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (filter === 'unread') {
        query = query.gt('unread_count', 0);
      } else if (filter === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setConversations((data || []) as Conversation[]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchMessages = useCallback(async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_inbox')
        .select('*')
        .or(`phone_from.eq.${phone},phone_to.eq.${phone}`)
        .order('received_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data || []) as Message[]);

      // Mark as read
      await supabase
        .from('whatsapp_inbox')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('phone_from', phone)
        .eq('is_read', false);

      // Update unread count
      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('phone', phone);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.phone);
    }
  }, [selectedConversation, fetchMessages]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      // This would call the WhatsApp API to send the message
      // For now, we'll just add it to the inbox
      const { error } = await supabase.from('whatsapp_inbox').insert({
        instance_id: selectedConversation.instance_id,
        phone_from: 'me',
        phone_to: selectedConversation.phone,
        message_type: 'text',
        message_content: newMessage,
        is_from_me: true,
        is_read: true,
      });

      if (error) throw error;

      // Update conversation
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      fetchMessages(selectedConversation.phone);
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const toggleArchive = async (conv: Conversation) => {
    try {
      await supabase
        .from('whatsapp_conversations')
        .update({ is_archived: !conv.is_archived })
        .eq('id', conv.id);

      toast.success(conv.is_archived ? 'Conversa desarquivada' : 'Conversa arquivada');
      fetchConversations();
    } catch (error) {
      toast.error('Erro ao arquivar');
    }
  };

  const togglePin = async (conv: Conversation) => {
    try {
      await supabase
        .from('whatsapp_conversations')
        .update({ is_pinned: !conv.is_pinned })
        .eq('id', conv.id);

      toast.success(conv.is_pinned ? 'Conversa desafixada' : 'Conversa fixada');
      fetchConversations();
    } catch (error) {
      toast.error('Erro ao fixar');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.phone.includes(searchQuery) ||
      (conv.contact_name?.toLowerCase().includes(searchLower))
    );
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
  });

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] gap-4">
      {/* Conversations List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inbox</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchConversations}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Não lidas
            </Button>
            <Button
              variant={filter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('archived')}
            >
              Arquivadas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando...</div>
            ) : sortedConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation?.id === conv.id ? 'bg-muted' : ''
                    } ${conv.is_pinned ? 'border-l-2 border-l-primary' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.profile_picture_url || undefined} />
                        <AvatarFallback>
                          {conv.contact_name?.[0] || conv.phone.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {conv.contact_name || conv.phone}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {conv.last_message_at && new Date(conv.last_message_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message || 'Sem mensagens'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.profile_picture_url || undefined} />
                    <AvatarFallback>
                      {selectedConversation.contact_name?.[0] || selectedConversation.phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation.contact_name || selectedConversation.phone}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedConversation.phone}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePin(selectedConversation)}>
                      {selectedConversation.is_pinned ? (
                        <>
                          <StarOff className="w-4 h-4 mr-2" />
                          Desafixar
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Fixar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(selectedConversation)}>
                      {selectedConversation.is_archived ? (
                        <>
                          <ArchiveX className="w-4 h-4 mr-2" />
                          Desarquivar
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_from_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.is_from_me
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.message_type !== 'text' && (
                          <div className="flex items-center gap-2 mb-1 opacity-70">
                            {getMessageIcon(msg.message_type)}
                            <span className="text-xs capitalize">{msg.message_type}</span>
                          </div>
                        )}
                        {msg.media_url && (
                          <div className="mb-2">
                            {msg.message_type === 'image' ? (
                              <img src={msg.media_url} alt="Media" className="rounded max-w-full" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                                Ver arquivo
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message_content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.is_from_me ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <span className="text-xs">
                            {new Date(msg.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.is_from_me && (
                            msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[44px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha uma conversa para ver as mensagens</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
