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
import { Mail, Edit, Save, X, Eye, Sparkles, Loader2, ShieldCheck, Key, Link2, UserPlus, AlertTriangle, Image, Type, FileText, MousePointer, Copy, Check, Webhook, ExternalLink, Palette, Send, RefreshCw } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
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
    
    // Auto-refresh webhook events every 10 seconds
    const interval = setInterval(() => {
      fetchWebhookEvents();
      setLastRefresh(new Date());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const generateWebhookUrl = () => {
    // Get current domain automatically
    const domain = window.location.origin;
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
      // First try to fetch from email_webhook_events (real webhook events)
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

      // Fallback to email_logs if no webhook events
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

  const parseHtmlToConfig = (html: string, templateType: string): TemplateConfig => {
    const urlVar = getUrlVariable(templateType);
    const defaults = getDefaultConfig(templateType);
    
    // Try to extract values from HTML
    const iconMatch = html.match(/<div class="icon">([^<]*)<\/div>/);
    const headerTitleMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/);
    const contentTitleMatch = html.match(/<h2[^>]*>([^<]*)<\/h2>/);
    const buttonTextMatch = html.match(/<a[^>]*class="button"[^>]*>([^<]*)<\/a>/);
    
    return {
      logoUrl: '',
      headerIcon: iconMatch?.[1] || defaults.headerIcon,
      headerTitle: headerTitleMatch?.[1] || defaults.headerTitle,
      headerBgColor: '#c9a227',
      contentTitle: contentTitleMatch?.[1] || defaults.contentTitle,
      contentText: defaults.contentText,
      buttonText: buttonTextMatch?.[1] || defaults.buttonText,
      buttonUrl: `{{${urlVar}}}`,
      buttonBgColor: '#c9a227',
      expirationText: defaults.expirationText,
      footerText: 'Barber Studio - Tradição e Estilo',
      footerSubtext: 'Se você não solicitou este email, pode ignorá-lo.',
    };
  };

  const getUrlVariable = (templateType: string): string => {
    switch (templateType) {
      case 'auth_confirm': return 'confirmation_url';
      case 'auth_reset': return 'reset_url';
      case 'auth_magic_link': return 'magic_link_url';
      case 'auth_invite': return 'invite_url';
      default: return 'confirmation_url';
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
      default:
        return {};
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
      <div class="divider"></div>
      <p style="font-size: 13px;">Ou copie e cole este link no seu navegador:</p>
      <div class="link-box">
        <p>${config.buttonUrl}</p>
      </div>
      <p class="expiration"><strong>⏱ ${config.expirationText}</strong></p>
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
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const html = generateHtmlFromConfig(templateConfig);
      
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

      if (error) throw error;

      toast.success('Template salvo com sucesso!');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handlePreview = () => {
    const html = generateHtmlFromConfig(templateConfig);
    let previewContent = html;
    
    const exampleValues: Record<string, string> = {
      confirmation_url: 'https://suaapp.com/email-confirmado',
      reset_url: 'https://suaapp.com/auth/reset?token=xyz789',
      magic_link_url: 'https://suaapp.com/auth/callback?token=magic123',
      invite_url: 'https://suaapp.com/auth/invite?token=invite456',
      email: 'usuario@exemplo.com',
      name: 'João Silva',
    };

    Object.entries(exampleValues).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    setPreviewHtml(previewContent);
    setShowPreview(true);
  };

  const generateWithAI = async () => {
    if (!editingTemplate) return;

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-prompt', {
        body: {
          prompt: aiPrompt || `Gere um texto profissional para email de ${getTemplateTypeLabel(editingTemplate.template_type)} de uma barbearia moderna e sofisticada chamada Barber Studio. O texto deve ser acolhedor, profissional e incentivar o usuário a clicar no botão.`,
          type: 'email_template'
        }
      });

      if (error) throw error;

      const generatedText = data?.generatedText || data?.text || '';
      
      if (generatedText) {
        // Parse AI response to extract title and content
        const lines = generatedText.split('\n').filter((l: string) => l.trim());
        const title = lines[0]?.replace(/^#+\s*/, '').trim() || templateConfig.contentTitle;
        const content = lines.slice(1).join(' ').trim() || generatedText;

        setTemplateConfig(prev => ({
          ...prev,
          contentTitle: title.length > 50 ? templateConfig.contentTitle : title,
          contentText: content.substring(0, 500),
        }));

        toast.success('Texto gerado com IA!');
      } else {
        // Fallback to default generation
        const defaults = getDefaultConfig(editingTemplate.template_type);
        setTemplateConfig(prev => ({
          ...prev,
          contentTitle: defaults.contentTitle || prev.contentTitle,
          contentText: defaults.contentText || prev.contentText,
        }));
        toast.success('Template gerado!');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback to defaults
      const defaults = getDefaultConfig(editingTemplate.template_type);
      setTemplateConfig(prev => ({
        ...prev,
        contentTitle: defaults.contentTitle || prev.contentTitle,
        contentText: defaults.contentText || prev.contentText,
      }));
      toast.success('Template gerado com configurações padrão');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getTemplateTypeLabel = (type: string): string => {
    switch (type) {
      case 'auth_confirm': return 'confirmação de email';
      case 'auth_reset': return 'redefinição de senha';
      case 'auth_magic_link': return 'link mágico';
      case 'auth_invite': return 'convite';
      default: return 'email';
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'auth_confirm': return ShieldCheck;
      case 'auth_reset': return Key;
      case 'auth_magic_link': return Link2;
      case 'auth_invite': return UserPlus;
      default: return Mail;
    }
  };

  const getTemplateDescription = (type: string) => {
    switch (type) {
      case 'auth_confirm': return 'Email enviado quando um novo usuário se cadastra';
      case 'auth_reset': return 'Email para recuperação de senha';
      case 'auth_magic_link': return 'Email com link de acesso sem senha';
      case 'auth_invite': return 'Email de convite para novos usuários';
      default: return 'Template de email';
    }
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
          <p className="text-sm text-muted-foreground">Personalize completamente os emails de autenticação</p>
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Integração com Resend</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os templates são enviados via <strong>Resend</strong>. Certifique-se de que a API Key está configurada.
                O link de confirmação <code className="text-xs bg-muted px-1 rounded">{'{{confirmation_url}}'}</code> é inserido automaticamente.
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
            <p className="text-xs text-muted-foreground">
              Envia um email de teste usando o template de confirmação
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Eventos Suportados</Label>
            <div className="flex flex-wrap gap-2">
              {['email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked'].map((event) => (
                <Badge key={event} variant="outline" className="text-xs">
                  {event}
                </Badge>
              ))}
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {webhookEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={event.type.includes('delivered') || event.type.includes('sent') ? 'default' : 'destructive'} className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground">{(event.data as any).email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum evento registrado ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
                <div>
                  <p className="text-xs text-muted-foreground">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Personalizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal - Visual Editor */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title={`Personalizar: ${editingTemplate?.name}`}
        size="xl"
      >
        {editingTemplate && (
          <>
            <ModalBody className="max-h-[70vh] overflow-y-auto">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
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
                  <TabsTrigger value="ai" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </TabsTrigger>
                </TabsList>

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
                        placeholder="Ex: Confirme seu email - Barber Studio"
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
                      placeholder="Ex: Confirme seu Email"
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
                      placeholder="Digite o texto que o usuário verá no email..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto de Expiração</Label>
                      <Input
                        value={templateConfig.expirationText}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, expirationText: e.target.value })}
                        placeholder="Ex: Este link expira em 24 horas."
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
                      placeholder="Ex: Barber Studio - Tradição e Estilo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtexto do Rodapé</Label>
                    <Input
                      value={templateConfig.footerSubtext}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, footerSubtext: e.target.value })}
                      placeholder="Ex: Se você não solicitou este email..."
                    />
                  </div>
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
                    <p className="text-xs text-muted-foreground">
                      Se preenchido, substitui o ícone emoji. Recomendado: 150x50px, fundo transparente.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ícone Emoji (se não usar logo)</Label>
                      <Input
                        value={templateConfig.headerIcon}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerIcon: e.target.value })}
                        placeholder="✨"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Título do Cabeçalho</Label>
                      <Input
                        value={templateConfig.headerTitle}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, headerTitle: e.target.value })}
                        placeholder="Barber Studio"
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
                        placeholder="#c9a227"
                        className="flex-1"
                      />
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
                      placeholder="Ex: Confirmar Email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link do Botão</Label>
                    <Input
                      value={templateConfig.buttonUrl}
                      onChange={(e) => setTemplateConfig({ ...templateConfig, buttonUrl: e.target.value })}
                      placeholder="{{confirmation_url}}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use <code className="bg-muted px-1 rounded">{'{{confirmation_url}}'}</code> para inserir o link de confirmação automaticamente.
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
                        placeholder="#c9a227"
                        className="flex-1"
                      />
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

                {/* AI Tab */}
                <TabsContent value="ai" className="space-y-4">
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-500">Gerar com Inteligência Artificial</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Descreva o tipo de texto que você quer e a IA irá gerar o conteúdo para você.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label>Descreva o que você quer (opcional)</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={`Ex: Quero um texto mais formal e corporativo, mencionando que somos uma barbearia premium...

Ou deixe em branco para usar o texto padrão otimizado para ${getTemplateTypeLabel(editingTemplate.template_type)}.`}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button
                    onClick={generateWithAI}
                    disabled={isGeneratingAI}
                    className="w-full"
                    variant="secondary"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Texto com IA
                      </>
                    )}
                  </Button>

                  <div className="space-y-2">
                    <Label>Exemplos de prompts:</Label>
                    <div className="space-y-2">
                      {[
                        'Texto amigável e casual para jovens',
                        'Texto formal e profissional para empresas',
                        'Texto acolhedor com tom de boas-vindas',
                        'Texto direto e objetivo, sem enrolação',
                      ].map((example, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => setAiPrompt(example)}
                        >
                          <span className="text-xs">{example}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handlePreview} variant="secondary">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
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
    </div>
  );
};

export default EmailTemplatesManager;
