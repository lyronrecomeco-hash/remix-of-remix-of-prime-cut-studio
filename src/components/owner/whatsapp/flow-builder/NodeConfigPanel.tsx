import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Copy, Sparkles, Code, Eye, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FlowNode, NodeType, NODE_COLORS } from './types';
import { cn } from '@/lib/utils';

interface NodeConfigPanelProps {
  node: FlowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
}

export const NodeConfigPanel = ({ node, onClose, onSave, onDelete, onDuplicate }: NodeConfigPanelProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('config');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data.label,
        description: node.data.description || '',
        ...node.data.config
      });
      setHasChanges(false);
    }
  }, [node]);

  if (!node) return null;

  const nodeColor = NODE_COLORS[node.data.type as NodeType] || '#6b7280';

  const handleSave = () => {
    const { label, description, ...config } = formData;
    onSave(node.id, {
      ...node.data,
      label,
      description,
      config
    });
    setHasChanges(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const renderConfigFields = () => {
    const type = node.data.type as NodeType;

    switch (type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Gatilho</Label>
              <Select 
                value={formData.triggerType || 'keyword'} 
                onValueChange={(v) => updateField('triggerType', v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">🔑 Palavra-chave</SelectItem>
                  <SelectItem value="first_contact">👋 Primeiro Contato</SelectItem>
                  <SelectItem value="button_click">🖱️ Clique em Botão</SelectItem>
                  <SelectItem value="all">📬 Todas Mensagens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <AnimatePresence mode="wait">
              {formData.triggerType === 'keyword' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Palavras-chave</Label>
                  <Textarea
                    value={formData.keywords || ''}
                    onChange={(e) => updateField('keywords', e.target.value)}
                    placeholder="oi, olá, bom dia, boa tarde"
                    className="bg-muted/50 resize-none"
                    rows={3}
                  />
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Separe por vírgula
                  </p>
                </motion.div>
              )}
              
              {formData.triggerType === 'button_click' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">ID do Botão</Label>
                  <Input
                    value={formData.buttonId || ''}
                    onChange={(e) => updateField('buttonId', e.target.value)}
                    placeholder="btn_confirm"
                    className="bg-muted/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                  <Wand2 className="w-3 h-3" /> IA
                </Button>
              </div>
              <Textarea
                value={formData.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="bg-muted/50 resize-none min-h-[120px]"
              />
              <div className="flex flex-wrap gap-1.5">
                {['{{nome}}', '{{telefone}}', '{{email}}'].map((variable) => (
                  <Badge 
                    key={variable}
                    variant="secondary" 
                    className="text-[10px] cursor-pointer hover:bg-primary/20"
                    onClick={() => updateField('text', (formData.text || '') + ' ' + variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  ⌨️
                </div>
                <div>
                  <Label className="text-sm">Simular digitação</Label>
                  <p className="text-[11px] text-muted-foreground">Mostra "digitando..." antes de enviar</p>
                </div>
              </div>
              <Switch
                checked={formData.typing || false}
                onCheckedChange={(v) => updateField('typing', v)}
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Mensagem</Label>
              <Textarea
                value={formData.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Escolha uma opção abaixo:"
                className="bg-muted/50 resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Botões</Label>
              <Textarea
                value={formData.buttonsRaw || ''}
                onChange={(e) => updateField('buttonsRaw', e.target.value)}
                placeholder="btn_sim|✅ Confirmar&#10;btn_nao|❌ Cancelar&#10;btn_ajuda|❓ Ajuda"
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground">
                Formato: <code className="bg-muted px-1 rounded">id|texto</code> (um por linha)
              </p>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Campo a Verificar</Label>
              <Select 
                value={formData.field || 'message'} 
                onValueChange={(v) => updateField('field', v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">💬 Mensagem</SelectItem>
                  <SelectItem value="phone">📱 Telefone</SelectItem>
                  <SelectItem value="name">👤 Nome</SelectItem>
                  <SelectItem value="state">📊 Estado da Conversa</SelectItem>
                  <SelectItem value="custom">⚙️ Campo Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Operador</Label>
              <Select 
                value={formData.operator || 'equals'} 
                onValueChange={(v) => updateField('operator', v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">= Igual a</SelectItem>
                  <SelectItem value="not_equals">≠ Diferente de</SelectItem>
                  <SelectItem value="contains">∈ Contém</SelectItem>
                  <SelectItem value="starts_with">^ Começa com</SelectItem>
                  <SelectItem value="ends_with">$ Termina com</SelectItem>
                  <SelectItem value="regex">⟨⟩ Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor</Label>
              <Input
                value={formData.value || ''}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="Valor para comparação"
                className="bg-muted/50"
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tempo de Espera</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={formData.seconds || 5}
                  onChange={(e) => updateField('seconds', parseInt(e.target.value))}
                  className="bg-muted/50 flex-1"
                />
                <Select 
                  value={formData.unit || 'seconds'} 
                  onValueChange={(v) => updateField('unit', v)}
                >
                  <SelectTrigger className="bg-muted/50 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary">
                ⏱️ O fluxo pausará por {formData.seconds || 5} {formData.unit || 'segundos'} antes de continuar
              </p>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">URL do Webhook</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
                className="bg-muted/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Método HTTP</Label>
              <Select 
                value={formData.method || 'POST'} 
                onValueChange={(v) => updateField('method', v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Headers (JSON)</Label>
              <Textarea
                value={formData.headersRaw || ''}
                onChange={(e) => updateField('headersRaw', e.target.value)}
                placeholder='{"Authorization": "Bearer seu_token"}'
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={3}
              />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prompt do Sistema</Label>
              <Textarea
                value={formData.prompt || ''}
                onChange={(e) => updateField('prompt', e.target.value)}
                placeholder="Você é um assistente virtual especializado em..."
                className="bg-muted/50 resize-none min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Modelo de IA</Label>
              <Select 
                value={formData.model || 'gemini-2.5-flash'} 
                onValueChange={(v) => updateField('model', v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">⚡ Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">🧠 Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gpt-5-mini">🤖 GPT-5 Mini</SelectItem>
                  <SelectItem value="gpt-5">🚀 GPT-5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Usar contexto</Label>
                <p className="text-[11px] text-muted-foreground">Inclui histórico da conversa</p>
              </div>
              <Switch
                checked={formData.useContext ?? true}
                onCheckedChange={(v) => updateField('useContext', v)}
              />
            </div>
          </div>
        );

      case 'split':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Distribuição do Tráfego</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm flex-1">Caminho A</span>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.percentageA || 50}
                    onChange={(e) => updateField('percentageA', parseInt(e.target.value))}
                    className="bg-muted/50 w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm flex-1">Caminho B</span>
                  <div className="w-20 text-center font-medium">
                    {100 - (formData.percentageA || 50)}
                  </div>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden flex">
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${formData.percentageA || 50}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${100 - (formData.percentageA || 50)}%` }}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Este nó não possui configurações adicionais.</p>
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-[340px] bg-card/95 backdrop-blur-xl border-l flex flex-col h-full shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${nodeColor}20` }}
            >
              <div 
                className="w-5 h-5 rounded-lg"
                style={{ backgroundColor: nodeColor }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{formData.label || 'Configurar Nó'}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {node.data.type}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-muted/50 p-1 h-9">
            <TabsTrigger value="config" className="flex-1 text-xs gap-1.5 h-7">
              <Sparkles className="w-3 h-3" /> Configurar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 text-xs gap-1.5 h-7">
              <Eye className="w-3 h-3" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1 text-xs gap-1.5 h-7">
              <Code className="w-3 h-3" /> JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <TabsContent value="config" className="m-0 space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome do Nó</Label>
              <Input
                value={formData.label || ''}
                onChange={(e) => updateField('label', e.target.value)}
                placeholder="Nome do nó"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Breve descrição (opcional)"
                className="bg-muted/50"
              />
            </div>

            <div className="my-4 border-t" />

            {/* Type-specific config */}
            {renderConfigFields()}
          </TabsContent>

          <TabsContent value="preview" className="m-0">
            <div className="rounded-xl border bg-muted/30 p-4 min-h-[200px]">
              <p className="text-xs text-muted-foreground text-center">
                Preview da mensagem aparecerá aqui
              </p>
            </div>
          </TabsContent>

          <TabsContent value="code" className="m-0">
            <pre className="rounded-xl bg-muted/50 p-4 text-xs overflow-auto">
              {JSON.stringify(node.data, null, 2)}
            </pre>
          </TabsContent>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/20 space-y-2">
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-amber-500 text-center mb-2"
          >
            ⚠️ Alterações não salvas
          </motion.div>
        )}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1.5"
            onClick={() => onDuplicate?.(node.id)}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-1.5"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button 
          size="sm" 
          className="w-full gap-1.5"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-3.5 h-3.5" />
          Salvar Alterações
        </Button>
      </div>
    </motion.div>
  );
};
