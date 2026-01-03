import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlowNode, NodeType } from './types';

interface NodeConfigPanelProps {
  node: FlowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigPanel = ({ node, onClose, onSave, onDelete }: NodeConfigPanelProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data.label,
        description: node.data.description || '',
        ...node.data.config
      });
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const { label, description, ...config } = formData;
    onSave(node.id, {
      ...node.data,
      label,
      description,
      config
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderConfigFields = () => {
    const type = node.data.type as NodeType;

    switch (type) {
      case 'trigger':
        return (
          <>
            <div className="space-y-2">
              <Label>Tipo de Gatilho</Label>
              <Select 
                value={formData.triggerType || 'keyword'} 
                onValueChange={(v) => updateField('triggerType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Palavra-chave</SelectItem>
                  <SelectItem value="first_contact">Primeiro Contato</SelectItem>
                  <SelectItem value="button_click">Clique em Botão</SelectItem>
                  <SelectItem value="all">Todas Mensagens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.triggerType === 'keyword' && (
              <div className="space-y-2">
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={formData.keywords || ''}
                  onChange={(e) => updateField('keywords', e.target.value)}
                  placeholder="oi, olá, bom dia"
                />
              </div>
            )}
            {formData.triggerType === 'button_click' && (
              <div className="space-y-2">
                <Label>ID do Botão</Label>
                <Input
                  value={formData.buttonId || ''}
                  onChange={(e) => updateField('buttonId', e.target.value)}
                  placeholder="btn_confirm"
                />
              </div>
            )}
          </>
        );

      case 'message':
        return (
          <>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={formData.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Digite a mensagem..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{nome}}'} para variáveis dinâmicas
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Simular digitação</Label>
              <Switch
                checked={formData.typing || false}
                onCheckedChange={(v) => updateField('typing', v)}
              />
            </div>
          </>
        );

      case 'button':
        return (
          <>
            <div className="space-y-2">
              <Label>Texto da Mensagem</Label>
              <Textarea
                value={formData.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Escolha uma opção:"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Botões (um por linha: id|texto)</Label>
              <Textarea
                value={formData.buttonsRaw || ''}
                onChange={(e) => updateField('buttonsRaw', e.target.value)}
                placeholder="btn_sim|✅ Sim&#10;btn_nao|❌ Não"
                rows={4}
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="space-y-2">
              <Label>Campo a Verificar</Label>
              <Select 
                value={formData.field || 'message'} 
                onValueChange={(v) => updateField('field', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Mensagem</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="state">Estado da Conversa</SelectItem>
                  <SelectItem value="custom">Campo Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <Select 
                value={formData.operator || 'equals'} 
                onValueChange={(v) => updateField('operator', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="starts_with">Começa com</SelectItem>
                  <SelectItem value="ends_with">Termina com</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                value={formData.value || ''}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="Valor para comparação"
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <div className="space-y-2">
            <Label>Tempo de Espera (segundos)</Label>
            <Input
              type="number"
              min="1"
              max="3600"
              value={formData.seconds || 5}
              onChange={(e) => updateField('seconds', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Máximo: 3600 segundos (1 hora)
            </p>
          </div>
        );

      case 'webhook':
        return (
          <>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={formData.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select 
                value={formData.method || 'POST'} 
                onValueChange={(v) => updateField('method', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                value={formData.headersRaw || ''}
                onChange={(e) => updateField('headersRaw', e.target.value)}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
              />
            </div>
          </>
        );

      case 'ai':
        return (
          <>
            <div className="space-y-2">
              <Label>Prompt do Sistema</Label>
              <Textarea
                value={formData.prompt || ''}
                onChange={(e) => updateField('prompt', e.target.value)}
                placeholder="Você é um assistente útil..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select 
                value={formData.model || 'gemini-2.5-flash'} 
                onValueChange={(v) => updateField('model', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'split':
        return (
          <div className="space-y-2">
            <Label>Porcentagem para Caminho A</Label>
            <Input
              type="number"
              min="1"
              max="99"
              value={formData.percentageA || 50}
              onChange={(e) => updateField('percentageA', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Caminho B receberá {100 - (formData.percentageA || 50)}%
            </p>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Este nó não possui configurações adicionais.
          </p>
        );
    }
  };

  return (
    <div className="w-80 bg-card border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configurar Nó</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>Nome do Nó</Label>
            <Input
              value={formData.label || ''}
              onChange={(e) => updateField('label', e.target.value)}
              placeholder="Nome do nó"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Breve descrição"
            />
          </div>

          <hr className="my-4" />

          {/* Type-specific config */}
          {renderConfigFields()}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex-1"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  );
};
