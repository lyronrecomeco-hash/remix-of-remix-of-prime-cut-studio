import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Edit, 
  Loader2, 
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  MousePointer,
  List,
  Link2,
  MessageSquare,
  Eye,
  Settings2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppPreview } from './preview/WhatsAppPreview';

// Types
interface TemplateButton {
  id: string;
  text: string;
  action?: string;
  payload?: string;
}

interface ListRow {
  id: string;
  title: string;
  description?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface InteractiveTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: 'text' | 'buttons' | 'list' | 'cta';
  message_content: string;
  header_type: string | null;
  header_content: string | null;
  footer_text: string | null;
  buttons: TemplateButton[];
  list_sections: ListSection[];
  button_text: string | null;
  variables: string[];
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

interface ButtonAction {
  id: string;
  template_id: string;
  button_id: string;
  action_type: string;
  action_config: Record<string, unknown>;
  description: string | null;
  is_active: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'text', label: 'Texto Simples', icon: MessageSquare },
  { value: 'buttons', label: 'Botões de Resposta', icon: MousePointer },
  { value: 'list', label: 'Lista Interativa', icon: List },
  { value: 'cta', label: 'CTA (Link/Ação)', icon: Link2 },
];

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'support', label: 'Suporte' },
  { value: 'sales', label: 'Vendas' },
  { value: 'transactional', label: 'Transacional' },
];

const ACTION_TYPES = [
  { value: 'send_template', label: 'Enviar Template' },
  { value: 'update_status', label: 'Atualizar Status' },
  { value: 'call_webhook', label: 'Chamar Webhook' },
  { value: 'transfer_human', label: 'Transferir para Humano' },
  { value: 'create_order', label: 'Criar Pedido' },
  { value: 'send_payment', label: 'Enviar Pagamento' },
];

