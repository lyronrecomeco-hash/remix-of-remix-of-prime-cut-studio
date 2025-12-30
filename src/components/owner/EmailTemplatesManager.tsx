import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Mail, Edit, Save, X, Eye, Sparkles, Loader2, ShieldCheck, Key, Link2, 
  UserPlus, AlertTriangle, Image, Type, FileText, MousePointer, Copy, Check, 
  Webhook, ExternalLink, Palette, Send, RefreshCw, Plus, Megaphone, Gift, 
  Bell, Calendar, Users, Trash2
} from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailTemplate {
  id: string;
  template_type: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateConfig {
  logoUrl: string;
  headerIcon: string;
  headerTitle: string;
  headerBgColor: string;
  contentTitle: string;
  contentText: string;
  buttonText: string;
  buttonUrl: string;
  buttonBgColor: string;
  expirationText: string;
  footerText: string;
  footerSubtext: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

interface UserForEmail {
  id: string;
  email: string;
  name: string;
  selected: boolean;
}

// All available template types
const TEMPLATE_TYPES = [
  { value: 'auth_confirm', label: 'Confirmação de Email', icon: ShieldCheck, description: 'Email enviado após cadastro' },
  { value: 'auth_reset', label: 'Recuperação de Senha', icon: Key, description: 'Email para redefinir senha' },
  { value: 'auth_magic_link', label: 'Link Mágico', icon: Link2, description: 'Acesso sem senha' },
  { value: 'auth_invite', label: 'Convite de Usuário', icon: UserPlus, description: 'Convite para novos usuários' },
  { value: 'welcome', label: 'Boas-Vindas', icon: Gift, description: 'Email após confirmação de email' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Campanhas e promoções' },
  { value: 'reminder', label: 'Lembrete', icon: Bell, description: 'Lembretes de agendamento' },
  { value: 'newsletter', label: 'Newsletter', icon: Mail, description: 'Novidades e atualizações' },
  { value: 'appointment', label: 'Confirmação de Agendamento', icon: Calendar, description: 'Confirmação de horário marcado' },
  { value: 'custom', label: 'Personalizado', icon: FileText, description: 'Template customizado' },
];

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  
  // Send email modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null);
  const [usersForEmail, setUsersForEmail] = useState<UserForEmail[]>([]);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  
  // New template state
  const [newTemplateType, setNewTemplateType] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    logoUrl: '',
    headerIcon: '✨',
    headerTitle: 'Barber Studio',
    headerBgColor: '#c9a227',
    contentTitle: '',
    contentText: '',
    buttonText: '',
    buttonUrl: '{{confirmation_url}}',
    buttonBgColor: '#c9a227',
    expirationText: 'Este link expira em 24 horas.',
    footerText: 'Barber Studio - Tradição e Estilo',
    footerSubtext: 'Se você não solicitou este email, pode ignorá-lo.',
  });

  useEffect(() => {
    fetchTemplates();
    generateWebhookUrl();
    fetchWebhookEvents();
    
    const interval = setInterval(() => {
      fetchWebhookEvents();
      setLastRefresh(new Date());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const generateWebhookUrl = () => {
    const projectId = 'wvnszzrvrrueuycrpgyc';
    const webhookEndpoint = `https://${projectId}.supabase.co/functions/v1/resend-webhook`;
    setWebhookUrl(webhookEndpoint);
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      toast.success('URL copiada!');
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const fetchWebhookEvents = async () => {
    try {
      const { data: webhookData, error: webhookError } = await supabase
        .from('email_webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!webhookError && webhookData && webhookData.length > 0) {
        setWebhookEvents(webhookData.map(event => ({
          id: event.id,
          type: event.event_type,
          created_at: event.created_at || new Date().toISOString(),
          data: { email: event.recipient_email, ...(event.payload as Record<string, unknown>) }
        })));
        return;
      }

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setWebhookEvents(data.map(log => ({
          id: log.id,
          type: log.status === 'sent' ? 'email.sent' : log.status === 'delivered' ? 'email.delivered' : 'email.bounced',
          created_at: log.sent_at,
          data: { email: log.recipient_email, template: log.template_type }
        })));
      }
    } catch (error) {
      console.error('Error fetching webhook events:', error);
    }
  };

  const sendTestEmail = async (templateType: string) => {
    if (!testEmail) {
      toast.error('Digite um email para teste');
      return;
    }
    
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { email: testEmail, templateType }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Email de teste enviado!');
      fetchWebhookEvents();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Erro ao enviar email de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;

      const parsedTemplates = (data || []).map(t => ({
        ...t,
        variables: typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables || []
      }));

      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersForEmail = async () => {
    try {
      // Get confirmed users from email_confirmation_tokens
      const { data: confirmedUsers, error } = await supabase
        .from('email_confirmation_tokens')
        .select('email, user_id')
        .not('confirmed_at', 'is', null);

      if (error) throw error;

      // Also try to get from user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]) || []);

      const users: UserForEmail[] = (confirmedUsers || []).map(u => ({
        id: u.user_id,
        email: u.email,
        name: profileMap.get(u.user_id) || u.email.split('@')[0],
        selected: false
      }));

      // Remove duplicates by email
      const uniqueUsers = users.filter((u, i, arr) => arr.findIndex(x => x.email === u.email) === i);
      
      setUsersForEmail(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const parseHtmlToConfig = (html: string, templateType: string): TemplateConfig => {
    const urlVar = getUrlVariable(templateType);
    const defaults = getDefaultConfig(templateType);
    
    // Extract icon
    const iconMatch = html.match(/<div class="icon">([^<]*)<\/div>/);
    
    // Extract header title
    const headerTitleMatch = html.match(/<div class="header">[\s\S]*?<h1[^>]*>([^<]*)<\/h1>/);
    
    // Extract content title (h2 inside content div)
    const contentTitleMatch = html.match(/<div class="content">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/);
    
    // Extract content text (p inside content div, after h2)
    const contentTextMatch = html.match(/<div class="content">[\s\S]*?<h2[^>]*>[\s\S]*?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    
    // Extract button text
    const buttonTextMatch = html.match(/<a[^>]*class="button"[^>]*>([\s\S]*?)<\/a>/);
    
    // Extract button URL
    const buttonUrlMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*class="button"/);
    
    // Extract header color - look for linear-gradient with the color
    const headerColorMatch = html.match(/\.header\s*\{[^}]*linear-gradient\s*\([^,]*,\s*([#][0-9a-fA-F]{6})/);
    // Fallback: look for background-color
    const headerColorFallback = html.match(/\.header\s*\{[^}]*background(?:-color)?:\s*([#][0-9a-fA-F]{6})/);
    
    // Extract button color
    const buttonColorMatch = html.match(/\.button\s*\{[^}]*linear-gradient\s*\([^,]*,\s*([#][0-9a-fA-F]{6})/);
    const buttonColorFallback = html.match(/\.button\s*\{[^}]*background(?:-color)?:\s*([#][0-9a-fA-F]{6})/);
    
    // Extract logo URL
    const logoMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="logo"/);
    
    // Extract expiration text
    const expirationMatch = html.match(/class="expiration"[^>]*>[\s\S]*?<strong>⏱\s*([\s\S]*?)<\/strong>/);
    
    // Extract footer text
    const footerTextMatch = html.match(/<div class="footer">[\s\S]*?<p><strong>([\s\S]*?)<\/strong><\/p>/);
    
    // Extract footer subtext
    const footerSubtextMatch = html.match(/<div class="footer">[\s\S]*?<strong>[\s\S]*?<\/strong><\/p>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    
    return {
      logoUrl: logoMatch?.[1] || '',
      headerIcon: iconMatch?.[1] || defaults.headerIcon || '✨',
      headerTitle: headerTitleMatch?.[1]?.trim() || defaults.headerTitle || 'Barber Studio',
      headerBgColor: headerColorMatch?.[1] || headerColorFallback?.[1] || '#c9a227',
      contentTitle: contentTitleMatch?.[1]?.trim() || defaults.contentTitle || '',
      contentText: contentTextMatch?.[1]?.trim() || defaults.contentText || '',
      buttonText: buttonTextMatch?.[1]?.trim() || defaults.buttonText || 'Clique Aqui',
      buttonUrl: buttonUrlMatch?.[1] || `{{${urlVar}}}`,
      buttonBgColor: buttonColorMatch?.[1] || buttonColorFallback?.[1] || '#c9a227',
      expirationText: expirationMatch?.[1]?.trim() || defaults.expirationText || '',
      footerText: footerTextMatch?.[1]?.trim() || 'Barber Studio - Tradição e Estilo',
      footerSubtext: footerSubtextMatch?.[1]?.trim() || 'Se você não solicitou este email, pode ignorá-lo.',
    };
  };

  const getUrlVariable = (templateType: string): string => {
    switch (templateType) {
      case 'auth_confirm': return 'confirmation_url';
      case 'auth_reset': return 'reset_url';
      case 'auth_magic_link': return 'magic_link_url';
      case 'auth_invite': return 'invite_url';
      case 'welcome': return 'dashboard_url';
      case 'marketing': return 'promo_url';
      case 'reminder': return 'appointment_url';
      case 'appointment': return 'appointment_url';
      default: return 'action_url';
    }
  };

  const getDefaultVariables = (templateType: string): string[] => {
    const baseVars = ['name', 'email', 'first_name', 'last_name', 'phone', 'company_name', 'current_date', 'current_year'];
    switch (templateType) {
      case 'auth_confirm': return [...baseVars, 'confirmation_url', 'token'];
      case 'auth_reset': return [...baseVars, 'reset_url', 'token', 'expires_in'];
      case 'auth_magic_link': return [...baseVars, 'magic_link_url', 'token'];
      case 'auth_invite': return [...baseVars, 'invite_url', 'inviter_name', 'role'];
      case 'welcome': return [...baseVars, 'dashboard_url', 'account_created_at'];
      case 'marketing': return [...baseVars, 'promo_url', 'discount_code', 'discount_percent', 'offer_expires', 'product_name'];
      case 'reminder': return [...baseVars, 'appointment_url', 'date', 'time', 'service', 'service_price', 'location', 'barber'];
      case 'appointment': return [...baseVars, 'appointment_url', 'date', 'time', 'service', 'service_price', 'service_duration', 'barber', 'location', 'protocol'];
      case 'newsletter': return [...baseVars, 'unsubscribe_url', 'newsletter_title', 'edition_number'];
      default: return [...baseVars, 'action_url', 'custom_field_1', 'custom_field_2'];
    }
  };

  const getDefaultConfig = (templateType: string): Partial<TemplateConfig> => {
    switch (templateType) {
      case 'auth_confirm':
        return {
          headerIcon: '✨',
          headerTitle: 'Barber Studio',
          contentTitle: 'Confirme seu Email',
          contentText: 'Obrigado por se cadastrar! Clique no botão abaixo para confirmar seu email e ativar sua conta.',
          buttonText: 'Confirmar Email',
          expirationText: 'Este link expira em 24 horas.',
        };
      case 'auth_reset':
        return {
          headerIcon: '🔐',
          headerTitle: 'Barber Studio',
          contentTitle: 'Redefinir sua Senha',
          contentText: 'Recebemos sua solicitação de redefinição de senha. Clique no botão abaixo para criar uma nova senha segura.',
          buttonText: 'Redefinir Senha',
          expirationText: 'Este link expira em 1 hora.',
        };
      case 'auth_magic_link':
        return {
          headerIcon: '🔗',
          headerTitle: 'Barber Studio',
          contentTitle: 'Seu Link de Acesso',
          contentText: 'Use o botão abaixo para acessar sua conta de forma segura, sem precisar de senha.',
          buttonText: 'Acessar Conta',
          expirationText: 'Este link expira em 1 hora.',
        };
      case 'auth_invite':
        return {
          headerIcon: '🎉',
          headerTitle: 'Barber Studio',
          contentTitle: 'Você foi Convidado!',
          contentText: 'Você foi convidado para fazer parte da equipe da Barber Studio! Clique no botão abaixo para aceitar o convite.',
          buttonText: 'Aceitar Convite',
          expirationText: 'Este link expira em 7 dias.',
        };
      case 'welcome':
        return {
          headerIcon: '🎊',
          headerTitle: 'Barber Studio',
          contentTitle: 'Bem-vindo à Família!',
          contentText: 'Sua conta foi confirmada com sucesso! Estamos muito felizes em ter você conosco. Explore nossos serviços e agende seu primeiro horário.',
          buttonText: 'Acessar Minha Conta',
          expirationText: '',
        };
      case 'marketing':
        return {
          headerIcon: '🎁',
          headerTitle: 'Barber Studio',
          contentTitle: 'Oferta Especial Para Você!',
          contentText: 'Temos uma promoção exclusiva esperando por você. Não perca essa oportunidade!',
          buttonText: 'Ver Promoção',
          expirationText: 'Válido por tempo limitado.',
        };
      case 'reminder':
        return {
          headerIcon: '⏰',
          headerTitle: 'Barber Studio',
          contentTitle: 'Lembrete de Agendamento',
          contentText: 'Este é um lembrete do seu horário marcado. Estamos te esperando!',
          buttonText: 'Ver Detalhes',
          expirationText: '',
        };
      case 'appointment':
        return {
          headerIcon: '📅',
          headerTitle: 'Barber Studio',
          contentTitle: 'Agendamento Confirmado!',
          contentText: 'Seu horário foi confirmado com sucesso. Confira os detalhes abaixo.',
          buttonText: 'Ver Agendamento',
          expirationText: '',
        };
      case 'newsletter':
        return {
          headerIcon: '📰',
          headerTitle: 'Barber Studio',
          contentTitle: 'Novidades da Semana',
          contentText: 'Confira as últimas novidades e dicas exclusivas da Barber Studio.',
          buttonText: 'Ler Mais',
          expirationText: '',
        };
      default:
        return {
          headerIcon: '✉️',
          headerTitle: 'Barber Studio',
          contentTitle: 'Título do Email',
          contentText: 'Conteúdo do email vai aqui.',
          buttonText: 'Clique Aqui',
          expirationText: '',
        };
    }
  };

  const generateHtmlFromConfig = (config: TemplateConfig): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, ${config.headerBgColor} 0%, ${adjustColor(config.headerBgColor, 20)} 50%, ${config.headerBgColor} 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; font-weight: bold; }
    .header .icon { font-size: 48px; margin-bottom: 15px; }
    .header .logo { max-width: 150px; margin-bottom: 15px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #ffffff; margin-top: 0; font-size: 22px; }
    .content p { color: #a0a0a0; line-height: 1.8; font-size: 15px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, ${config.buttonBgColor} 0%, ${adjustColor(config.buttonBgColor, 20)} 100%); color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3); }
    .link-box { background-color: #252525; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
    .link-box p { color: #666; font-size: 11px; margin: 0; }
    .footer { background-color: #0f0f0f; color: #666; padding: 25px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #333, transparent); margin: 25px 0; }
    .expiration { color: ${config.buttonBgColor}; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="logo" />` : `<div class="icon">${config.headerIcon}</div>`}
      <h1>${config.headerTitle}</h1>
    </div>
    <div class="content">
      <h2>${config.contentTitle}</h2>
      <p>${config.contentText}</p>
      <div class="button-container">
        <a href="${config.buttonUrl}" class="button">${config.buttonText}</a>
      </div>
      ${config.expirationText ? `
      <div class="divider"></div>
      <p style="font-size: 13px;">Ou copie e cole este link no seu navegador:</p>
      <div class="link-box">
        <p>${config.buttonUrl}</p>
      </div>
      <p class="expiration"><strong>⏱ ${config.expirationText}</strong></p>
      ` : ''}
    </div>
    <div class="footer">
      <p><strong>${config.footerText}</strong></p>
      <p>${config.footerSubtext}</p>
      <p>© ${new Date().getFullYear()} Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;
  };

  const adjustColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    const config = parseHtmlToConfig(template.html_content, template.template_type);
    setTemplateConfig(config);
    setEditingTemplate(template);
    setAiPrompt('');
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setNewTemplateType('');
    setNewTemplateName('');
    setNewTemplateSubject('');
    setIsCreating(true);
    setEditingTemplate(null);
  };

  const handleStartCreating = () => {
    if (!newTemplateType || !newTemplateName || !newTemplateSubject) {
      toast.error('Preencha todos os campos');
      return;
    }

    const defaults = getDefaultConfig(newTemplateType);
    const urlVar = getUrlVariable(newTemplateType);
    
    const config: TemplateConfig = {
      logoUrl: '',
      headerIcon: defaults.headerIcon || '✨',
      headerTitle: defaults.headerTitle || 'Barber Studio',
      headerBgColor: '#c9a227',
      contentTitle: defaults.contentTitle || 'Título',
      contentText: defaults.contentText || 'Conteúdo do email',
      buttonText: defaults.buttonText || 'Clique Aqui',
      buttonUrl: `{{${urlVar}}}`,
      buttonBgColor: '#c9a227',
      expirationText: defaults.expirationText || '',
      footerText: 'Barber Studio - Tradição e Estilo',
      footerSubtext: 'Se você não solicitou este email, pode ignorá-lo.',
    };

    setTemplateConfig(config);
    
    const newTemplate: EmailTemplate = {
      id: '', // Will be created on save
      template_type: newTemplateType,
      name: newTemplateName,
      subject: newTemplateSubject,
      html_content: generateHtmlFromConfig(config),
      variables: getDefaultVariables(newTemplateType),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditingTemplate(newTemplate);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setIsSaving(true);
    try {
      const html = generateHtmlFromConfig(templateConfig);
      
      console.log('Saving template:', {
        id: editingTemplate.id,
        name: editingTemplate.name,
        type: editingTemplate.template_type,
        configSnapshot: templateConfig
      });
      
      if (editingTemplate.id) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: editingTemplate.name,
            subject: editingTemplate.subject,
            html_content: html,
            is_active: editingTemplate.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        toast.success('Template atualizado com sucesso!');
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_type: editingTemplate.template_type,
            name: editingTemplate.name,
            subject: editingTemplate.subject,
            html_content: html,
            variables: editingTemplate.variables,
            is_active: editingTemplate.is_active,
          });

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        toast.success('Template criado com sucesso!');
      }
      
      await fetchTemplates();
      setEditingTemplate(null);
      setIsCreating(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast.success('Template excluído!');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Erro ao excluir template');
    }
  };

  const handlePreview = () => {
    const html = generateHtmlFromConfig(templateConfig);
    let previewContent = html;
    
    const exampleValues: Record<string, string> = {
      // URLs
      confirmation_url: 'https://suaapp.com/email-confirmado',
      reset_url: 'https://suaapp.com/auth/reset?token=xyz789',
      magic_link_url: 'https://suaapp.com/auth/callback?token=magic123',
      invite_url: 'https://suaapp.com/auth/invite?token=invite456',
      dashboard_url: 'https://suaapp.com/dashboard',
      promo_url: 'https://suaapp.com/promo/especial',
      appointment_url: 'https://suaapp.com/agendamento/12345',
      action_url: 'https://suaapp.com/action',
      unsubscribe_url: 'https://suaapp.com/unsubscribe',
      // Dados pessoais
      email: 'usuario@exemplo.com',
      name: 'João Silva',
      first_name: 'João',
      last_name: 'Silva',
      phone: '(11) 99999-9999',
      // Empresa
      company_name: 'Barber Studio',
      // Datas e tempo
      current_date: new Date().toLocaleDateString('pt-BR'),
      current_year: new Date().getFullYear().toString(),
      account_created_at: new Date().toLocaleDateString('pt-BR'),
      expires_in: '24 horas',
      // Agendamento
      date: '15/01/2025',
      time: '14:00',
      service: 'Corte + Barba',
      service_price: 'R$ 75,00',
      service_duration: '45 minutos',
      barber: 'Carlos',
      location: 'Rua das Flores, 123',
      protocol: 'AGD-2025-0001',
      // Marketing
      discount_code: 'PROMO2025',
      discount_percent: '20%',
      offer_expires: '31/01/2025',
      product_name: 'Combo Premium',
      // Convites
      inviter_name: 'Admin',
      role: 'Colaborador',
      // Token
      token: 'abc123xyz789',
      // Newsletter
      newsletter_title: 'Novidades de Janeiro',
      edition_number: '#42',
      // Custom
      custom_field_1: 'Valor Personalizado 1',
      custom_field_2: 'Valor Personalizado 2',
    };

    Object.entries(exampleValues).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    setPreviewHtml(previewContent);
    setShowPreview(true);
  };

  const handleOpenSendModal = async (template: EmailTemplate) => {
    setSendingTemplate(template);
    setShowSendModal(true);
    setSelectAllUsers(false);
    await fetchUsersForEmail();
  };

  const handleToggleUserSelection = (userId: string) => {
    setUsersForEmail(prev => prev.map(u => 
      u.id === userId ? { ...u, selected: !u.selected } : u
    ));
  };

  const handleToggleSelectAll = () => {
    const newValue = !selectAllUsers;
    setSelectAllUsers(newValue);
    setUsersForEmail(prev => prev.map(u => ({ ...u, selected: newValue })));
  };

  const handleSendEmails = async () => {
    if (!sendingTemplate) return;

    const selectedUsers = usersForEmail.filter(u => u.selected);
    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um usuário');
      return;
    }

    setIsSendingEmails(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          templateId: sendingTemplate.id,
          templateType: sendingTemplate.template_type,
          recipients: selectedUsers.map(u => ({ email: u.email, name: u.name }))
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${selectedUsers.length} email(s) enviado(s) com sucesso!`);
      setShowSendModal(false);
      fetchWebhookEvents();
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error(error.message || 'Erro ao enviar emails');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite uma descrição para a IA');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const templateType = editingTemplate?.template_type || 'custom';
      
      const { data, error } = await supabase.functions.invoke('generate-email-template', {
        body: {
          prompt: aiPrompt,
          templateType,
          currentConfig: {
            headerTitle: templateConfig.headerTitle,
            contentTitle: templateConfig.contentTitle,
            contentText: templateConfig.contentText,
            buttonText: templateConfig.buttonText,
            headerBgColor: templateConfig.headerBgColor,
            buttonBgColor: templateConfig.buttonBgColor,
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.config) {
        const aiConfig = data.config;
        
        setTemplateConfig(prev => ({
          ...prev,
          headerTitle: aiConfig.headerTitle || prev.headerTitle,
          headerIcon: aiConfig.headerIcon || prev.headerIcon,
          contentTitle: aiConfig.contentTitle || prev.contentTitle,
          contentText: aiConfig.contentText || prev.contentText,
          buttonText: aiConfig.buttonText || prev.buttonText,
          headerBgColor: aiConfig.headerBgColor || prev.headerBgColor,
          buttonBgColor: aiConfig.buttonBgColor || prev.buttonBgColor,
          footerText: aiConfig.footerText || prev.footerText,
          expirationText: aiConfig.expirationText || prev.expirationText,
        }));

        toast.success('Template gerado com IA! Clique em Preview para ver.');
        
        // Auto show preview
        setTimeout(() => {
          handlePreview();
        }, 500);
      } else {
        throw new Error(data?.error || 'Erro ao gerar template');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Erro ao gerar com IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getTemplateTypeLabel = (type: string): string => {
    return TEMPLATE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getTemplateIcon = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type)?.icon || Mail;
  };

  const getTemplateDescription = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type)?.description || 'Template de email';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Templates de Email</h2>
          <p className="text-sm text-muted-foreground">Personalize e envie emails para seus usuários</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </div>

      {/* Info Alert */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Integração com Resend</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os templates são enviados via <strong>Resend</strong>. Variáveis como <code className="text-xs bg-muted px-1 rounded">{'{{name}}'}</code> são substituídas automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhooks Resend</CardTitle>
              <CardDescription>Receba eventos de email em tempo real</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">URL do Webhook</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-secondary/50 rounded-lg border border-border font-mono text-sm break-all">
                {webhookUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
                className="flex-shrink-0"
              >
                {copiedWebhook ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copie esta URL e adicione no painel do Resend em{' '}
              <a 
                href="https://resend.com/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                resend.com/webhooks
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Testar Envio de Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Digite seu email para teste"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => sendTestEmail('auth_confirm')}
                disabled={isSendingTest || !testEmail}
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Eventos Recentes</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Auto-refresh: {lastRefresh.toLocaleTimeString('pt-BR')}</span>
              </div>
            </div>
            {webhookEvents.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {webhookEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={event.type.includes('delivered') || event.type.includes('sent') ? 'default' : 'destructive'} className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground text-xs">{(event.data as any).email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2 text-center">
                Nenhum evento registrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const IconComponent = getTemplateIcon(template.template_type);
          return (
            <Card key={template.id} className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {getTemplateDescription(template.template_type)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Assunto:</p>
                  <p className="text-sm text-foreground">{template.subject}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenSendModal(template)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create New Template Modal */}
      <Modal
        isOpen={isCreating && !editingTemplate}
        onClose={() => setIsCreating(false)}
        title="Criar Novo Template"
        size="md"
      >
        <ModalBody className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo do Template</Label>
            <Select value={newTemplateType} onValueChange={setNewTemplateType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {newTemplateType && (
              <p className="text-xs text-muted-foreground">
                {TEMPLATE_TYPES.find(t => t.value === newTemplateType)?.description}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Nome do Template</Label>
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Ex: Boas-Vindas Premium"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Assunto do Email</Label>
            <Input
              value={newTemplateSubject}
              onChange={(e) => setNewTemplateSubject(e.target.value)}
              placeholder="Ex: Bem-vindo à Barber Studio!"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Cancelar
          </Button>
          <Button onClick={handleStartCreating}>
            Continuar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => { setEditingTemplate(null); setIsCreating(false); }}
        title={editingTemplate?.id ? `Editar: ${editingTemplate?.name}` : `Criar: ${editingTemplate?.name}`}
        size="xl"
      >
        {editingTemplate && (
          <>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="ai" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Modo IA
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Conteúdo
                  </TabsTrigger>
                  <TabsTrigger value="header" className="flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    Cabeçalho
                  </TabsTrigger>
                  <TabsTrigger value="button" className="flex items-center gap-1">
                    <MousePointer className="w-3 h-3" />
                    Botão
                  </TabsTrigger>
                </TabsList>

                {/* AI Tab - Now First */}
                <TabsContent value="ai" className="space-y-4">
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-500">Gerar Template Completo com IA</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Descreva sua ideia e a IA irá gerar o template completo: cores, textos, cabeçalho e botão!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label>Descreva como você quer o template</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={`Ex: Quero um template moderno com cores roxas e azuis, tom amigável e jovem, mencionando que somos a melhor barbearia da cidade...

Ou: Template minimalista e elegante, cores preto e dourado, texto formal e sofisticado para clientes VIP...`}
                      className="min-h-[140px]"
                    />
                  </div>

                  <Button
                    onClick={generateWithAI}
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando Template Completo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar com IA e Ver Preview
                      </>
                    )}
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Exemplos de prompts:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Moderno e jovem com cores vibrantes',
                        'Elegante e sofisticado com dourado',
                        'Minimalista preto e branco',
                        'Acolhedor e casual para jovens',
                        'Profissional e corporativo',
                        'Festivo com tema de promoção',
                      ].map((example, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2"
                          onClick={() => setAiPrompt(example)}
                        >
                          <span className="text-xs">{example}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Template</Label>
                      <Input
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assunto do Email</Label>
                      <Input
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Título do Conteúdo
                    </Label>
                    <Input
                      value={templateConfig.contentTitle}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, contentTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Texto Principal
                    </Label>
                    <Textarea
                      value={templateConfig.contentText}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, contentText: e.target.value })}
                      onPaste={(e) => {
                        e.preventDefault();
                        const clipboardData = e.clipboardData;
                        
                        // Try to get HTML formatted content first
                        const htmlData = clipboardData.getData('text/html');
                        const plainText = clipboardData.getData('text/plain');
                        
                        let formattedText = plainText;
                        
                        if (htmlData) {
                          // Parse HTML and convert to simplified HTML for email
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(htmlData, 'text/html');
                          const body = doc.body;
                          
                          // Extract text with basic formatting preserved
                          const extractFormattedText = (node: Node): string => {
                            let result = '';
                            
                            node.childNodes.forEach((child) => {
                              if (child.nodeType === Node.TEXT_NODE) {
                                result += child.textContent;
                              } else if (child.nodeType === Node.ELEMENT_NODE) {
                                const element = child as HTMLElement;
                                const tagName = element.tagName.toLowerCase();
                                
                                switch (tagName) {
                                  case 'br':
                                    result += '<br/>';
                                    break;
                                  case 'p':
                                  case 'div':
                                    result += extractFormattedText(element) + '<br/><br/>';
                                    break;
                                  case 'strong':
                                  case 'b':
                                    result += '<strong>' + extractFormattedText(element) + '</strong>';
                                    break;
                                  case 'em':
                                  case 'i':
                                    result += '<em>' + extractFormattedText(element) + '</em>';
                                    break;
                                  case 'u':
                                    result += '<u>' + extractFormattedText(element) + '</u>';
                                    break;
                                  case 'ul':
                                  case 'ol':
                                    result += extractFormattedText(element);
                                    break;
                                  case 'li':
                                    result += '• ' + extractFormattedText(element) + '<br/>';
                                    break;
                                  case 'h1':
                                  case 'h2':
                                  case 'h3':
                                  case 'h4':
                                    result += '<strong>' + extractFormattedText(element) + '</strong><br/><br/>';
                                    break;
                                  case 'a':
                                    const href = element.getAttribute('href');
                                    result += href ? `<a href="${href}">${extractFormattedText(element)}</a>` : extractFormattedText(element);
                                    break;
                                  default:
                                    result += extractFormattedText(element);
                                }
                              }
                            });
                            
                            return result;
                          };
                          
                          formattedText = extractFormattedText(body)
                            .replace(/<br\/><br\/><br\/>/g, '<br/><br/>')
                            .replace(/^\s*<br\/>/g, '')
                            .replace(/<br\/>\s*$/g, '')
                            .trim();
                        } else if (plainText) {
                          // Convert plain text line breaks to HTML
                          formattedText = plainText
                            .split(/\n\n+/)
                            .map(paragraph => paragraph.trim())
                            .filter(p => p.length > 0)
                            .join('<br/><br/>');
                          
                          // Convert single line breaks within paragraphs
                          formattedText = formattedText.replace(/\n/g, '<br/>');
                        }
                        
                        // Combine with existing text at cursor position
                        const textarea = e.target as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const currentValue = templateConfig.contentText;
                        
                        const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
                        setTemplateConfig({ ...templateConfig, contentText: newValue });
                      }}
                      className="min-h-[100px] font-mono text-sm"
                      placeholder="Cole texto formatado aqui - negrito, itálico, listas e parágrafos serão preservados"
                    />
                    <p className="text-xs text-muted-foreground">
                      Suporta formatação HTML: &lt;strong&gt;, &lt;em&gt;, &lt;br/&gt;, &lt;a&gt;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto de Expiração</Label>
                      <Input
                        value={templateConfig.expirationText}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, expirationText: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={editingTemplate.is_active}
                        onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, is_active: checked })}
                      />
                      <Label>Template Ativo</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Texto do Rodapé</Label>
                    <Input
                      value={templateConfig.footerText}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, footerText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtexto do Rodapé</Label>
                    <Input
                      value={templateConfig.footerSubtext}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, footerSubtext: e.target.value })}
                    />
                  </div>

                  {/* Variables Section */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium">Variáveis de Personalização</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Clique em uma variável para copiá-la. Cole no texto principal, assunto ou outros campos.
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {editingTemplate.variables.map((v, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${v}}}`);
                              toast.success(`{{${v}}} copiado!`);
                            }}
                          >
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Header Tab */}
                <TabsContent value="header" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      URL da Logo (opcional)
                    </Label>
                    <Input
                      value={templateConfig.logoUrl}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, logoUrl: e.target.value })}
                      placeholder="https://seusite.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ícone Emoji</Label>
                      <Input
                        value={templateConfig.headerIcon}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerIcon: e.target.value })}
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Título do Cabeçalho</Label>
                      <Input
                        value={templateConfig.headerTitle}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerTitle: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Cor do Cabeçalho
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={templateConfig.headerBgColor}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerBgColor: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.headerBgColor}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerBgColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Quick color presets */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Cores pré-definidas</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { color: '#c9a227', name: 'Dourado' },
                        { color: '#1e40af', name: 'Azul' },
                        { color: '#166534', name: 'Verde' },
                        { color: '#dc2626', name: 'Vermelho' },
                        { color: '#7c3aed', name: 'Roxo' },
                        { color: '#0891b2', name: 'Ciano' },
                        { color: '#ea580c', name: 'Laranja' },
                        { color: '#be185d', name: 'Rosa' },
                        { color: '#1f2937', name: 'Escuro' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition-colors"
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                          onClick={() => setTemplateConfig({ ...templateConfig, headerBgColor: preset.color })}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Button Tab */}
                <TabsContent value="button" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      Texto do Botão
                    </Label>
                    <Input
                      value={templateConfig.buttonText}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, buttonText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link do Botão</Label>
                    <Input
                      value={templateConfig.buttonUrl}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, buttonUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use variáveis como <code className="bg-muted px-1 rounded">{'{{confirmation_url}}'}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Cor do Botão
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={templateConfig.buttonBgColor}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, buttonBgColor: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.buttonBgColor}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, buttonBgColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Quick color presets for button */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Cores pré-definidas</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { color: '#c9a227', name: 'Dourado' },
                        { color: '#1e40af', name: 'Azul' },
                        { color: '#166534', name: 'Verde' },
                        { color: '#dc2626', name: 'Vermelho' },
                        { color: '#7c3aed', name: 'Roxo' },
                        { color: '#0891b2', name: 'Ciano' },
                        { color: '#ea580c', name: 'Laranja' },
                        { color: '#be185d', name: 'Rosa' },
                        { color: '#1f2937', name: 'Escuro' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition-colors"
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                          onClick={() => setTemplateConfig({ ...templateConfig, buttonBgColor: preset.color })}
                        />
                      ))}
                    </div>
                  </div>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Variáveis disponíveis:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {editingTemplate.variables.map((v, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => setTemplateConfig({ ...templateConfig, buttonUrl: `{{${v}}}` })}
                          >
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => { setEditingTemplate(null); setIsCreating(false); }}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handlePreview} variant="secondary">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview do Email"
        size="lg"
      >
        <ModalBody>
          <div className="bg-neutral-900 rounded-lg overflow-hidden border border-border">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px] border-0"
              title="Email Preview"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={`Enviar: ${sendingTemplate?.name}`}
        size="md"
      >
        <ModalBody className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-500">Selecione os Destinatários</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha os usuários que receberão este email. Apenas usuários com email confirmado são listados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <Checkbox 
              checked={selectAllUsers}
              onCheckedChange={handleToggleSelectAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="cursor-pointer">
              Selecionar Todos ({usersForEmail.length} usuários)
            </Label>
          </div>

          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {usersForEmail.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário com email confirmado encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {usersForEmail.map((user) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      user.selected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleToggleUserSelection(user.id)}
                  >
                    <Checkbox checked={user.selected} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {usersForEmail.filter(u => u.selected).length} selecionado(s)
            </span>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowSendModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSendEmails} 
            disabled={isSendingEmails || usersForEmail.filter(u => u.selected).length === 0}
          >
            {isSendingEmails ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Emails
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EmailTemplatesManager;
