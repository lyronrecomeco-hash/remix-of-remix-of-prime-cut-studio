import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Save, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  template_type: string;
  name: string;
  message_template: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  use_ai: boolean;
  ai_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  welcome: 'Boas-vindas (após confirmação de email)',
  appointment_confirmed: 'Agendamento Confirmado',
  appointment_reminder: 'Lembrete de Agendamento',
  appointment_cancelled: 'Agendamento Cancelado',
  affiliate_verification: 'Verificação de Afiliado (código WhatsApp)',
};

const WhatsAppTemplatesManager = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<WhatsAppTemplate>>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setTemplates((data || []) as unknown as WhatsAppTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const getEditedValue = <K extends keyof WhatsAppTemplate>(
    templateId: string,
    field: K,
    originalValue: WhatsAppTemplate[K]
  ): WhatsAppTemplate[K] => {
    const edited = editedTemplates[templateId];
    if (edited && field in edited) {
      return edited[field] as WhatsAppTemplate[K];
    }
    return originalValue;
  };

  const updateField = (templateId: string, field: keyof WhatsAppTemplate, value: any) => {
    setEditedTemplates(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value,
      },
    }));
  };

  const saveTemplate = async (template: WhatsAppTemplate) => {
    setSavingId(template.id);
    try {
      const updates = editedTemplates[template.id] || {};
      
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (error) throw error;

      toast.success('Template salvo com sucesso!');
      
      // Clear edited state for this template
      setEditedTemplates(prev => {
        const newState = { ...prev };
        delete newState[template.id];
        return newState;
      });
      
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSavingId(null);
    }
  };

  const generateWithAI = async (template: WhatsAppTemplate) => {
    const aiPrompt = getEditedValue(template.id, 'ai_prompt', template.ai_prompt);
    
    if (!aiPrompt) {
      toast.error('Configure um prompt de IA primeiro');
      return;
    }

    setGeneratingId(template.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-prompt', {
        body: {
          type: 'generate',
          context: aiPrompt,
        },
      });

      if (error) throw error;

      if (data?.message) {
        updateField(template.id, 'message_template', data.message);
        toast.success('Mensagem gerada com IA!');
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Erro ao gerar mensagem com IA');
    } finally {
      setGeneratingId(null);
    }
  };

  const hasUnsavedChanges = (templateId: string) => {
    return templateId in editedTemplates && Object.keys(editedTemplates[templateId]).length > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-500" />
            Templates WhatsApp
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure mensagens automáticas enviadas via WhatsApp
          </p>
        </div>
        <Button variant="outline" onClick={fetchTemplates}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum template configurado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="bg-card border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {hasUnsavedChanges(template.id) && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          Não salvo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {TEMPLATE_TYPE_LABELS[template.template_type] || template.template_type}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getEditedValue(template.id, 'is_active', template.is_active)}
                        onCheckedChange={(checked) => updateField(template.id, 'is_active', checked)}
                      />
                      <Label className="text-sm">
                        {getEditedValue(template.id, 'is_active', template.is_active) ? 'Ativo' : 'Inativo'}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Message Template */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mensagem</Label>
                  <Textarea
                    value={getEditedValue(template.id, 'message_template', template.message_template)}
                    onChange={(e) => updateField(template.id, 'message_template', e.target.value)}
                    placeholder="Digite a mensagem..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{email}}'}, {'{{codigo}}'} (para verificação)
                  </p>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    URL da Imagem (opcional)
                  </Label>
                  <Input
                    value={getEditedValue(template.id, 'image_url', template.image_url) || ''}
                    onChange={(e) => updateField(template.id, 'image_url', e.target.value || null)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                {/* Button */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Texto do Botão (opcional)
                    </Label>
                    <Input
                      value={getEditedValue(template.id, 'button_text', template.button_text) || ''}
                      onChange={(e) => updateField(template.id, 'button_text', e.target.value || null)}
                      placeholder="Agendar Agora"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">URL do Botão</Label>
                    <Input
                      value={getEditedValue(template.id, 'button_url', template.button_url) || ''}
                      onChange={(e) => updateField(template.id, 'button_url', e.target.value || null)}
                      placeholder="https://exemplo.com/agendar"
                    />
                  </div>
                </div>

                {/* AI Section */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Geração com IA
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={getEditedValue(template.id, 'use_ai', template.use_ai)}
                        onCheckedChange={(checked) => updateField(template.id, 'use_ai', checked)}
                      />
                      <Label className="text-sm">
                        {getEditedValue(template.id, 'use_ai', template.use_ai) ? 'Habilitado' : 'Desabilitado'}
                      </Label>
                    </div>
                  </div>
                  
                  {getEditedValue(template.id, 'use_ai', template.use_ai) && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Prompt para IA gerar a mensagem
                        </Label>
                        <Textarea
                          value={getEditedValue(template.id, 'ai_prompt', template.ai_prompt) || ''}
                          onChange={(e) => updateField(template.id, 'ai_prompt', e.target.value || null)}
                          placeholder="Ex: Crie uma mensagem de boas-vindas calorosa para novos clientes de uma barbearia premium..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => generateWithAI(template)}
                        disabled={generatingId === template.id}
                        className="w-full"
                      >
                        {generatingId === template.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Gerar Mensagem com IA
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="p-4 bg-[#0b141a] rounded-lg border border-border">
                    <div className="bg-[#005c4b] text-white p-3 rounded-lg max-w-[80%] ml-auto">
                      <p className="text-sm whitespace-pre-wrap">
                        {getEditedValue(template.id, 'message_template', template.message_template)
                          .replace(/\{\{nome\}\}/g, 'João Silva')
                          .replace(/\{\{telefone\}\}/g, '(11) 99999-9999')
                          .replace(/\{\{email\}\}/g, 'joao@email.com')}
                      </p>
                      {getEditedValue(template.id, 'button_text', template.button_text) && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <span className="text-xs text-white/80">
                            🔗 {getEditedValue(template.id, 'button_text', template.button_text)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveTemplate(template)}
                    disabled={savingId === template.id || !hasUnsavedChanges(template.id)}
                  >
                    {savingId === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        {hasUnsavedChanges(template.id) ? (
                          <Save className="w-4 h-4 mr-2" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {hasUnsavedChanges(template.id) ? 'Salvar Alterações' : 'Salvo'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesManager;
