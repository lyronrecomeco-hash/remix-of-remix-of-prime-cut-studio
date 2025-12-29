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
import { Mail, Edit, Save, X, Eye, Sparkles, Code, Loader2 } from 'lucide-react';
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

      // Parse variables from JSON
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

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast.success(`Template ${!template.is_active ? 'ativado' : 'desativado'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    // Replace variables with example values
    let html = template.html_content;
    const exampleValues: Record<string, string> = {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      data: '15/01/2025',
      horario: '14:30',
      servico: 'Corte + Barba',
      barbeiro: 'Carlos',
      barbearia: 'Barber Studio',
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
      // Simulate AI generation (replace with actual AI call when configured)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const improvedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a227; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .highlight { background-color: #f8f9fa; border-left: 4px solid #c9a227; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #c9a227; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { background-color: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Olá, {{nome}}!</h2>
      <p>${editingTemplate.template_type === 'confirmation' ? 'Seu agendamento foi confirmado com sucesso.' : 
          editingTemplate.template_type === 'welcome' ? 'Seja bem-vindo à nossa barbearia!' :
          editingTemplate.template_type === 'reminder' ? 'Lembrando do seu agendamento.' :
          'Informamos sobre seu agendamento.'}</p>
      <div class="highlight">
        <p><strong>📅 Data:</strong> {{data}}</p>
        <p><strong>🕐 Horário:</strong> {{horario}}</p>
        <p><strong>✂️ Serviço:</strong> {{servico}}</p>
        <p><strong>💈 Barbeiro:</strong> {{barbeiro}}</p>
      </div>
      <p>Estamos ansiosos para recebê-lo!</p>
    </div>
    <div class="footer">
      <p>Barber Studio - Tradição e Estilo</p>
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

  const getTemplateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      confirmation: 'Confirmação',
      welcome: 'Boas-vindas',
      reminder: 'Lembrete',
      cancellation: 'Cancelamento',
    };
    return labels[type] || type;
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
          <p className="text-sm text-muted-foreground">Gerencie os templates de email do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="border-border/50 hover:border-border transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {getTemplateTypeLabel(template.template_type)}
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
                <p className="text-xs text-muted-foreground">Variáveis:</p>
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
        ))}
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
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10"
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
          <div className="bg-white rounded-lg overflow-hidden">
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
