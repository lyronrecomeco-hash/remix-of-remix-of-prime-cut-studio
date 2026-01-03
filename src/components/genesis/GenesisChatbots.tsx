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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Play,
  Pause,
  Brain,
  Sparkles,
  LayoutGrid,
  List,
  Moon,
  Timer,
  Settings2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useGenesisAuth } from '@/contexts/GenesisAuthContext';
import lunaAvatar from '@/assets/luna-avatar.png';

interface Chatbot {
  id: string;
  instance_id: string | null;
  name: string;
  trigger_type: string;
  trigger_keywords: string[];
  response_type: string;
  response_content: string | null;
  response_buttons: any[];
  response_list: any;
  delay_seconds: number;
  is_active: boolean;
  priority: number;
  match_count: number;
  created_at: string;
  ai_enabled?: boolean;
  ai_model?: string | null;
  ai_temperature?: number;
  ai_system_prompt?: string | null;
}

interface GenesisChatbotsProps {
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
  { value: 'text', label: 'Texto simples', icon: MessageSquare, disabled: false },
  { value: 'buttons', label: 'Com botões', icon: LayoutGrid, disabled: true, notice: 'Temporariamente inativo' },
  { value: 'list', label: 'Menu de lista', icon: List, disabled: true, notice: 'Temporariamente inativo' },
  { value: 'ai', label: 'Resposta IA', icon: Brain, disabled: false },
];

