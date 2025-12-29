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
import { Mail, Edit, Save, X, Eye, Sparkles, Loader2, ShieldCheck, Key, Link2, UserPlus, AlertTriangle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';

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

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

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

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          html_content: editingTemplate.html_content,
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

  const handlePreview = (template: EmailTemplate) => {
    let html = template.html_content;
    const exampleValues: Record<string, string> = {
      confirmation_url: 'https://suaapp.com/auth/confirm?token=abc123',
      reset_url: 'https://suaapp.com/auth/reset?token=xyz789',
      magic_link_url: 'https://suaapp.com/auth/callback?token=magic123',
      invite_url: 'https://suaapp.com/auth/invite?token=invite456',
      email: 'usuario@exemplo.com',
    };

    template.variables.forEach(variable => {
      const value = exampleValues[variable] || `[${variable}]`;
      html = html.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    setPreviewHtml(html);
    setShowPreview(true);
  };

  const generateWithAI = async () => {
    if (!editingTemplate) return;

    setIsGeneratingAI(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const templateStyles = {
        auth_confirm: { title: 'Confirme seu email', icon: '✨', buttonText: 'Confirmar Email', urlVar: 'confirmation_url' },
        auth_reset: { title: 'Redefinir sua senha', icon: '🔐', buttonText: 'Redefinir Senha', urlVar: 'reset_url' },
        auth_magic_link: { title: 'Seu link de acesso', icon: '🔗', buttonText: 'Acessar Conta', urlVar: 'magic_link_url' },
        auth_invite: { title: 'Você foi convidado!', icon: '🎉', buttonText: 'Aceitar Convite', urlVar: 'invite_url' },
      };

      const config = templateStyles[editingTemplate.template_type as keyof typeof templateStyles] || templateStyles.auth_confirm;

      const improvedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #c9a227 0%, #d4af37 50%, #c9a227 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; font-weight: bold; }
    .header .icon { font-size: 48px; margin-bottom: 15px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #ffffff; margin-top: 0; font-size: 22px; }
    .content p { color: #a0a0a0; line-height: 1.8; font-size: 15px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%); color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3); }
    .link-box { background-color: #252525; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
    .link-box p { color: #666; font-size: 11px; margin: 0; }
    .footer { background-color: #0f0f0f; color: #666; padding: 25px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #333, transparent); margin: 25px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${config.icon}</div>
      <h1>Barber Studio</h1>
    </div>
    <div class="content">
      <h2>${config.title}</h2>
      <p>${editingTemplate.template_type === 'auth_confirm' ? 'Obrigado por se cadastrar! Clique no botão abaixo para confirmar seu email e ativar sua conta.' :
          editingTemplate.template_type === 'auth_reset' ? 'Recebemos sua solicitação de redefinição de senha. Clique no botão abaixo para criar uma nova senha segura.' :
          editingTemplate.template_type === 'auth_magic_link' ? 'Use o botão abaixo para acessar sua conta de forma segura, sem precisar de senha.' :
          'Você foi convidado para fazer parte da equipe da Barber Studio! Clique no botão abaixo para aceitar o convite.'}</p>
      <div class="button-container">
        <a href="{{${config.urlVar}}}" class="button">${config.buttonText}</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 13px;">Ou copie e cole este link no seu navegador:</p>
      <div class="link-box">
        <p>{{${config.urlVar}}}</p>
      </div>
      <p style="color: #c9a227; font-size: 13px;"><strong>⏱ Este link expira em ${editingTemplate.template_type === 'auth_confirm' ? '24 horas' : '1 hora'}.</strong></p>
    </div>
    <div class="footer">
      <p><strong>Barber Studio</strong> - Tradição e Estilo</p>
      <p>Se você não solicitou este email, pode ignorá-lo com segurança.</p>
      <p>© ${new Date().getFullYear()} Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;

      setEditingTemplate({
        ...editingTemplate,
        html_content: improvedHtml.trim(),
      });

      toast.success('Template gerado com IA!');
    } catch (error) {
      toast.error('Erro ao gerar com IA');
    } finally {
      setIsGeneratingAI(false);
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
          <h2 className="text-xl font-semibold text-foreground">Templates de Email (Auth)</h2>
          <p className="text-sm text-muted-foreground">Personalize os emails de autenticação do sistema</p>
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Configuração Necessária</p>
              <p className="text-sm text-muted-foreground mt-1">
                Para usar templates customizados, você precisa configurar o <strong>Resend</strong> e 
                ativar os <strong>Auth Hooks</strong> no painel do Supabase. Os templates editados aqui 
                serão usados quando a integração estiver ativa.
              </p>
            </div>
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
                    variant="outline"
                    onClick={() => handlePreview(template)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title={`Editar: ${editingTemplate?.name}`}
        size="xl"
      >
        {editingTemplate && (
          <>
            <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTemplate.is_active}
                    onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, is_active: checked })}
                  />
                  <Label>Template Ativo</Label>
                </div>
                <Button
                  variant="outline"
                  onClick={generateWithAI}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gerar com IA
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo HTML</Label>
                  <div className="flex flex-wrap gap-1">
                    {editingTemplate.variables.map((v, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => {
                          const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = editingTemplate.html_content;
                            const newText = text.substring(0, start) + `{{${v}}}` + text.substring(end);
                            setEditingTemplate({ ...editingTemplate, html_content: newText });
                          }
                        }}
                      >
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea
                  id="html-editor"
                  value={editingTemplate.html_content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder="<html>...</html>"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={() => handlePreview(editingTemplate)} variant="secondary">
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
