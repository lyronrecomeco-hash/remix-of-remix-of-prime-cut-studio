import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Zap,
  MessageSquare,
  Clock,
  Hash,
  Users,
  AlertTriangle,
  Play,
  Pause,
  Settings2,
  Brain,
  Sparkles,
  Activity,
  ArrowRight,
  Copy,
  Eye,
  Timer,
  Moon,
  Sun,
  LayoutGrid,
  List,
  GitBranch,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Chatbot {
  id: string;
  instance_id: string | null;
  name: string;
  trigger_type: string;
  trigger_keywords: string[];
  response_type: string;
  response_content: string | null;
  response_buttons: any;
  response_list: any;
  delay_seconds: number;
  is_active: boolean;
  priority: number;
  match_count: number;
  created_at: string;
  // Optional AI fields (may not exist in DB yet)
  ai_enabled?: boolean;
  ai_model?: string | null;
  ai_temperature?: number;
  ai_max_tokens?: number;
  ai_system_prompt?: string | null;
  working_hours_only?: boolean;
}

interface BusinessHours {
  id: string;
  instance_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface WAChatbotsProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

const TRIGGER_TYPES = [
  { value: 'keyword', label: 'Palavra-chave', icon: Hash, description: 'Responde quando mensagem contém palavra' },
  { value: 'all', label: 'Todas as mensagens', icon: MessageSquare, description: 'Responde a qualquer mensagem' },
  { value: 'first_contact', label: 'Primeiro contato', icon: Users, description: 'Apenas na primeira mensagem' },
  { value: 'business_hours', label: 'Fora do expediente', icon: Moon, description: 'Responde fora do horário' },
  { value: 'inactivity', label: 'Inatividade', icon: Timer, description: 'Após X minutos sem resposta' },
];

const RESPONSE_TYPES = [
  { value: 'text', label: 'Texto simples', icon: MessageSquare },
  { value: 'buttons', label: 'Com botões', icon: LayoutGrid },
  { value: 'list', label: 'Menu de lista', icon: List },
  { value: 'ai', label: 'Resposta IA', icon: Brain },
];

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Rápido e eficiente' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Mais preciso' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'OpenAI compacto' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export const WAChatbots = ({ instances }: WAChatbotsProps) => {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [activeTab, setActiveTab] = useState('chatbots');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'keyword',
    keywords: '',
    response_type: 'text',
    response: '',
    delay: 2,
    instance_id: '',
    ai_enabled: false,
    ai_model: 'gemini-2.5-flash',
    ai_temperature: 0.7,
    ai_max_tokens: 500,
    ai_system_prompt: '',
    working_hours_only: false,
    buttons: [{ id: '', text: '' }],
  });

  const fetchData = useCallback(async () => {
    try {
      const [chatbotsRes, hoursRes] = await Promise.all([
        supabase.from('whatsapp_automations').select('*').order('priority', { ascending: true }),
        supabase.from('whatsapp_business_hours').select('*').order('day_of_week', { ascending: true }),
      ]);

      if (chatbotsRes.error) throw chatbotsRes.error;
      if (hoursRes.error) throw hoursRes.error;

      setChatbots((chatbotsRes.data || []) as unknown as Chatbot[]);
      setBusinessHours((hoursRes.data || []) as BusinessHours[]);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      toast.error('Erro ao carregar chatbots');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      name: '',
      trigger_type: 'keyword',
      keywords: '',
      response_type: 'text',
      response: '',
      delay: 2,
      instance_id: '',
      ai_enabled: false,
      ai_model: 'gemini-2.5-flash',
      ai_temperature: 0.7,
      ai_max_tokens: 500,
      ai_system_prompt: '',
      working_hours_only: false,
      buttons: [{ id: '', text: '' }],
    });
  };

  const openCreateDialog = () => {
    setEditingChatbot(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (chatbot: Chatbot) => {
    setEditingChatbot(chatbot);
    setForm({
      name: chatbot.name,
      trigger_type: chatbot.trigger_type,
      keywords: chatbot.trigger_keywords.join(', '),
      response_type: chatbot.ai_enabled ? 'ai' : chatbot.response_type,
      response: chatbot.response_content || '',
      delay: chatbot.delay_seconds,
      instance_id: chatbot.instance_id || '',
      ai_enabled: chatbot.ai_enabled,
      ai_model: chatbot.ai_model || 'gemini-2.5-flash',
      ai_temperature: chatbot.ai_temperature || 0.7,
      ai_max_tokens: chatbot.ai_max_tokens || 500,
      ai_system_prompt: chatbot.ai_system_prompt || '',
      working_hours_only: chatbot.working_hours_only,
      buttons: chatbot.response_buttons?.length > 0 ? chatbot.response_buttons : [{ id: '', text: '' }],
    });
    setIsDialogOpen(true);
  };

  const saveChatbot = async () => {
    if (!form.name.trim()) {
      toast.error('Digite um nome para o chatbot');
      return;
    }

    if (form.response_type !== 'ai' && !form.response.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    setIsSaving(true);
    try {
      const isAI = form.response_type === 'ai';
      const data: Record<string, unknown> = {
        name: form.name,
        trigger_type: form.trigger_type,
        trigger_keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        response_type: isAI ? 'text' : form.response_type,
        response_content: form.response || null,
        response_buttons: form.response_type === 'buttons' ? form.buttons.filter(b => b.text.trim()) : null,
        delay_seconds: form.delay,
        instance_id: form.instance_id || null,
        ai_enabled: isAI,
        ai_model: isAI ? form.ai_model : null,
        ai_temperature: form.ai_temperature,
        ai_max_tokens: form.ai_max_tokens,
        ai_system_prompt: form.ai_system_prompt || null,
        working_hours_only: form.working_hours_only,
        trigger_conditions: null,
      };

      if (editingChatbot) {
        const { error } = await supabase
          .from('whatsapp_automations')
          .update(data)
          .eq('id', editingChatbot.id);
        if (error) throw error;
        toast.success('Chatbot atualizado!');
      } else {
        const insertData = { ...data, priority: chatbots.length + 1 } as any;
        const { error } = await supabase
          .from('whatsapp_automations')
          .insert(insertData);
        if (error) throw error;
        toast.success('Chatbot criado!');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving chatbot:', error);
      toast.error('Erro ao salvar chatbot');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChatbot = async (chatbot: Chatbot) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automations')
        .update({ is_active: !chatbot.is_active })
        .eq('id', chatbot.id);
      if (error) throw error;
      toast.success(chatbot.is_active ? 'Chatbot pausado' : 'Chatbot ativado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const deleteChatbot = async (id: string) => {
    try {
      const { error } = await supabase.from('whatsapp_automations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Chatbot removido');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover chatbot');
    }
  };

  const duplicateChatbot = async (chatbot: Chatbot) => {
    try {
      const duplicateData = {
        name: `${chatbot.name} (Cópia)`,
        instance_id: chatbot.instance_id,
        trigger_type: chatbot.trigger_type,
        trigger_keywords: chatbot.trigger_keywords,
        response_type: chatbot.response_type,
        response_content: chatbot.response_content,
        response_buttons: chatbot.response_buttons,
        response_list: chatbot.response_list,
        delay_seconds: chatbot.delay_seconds,
        is_active: false,
        priority: chatbots.length + 1,
      };
      const { error } = await supabase
        .from('whatsapp_automations')
        .insert(duplicateData);
      if (error) throw error;
      toast.success('Chatbot duplicado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao duplicar');
    }
  };

  const updateBusinessHours = async (dayOfWeek: number, field: string, value: any) => {
    const existing = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    try {
      if (existing) {
        await supabase
          .from('whatsapp_business_hours')
          .update({ [field]: value })
          .eq('id', existing.id);
      } else if (instances[0]) {
        await supabase
          .from('whatsapp_business_hours')
          .insert({
            instance_id: instances[0].id,
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '18:00',
            is_active: true,
            [field]: value,
          });
      }
      fetchData();
      toast.success('Horário atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar horário');
    }
  };

  // Stats
  const activeChatbots = chatbots.filter(c => c.is_active).length;
  const totalMatches = chatbots.reduce((acc, c) => acc + (c.match_count || 0), 0);
  const aiChatbots = chatbots.filter(c => c.ai_enabled).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg"
              >
                <Bot className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Chatbots Inteligentes
                  <Badge variant="secondary">IA</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Configure respostas automáticas com inteligência artificial
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog} size="lg" className="gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              Novo Chatbot
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-2xl font-bold">{chatbots.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{activeChatbots}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{aiChatbots}</p>
              <p className="text-xs text-muted-foreground">Com IA</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{totalMatches}</p>
              <p className="text-xs text-muted-foreground">Respostas</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chatbots" className="gap-2">
            <Bot className="w-4 h-4" />
            Chatbots
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="w-4 h-4" />
            Horário Comercial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatbots" className="mt-6">
          {/* Chatbots List */}
          {chatbots.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="font-semibold text-xl mb-2">Crie seu primeiro chatbot</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Configure respostas automáticas para atender seus clientes 24/7
                </p>
                <Button onClick={openCreateDialog} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Chatbot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {chatbots.map((chatbot, index) => {
                  const triggerInfo = TRIGGER_TYPES.find(t => t.value === chatbot.trigger_type);
                  const TriggerIcon = triggerInfo?.icon || Zap;

                  return (
                    <motion.div
                      key={chatbot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`transition-all hover:shadow-lg ${
                        chatbot.is_active ? 'border-primary/30' : 'opacity-70'
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                chatbot.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}>
                                {chatbot.ai_enabled ? <Brain className="w-5 h-5" /> : <TriggerIcon className="w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className="font-semibold">{chatbot.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs">
                                    {triggerInfo?.label}
                                  </Badge>
                                  {chatbot.ai_enabled && (
                                    <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600">
                                      <Brain className="w-3 h-3 mr-1" />
                                      IA
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={chatbot.is_active}
                              onCheckedChange={() => toggleChatbot(chatbot)}
                            />
                          </div>

                          {/* Keywords */}
                          {chatbot.trigger_type === 'keyword' && chatbot.trigger_keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {chatbot.trigger_keywords.slice(0, 4).map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                              {chatbot.trigger_keywords.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{chatbot.trigger_keywords.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Preview */}
                          {chatbot.response_content && !chatbot.ai_enabled && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 bg-muted/50 p-2 rounded-lg">
                              {chatbot.response_content}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" />
                              {chatbot.match_count || 0} respostas
                            </div>
                            <div className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" />
                              {chatbot.delay_seconds}s delay
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(chatbot)}>
                              <Edit className="w-4 h-4 mr-1.5" />
                              Editar
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => duplicateChatbot(chatbot)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteChatbot(chatbot.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure o horário comercial para ativar respostas automáticas fora do expediente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS_OF_WEEK.map(({ value, label, fullLabel }) => {
                  const hours = businessHours.find(h => h.day_of_week === value);
                  const isActive = hours?.is_active ?? (value >= 1 && value <= 5);

                  return (
                    <div
                      key={value}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        isActive ? 'bg-card' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => updateBusinessHours(value, 'is_active', checked)}
                        />
                        <span className={`font-medium ${!isActive && 'text-muted-foreground'}`}>
                          {fullLabel}
                        </span>
                      </div>
                      
                      {isActive && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4 text-yellow-500" />
                            <Input
                              type="time"
                              value={hours?.start_time || '09:00'}
                              onChange={(e) => updateBusinessHours(value, 'start_time', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <span className="text-muted-foreground">até</span>
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-blue-500" />
                            <Input
                              type="time"
                              value={hours?.end_time || '18:00'}
                              onChange={(e) => updateBusinessHours(value, 'end_time', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingChatbot ? <Edit className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-primary" />}
              {editingChatbot ? 'Editar Chatbot' : 'Novo Chatbot'}
            </DialogTitle>
            <DialogDescription>
              Configure quando e como o chatbot deve responder automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome do Chatbot</Label>
              <Input
                placeholder="Ex: Boas-vindas, FAQ, Suporte..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Trigger Type */}
            <div className="space-y-3">
              <Label>Quando deve responder?</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRIGGER_TYPES.map(({ value, label, icon: Icon, description }) => (
                  <div
                    key={value}
                    onClick={() => setForm({ ...form, trigger_type: value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.trigger_type === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${form.trigger_type === value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            {form.trigger_type === 'keyword' && (
              <div className="space-y-2">
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input
                  placeholder="oi, olá, bom dia, boa tarde, preço, horário"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  O chatbot responderá quando a mensagem contiver qualquer uma dessas palavras
                </p>
              </div>
            )}

            {/* Response Type */}
            <div className="space-y-3">
              <Label>Tipo de resposta</Label>
              <div className="grid grid-cols-4 gap-3">
                {RESPONSE_TYPES.map(({ value, label, icon: Icon }) => (
                  <div
                    key={value}
                    onClick={() => setForm({ ...form, response_type: value })}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      form.response_type === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${form.response_type === value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Config */}
            {form.response_type === 'ai' && (
              <div className="space-y-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <Label className="text-purple-700 dark:text-purple-300">Configuração de IA</Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Modelo</Label>
                  <Select
                    value={form.ai_model}
                    onValueChange={(v) => setForm({ ...form, ai_model: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div>
                            <p>{model.label}</p>
                            <p className="text-xs text-muted-foreground">{model.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Prompt do Sistema</Label>
                  <Textarea
                    placeholder="Você é um assistente prestativo da empresa X. Seja educado e objetivo nas respostas..."
                    value={form.ai_system_prompt}
                    onChange={(e) => setForm({ ...form, ai_system_prompt: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Temperatura: {form.ai_temperature}</Label>
                    <Slider
                      value={[form.ai_temperature]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={([v]) => setForm({ ...form, ai_temperature: v })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mais baixo = mais preciso, mais alto = mais criativo
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Max Tokens: {form.ai_max_tokens}</Label>
                    <Slider
                      value={[form.ai_max_tokens]}
                      min={100}
                      max={2000}
                      step={100}
                      onValueChange={([v]) => setForm({ ...form, ai_max_tokens: v })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Text Response */}
            {form.response_type === 'text' && (
              <div className="space-y-2">
                <Label>Mensagem de resposta</Label>
                <Textarea
                  placeholder="Olá! 👋 Como posso ajudar você hoje?"
                  value={form.response}
                  onChange={(e) => setForm({ ...form, response: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{nome}'} para inserir o nome do contato
                </p>
              </div>
            )}

            {/* Delay */}
            <div className="space-y-2">
              <Label>Delay antes de responder: {form.delay}s</Label>
              <Slider
                value={[form.delay]}
                min={0}
                max={30}
                step={1}
                onValueChange={([v]) => setForm({ ...form, delay: v })}
              />
              <p className="text-xs text-muted-foreground">
                Simula tempo de digitação para parecer mais natural
              </p>
            </div>

            {/* Instance */}
            {instances.length > 1 && (
              <div className="space-y-2">
                <Label>Instância (opcional)</Label>
                <Select
                  value={form.instance_id}
                  onValueChange={(v) => setForm({ ...form, instance_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as instâncias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {instances.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Working Hours Only */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Apenas fora do expediente</p>
                  <p className="text-xs text-muted-foreground">Responder apenas quando estiver fora do horário comercial</p>
                </div>
              </div>
              <Switch
                checked={form.working_hours_only}
                onCheckedChange={(checked) => setForm({ ...form, working_hours_only: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveChatbot} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {editingChatbot ? 'Salvar' : 'Criar Chatbot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