export const WAInteractiveTemplates = () => {
  const [templates, setTemplates] = useState<InteractiveTemplate[]>([]);
  const [buttonActions, setButtonActions] = useState<ButtonAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Editor state
  const [editingTemplate, setEditingTemplate] = useState<InteractiveTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Preview variables
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({
    nome: 'João Silva',
    pedido_id: '12345',
    valor: '299,90',
    link_pagamento: 'https://pay.genesis.com/abc123',
    empresa: 'Genesis',
  });

  // Form state
  const [formData, setFormData] = useState<Partial<InteractiveTemplate>>({
    name: '',
    description: '',
    template_type: 'text',
    message_content: '',
    header_type: null,
    header_content: null,
    footer_text: null,
    buttons: [],
    list_sections: [],
    button_text: null,
    category: 'general',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [templatesRes, actionsRes] = await Promise.all([
        supabase
          .from('whatsapp_interactive_templates')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('whatsapp_button_actions')
          .select('*')
          .order('created_at', { ascending: true }),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (actionsRes.error) throw actionsRes.error;

      const parsed = (templatesRes.data || []).map((t) => ({
        ...t,
        buttons: (t.buttons as unknown as TemplateButton[]) || [],
        list_sections: (t.list_sections as unknown as ListSection[]) || [],
        variables: (t.variables as unknown as string[]) || [],
      })) as InteractiveTemplate[];

      setTemplates(parsed);
      setButtonActions((actionsRes.data || []) as ButtonAction[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (template?: InteractiveTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        template_type: template.template_type,
        message_content: template.message_content,
        header_type: template.header_type,
        header_content: template.header_content,
        footer_text: template.footer_text,
        buttons: template.buttons || [],
        list_sections: template.list_sections || [],
        button_text: template.button_text,
        category: template.category,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        template_type: 'text',
        message_content: '',
        header_type: null,
        header_content: null,
        footer_text: null,
        buttons: [],
        list_sections: [],
        button_text: null,
        category: 'general',
        is_active: true,
      });
    }
    setIsEditorOpen(true);
  };

  const saveTemplate = async () => {
    if (!formData.name?.trim() || !formData.message_content?.trim()) {
      toast.error('Preencha nome e mensagem');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        template_type: formData.template_type,
        message_content: formData.message_content,
        header_type: formData.header_type || null,
        header_content: formData.header_content || null,
        footer_text: formData.footer_text || null,
        buttons: JSON.parse(JSON.stringify(formData.buttons || [])),
        list_sections: JSON.parse(JSON.stringify(formData.list_sections || [])),
        button_text: formData.button_text || null,
        category: formData.category || 'general',
        is_active: formData.is_active ?? true,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('whatsapp_interactive_templates')
          .update(payload)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Template atualizado!');
      } else {
        const { error } = await supabase
          .from('whatsapp_interactive_templates')
          .insert(payload);
        if (error) throw error;
        toast.success('Template criado!');
      }

      setIsEditorOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_interactive_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Template removido!');
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao remover template');
    }
  };

  const toggleActive = async (template: InteractiveTemplate) => {
    try {
      const { error } = await supabase
        .from('whatsapp_interactive_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);
      if (error) throw error;
      toast.success(`Template ${template.is_active ? 'desativado' : 'ativado'}!`);
      fetchData();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Button management
  const addButton = () => {
    const newButton: TemplateButton = {
      id: `btn_${Date.now()}`,
      text: 'Novo Botão',
    };
    setFormData(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), newButton],
    }));
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    setFormData(prev => ({
      ...prev,
      buttons: (prev.buttons || []).map((btn, i) => 
        i === index ? { ...btn, ...updates } : btn
      ),
    }));
  };

  const removeButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buttons: (prev.buttons || []).filter((_, i) => i !== index),
    }));
  };

  // List section management
  const addListSection = () => {
    const newSection: ListSection = {
      title: 'Nova Seção',
      rows: [{ id: `row_${Date.now()}`, title: 'Nova Opção', description: '' }],
    };
    setFormData(prev => ({
      ...prev,
      list_sections: [...(prev.list_sections || []), newSection],
    }));
  };

  const updateListSection = (sectionIndex: number, updates: Partial<ListSection>) => {
    setFormData(prev => ({
      ...prev,
      list_sections: (prev.list_sections || []).map((section, i) =>
        i === sectionIndex ? { ...section, ...updates } : section
      ),
    }));
  };

  const addListRow = (sectionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      list_sections: (prev.list_sections || []).map((section, i) =>
        i === sectionIndex
          ? { ...section, rows: [...section.rows, { id: `row_${Date.now()}`, title: 'Nova Opção', description: '' }] }
          : section
      ),
    }));
  };

  const updateListRow = (sectionIndex: number, rowIndex: number, updates: Partial<ListRow>) => {
    setFormData(prev => ({
      ...prev,
      list_sections: (prev.list_sections || []).map((section, i) =>
        i === sectionIndex
          ? { ...section, rows: section.rows.map((row, j) => j === rowIndex ? { ...row, ...updates } : row) }
          : section
      ),
    }));
  };

  const removeListRow = (sectionIndex: number, rowIndex: number) => {
    setFormData(prev => ({
      ...prev,
      list_sections: (prev.list_sections || []).map((section, i) =>
        i === sectionIndex
          ? { ...section, rows: section.rows.filter((_, j) => j !== rowIndex) }
          : section
      ),
    }));
  };

  const getTypeIcon = (type: string) => {
    const t = TEMPLATE_TYPES.find(tt => tt.value === type);
    return t ? t.icon : MessageSquare;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-muted text-muted-foreground',
      marketing: 'bg-purple-500/10 text-purple-500',
      support: 'bg-blue-500/10 text-blue-500',
      sales: 'bg-green-500/10 text-green-500',
      transactional: 'bg-orange-500/10 text-orange-500',
    };
    return colors[category] || colors.general;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Templates Interativos</h2>
          <p className="text-sm text-muted-foreground">
            Crie templates com botões, listas e CTAs
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <Zap className="w-4 h-4" />
            Ações de Botões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const TypeIcon = getTypeIcon(template.template_type);
              return (
                <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{template.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label}
                          </Badge>
                          <Badge className={getCategoryColor(template.category)}>
                            {CATEGORIES.find(c => c.value === template.category)?.label}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => toggleActive(template)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {template.message_content}
                      </p>
                    </div>
                    
                    {/* Button/List preview */}
                    {template.template_type === 'buttons' && template.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.buttons.map((btn, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {btn.text}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {template.template_type === 'list' && template.list_sections.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-3">
                        {template.list_sections.reduce((acc, s) => acc + s.rows.length, 0)} opções em {template.list_sections.length} seções
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditor(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {templates.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie templates interativos para suas automações
                  </p>
                  <Button onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações de Botões</CardTitle>
            </CardHeader>
            <CardContent>
              {buttonActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Configure ações nos botões dos templates
                </p>
              ) : (
                <div className="space-y-2">
                  {buttonActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{action.button_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {ACTION_TYPES.find(a => a.value === action.action_type)?.label}
                        </p>
                      </div>
                      <Switch checked={action.is_active} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure o template e visualize em tempo real
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-6 h-full">
              {/* Form Side */}
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Nome do Template</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Confirmação de Pedido"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.template_type}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, template_type: v as InteractiveTemplate['template_type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={formData.message_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
                      rows={6}
                      placeholder="Olá {{nome}}! Seu pedido foi recebido..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{variavel}}'} para inserir dados dinâmicos. *negrito*, _itálico_
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="space-y-2">
                    <Label>Rodapé (opcional)</Label>
                    <Input
                      value={formData.footer_text || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                      placeholder="Genesis © 2025"
                    />
                  </div>

                  <Separator />

                  {/* Buttons Config (for buttons/cta type) */}
                  {(formData.template_type === 'buttons' || formData.template_type === 'cta') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Botões (máx. 3)</Label>
                        {(formData.buttons?.length || 0) < 3 && (
                          <Button variant="outline" size="sm" onClick={addButton}>
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(formData.buttons || []).map((btn, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={btn.id}
                                onChange={(e) => updateButton(index, { id: e.target.value })}
                                placeholder="ID do botão (ex: btn_confirmar)"
                                className="font-mono text-xs"
                              />
                              <Input
                                value={btn.text}
                                onChange={(e) => updateButton(index, { text: e.target.value })}
                                placeholder="Texto exibido"
                              />
                              {formData.template_type === 'cta' && (
                                <Input
                                  value={btn.payload || ''}
                                  onChange={(e) => updateButton(index, { payload: e.target.value })}
                                  placeholder="URL ou payload"
                                  className="font-mono text-xs"
                                />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeButton(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List Config (for list type) */}
                  {formData.template_type === 'list' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Texto do Botão da Lista</Label>
                        <Input
                          value={formData.button_text || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                          placeholder="Ver Opções"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Seções da Lista</Label>
                        <Button variant="outline" size="sm" onClick={addListSection}>
                          <Plus className="w-4 h-4 mr-1" />
                          Seção
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {(formData.list_sections || []).map((section, sIdx) => (
                          <div key={sIdx} className="border rounded-lg p-3 space-y-3">
                            <Input
                              value={section.title}
                              onChange={(e) => updateListSection(sIdx, { title: e.target.value })}
                              placeholder="Título da Seção"
                              className="font-medium"
                            />
                            <div className="space-y-2 pl-4">
                              {section.rows.map((row, rIdx) => (
                                <div key={rIdx} className="flex gap-2 items-start">
                                  <div className="flex-1 space-y-1">
                                    <Input
                                      value={row.id}
                                      onChange={(e) => updateListRow(sIdx, rIdx, { id: e.target.value })}
                                      placeholder="ID"
                                      className="font-mono text-xs"
                                    />
                                    <Input
                                      value={row.title}
                                      onChange={(e) => updateListRow(sIdx, rIdx, { title: e.target.value })}
                                      placeholder="Título"
                                    />
                                    <Input
                                      value={row.description || ''}
                                      onChange={(e) => updateListRow(sIdx, rIdx, { description: e.target.value })}
                                      placeholder="Descrição (opcional)"
                                      className="text-sm"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeListRow(sIdx, rIdx)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addListRow(sIdx)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Opção
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Preview Side */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4" />
                  <Label>Preview em Tempo Real</Label>
                </div>
                <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl p-4">
                  <WhatsAppPreview
                    templateType={formData.template_type || 'text'}
                    messageContent={formData.message_content || ''}
                    buttons={formData.buttons || []}
                    listSections={formData.list_sections || []}
                    buttonText={formData.button_text || 'Ver Opções'}
                    footerText={formData.footer_text || ''}
                    variables={previewVariables}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingTemplate ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
