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
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  const [testingCampaign, setTestingCampaign] = useState<string | null>(null);
  
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
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactInput, setContactInput] = useState({ phone: '', name: '' });
  const [bulkContacts, setBulkContacts] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contactsTab, setContactsTab] = useState<'manual' | 'bulk' | 'csv'>('manual');

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
        const name = parts[1]?.trim() || phone;
        
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
      const name = parts[1]?.trim() || phone;
      
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

    setContacts(prev => [...prev, { phone, name: contactInput.name.trim() || phone }]);
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
          status: 'draft',
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
    });
    setContacts([]);
    setShowNewCampaign(false);
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

  const startCampaign = async (campaignId: string) => {
    setSendingCampaign(campaignId);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-marketing', {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;

      if (data?.success) {
        notify.success(`Campanha concluída! Enviados: ${data.sent}, Falhas: ${data.failed}`);
      } else {
        notify.error(data?.error || 'Erro ao enviar');
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground', icon: <FileText className="w-3 h-3" /> },
      sending: { label: 'Enviando', color: 'bg-blue-500/20 text-blue-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      completed: { label: 'Concluída', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { label: 'Falhou', color: 'bg-destructive/20 text-destructive', icon: <XCircle className="w-3 h-3" /> },
    };
    const c = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Marketing
          </h2>
          <p className="text-sm text-muted-foreground">Disparo via WhatsApp</p>
        </div>
        
        <button
          onClick={toggleMarketing}
          className={`w-14 h-7 rounded-full transition-colors relative ${
            settings?.is_enabled ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
            settings?.is_enabled ? 'left-8' : 'left-1'
          }`} />
        </button>
      </div>

      {!settings?.is_enabled ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="opacity-60 pointer-events-none select-none">
            <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Modo Marketing Desativado</h3>
            <p className="text-muted-foreground mb-4">
              Ative o modo Marketing para enviar mensagens em massa.
            </p>
          </div>
          <Button variant="hero" onClick={toggleMarketing} className="mt-2">
            <Power className="w-4 h-4" />
            Ativar Marketing
          </Button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          {/* Settings - Grid compacto */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Configurações</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Máx. contatos</label>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={settings?.max_contacts || 100}
                  onChange={(e) => updateSettings({ max_contacts: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Intervalo (seg)</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={settings?.delay_between_messages || 3}
                  onChange={(e) => updateSettings({ delay_between_messages: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-yellow-500">Aviso:</strong> Envio em massa pode resultar em bloqueio pelo WhatsApp.
            </p>
          </div>

          {/* New Campaign Button */}
          {!showNewCampaign && (
            <Button variant="hero" onClick={() => setShowNewCampaign(true)} className="w-full">
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>
          )}

          {/* New Campaign Form */}
          {showNewCampaign && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Nova Campanha
                </h3>
                <button onClick={resetForm} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nome</label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Promoção de Natal"
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">Mensagem</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIModal(true)}
                    className="h-6 text-xs gap-1 text-primary"
                  >
                    <Wand2 className="w-3 h-3" />
                    Gerar com IA
                  </Button>
                </div>
                <Textarea
                  value={campaignForm.message_template}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, message_template: e.target.value }))}
                  placeholder="Digite sua mensagem..."
                  rows={3}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use {'{{nome}}'} para personalizar
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Imagem (opcional)</label>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 h-8"
                  >
                    {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingImage ? 'Enviando...' : 'Upload'}
                  </Button>
                  {campaignForm.image_url && (
                    <button
                      onClick={() => setCampaignForm(prev => ({ ...prev, image_url: '' }))}
                      className="p-1 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {campaignForm.image_url && (
                  <img src={campaignForm.image_url} alt="Preview" className="mt-2 w-16 h-16 object-cover rounded-lg" />
                )}
              </div>

              {/* Button */}
              <div className="p-2 bg-secondary/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Botão clicável (opcional)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={campaignForm.button_text}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, button_text: e.target.value }))}
                    placeholder="Texto"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={campaignForm.button_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, button_url: e.target.value }))}
                    placeholder="https://..."
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                <div>
                  <span className="text-xs font-medium">Contatos</span>
                  <p className="text-[10px] text-muted-foreground">
                    {contacts.length}/{settings?.max_contacts || 100}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowContactsModal(true)} className="h-7 text-xs">
                  <Users className="w-3 h-3" />
                  Gerenciar
                </Button>
              </div>

              {contacts.length > 0 && (
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {contacts.slice(0, 3).map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-secondary/30 rounded text-xs">
                      <span className="truncate">{contact.name} - {contact.phone}</span>
                      <button onClick={() => removeContact(contact.phone)} className="p-0.5 hover:bg-destructive/20 rounded text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {contacts.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{contacts.length - 3} contato(s)</p>
                  )}
                </div>
              )}

              <Button variant="hero" onClick={createCampaign} className="w-full">
                <Send className="w-4 h-4" />
                Criar Campanha
              </Button>
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Campanhas</h3>
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="glass-card rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm truncate">{campaign.name}</h4>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {campaign.message_template}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {campaign.sent_count}/{campaign.target_count}
                        </span>
                        {campaign.image_url && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Imagem
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {campaign.status === 'draft' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testCampaign(campaign.id)}
                            disabled={testingCampaign === campaign.id}
                            className="h-7 w-7 p-0"
                          >
                            {testingCampaign === campaign.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <TestTube className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => startCampaign(campaign.id)}
                            disabled={sendingCampaign === campaign.id}
                            className="h-7 w-7 p-0"
                          >
                            {sendingCampaign === campaign.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-1.5 hover:bg-destructive/20 rounded-lg text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intro Modal */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Modo Marketing
            </DialogTitle>
            <DialogDescription>Funcionalidades do módulo</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-2">
            {[
              { icon: Send, title: 'Disparo em Massa', desc: 'Envie para múltiplos contatos' },
              { icon: FileSpreadsheet, title: 'Importar Contatos', desc: 'Via CSV ou em massa' },
              { icon: ImageIcon, title: 'Imagens e Botões', desc: 'Adicione mídia às mensagens' },
              { icon: Sparkles, title: 'IA para Mensagens', desc: 'Gere mensagens persuasivas' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-xs">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 flex items-start gap-2 mt-2">
              <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                <strong className="text-yellow-500">Atenção:</strong> Envio em massa pode resultar em bloqueio.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowIntroModal(false)} size="sm" className="flex-1">
              Cancelar
            </Button>
            <Button variant="hero" onClick={confirmEnableMarketing} size="sm" className="flex-1">
              <Power className="w-3 h-3" />
              Ativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Gerar Mensagem com IA
            </DialogTitle>
            <DialogDescription>Crie mensagens de marketing persuasivas</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Descreva o objetivo da campanha
              </label>
              <Textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Ex: Promoção de 20% em cortes durante o mês de janeiro, foco em novos clientes..."
                rows={3}
                className="text-sm"
              />
            </div>

            <Button 
              onClick={() => generateWithAI('generate')} 
              disabled={aiGenerating || !aiContext.trim()}
              className="w-full"
            >
              {aiGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Gerar Mensagem
            </Button>

            {generatedMessage && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Mensagem Gerada</label>
                  <div className="bg-secondary/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {generatedMessage}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Quer melhorar? Descreva o que ajustar
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={aiFeedback}
                      onChange={(e) => setAiFeedback(e.target.value)}
                      placeholder="Ex: mais curta, mais urgente, adicionar emoji..."
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateWithAI('improve')}
                      disabled={aiGenerating}
                      className="h-8"
                    >
                      {aiGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button variant="hero" onClick={applyGeneratedMessage} className="w-full">
                  <CheckCircle className="w-4 h-4" />
                  Usar Esta Mensagem
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contacts Modal */}
      <Dialog open={showContactsModal} onOpenChange={setShowContactsModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Gerenciar Contatos
            </DialogTitle>
            <DialogDescription>
              {contacts.length}/{settings?.max_contacts || 100} contatos
            </DialogDescription>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {[
              { id: 'manual', label: 'Manual' },
              { id: 'bulk', label: 'Em Massa' },
              { id: 'csv', label: 'CSV' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setContactsTab(tab.id as any)}
                className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  contactsTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 py-2">
            {contactsTab === 'manual' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={contactInput.phone}
                    onChange={(e) => setContactInput(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Telefone"
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    value={contactInput.name}
                    onChange={(e) => setContactInput(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome"
                    className="flex-1 h-8 text-sm"
                  />
                </div>
                <Button variant="hero" onClick={addManualContact} size="sm" className="w-full">
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>
            )}

            {contactsTab === 'bulk' && (
              <div className="space-y-2">
                <Textarea
                  value={bulkContacts}
                  onChange={(e) => setBulkContacts(e.target.value)}
                  placeholder={`5511999999999, João\n5511888888888, Maria`}
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">telefone, nome - um por linha</p>
                <Button variant="hero" onClick={handleBulkAdd} size="sm" className="w-full">
                  <Plus className="w-3 h-3" />
                  Adicionar Todos
                </Button>
              </div>
            )}

            {contactsTab === 'csv' && (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
                  <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-2">CSV ou TXT</p>
                  <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
                    <Upload className="w-3 h-3" />
                    Escolher
                  </Button>
                </div>
              </div>
            )}

            {contacts.length > 0 && (
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Adicionados</span>
                  <button onClick={() => setContacts([])} className="text-[10px] text-destructive hover:underline">
                    Limpar
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-secondary/30 rounded text-xs">
                      <span className="truncate">{contact.name} - {contact.phone}</span>
                      <button onClick={() => removeContact(contact.phone)} className="p-0.5 hover:bg-destructive/20 rounded text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => setShowContactsModal(false)} size="sm" className="w-full">
            Concluído
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