export function GenesisChatbots({ instances }: GenesisChatbotsProps) {
  const { genesisUser } = useGenesisAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLunaOpen, setIsLunaOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lunaPrompt, setLunaPrompt] = useState('');
  const [isLunaBuilding, setIsLunaBuilding] = useState(false);
  const [lunaBuildStep, setLunaBuildStep] = useState('');

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
    ai_model: 'Luna IA',
    ai_temperature: 0.7,
    ai_system_prompt: '',
    buttons: [{ id: '', text: '' }],
  });

  const fetchChatbots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automations')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setChatbots((data || []) as unknown as Chatbot[]);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatbots();
  }, [fetchChatbots]);

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
      ai_model: 'Luna IA',
      ai_temperature: 0.7,
      ai_system_prompt: '',
      buttons: [{ id: '', text: '' }],
    });
  };

  const openCreateDialog = () => {
    setEditingChatbot(null);
    resetForm();
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
        ai_model: isAI ? 'gpt-4o-mini' : null, // Luna IA uses ChatGPT
        ai_temperature: form.ai_temperature,
        ai_system_prompt: form.ai_system_prompt || null,
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
      fetchChatbots();
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
      fetchChatbots();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const deleteChatbot = async (id: string) => {
    try {
      const { error } = await supabase.from('whatsapp_automations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Chatbot removido');
      fetchChatbots();
    } catch (error) {
      toast.error('Erro ao remover chatbot');
    }
  };

  // Luna AI Builder
  const buildWithLuna = async () => {
    if (!lunaPrompt.trim()) {
      toast.error('Digite uma descrição para a Luna');
      return;
    }

    setIsLunaBuilding(true);
    const steps = [
      'Analisando sua descrição...',
      'Identificando gatilhos ideais...',
      'Gerando respostas inteligentes...',
      'Configurando personalidade do bot...',
      'Finalizando chatbot...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setLunaBuildStep(steps[i]);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    }

    // Generate chatbot from prompt
    setForm({
      name: `Bot Luna - ${lunaPrompt.slice(0, 20)}...`,
      trigger_type: 'keyword',
      keywords: lunaPrompt.split(' ').slice(0, 3).join(', '),
      response_type: 'ai',
      response: '',
      delay: 2,
      instance_id: instances[0]?.id || '',
      ai_enabled: true,
      ai_model: 'Luna IA',
      ai_temperature: 0.7,
      ai_system_prompt: `Você é um assistente virtual inteligente. ${lunaPrompt}. Seja amigável, profissional e ajude os clientes da melhor forma possível.`,
      buttons: [],
    });

    setIsLunaBuilding(false);
    setIsLunaOpen(false);
    setIsDialogOpen(true);
    setLunaPrompt('');
    toast.success('Luna configurou seu chatbot! Revise e salve.');
  };

  // Stats
  const activeChatbots = chatbots.filter(c => c.is_active).length;
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
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg flex-shrink-0"
              >
                <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </motion.div>
              <div>
                <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 flex-wrap">
                  Chatbots Inteligentes
                  <Badge variant="secondary">IA</Badge>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Configure respostas automáticas com inteligência artificial
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => setIsLunaOpen(true)} 
                className="gap-2"
                size="sm"
              >
                <img src={lunaAvatar} alt="Luna" className="w-5 h-5 rounded-full" />
                <span className="hidden sm:inline">Luna IA</span>
                <span className="sm:hidden">Luna</span>
              </Button>
              <Button onClick={openCreateDialog} size="sm" className="gap-2 shadow-lg">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Chatbot</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
              <p className="text-xl sm:text-2xl font-bold">{chatbots.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{activeChatbots}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
            <div className="p-3 sm:p-4 bg-primary/10 rounded-xl">
              <p className="text-xl sm:text-2xl font-bold text-primary">{aiChatbots}</p>
              <p className="text-xs text-muted-foreground">Com IA</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chatbots List */}
      {chatbots.length === 0 ? (
        <Card>
          <CardContent className="py-10 sm:py-16 text-center px-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </motion.div>
            <h3 className="font-semibold text-lg sm:text-xl mb-2">Crie seu primeiro chatbot</h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
              Configure respostas automáticas para atender seus clientes 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => setIsLunaOpen(true)} variant="outline" className="gap-2">
                <img src={lunaAvatar} alt="Luna" className="w-5 h-5 rounded-full" />
                Criar com Luna IA
              </Button>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-5 h-5" />
                Criar Chatbot
              </Button>
            </div>
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
                            <Badge variant="outline" className="text-xs mt-1">
                              {triggerInfo?.label}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={chatbot.is_active}
                          onCheckedChange={() => toggleChatbot(chatbot)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingChatbot(chatbot);
                            setForm({
                              name: chatbot.name,
                              trigger_type: chatbot.trigger_type,
                              keywords: chatbot.trigger_keywords.join(', '),
                              response_type: chatbot.ai_enabled ? 'ai' : chatbot.response_type,
                              response: chatbot.response_content || '',
                              delay: chatbot.delay_seconds,
                              instance_id: chatbot.instance_id || '',
                              ai_enabled: chatbot.ai_enabled || false,
                              ai_model: 'Luna IA',
                              ai_temperature: chatbot.ai_temperature || 0.7,
                              ai_system_prompt: chatbot.ai_system_prompt || '',
                              buttons: chatbot.response_buttons || [],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteChatbot(chatbot.id)}
                        >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {editingChatbot ? 'Editar Chatbot' : 'Novo Chatbot'}
            </DialogTitle>
            <DialogDescription>
              Configure as respostas automáticas do seu bot
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-6 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label>Nome do Chatbot</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Atendimento 24h"
                />
              </div>

              {/* Instance */}
              {instances.length > 0 && (
                <div className="space-y-2">
                  <Label>Instância (opcional)</Label>
                  <Select
                    value={form.instance_id}
                    onValueChange={(v) => setForm({ ...form, instance_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trigger Type */}
              <div className="space-y-2">
                <Label>Gatilho</Label>
                <Select
                  value={form.trigger_type}
                  onValueChange={(v) => setForm({ ...form, trigger_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keywords */}
              {form.trigger_type === 'keyword' && (
                <div className="space-y-2">
                  <Label>Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="oi, olá, bom dia, preço"
                  />
                </div>
              )}

              {/* Response Type */}
              <div className="space-y-2">
                <Label>Tipo de Resposta</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RESPONSE_TYPES.map((rt) => (
                    <Button
                      key={rt.value}
                      type="button"
                      variant={form.response_type === rt.value ? 'default' : 'outline'}
                      className="justify-start gap-2 relative"
                      onClick={() => !rt.disabled && setForm({ ...form, response_type: rt.value, ai_enabled: rt.value === 'ai' })}
                      disabled={rt.disabled}
                    >
                      <rt.icon className="w-4 h-4" />
                      {rt.label}
                      {rt.disabled && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Response Content */}
              {form.response_type === 'text' && (
                <div className="space-y-2">
                  <Label>Mensagem de Resposta</Label>
                  <Textarea
                    value={form.response}
                    onChange={(e) => setForm({ ...form, response: e.target.value })}
                    placeholder="Digite a resposta automática..."
                    rows={4}
                  />
                </div>
              )}

              {/* AI Config */}
              {form.response_type === 'ai' && (
                <div className="space-y-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Configuração Luna IA</span>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                      ChatGPT
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input value="Luna IA (ChatGPT)" disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label>Personalidade / System Prompt</Label>
                    <Textarea
                      value={form.ai_system_prompt}
                      onChange={(e) => setForm({ ...form, ai_system_prompt: e.target.value })}
                      placeholder="Você é um atendente amigável da empresa X..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Temperatura: {form.ai_temperature}</Label>
                    <Slider
                      value={[form.ai_temperature]}
                      onValueChange={([v]) => setForm({ ...form, ai_temperature: v })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Menor = mais preciso, Maior = mais criativo
                    </p>
                  </div>
                </div>
              )}

              {/* Delay */}
              <div className="space-y-2">
                <Label>Delay antes de responder: {form.delay}s</Label>
                <Slider
                  value={[form.delay]}
                  onValueChange={([v]) => setForm({ ...form, delay: v })}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveChatbot} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingChatbot ? 'Salvar Alterações' : 'Criar Chatbot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Luna AI Builder Dialog - Genesis Theme - Professional Real-time Build */}
      <Dialog open={isLunaOpen} onOpenChange={(open) => !isLunaBuilding && setIsLunaOpen(open)}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-background to-background/95">
          <DialogHeader className="border-b border-border pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center ring-2 ring-primary/30 overflow-hidden">
                <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="flex items-center gap-2">
                  Luna IA
                  <Badge className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground border-0 text-[10px]">
                    GENESIS
                  </Badge>
                </span>
                <p className="text-sm font-normal text-muted-foreground">
                  Assistente inteligente de chatbots
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            {isLunaBuilding ? (
              <div className="space-y-6">
                {/* Luna Avatar Animation */}
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/30"
                  >
                    <img src={lunaAvatar} alt="Luna" className="w-full h-full object-cover" />
                  </motion.div>
                </div>
                
                {/* Building Status */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <p className="text-lg font-semibold text-primary">Luna está construindo seu chatbot...</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar até 5 minutos para um resultado perfeito</p>
                </motion.div>

                {/* Real-time building steps with typewriter */}
                <div className="bg-muted/30 rounded-xl p-4 border min-h-[200px] max-h-[300px] overflow-y-auto">
                  <div className="space-y-3">
                    {[
                      { step: 'Analisando sua descrição...', icon: '🔍' },
                      { step: 'Identificando gatilhos ideais...', icon: '🎯' },
                      { step: 'Definindo personalidade do bot...', icon: '🤖' },
                      { step: 'Criando respostas inteligentes...', icon: '💬' },
                      { step: 'Configurando inteligência artificial...', icon: '🧠' },
                    ].map((item, idx) => {
                      const stepIndex = [
                        'Analisando sua descrição...',
                        'Identificando gatilhos ideais...',
                        'Gerando respostas inteligentes...',
                        'Configurando personalidade do bot...',
                        'Finalizando chatbot...',
                      ].indexOf(lunaBuildStep);
                      const isComplete = idx < stepIndex;
                      const isActive = idx === stepIndex;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: isComplete || isActive ? 1 : 0.3, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className={`flex items-center gap-3 p-2 rounded-lg ${isActive ? 'bg-primary/10' : ''}`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className={`text-sm ${isComplete ? 'text-green-500 line-through' : isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {item.step}
                          </span>
                          {isComplete && <span className="text-green-500 ml-auto">✓</span>}
                          {isActive && (
                            <motion.div
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="ml-auto w-2 h-2 rounded-full bg-primary"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{Math.round(([
                      'Analisando sua descrição...',
                      'Identificando gatilhos ideais...',
                      'Gerando respostas inteligentes...',
                      'Configurando personalidade do bot...',
                      'Finalizando chatbot...',
                    ].indexOf(lunaBuildStep) + 1) / 5 * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary/60"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${([
                          'Analisando sua descrição...',
                          'Identificando gatilhos ideais...',
                          'Gerando respostas inteligentes...',
                          'Configurando personalidade do bot...',
                          'Finalizando chatbot...',
                        ].indexOf(lunaBuildStep) + 1) / 5 * 100}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Descreva o que você precisa. A Luna vai analisar, configurar gatilhos, criar respostas inteligentes e finalizar seu chatbot com precisão profissional.
                </p>
                <Textarea
                  value={lunaPrompt}
                  onChange={(e) => setLunaPrompt(e.target.value)}
                  placeholder="Ex: Quero um chatbot para atender clientes de uma pizzaria. Ele deve responder sobre cardápio, preços, horários de funcionamento, promoções e formas de pagamento. Precisa ser amigável e profissional..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Quanto mais detalhes você fornecer, melhor será o resultado!
                </p>
              </>
            )}
          </div>

          {!isLunaBuilding && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLunaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={buildWithLuna} className="gap-2 bg-gradient-to-r from-primary to-primary/80" disabled={!lunaPrompt.trim()}>
                <Sparkles className="w-4 h-4" />
                Criar com Luna
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
