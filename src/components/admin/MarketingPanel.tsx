import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Upload,
  Users,
  Send,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  HelpCircle,
  Power,
  Link as LinkIcon,
  Sparkles,
  Play,
  FileText,
  X,
  FileSpreadsheet,
  TestTube,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Shield,
  Zap,
  Timer,
  TrendingUp,
  Info,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface MarketingSettings {
  id: string;
  is_enabled: boolean;
  max_contacts: number;
  delay_between_messages: number;
  // Anti-blocking protection fields
  min_delay_seconds: number;
  max_delay_seconds: number;
  daily_limit: number;
  warmup_enabled: boolean;
  warmup_day: number;
  pause_every_n_messages: number;
  pause_duration_seconds: number;
  allowed_start_hour: number;
  allowed_end_hour: number;
  messages_sent_today: number;
  last_reset_date: string;
  consecutive_errors: number;
  max_consecutive_errors: number;
}

interface Campaign {
  id: string;
  name: string;
  message_template: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  target_count: number;
  sent_count: number;
  status: string;
  use_ai: boolean;
  ai_prompt: string | null;
  created_at: string;
  scheduled_at: string | null;
  completed_at: string | null;
}

interface Contact {
  phone: string;
  name: string;
}

export default function MarketingPanel() {
  const { notify } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  const [testingCampaign, setTestingCampaign] = useState<string | null>(null);
  const [campaignPage, setCampaignPage] = useState(0);
  const CAMPAIGNS_PER_PAGE = 5;
  
  // AI state
  const [aiContext, setAiContext] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  
  // New campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message_template: '',
    image_url: '',
    button_text: '',
    button_url: '',
    use_ai: false,
    ai_prompt: '',
    scheduled_at: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactInput, setContactInput] = useState({ phone: '', name: '' });
  const [bulkContacts, setBulkContacts] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contactsTab, setContactsTab] = useState<'manual' | 'bulk' | 'csv'>('manual');

  // Pagination calculations
  const totalCampaignPages = Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE);
  const paginatedCampaigns = campaigns.slice(
    campaignPage * CAMPAIGNS_PER_PAGE,
    (campaignPage + 1) * CAMPAIGNS_PER_PAGE
  );

  useEffect(() => {
    fetchSettings();
    fetchCampaigns();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('marketing_settings').select('*').limit(1).maybeSingle();
    if (data) setSettings(data as MarketingSettings);
    setLoading(false);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data as Campaign[]);
  };

  const toggleMarketing = async () => {
    if (!settings) return;
    
    if (!settings.is_enabled) {
      setShowIntroModal(true);
      return;
    }
    
    const { error } = await supabase
      .from('marketing_settings')
      .update({ is_enabled: false })
      .eq('id', settings.id);
    
    if (error) {
      notify.error('Erro ao desativar');
    } else {
      setSettings({ ...settings, is_enabled: false });
      notify.info('Modo Marketing desativado');
    }
  };

  const confirmEnableMarketing = async () => {
    if (!settings) return;
    
    const { error } = await supabase
      .from('marketing_settings')
      .update({ is_enabled: true })
      .eq('id', settings.id);
    
    if (error) {
      notify.error('Erro ao ativar');
    } else {
      setSettings({ ...settings, is_enabled: true });
      notify.success('Modo Marketing ativado!');
    }
    setShowIntroModal(false);
  };

  const updateSettings = async (updates: Partial<MarketingSettings>) => {
    if (!settings) return;
    
    const { error } = await supabase
      .from('marketing_settings')
      .update(updates)
      .eq('id', settings.id);
    
    if (error) {
      notify.error('Erro ao salvar');
    } else {
      setSettings({ ...settings, ...updates });
      notify.success('Configuração salva');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.error('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('marketing-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketing-images')
        .getPublicUrl(fileName);

      setCampaignForm(prev => ({ ...prev, image_url: publicUrl }));
      notify.success('Imagem enviada!');
    } catch (error) {
      console.error('Upload error:', error);
      notify.error('Erro ao enviar imagem');
    }
    setUploadingImage(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const newContacts: Contact[] = [];
      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('telefone') || line.toLowerCase().includes('phone'))) {
          return;
        }
        
        const parts = line.split(/[,;]/);
        const phone = parts[0]?.replace(/\D/g, '').trim();
        // Name is truly optional - don't use phone as fallback
        const name = parts[1]?.trim() || '';
        
        if (phone && phone.length >= 10 && !contacts.some(c => c.phone === phone) && !newContacts.some(c => c.phone === phone)) {
          if (contacts.length + newContacts.length < (settings?.max_contacts || 100)) {
            newContacts.push({ phone, name });
          }
        }
      });

      if (newContacts.length > 0) {
        setContacts(prev => [...prev, ...newContacts]);
        notify.success(`${newContacts.length} contato(s) importado(s)`);
        setShowContactsModal(false);
      } else {
        notify.error('Nenhum contato válido encontrado');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkAdd = () => {
    const lines = bulkContacts.split('\n').filter(line => line.trim());
    const newContacts: Contact[] = [];
    
    lines.forEach(line => {
      const parts = line.split(/[,;]/);
      const phone = parts[0]?.replace(/\D/g, '').trim();
      // Name is truly optional - don't use phone as fallback
      const name = parts[1]?.trim() || '';
      
      if (phone && phone.length >= 10 && !contacts.some(c => c.phone === phone) && !newContacts.some(c => c.phone === phone)) {
        if (contacts.length + newContacts.length < (settings?.max_contacts || 100)) {
          newContacts.push({ phone, name });
        }
      }
    });

    if (newContacts.length > 0) {
      setContacts(prev => [...prev, ...newContacts]);
      setBulkContacts('');
      setShowContactsModal(false);
      notify.success(`${newContacts.length} contato(s) adicionado(s)`);
    } else {
      notify.error('Nenhum contato válido encontrado');
    }
  };

  const addManualContact = () => {
    if (!contactInput.phone.trim()) {
      notify.error('Digite um número de telefone');
      return;
    }
    
    const phone = contactInput.phone.replace(/\D/g, '');
    if (phone.length < 10) {
      notify.error('Número inválido');
      return;
    }

    if (contacts.some(c => c.phone === phone)) {
      notify.error('Contato já adicionado');
      return;
    }

    if (contacts.length >= (settings?.max_contacts || 100)) {
      notify.error(`Limite de ${settings?.max_contacts || 100} contatos atingido`);
      return;
    }

    // Name is truly optional - don't use phone as fallback
    setContacts(prev => [...prev, { phone, name: contactInput.name.trim() || '' }]);
    setContactInput({ phone: '', name: '' });
    notify.success('Contato adicionado');
  };

  const removeContact = (phone: string) => {
    setContacts(prev => prev.filter(c => c.phone !== phone));
  };

  // AI Functions
  const generateWithAI = async (type: 'generate' | 'improve') => {
    if (type === 'generate' && !aiContext.trim()) {
      notify.error('Descreva o contexto da campanha');
      return;
    }

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-prompt', {
        body: {
          type,
          context: aiContext,
          currentMessage: generatedMessage || campaignForm.message_template,
          feedback: aiFeedback,
        },
      });

      if (error) throw error;

      if (data?.success && data?.message) {
        setGeneratedMessage(data.message);
        setAiFeedback('');
        notify.success(type === 'generate' ? 'Mensagem gerada!' : 'Mensagem melhorada!');
      } else {
        throw new Error(data?.error || 'Erro ao gerar');
      }
    } catch (error: any) {
      console.error('AI error:', error);
      notify.error(error.message || 'Erro ao gerar mensagem');
    }
    setAiGenerating(false);
  };

  const applyGeneratedMessage = () => {
    if (generatedMessage) {
      setCampaignForm(prev => ({ ...prev, message_template: generatedMessage }));
      setShowAIModal(false);
      setGeneratedMessage('');
      setAiContext('');
      notify.success('Mensagem aplicada!');
    }
  };

  const createCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.message_template.trim()) {
      notify.error('Preencha nome e mensagem');
      return;
    }

    if (contacts.length < 1) {
      notify.error('Adicione pelo menos 1 contato');
      return;
    }

    try {
      const isScheduled = !!campaignForm.scheduled_at;
      
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert({
          name: campaignForm.name,
          message_template: campaignForm.message_template,
          image_url: campaignForm.image_url || null,
          button_text: campaignForm.button_text || null,
          button_url: campaignForm.button_url || null,
          use_ai: campaignForm.use_ai,
          ai_prompt: campaignForm.ai_prompt || null,
          target_count: contacts.length,
          status: isScheduled ? 'scheduled' : 'draft',
          scheduled_at: campaignForm.scheduled_at || null,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const contactsToInsert = contacts.map(c => ({
        campaign_id: campaign.id,
        phone: c.phone,
        name: c.name,
        status: 'pending',
      }));

      const { error: contactsError } = await supabase
        .from('marketing_contacts')
        .insert(contactsToInsert);

      if (contactsError) throw contactsError;

      notify.success('Campanha criada!');
      fetchCampaigns();
      resetForm();
    } catch (error) {
      console.error('Campaign creation error:', error);
      notify.error('Erro ao criar campanha');
    }
  };

  const resetForm = () => {
    setCampaignForm({
      name: '',
      message_template: '',
      image_url: '',
      button_text: '',
      button_url: '',
      use_ai: false,
      ai_prompt: '',
      scheduled_at: '',
    });
    setContacts([]);
    setShowNewCampaignModal(false);
  };

  const testCampaign = async (campaignId: string) => {
    setTestingCampaign(campaignId);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-marketing', {
        body: { campaign_id: campaignId, test_mode: true },
      });

      if (error) throw error;

      if (data?.success) {
        notify.success('Teste enviado!');
      } else {
        notify.error(data?.error || 'Erro ao testar');
      }
    } catch (error: any) {
      console.error('Test campaign error:', error);
      notify.error('Erro ao testar campanha');
    }
    
    setTestingCampaign(null);
  };

  const startCampaign = async (campaignId: string, resetContacts = false) => {
    setSendingCampaign(campaignId);
    
    try {
      if (resetContacts) {
        await supabase
          .from('marketing_contacts')
          .update({ status: 'pending', sent_at: null, error_message: null })
          .eq('campaign_id', campaignId);
        
        await supabase
          .from('marketing_campaigns')
          .update({ status: 'draft', sent_count: 0, completed_at: null })
          .eq('id', campaignId);
      }

      const { data, error } = await supabase.functions.invoke('send-marketing', {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;

      if (data?.success) {
        notify.success(`Campanha concluída! Enviados: ${data.sent}, Falhas: ${data.failed}`);
      } else {
        if (data?.error === 'Nenhum contato pendente') {
          notify.warning('Todos os contatos já foram enviados. Use "Reenviar" para enviar novamente.');
        } else {
          notify.error(data?.error || 'Erro ao enviar');
        }
      }
      
      fetchCampaigns();
    } catch (error: any) {
      console.error('Campaign start error:', error);
      notify.error('Erro ao iniciar campanha');
    }
    
    setSendingCampaign(null);
  };

  const deleteCampaign = async (campaignId: string) => {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      notify.error('Erro ao excluir');
    } else {
      notify.success('Campanha excluída');
      fetchCampaigns();
    }
  };

  const getStatusBadge = (status: string, scheduledAt?: string | null) => {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground', icon: <FileText className="w-3.5 h-3.5" /> },
      scheduled: { 
        label: scheduledAt ? `Agendado: ${new Date(scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Agendado', 
        color: 'bg-purple-500/20 text-purple-400', 
        icon: <Calendar className="w-3.5 h-3.5" /> 
      },
      sending: { label: 'Enviando', color: 'bg-blue-500/20 text-blue-400', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
      completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3.5 h-3.5" /> },
      failed: { label: 'Falhou', color: 'bg-destructive/20 text-destructive', icon: <XCircle className="w-3.5 h-3.5" /> },
      paused: { label: 'Pausada', color: 'bg-orange-500/20 text-orange-400', icon: <Timer className="w-3.5 h-3.5" /> },
    };
    const c = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${c.color}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  // Calculate warmup limit based on day
  const getWarmupLimit = (day: number, baseLimit: number): number => {
    const warmupLimits: Record<number, number> = { 1: 20, 2: 35, 3: 50, 4: 75, 5: 100 };
    return Math.min(warmupLimits[day] || baseLimit, baseLimit);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Separate campaigns by status
  const activeCampaigns = campaigns.filter(c => ['sending', 'scheduled'].includes(c.status));
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  const completedCampaigns = campaigns.filter(c => ['completed', 'failed', 'paused'].includes(c.status));

  const [marketingTab, setMarketingTab] = useState<'active' | 'drafts' | 'history'>('active');

  const renderCampaignCard = (campaign: Campaign, compact = false) => (
    <div key={campaign.id} className={`glass-card rounded-xl ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className={`font-semibold truncate ${compact ? 'text-base' : 'text-lg'}`}>{campaign.name}</h4>
            {getStatusBadge(campaign.status, campaign.scheduled_at)}
          </div>
          <p className={`text-muted-foreground line-clamp-2 mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
            {campaign.message_template}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {campaign.sent_count}/{campaign.target_count}
            </span>
            {campaign.image_url && (
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Imagem
              </span>
            )}
            {campaign.button_url && (
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Botão
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campaign.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testCampaign(campaign.id)}
                disabled={testingCampaign === campaign.id}
                className="h-9 px-3"
              >
                {testingCampaign === campaign.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => startCampaign(campaign.id)}
                disabled={sendingCampaign === campaign.id}
                className="h-9 px-3"
              >
                {sendingCampaign === campaign.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCampaign(campaign.id)}
                className="h-9 px-2 text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          {campaign.status === 'completed' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCampaign(campaign.id, true)}
                disabled={sendingCampaign === campaign.id}
                className="h-9 px-3"
              >
                {sendingCampaign === campaign.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCampaign(campaign.id)}
                className="h-9 px-2 text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          {campaign.status === 'sending' && (
            <span className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Marketing
          </h2>
          <p className="text-sm text-muted-foreground">Disparo em massa via WhatsApp</p>
        </div>
        
        <div className="flex items-center gap-2">
          {settings?.is_enabled && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)} className="h-9 px-3">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowProtectionModal(true)} className="h-9 px-3">
                <Shield className="w-4 h-4" />
              </Button>
            </>
          )}
          <button
            onClick={toggleMarketing}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              settings?.is_enabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
              settings?.is_enabled ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {!settings?.is_enabled ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="opacity-60 pointer-events-none select-none">
            <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Modo Marketing Desativado</h3>
            <p className="text-muted-foreground mb-4">
              Ative o modo Marketing para enviar mensagens em massa via WhatsApp.
            </p>
          </div>
          <Button variant="hero" onClick={toggleMarketing} className="mt-2 h-10 px-6">
            <Power className="w-4 h-4" />
            Ativar Marketing
          </Button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl mb-4 shrink-0">
            {[
              { id: 'active', label: 'Ativas', count: activeCampaigns.length, icon: Zap },
              { id: 'drafts', label: 'Rascunhos', count: draftCampaigns.length, icon: FileText },
              { id: 'history', label: 'Histórico', count: completedCampaigns.length, icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMarketingTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  marketingTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    marketingTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {/* Status Bar - Always visible */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold">{settings?.warmup_day || 1}/5</span>
                <p className="text-[10px] text-muted-foreground">Aquecimento</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold">
                  {settings?.warmup_enabled 
                    ? getWarmupLimit(settings?.warmup_day || 1, settings?.daily_limit || 50) 
                    : settings?.daily_limit || 50}
                </span>
                <p className="text-[10px] text-muted-foreground">msg/dia</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-0.5">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold">{settings?.messages_sent_today || 0}</span>
                <p className="text-[10px] text-muted-foreground">hoje</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-base font-bold">{settings?.allowed_start_hour || 8}-{settings?.allowed_end_hour || 20}h</span>
                <p className="text-[10px] text-muted-foreground">horário</p>
              </div>
            </div>

            {/* New Campaign Button */}
            <Button variant="hero" onClick={() => setShowNewCampaignModal(true)} className="w-full h-10 mb-4">
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>

            {/* Tab Content */}
            {marketingTab === 'active' && (
              <div className="space-y-3">
                {activeCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhuma campanha ativa</p>
                    <p className="text-sm">Campanhas enviando ou agendadas aparecerão aqui</p>
                  </div>
                ) : (
                  activeCampaigns.map(c => renderCampaignCard(c))
                )}
              </div>
            )}

            {marketingTab === 'drafts' && (
              <div className="space-y-3">
                {draftCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum rascunho</p>
                    <p className="text-sm">Crie uma nova campanha para começar</p>
                  </div>
                ) : (
                  draftCampaigns.map(c => renderCampaignCard(c))
                )}
              </div>
            )}

            {marketingTab === 'history' && (
              <div className="space-y-3">
                {completedCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum histórico</p>
                    <p className="text-sm">Campanhas concluídas aparecerão aqui</p>
                  </div>
                ) : (
                  completedCampaigns.map(c => renderCampaignCard(c, true))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intro Modal */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Megaphone className="w-6 h-6 text-primary" />
              Modo Marketing
            </DialogTitle>
            <DialogDescription className="text-base">Funcionalidades do módulo de marketing</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {[
              { icon: Send, title: 'Disparo em Massa', desc: 'Envie mensagens para múltiplos contatos' },
              { icon: FileSpreadsheet, title: 'Importar Contatos', desc: 'Via CSV, texto ou manualmente' },
              { icon: ImageIcon, title: 'Imagens e Botões', desc: 'Adicione mídia e links clicáveis' },
              { icon: Sparkles, title: 'IA para Mensagens', desc: 'Gere mensagens persuasivas com IA' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3 mt-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-yellow-500">Atenção:</strong> Envio em massa pode resultar em bloqueio pelo WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowIntroModal(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button variant="hero" onClick={confirmEnableMarketing} className="flex-1 h-11">
              <Power className="w-4 h-4" />
              Ativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Settings className="w-6 h-6 text-primary" />
              Configurações de Marketing
            </DialogTitle>
            <DialogDescription className="text-base">Ajuste os parâmetros de envio</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div>
              <label className="text-base font-medium block mb-2">Máximo de contatos por campanha</label>
              <Input
                type="number"
                min={10}
                max={1000}
                value={settings?.max_contacts || 100}
                onChange={(e) => updateSettings({ max_contacts: Number(e.target.value) })}
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground mt-2">Limite de contatos que podem ser adicionados</p>
            </div>
            <div>
              <label className="text-base font-medium block mb-2">Intervalo entre mensagens (segundos)</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={settings?.delay_between_messages || 3}
                onChange={(e) => updateSettings({ delay_between_messages: Number(e.target.value) })}
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground mt-2">Tempo de espera entre cada envio</p>
            </div>
          </div>

          <Button variant="hero" onClick={() => setShowSettingsModal(false)} className="w-full h-11">
            Concluído
          </Button>
        </DialogContent>
      </Dialog>

      {/* New Campaign Modal */}
      <Dialog open={showNewCampaignModal} onOpenChange={setShowNewCampaignModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Plus className="w-6 h-6 text-primary" />
              Nova Campanha
            </DialogTitle>
            <DialogDescription className="text-base">Configure sua campanha de marketing</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Nome */}
            <div>
              <label className="text-base font-medium block mb-2">Nome da Campanha</label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Promoção de Natal"
                className="h-12 text-base"
              />
            </div>

            {/* Mensagem */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-base font-medium">Mensagem</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIModal(true)}
                  className="h-9 gap-2 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Wand2 className="w-4 h-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                value={campaignForm.message_template}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder="Digite sua mensagem de marketing..."
                rows={4}
                className="text-base"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Use {'{{nome}}'} para personalizar com o nome do contato
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-base font-medium block mb-2">Imagem (opcional)</label>
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex-1 h-11"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadingImage ? 'Enviando...' : 'Escolher Imagem'}
                </Button>
                {campaignForm.image_url && (
                  <Button
                    variant="ghost"
                    onClick={() => setCampaignForm(prev => ({ ...prev, image_url: '' }))}
                    className="h-11 px-3 text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {campaignForm.image_url && (
                <img src={campaignForm.image_url} alt="Preview" className="mt-3 w-24 h-24 object-cover rounded-xl" />
              )}
            </div>

            {/* Button */}
            <div className="p-4 bg-secondary/30 rounded-xl">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Botão clicável (opcional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={campaignForm.button_text}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Texto do botão"
                  className="h-11"
                />
                <Input
                  value={campaignForm.button_url}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, button_url: e.target.value }))}
                  placeholder="https://..."
                  className="h-11"
                />
              </div>
            </div>

            {/* Agendamento */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-base font-medium text-purple-400">Agendar Disparo (opcional)</span>
              </div>
              <Input
                type="datetime-local"
                value={campaignForm.scheduled_at}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className="h-11"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {campaignForm.scheduled_at 
                  ? `Disparo agendado para: ${new Date(campaignForm.scheduled_at).toLocaleString('pt-BR')}`
                  : 'Deixe em branco para enviar manualmente'
                }
              </p>
            </div>

            {/* Contacts */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
              <div>
                <span className="text-base font-medium">Contatos</span>
                <p className="text-sm text-muted-foreground">
                  {contacts.length} de {settings?.max_contacts || 100} adicionados
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowContactsModal(true)} className="h-10">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </div>

            {contacts.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {contacts.slice(0, 5).map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span className="truncate text-sm">{contact.name ? `${contact.name} - ${contact.phone}` : contact.phone}</span>
                    <button onClick={() => removeContact(contact.phone)} className="p-1.5 hover:bg-destructive/20 rounded-lg text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {contacts.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center py-2">+{contacts.length - 5} contato(s) adicionados</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm} className="flex-1 h-12">
              Cancelar
            </Button>
            <Button variant="hero" onClick={createCampaign} className="flex-1 h-12">
              <Send className="w-4 h-4" />
              Criar Campanha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Wand2 className="w-6 h-6 text-primary" />
              Gerar Mensagem com IA
            </DialogTitle>
            <DialogDescription className="text-base">Crie mensagens de marketing persuasivas</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div>
              <label className="text-base font-medium block mb-2">
                Descreva o objetivo da campanha
              </label>
              <Textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Ex: Promoção de 20% em cortes durante o mês de janeiro para atrair novos clientes. Quero uma mensagem que toque na dor de quem precisa renovar o visual e mostre como nossa barbearia pode ajudar..."
                rows={4}
                className="text-base"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Quanto mais detalhes, melhor será a mensagem gerada
              </p>
            </div>

            <Button 
              onClick={() => generateWithAI('generate')} 
              disabled={aiGenerating || !aiContext.trim()}
              className="w-full h-12"
            >
              {aiGenerating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5 mr-2" />
              )}
              Gerar Mensagem
            </Button>

            {generatedMessage && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="text-base font-medium block mb-2">Mensagem Gerada</label>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-base whitespace-pre-wrap">
                    {generatedMessage}
                  </div>
                </div>

                <div>
                  <label className="text-base font-medium block mb-2">
                    Quer melhorar? Descreva o ajuste
                  </label>
                  <div className="flex gap-3">
                    <Input
                      value={aiFeedback}
                      onChange={(e) => setAiFeedback(e.target.value)}
                      placeholder="Ex: mais curta, mais urgente, adicionar emoji..."
                      className="h-11"
                    />
                    <Button
                      variant="outline"
                      onClick={() => generateWithAI('improve')}
                      disabled={aiGenerating}
                      className="h-11 px-4"
                    >
                      {aiGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button variant="hero" onClick={applyGeneratedMessage} className="w-full h-12">
                  <CheckCircle className="w-5 h-5" />
                  Usar Esta Mensagem
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contacts Modal */}
      <Dialog open={showContactsModal} onOpenChange={setShowContactsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Users className="w-6 h-6 text-primary" />
              Gerenciar Contatos
            </DialogTitle>
            <DialogDescription className="text-base">
              {contacts.length} de {settings?.max_contacts || 100} contatos adicionados
            </DialogDescription>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1.5 bg-secondary/50 rounded-xl">
            {[
              { id: 'manual', label: 'Manual' },
              { id: 'bulk', label: 'Em Massa' },
              { id: 'csv', label: 'CSV' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setContactsTab(tab.id as any)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  contactsTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 py-4">
            {contactsTab === 'manual' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    value={contactInput.phone}
                    onChange={(e) => setContactInput(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Telefone (com DDD)"
                    className="flex-1 h-11"
                  />
                  <Input
                    value={contactInput.name}
                    onChange={(e) => setContactInput(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome (opcional)"
                    className="flex-1 h-11"
                  />
                </div>
                <Button variant="hero" onClick={addManualContact} className="w-full h-11">
                  <Plus className="w-4 h-4" />
                  Adicionar Contato
                </Button>
              </div>
            )}

            {contactsTab === 'bulk' && (
              <div className="space-y-3">
                <Textarea
                  value={bulkContacts}
                  onChange={(e) => setBulkContacts(e.target.value)}
                  placeholder={`5511999999999, João\n5511888888888, Maria\n5511777777777`}
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">Formato: telefone, nome (um por linha)</p>
                <Button variant="hero" onClick={handleBulkAdd} className="w-full h-11">
                  <Plus className="w-4 h-4" />
                  Adicionar Todos
                </Button>
              </div>
            )}

            {contactsTab === 'csv' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
                  <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-base text-muted-foreground mb-4">Arquivo CSV ou TXT</p>
                  <Button variant="outline" onClick={() => csvInputRef.current?.click()} className="h-11">
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Arquivo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Formato esperado: telefone, nome</p>
              </div>
            )}

            {contacts.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-medium">Contatos Adicionados</span>
                  <button onClick={() => setContacts([])} className="text-sm text-destructive hover:underline">
                    Limpar todos
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <span className="truncate text-sm">{contact.name ? `${contact.name} - ${contact.phone}` : contact.phone}</span>
                      <button onClick={() => removeContact(contact.phone)} className="p-1.5 hover:bg-destructive/20 rounded-lg text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="hero" onClick={() => setShowContactsModal(false)} className="w-full h-11">
            Concluído
          </Button>
        </DialogContent>
      </Dialog>

      {/* Protection Settings Modal */}
      <Dialog open={showProtectionModal} onOpenChange={setShowProtectionModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Shield className="w-6 h-6 text-green-500" />
              Proteção Anti-Bloqueio
            </DialogTitle>
            <DialogDescription className="text-base">Configure as proteções para evitar bloqueio do seu número</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Delay Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                Intervalo entre Mensagens
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Mínimo (segundos)</label>
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={settings?.min_delay_seconds || 8}
                    onChange={(e) => updateSettings({ min_delay_seconds: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Máximo (segundos)</label>
                  <Input
                    type="number"
                    min={10}
                    max={120}
                    value={settings?.max_delay_seconds || 20}
                    onChange={(e) => updateSettings({ max_delay_seconds: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Delay aleatório entre {settings?.min_delay_seconds || 8}s e {settings?.max_delay_seconds || 20}s simula comportamento humano</p>
            </div>

            {/* Pause Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Pausas Automáticas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Pausar a cada X msg</label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={settings?.pause_every_n_messages || 10}
                    onChange={(e) => updateSettings({ pause_every_n_messages: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Duração pausa (seg)</label>
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={settings?.pause_duration_seconds || 30}
                    onChange={(e) => updateSettings({ pause_duration_seconds: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Daily Limit */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Limite Diário e Aquecimento
              </h4>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Limite máximo por dia</label>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={settings?.daily_limit || 50}
                  onChange={(e) => updateSettings({ daily_limit: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <span className="font-medium">Aquecimento Progressivo</span>
                  <p className="text-xs text-muted-foreground">Aumenta limite gradualmente em 5 dias</p>
                </div>
                <button
                  onClick={() => updateSettings({ warmup_enabled: !settings?.warmup_enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings?.warmup_enabled ? 'bg-green-500' : 'bg-secondary'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    settings?.warmup_enabled ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
              {settings?.warmup_enabled && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm text-green-400">
                    <strong>Dia {settings?.warmup_day || 1}/5:</strong> Limite atual de {getWarmupLimit(settings?.warmup_day || 1, settings?.daily_limit || 50)} mensagens
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Progressão: 20 → 35 → 50 → 75 → {settings?.daily_limit || 100} msg/dia
                  </p>
                </div>
              )}
            </div>

            {/* Allowed Hours */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Horário Permitido
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Início</label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={settings?.allowed_start_hour || 8}
                    onChange={(e) => updateSettings({ allowed_start_hour: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Fim</label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={settings?.allowed_end_hour || 20}
                    onChange={(e) => updateSettings({ allowed_end_hour: Number(e.target.value) })}
                    className="h-11"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Envio só permitido entre {settings?.allowed_start_hour || 8}h e {settings?.allowed_end_hour || 20}h</p>
            </div>

            {/* Error Detection */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Detecção de Erros
              </h4>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Pausar após X erros consecutivos</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings?.max_consecutive_errors || 3}
                  onChange={(e) => updateSettings({ max_consecutive_errors: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
              <p className="text-xs text-muted-foreground">Pausa automática protege contra bloqueios em cascata</p>
            </div>
          </div>

          <Button variant="hero" onClick={() => setShowProtectionModal(false)} className="w-full h-11">
            Concluído
          </Button>
        </DialogContent>
      </Dialog>

      {/* Documentation Modal */}
      <Dialog open={showDocsModal} onOpenChange={setShowDocsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <BookOpen className="w-6 h-6 text-primary" />
              Guia de Proteção Anti-Bloqueio
            </DialogTitle>
            <DialogDescription className="text-base">Entenda como o sistema protege seu número</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Strategy Overview */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Como Funciona a Proteção
              </h4>
              <p className="text-sm text-muted-foreground">
                O sistema implementa múltiplas camadas de proteção que simulam o comportamento humano 
                e respeitam os limites do WhatsApp para evitar bloqueios.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4">
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Timer className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Delays Inteligentes (8-20s)</h5>
                    <p className="text-sm text-muted-foreground">
                      Intervalos aleatórios entre mensagens simulam digitação humana. 
                      Humanos não enviam mensagens a cada 1 segundo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Pausas Automáticas</h5>
                    <p className="text-sm text-muted-foreground">
                      A cada 10 mensagens, o sistema faz uma pausa de 30 segundos. 
                      Isso imita o comportamento de "descanso" natural.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Aquecimento Progressivo (5 dias)</h5>
                    <p className="text-sm text-muted-foreground">
                      Dia 1: 20 msg → Dia 2: 35 msg → Dia 3: 50 msg → Dia 4: 75 msg → Dia 5+: limite total.
                      Números novos precisam de aquecimento gradual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Horário Comercial (8h-20h)</h5>
                    <p className="text-sm text-muted-foreground">
                      Envios bloqueados fora do horário comercial. 
                      Mensagens às 3h da manhã são suspeitas para o algoritmo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Detecção de Erros</h5>
                    <p className="text-sm text-muted-foreground">
                      Se 3 mensagens seguidas falharem, a campanha é pausada automaticamente. 
                      Isso evita bloqueio em cascata quando algo está errado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                Boas Práticas
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Use listas de contatos que já interagiram com você (clientes, leads)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Personalize mensagens com o nome do destinatário usando {"{{nome}}"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Mantenha o limite diário baixo nas primeiras semanas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Evite enviar para números desconhecidos ou comprados</span>
                </li>
              </ul>
            </div>

            {/* What NOT to do */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                O Que NÃO Fazer
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Enviar para listas compradas ou de números desconhecidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Reduzir os delays abaixo de 8 segundos</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Enviar centenas de mensagens no primeiro dia</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Ignorar campanhas pausadas - investigue o problema primeiro</span>
                </li>
              </ul>
            </div>
          </div>

          <Button variant="hero" onClick={() => setShowDocsModal(false)} className="w-full h-11">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
