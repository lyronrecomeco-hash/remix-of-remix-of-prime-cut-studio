import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MessageSquare,
  Image,
  FileText,
  Mic,
  Video,
  MapPin,
  Contact,
  List,
  Send,
  Clock,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WAAdvancedSendProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'buttons' | 'list';

interface ButtonItem {
  id: string;
  text: string;
}

interface ListSection {
  title: string;
  rows: Array<{ id: string; title: string; description: string }>;
}

export const WAAdvancedSend = ({ instances }: WAAdvancedSendProps) => {
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [buttons, setButtons] = useState<ButtonItem[]>([{ id: '1', text: '' }]);
  const [listTitle, setListTitle] = useState('');
  const [listButtonText, setListButtonText] = useState('Ver opções');
  const [listSections, setListSections] = useState<ListSection[]>([
    { title: 'Opções', rows: [{ id: '1', title: '', description: '' }] }
  ]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [isSending, setIsSending] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('');

  const connectedInstances = instances.filter(i => i.status === 'connected');

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { id: String(buttons.length + 1), text: '' }]);
    }
  };

  const removeButton = (index: number) => {
    if (buttons.length > 1) {
      setButtons(buttons.filter((_, i) => i !== index));
    }
  };

  const updateButton = (index: number, text: string) => {
    const newButtons = [...buttons];
    newButtons[index].text = text;
    setButtons(newButtons);
  };

  const addListRow = (sectionIndex: number) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows.push({
      id: String(newSections[sectionIndex].rows.length + 1),
      title: '',
      description: ''
    });
    setListSections(newSections);
  };

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error('Digite o número de telefone');
      return;
    }

    if (!selectedInstance && connectedInstances.length > 0) {
      setSelectedInstance(connectedInstances[0].id);
    }

    setIsSending(true);
    try {
      let formattedPhone = phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const messageData: any = {
        instance_id: selectedInstance || connectedInstances[0]?.id,
        phone_to: formattedPhone,
        message_type: messageType,
        message_content: message,
        media_url: mediaUrl || null,
        media_caption: caption || null,
        buttons: messageType === 'buttons' ? buttons.filter(b => b.text.trim()) : null,
        list_options: messageType === 'list' ? { title: listTitle, buttonText: listButtonText, sections: listSections } : null,
        status: isScheduled ? 'pending' : 'queued',
      };

      if (isScheduled && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        await supabase.from('whatsapp_scheduled_messages').insert({
          ...messageData,
          scheduled_at: scheduledDateTime.toISOString(),
        });

        toast.success(`Mensagem agendada para ${format(scheduledDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
      } else {
        await supabase.from('whatsapp_send_queue').insert(messageData);
        toast.success('Mensagem adicionada à fila de envio!');
      }

      // Reset form
      setPhone('');
      setMessage('');
      setMediaUrl('');
      setCaption('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const messageTypes = [
    { type: 'text' as MessageType, icon: MessageSquare, label: 'Texto' },
    { type: 'image' as MessageType, icon: Image, label: 'Imagem' },
    { type: 'document' as MessageType, icon: FileText, label: 'Documento' },
    { type: 'audio' as MessageType, icon: Mic, label: 'Áudio' },
    { type: 'video' as MessageType, icon: Video, label: 'Vídeo' },
    { type: 'location' as MessageType, icon: MapPin, label: 'Localização' },
    { type: 'contact' as MessageType, icon: Contact, label: 'Contato' },
    { type: 'buttons' as MessageType, icon: List, label: 'Botões' },
    { type: 'list' as MessageType, icon: List, label: 'Lista' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Envio Avançado de Mensagens</CardTitle>
          <CardDescription>
            Envie diferentes tipos de mídia, botões interativos e listas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Mensagem</Label>
            <div className="flex flex-wrap gap-2">
              {messageTypes.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={messageType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType(type)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Instance Selection */}
          {connectedInstances.length > 1 && (
            <div className="space-y-2">
              <Label>Instância</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
              >
                {connectedInstances.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Phone Input */}
          <div className="space-y-2">
            <Label>Número de Telefone</Label>
            <Input
              placeholder="Ex: 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Dynamic Content Based on Type */}
          {messageType === 'text' && (
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {['image', 'document', 'audio', 'video'].includes(messageType) && (
            <>
              <div className="space-y-2">
                <Label>URL da Mídia</Label>
                <Input
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
              {['image', 'video', 'document'].includes(messageType) && (
                <div className="space-y-2">
                  <Label>Legenda (opcional)</Label>
                  <Textarea
                    placeholder="Descrição da mídia..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </>
          )}

          {messageType === 'location' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  placeholder="-23.5505"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  placeholder="-46.6333"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          )}

          {messageType === 'contact' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Contato</Label>
                <Input
                  placeholder="João Silva"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone do Contato</Label>
                <Input
                  placeholder="11999999999"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {messageType === 'buttons' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Texto da mensagem com botões..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Botões (máx. 3)</Label>
                {buttons.map((btn, index) => (
                  <div key={btn.id} className="flex gap-2">
                    <Input
                      placeholder={`Botão ${index + 1}`}
                      value={btn.text}
                      onChange={(e) => updateButton(index, e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => removeButton(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {buttons.length < 3 && (
                  <Button variant="outline" onClick={addButton} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Botão
                  </Button>
                )}
              </div>
            </div>
          )}

          {messageType === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título da Lista</Label>
                <Input
                  placeholder="Escolha uma opção"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input
                  placeholder="Ver opções"
                  value={listButtonText}
                  onChange={(e) => setListButtonText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Texto da mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Opções da Lista</Label>
                {listSections[0].rows.map((row, index) => (
                  <div key={row.id} className="grid gap-2 md:grid-cols-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Título da opção"
                      value={row.title}
                      onChange={(e) => {
                        const newSections = [...listSections];
                        newSections[0].rows[index].title = e.target.value;
                        setListSections(newSections);
                      }}
                    />
                    <Input
                      placeholder="Descrição (opcional)"
                      value={row.description}
                      onChange={(e) => {
                        const newSections = [...listSections];
                        newSections[0].rows[index].description = e.target.value;
                        setListSections(newSections);
                      }}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={() => addListRow(0)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          )}

          {/* Schedule Option */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Agendar Envio</p>
                <p className="text-xs text-muted-foreground">Enviar em data/hora específica</p>
              </div>
            </div>
            <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {isScheduled && (
            <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, 'dd/MM/yyyy') : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !phone.trim() || connectedInstances.length === 0}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isScheduled ? 'Agendar Mensagem' : 'Enviar Mensagem'}
              </>
            )}
          </Button>

          {connectedInstances.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">
              Conecte uma instância para enviar mensagens
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
