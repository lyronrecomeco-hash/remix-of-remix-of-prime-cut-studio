import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Smartphone,
  MessageSquare,
  History,
  LayoutGrid,
  List,
  Zap,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppPreview } from './preview/WhatsAppPreview';
import { cn } from '@/lib/utils';

interface WARealTestProps {
  instances: Array<{ id: string; name: string; status: string }>;
  backendMode: 'vps' | 'local';
  backendUrl: string;
  localEndpoint: string;
  localPort: string;
  localToken: string;
  masterToken: string;
  isBackendActive: boolean;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  message_content: string;
  buttons: any[];
  list_sections: any[];
  footer_text: string | null;
  variables: string[];
}

interface CustomButton {
  id: string;
  text: string;
}

interface MessageLog {
  id: string;
  phone_to: string;
  message: string;
  status: string;
  created_at: string;
  error_message: string | null;
  message_type?: string;
}

export const WARealTest = ({
  instances,
  backendMode,
  backendUrl,
  localEndpoint,
  localPort,
  localToken,
  masterToken,
  isBackendActive,
}: WARealTestProps) => {
  const [testPhone, setTestPhone] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'buttons' | 'list' | 'template'>('buttons');
  const [isSending, setIsSending] = useState(false);
  const [recentLogs, setRecentLogs] = useState<MessageLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [localCapabilities, setLocalCapabilities] = useState<{ buttons: boolean | null; list: boolean | null }>({
    buttons: null,
    list: null,
  });

  const connectedInstance = instances.find((i) => i.status === 'connected');

  // Text message
  const [textMessage, setTextMessage] = useState('');
  
  // Button message
  const [buttonTitle, setButtonTitle] = useState('');
  const [buttonBody, setButtonBody] = useState('Escolha uma opção abaixo:');
  const [buttonFooter, setButtonFooter] = useState('Genesis WhatsApp');
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([
    { id: 'btn_confirm', text: '✅ Confirmar' },
    { id: 'btn_cancel', text: '❌ Cancelar' }
  ]);
  
  // List message
  const [listTitle, setListTitle] = useState('');
  const [listBody, setListBody] = useState('Selecione uma opção:');
  const [listButtonText, setListButtonText] = useState('Ver opções');
  const [listFooter, setListFooter] = useState('');
  const [listSections, setListSections] = useState([
    {
      title: 'Opções Principais',
      rows: [
        { id: 'opt_1', title: 'Opção 1', description: 'Descrição da opção 1' },
        { id: 'opt_2', title: 'Opção 2', description: 'Descrição da opção 2' }
      ]
    }
  ]);
  
  // Template mode
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
    fetchRecentLogs();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
      
      if (template?.variables) {
        const vars: Record<string, string> = {};
        template.variables.forEach((v: string) => {
          vars[v] = '';
        });
        setVariableValues(vars);
      }
    } else {
      setSelectedTemplate(null);
      setVariableValues({});
    }
  }, [selectedTemplateId, templates]);

  // Detect whether the running local backend supports interactive endpoints.
  useEffect(() => {
    if (backendMode !== 'local' || !isBackendActive || !connectedInstance) {
      setLocalCapabilities({ buttons: null, list: null });
      return;
    }

    const base = `${localEndpoint}:${localPort}`;

    const checkEndpoint = async (path: string) => {
      try {
        const resp = await fetch(`${base}/api/instance/${connectedInstance.id}/${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localToken}`,
          },
          body: JSON.stringify({}),
        });

        // If the route doesn't exist, Express returns HTML 404.
        if (resp.status === 404) return false;
        return true; // any other status means route exists (might still error for bad payload)
      } catch {
        return null;
      }
    };

    (async () => {
      const [buttonsSupport, listSupport] = await Promise.all([
        checkEndpoint('send-buttons'),
        checkEndpoint('send-list'),
      ]);

      setLocalCapabilities({
        buttons: buttonsSupport,
        list: listSupport,
      });
    })();
  }, [backendMode, isBackendActive, connectedInstance?.id, localEndpoint, localPort, localToken]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('whatsapp_interactive_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    setTemplates((data || []).map(t => ({
      id: t.id,
      name: t.name,
      template_type: t.template_type,
      message_content: t.message_content,
      buttons: (t.buttons as unknown as any[]) || [],
      list_sections: (t.list_sections as unknown as any[]) || [],
      footer_text: t.footer_text,
      variables: (t.variables as unknown as string[]) || []
    })));
  };

  const fetchRecentLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const addButton = () => {
    if (customButtons.length >= 3) {
      toast.error('Máximo de 3 botões permitido');
      return;
    }
    setCustomButtons([
      ...customButtons,
      { id: `btn_${Date.now()}`, text: 'Novo Botão' }
    ]);
  };

  const removeButton = (index: number) => {
    setCustomButtons(customButtons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: 'id' | 'text', value: string) => {
    const updated = [...customButtons];
    updated[index][field] = value;
    setCustomButtons(updated);
  };

  const sendRealMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite o número de telefone');
      return;
    }

    if (!isBackendActive) {
      toast.error('Backend não conectado. Configure na aba "Backend".');
      return;
    }

    const connectedInstance = instances.find(i => i.status === 'connected');
    if (!connectedInstance) {
      toast.error('Nenhuma instância conectada.');
      return;
    }

    setIsSending(true);

    try {
      let formattedPhone = testPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const endpoint = backendMode === 'local'
        ? `${localEndpoint}:${localPort}/api/instance`
        : backendUrl;
      
      const token = backendMode === 'local' ? localToken : masterToken;

      let payload: any = { phone: formattedPhone };
      let sendEndpoint = `${endpoint}/${connectedInstance.id}/send`;
      let logMessage = '';
      let logType = 'text';

      switch (messageType) {
        case 'text':
          payload.message = textMessage;
          logMessage = textMessage;
          break;

        case 'buttons':
          sendEndpoint = `${endpoint}/${connectedInstance.id}/send-buttons`;
          payload = {
            phone: formattedPhone,
            title: buttonTitle || undefined,
            message: buttonBody,
            footer: buttonFooter || undefined,
            buttons: customButtons.map(b => ({
              id: b.id,
              text: b.text
            }))
          };
          logMessage = `[BUTTONS] ${buttonBody} | Botões: ${customButtons.map(b => b.text).join(', ')}`;
          logType = 'buttons';
          break;

        case 'list':
          sendEndpoint = `${endpoint}/${connectedInstance.id}/send-list`;
          payload = {
            phone: formattedPhone,
            title: listTitle || undefined,
            body: listBody,
            footer: listFooter || undefined,
            buttonText: listButtonText,
            sections: listSections
          };
          logMessage = `[LIST] ${listBody} | Seções: ${listSections.length}`;
          logType = 'list';
          break;

        case 'template':
          if (!selectedTemplate) {
            toast.error('Selecione um template');
            setIsSending(false);
            return;
          }
          
          // Replace variables in message
          let processedMessage = selectedTemplate.message_content;
          Object.entries(variableValues).forEach(([key, value]) => {
            processedMessage = processedMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
          });

          if (selectedTemplate.template_type === 'buttons') {
            sendEndpoint = `${endpoint}/${connectedInstance.id}/send-buttons`;
            payload = {
              phone: formattedPhone,
              message: processedMessage,
              footer: selectedTemplate.footer_text || undefined,
              buttons: selectedTemplate.buttons.map((b: any) => ({
                id: b.id,
                text: b.text
              }))
            };
          } else if (selectedTemplate.template_type === 'list') {
            sendEndpoint = `${endpoint}/${connectedInstance.id}/send-list`;
            payload = {
              phone: formattedPhone,
              body: processedMessage,
              footer: selectedTemplate.footer_text || undefined,
              buttonText: 'Ver opções',
              sections: selectedTemplate.list_sections
            };
          } else {
            payload.message = processedMessage;
          }
          
          logMessage = `[TEMPLATE: ${selectedTemplate.name}] ${processedMessage}`;
          logType = selectedTemplate.template_type;
          break;
      }

      console.log('Sending to:', sendEndpoint, 'Payload:', payload);

      const response = await fetch(sendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let result: any = {};
      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = { raw };
      }

      // Local backend outdated => interactive endpoint doesn't exist
      if (backendMode === 'local' && response.status === 404 && (messageType === 'buttons' || messageType === 'list' || (messageType === 'template' && ['buttons', 'list'].includes(selectedTemplate?.template_type || '')))) {
        throw new Error(
          'Seu backend local está desatualizado e não possui suporte a botões/listas. Vá em “Backend” → “Baixar Script” e reinicie o whatsapp-local.js.'
        );
      }

      if (response.ok && result.success !== false) {
        toast.success('Mensagem enviada com sucesso!');

        await supabase.from('whatsapp_message_logs').insert({
          instance_id: connectedInstance.id,
          direction: 'outgoing',
          phone_to: formattedPhone,
          message: logMessage,
          status: 'sent',
          message_type: logType
        });

        fetchRecentLogs();
      } else {
        throw new Error(result?.error || result?.message || (typeof raw === 'string' && raw) || 'Erro ao enviar mensagem');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Send error:', error);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Enviada</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" />Falha</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'buttons':
        return <Badge variant="outline" className="text-[10px]"><LayoutGrid className="w-2.5 h-2.5 mr-1" />Botões</Badge>;
      case 'list':
        return <Badge variant="outline" className="text-[10px]"><List className="w-2.5 h-2.5 mr-1" />Lista</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]"><MessageSquare className="w-2.5 h-2.5 mr-1" />Texto</Badge>;
    }
  };

  const requiresButtons = messageType === 'buttons' || (messageType === 'template' && selectedTemplate?.template_type === 'buttons');
  const requiresList = messageType === 'list' || (messageType === 'template' && selectedTemplate?.template_type === 'list');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
          <Zap className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Modo Teste Real
            <Badge className="bg-green-500 text-white">LIVE</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Envie mensagens reais com botões interativos para testar seus fluxos
          </p>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {!isBackendActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Backend não conectado</p>
              <p className="text-sm opacity-80">Configure o backend na aba "Backend" para enviar mensagens.</p>
            </div>
          </motion.div>
        )}

        {isBackendActive && instances.filter(i => i.status === 'connected').length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center gap-3"
          >
            <Smartphone className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Nenhuma instância conectada</p>
              <p className="text-sm opacity-80">Conecte uma instância na aba "Instâncias".</p>
            </div>
          </motion.div>
        )}

        {backendMode === 'local' && isBackendActive && ((requiresButtons && localCapabilities.buttons === false) || (requiresList && localCapabilities.list === false)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Botões/Listas não suportados no seu backend local</p>
              <p className="text-sm opacity-80">
                O serviço em execução não tem os endpoints de interativos (404). Baixe o script atualizado em “Backend” → “Baixar Script” e reinicie o whatsapp-local.js.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Configurar Mensagem
              </CardTitle>
              <CardDescription>
                Configure e envie mensagens reais com botões ou listas interativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 bg-muted rounded-l-md border border-r-0">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">+55</span>
                  </div>
                  <Input
                    placeholder="27 99772-3328"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* Message Type Tabs */}
              <Tabs value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="text" className="gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Texto</span>
                  </TabsTrigger>
                  <TabsTrigger value="buttons" className="gap-1.5">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Botões</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-1.5">
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </TabsTrigger>
                  <TabsTrigger value="template" className="gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Template</span>
                  </TabsTrigger>
                </TabsList>

                {/* Text Message */}
                <TabsContent value="text" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Button Message */}
                <TabsContent value="buttons" className="space-y-4 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Título (opcional)</Label>
                      <Input
                        value={buttonTitle}
                        onChange={(e) => setButtonTitle(e.target.value)}
                        placeholder="Título da mensagem"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rodapé (opcional)</Label>
                      <Input
                        value={buttonFooter}
                        onChange={(e) => setButtonFooter(e.target.value)}
                        placeholder="Texto do rodapé"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mensagem Principal</Label>
                    <Textarea
                      value={buttonBody}
                      onChange={(e) => setButtonBody(e.target.value)}
                      placeholder="Escolha uma opção:"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Botões (máx. 3)</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addButton}
                        disabled={customButtons.length >= 3}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {customButtons.map((btn, index) => (
                        <motion.div
                          key={btn.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-2 items-center"
                        >
                          <Input
                            value={btn.id}
                            onChange={(e) => updateButton(index, 'id', e.target.value)}
                            placeholder="ID do botão"
                            className="flex-1 font-mono text-sm"
                          />
                          <Input
                            value={btn.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            placeholder="Texto do botão"
                            className="flex-[2]"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeButton(index)}
                            disabled={customButtons.length <= 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* List Message */}
                <TabsContent value="list" className="space-y-4 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Título (opcional)</Label>
                      <Input
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        placeholder="Título da mensagem"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input
                        value={listButtonText}
                        onChange={(e) => setListButtonText(e.target.value)}
                        placeholder="Ver opções"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mensagem Principal</Label>
                    <Textarea
                      value={listBody}
                      onChange={(e) => setListBody(e.target.value)}
                      placeholder="Selecione uma opção:"
                      rows={2}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <Label className="text-sm text-muted-foreground">
                      Lista de Opções (edição simplificada)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Seção: {listSections[0]?.title} - {listSections[0]?.rows?.length} itens
                    </p>
                    <div className="space-y-2">
                      {listSections[0]?.rows?.map((row: any, index: number) => (
                        <div key={row.id} className="flex gap-2">
                          <Input
                            value={row.title}
                            onChange={(e) => {
                              const updated = [...listSections];
                              updated[0].rows[index].title = e.target.value;
                              setListSections(updated);
                            }}
                            placeholder="Título"
                            className="flex-1"
                          />
                          <Input
                            value={row.description}
                            onChange={(e) => {
                              const updated = [...listSections];
                              updated[0].rows[index].description = e.target.value;
                              setListSections(updated);
                            }}
                            placeholder="Descrição"
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Template Message */}
                <TabsContent value="template" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Selecionar Template</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um template salvo" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {template.template_type === 'buttons' && <LayoutGrid className="w-4 h-4" />}
                              {template.template_type === 'list' && <List className="w-4 h-4" />}
                              {template.template_type === 'text' && <MessageSquare className="w-4 h-4" />}
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                    <div className="space-y-3 p-4 rounded-xl bg-muted/50 border">
                      <Label>Preencher Variáveis</Label>
                      {selectedTemplate.variables.map((v: string) => (
                        <div key={v} className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-mono">{`{{${v}}}`}</Badge>
                          <Input
                            value={variableValues[v] || ''}
                            onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                            placeholder={`Valor de ${v}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTemplate && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium mb-1">{selectedTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {selectedTemplate.template_type} | 
                        {selectedTemplate.buttons?.length > 0 && ` ${selectedTemplate.buttons.length} botões`}
                        {selectedTemplate.list_sections?.length > 0 && ` ${selectedTemplate.list_sections.length} seções`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Send Button */}
              <Button
                onClick={sendRealMessage}
                disabled={isSending || !isBackendActive}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Mensagem Real
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Logs */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="scale-90 origin-top">
                <WhatsAppPreview
                  templateType={messageType === 'template' ? selectedTemplate?.template_type || 'text' : messageType}
                  messageContent={
                    messageType === 'text' ? textMessage :
                    messageType === 'buttons' ? buttonBody :
                    messageType === 'list' ? listBody :
                    selectedTemplate?.message_content || ''
                  }
                  buttons={
                    messageType === 'buttons' ? customButtons.map(b => ({ id: b.id, text: b.text })) :
                    messageType === 'template' ? selectedTemplate?.buttons || [] : []
                  }
                  listSections={
                    messageType === 'list' ? listSections :
                    messageType === 'template' ? selectedTemplate?.list_sections || [] : []
                  }
                  buttonText={messageType === 'list' ? listButtonText : 'Ver opções'}
                  footerText={
                    messageType === 'buttons' ? buttonFooter :
                    messageType === 'list' ? listFooter :
                    selectedTemplate?.footer_text || ''
                  }
                  variables={variableValues}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Últimos Envios
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchRecentLogs} disabled={isLoadingLogs}>
                  {isLoadingLogs ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Atualizar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {recentLogs.length > 0 ? (
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs">{log.phone_to}</span>
                            {getTypeBadge(log.message_type)}
                          </div>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1">
                          {log.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-xs">Nenhum envio</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
