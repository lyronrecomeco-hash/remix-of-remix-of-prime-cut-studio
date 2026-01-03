import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Copy, Sparkles, Code, Eye, Wand2, Plus, Minus, AlertTriangle, Info, Zap, Tag, Globe, CornerDownRight, StickyNote, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'main']);

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <Collapsible open={expandedSections.includes(id)} onOpenChange={() => toggleSection(id)}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4" style={{ color: nodeColor }} />
          {title}
        </div>
        <motion.div animate={{ rotate: expandedSections.includes(id) ? 180 : 0 }}>
          <Minus className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </CollapsibleTrigger>
    </Collapsible>
  );

  const renderConfigFields = () => {
    const type = node.data.type as NodeType;

    switch (type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Gatilho</Label>
              <Select value={formData.triggerType || 'keyword'} onValueChange={(v) => updateField('triggerType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">🔑 Palavra-chave</SelectItem>
                  <SelectItem value="first_contact">👋 Primeiro Contato</SelectItem>
                  <SelectItem value="button_click">🖱️ Clique em Botão</SelectItem>
                  <SelectItem value="all">📬 Todas Mensagens</SelectItem>
                  <SelectItem value="scheduled">⏰ Agendado</SelectItem>
                  <SelectItem value="webhook">🔗 Webhook Externo</SelectItem>
                  <SelectItem value="inactivity">💤 Inatividade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <AnimatePresence mode="wait">
              {formData.triggerType === 'keyword' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Palavras-chave</Label>
                    <Textarea
                      value={formData.keywords || ''}
                      onChange={(e) => updateField('keywords', e.target.value)}
                      placeholder="oi, olá, bom dia, boa tarde"
                      className="bg-muted/50 resize-none"
                      rows={3}
                    />
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Separe por vírgula</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Modo de Correspondência</Label>
                    <Select value={formData.matchMode || 'contains'} onValueChange={(v) => updateField('matchMode', v)}>
                      <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="exact">Exato</SelectItem>
                        <SelectItem value="starts">Começa com</SelectItem>
                        <SelectItem value="ends">Termina com</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <Label className="text-sm">Case Sensitive</Label>
                      <p className="text-[11px] text-muted-foreground">Diferenciar maiúsculas/minúsculas</p>
                    </div>
                    <Switch checked={formData.caseSensitive || false} onCheckedChange={(v) => updateField('caseSensitive', v)} />
                  </div>
                </motion.div>
              )}
              
              {formData.triggerType === 'button_click' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">ID do Botão</Label>
                  <Input value={formData.buttonId || ''} onChange={(e) => updateField('buttonId', e.target.value)} placeholder="btn_confirm" className="bg-muted/50" />
                </motion.div>
              )}
              
              {formData.triggerType === 'inactivity' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tempo de Inatividade (minutos)</Label>
                  <Input type="number" min="1" max="1440" value={formData.inactivityMinutes || 5} onChange={(e) => updateField('inactivityMinutes', parseInt(e.target.value))} className="bg-muted/50" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Prioridade do Gatilho</p>
                  <p>Gatilhos são avaliados na ordem de prioridade. O primeiro match executa o fluxo.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"><Wand2 className="w-3 h-3" /> IA</Button>
              </div>
              <Textarea
                value={formData.text || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="bg-muted/50 resize-none min-h-[120px]"
              />
              <div className="flex flex-wrap gap-1.5">
                {['{{nome}}', '{{telefone}}', '{{email}}', '{{data}}', '{{hora}}'].map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/20" onClick={() => updateField('text', (formData.text || '') + ' ' + variable)}>{variable}</Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">⌨️</div>
                  <div>
                    <Label className="text-sm">Simular digitação</Label>
                    <p className="text-[11px] text-muted-foreground">Mostra "digitando..." antes de enviar</p>
                  </div>
                </div>
                <Switch checked={formData.typing || false} onCheckedChange={(v) => updateField('typing', v)} />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Duração digitando (ms)</Label>
                <Slider value={[formData.typingDuration || 2000]} onValueChange={(v) => updateField('typingDuration', v[0])} min={500} max={5000} step={100} className="py-2" />
                <p className="text-[11px] text-muted-foreground text-right">{formData.typingDuration || 2000}ms</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mídia (Opcional)</Label>
              <Select value={formData.mediaType || 'none'} onValueChange={(v) => updateField('mediaType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="image">🖼️ Imagem</SelectItem>
                  <SelectItem value="video">🎬 Vídeo</SelectItem>
                  <SelectItem value="audio">🎵 Áudio</SelectItem>
                  <SelectItem value="document">📄 Documento</SelectItem>
                </SelectContent>
              </Select>
              {formData.mediaType && formData.mediaType !== 'none' && (
                <Input value={formData.mediaUrl || ''} onChange={(e) => updateField('mediaUrl', e.target.value)} placeholder="URL da mídia" className="bg-muted/50 mt-2" />
              )}
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Mensagem</Label>
              <Textarea value={formData.text || ''} onChange={(e) => updateField('text', e.target.value)} placeholder="Escolha uma opção abaixo:" className="bg-muted/50 resize-none" rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título (Opcional)</Label>
              <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Título do menu" className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rodapé (Opcional)</Label>
              <Input value={formData.footer || ''} onChange={(e) => updateField('footer', e.target.value)} placeholder="Texto do rodapé" className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Botões (máx. 3)</Label>
              <Textarea
                value={formData.buttonsRaw || ''}
                onChange={(e) => updateField('buttonsRaw', e.target.value)}
                placeholder="btn_sim|✅ Confirmar&#10;btn_nao|❌ Cancelar&#10;btn_ajuda|❓ Ajuda"
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground">Formato: <code className="bg-muted px-1 rounded">id|texto</code> (um por linha)</p>
            </div>
            
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-muted-foreground">Máximo de 3 botões por mensagem. Use Lista para mais opções.</p>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Mensagem</Label>
              <Textarea value={formData.text || ''} onChange={(e) => updateField('text', e.target.value)} placeholder="Selecione uma opção:" className="bg-muted/50 resize-none" rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título da Lista</Label>
              <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Menu de Opções" className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto do Botão</Label>
              <Input value={formData.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} placeholder="Ver opções" className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Seções e Itens</Label>
              <Textarea
                value={formData.sectionsRaw || ''}
                onChange={(e) => updateField('sectionsRaw', e.target.value)}
                placeholder="# Seção 1&#10;item1|Opção 1|Descrição&#10;item2|Opção 2|Descrição&#10;# Seção 2&#10;item3|Opção 3|Descrição"
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={6}
              />
              <p className="text-[11px] text-muted-foreground"># para seção, id|título|descrição para itens</p>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Campo a Verificar</Label>
              <Select value={formData.field || 'message'} onValueChange={(v) => updateField('field', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">💬 Mensagem</SelectItem>
                  <SelectItem value="phone">📱 Telefone</SelectItem>
                  <SelectItem value="name">👤 Nome</SelectItem>
                  <SelectItem value="state">📊 Estado da Conversa</SelectItem>
                  <SelectItem value="variable">📝 Variável</SelectItem>
                  <SelectItem value="time">⏰ Horário</SelectItem>
                  <SelectItem value="day">📅 Dia da Semana</SelectItem>
                  <SelectItem value="custom">⚙️ Campo Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.field === 'variable' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome da Variável</Label>
                <Input value={formData.variableName || ''} onChange={(e) => updateField('variableName', e.target.value)} placeholder="nome_variavel" className="bg-muted/50" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Operador</Label>
              <Select value={formData.operator || 'equals'} onValueChange={(v) => updateField('operator', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">= Igual a</SelectItem>
                  <SelectItem value="not_equals">≠ Diferente de</SelectItem>
                  <SelectItem value="contains">∈ Contém</SelectItem>
                  <SelectItem value="not_contains">∉ Não contém</SelectItem>
                  <SelectItem value="starts_with">^ Começa com</SelectItem>
                  <SelectItem value="ends_with">$ Termina com</SelectItem>
                  <SelectItem value="greater">{'>'} Maior que</SelectItem>
                  <SelectItem value="less">{'<'} Menor que</SelectItem>
                  <SelectItem value="regex">⟨⟩ Regex</SelectItem>
                  <SelectItem value="is_empty">∅ Está vazio</SelectItem>
                  <SelectItem value="is_not_empty">✓ Não está vazio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {!['is_empty', 'is_not_empty'].includes(formData.operator) && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor</Label>
                <Input value={formData.value || ''} onChange={(e) => updateField('value', e.target.value)} placeholder="Valor para comparação" className="bg-muted/50" />
              </div>
            )}
            
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400 font-medium">✓ SIM</span> = condição verdadeira
                <br />
                <span className="text-red-400 font-medium">✗ NÃO</span> = condição falsa
              </p>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tempo de Espera</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" max="3600" value={formData.seconds || 5} onChange={(e) => updateField('seconds', parseInt(e.target.value))} className="bg-muted/50 flex-1" />
                <Select value={formData.unit || 'seconds'} onValueChange={(v) => updateField('unit', v)}>
                  <SelectTrigger className="bg-muted/50 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Mostrar digitando</Label>
                <p className="text-[11px] text-muted-foreground">Exibe "digitando..." durante a espera</p>
              </div>
              <Switch checked={formData.showTyping ?? true} onCheckedChange={(v) => updateField('showTyping', v)} />
            </div>
            
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary">⏱️ O fluxo pausará por {formData.seconds || 5} {formData.unit || 'segundos'} antes de continuar</p>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">URL do Webhook</Label>
              <Input value={formData.url || ''} onChange={(e) => updateField('url', e.target.value)} placeholder="https://api.exemplo.com/webhook" className="bg-muted/50 font-mono text-sm" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Método HTTP</Label>
              <Select value={formData.method || 'POST'} onValueChange={(v) => updateField('method', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
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
              <Textarea value={formData.headersRaw || ''} onChange={(e) => updateField('headersRaw', e.target.value)} placeholder='{"Authorization": "Bearer seu_token"}' className="bg-muted/50 resize-none font-mono text-sm" rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body (JSON)</Label>
              <Textarea value={formData.bodyRaw || ''} onChange={(e) => updateField('bodyRaw', e.target.value)} placeholder='{"nome": "{{nome}}", "telefone": "{{telefone}}"}' className="bg-muted/50 resize-none font-mono text-sm" rows={4} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Timeout (segundos)</Label>
              <Input type="number" min="5" max="120" value={formData.timeout || 30} onChange={(e) => updateField('timeout', parseInt(e.target.value))} className="bg-muted/50" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Salvar resposta</Label>
                <p className="text-[11px] text-muted-foreground">Armazena resposta em variável</p>
              </div>
              <Switch checked={formData.saveResponse || false} onCheckedChange={(v) => updateField('saveResponse', v)} />
            </div>
            
            {formData.saveResponse && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome da Variável</Label>
                <Input value={formData.responseVariable || ''} onChange={(e) => updateField('responseVariable', e.target.value)} placeholder="api_response" className="bg-muted/50" />
              </div>
            )}
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <Label className="text-sm font-medium">Configuração da API</Label>
              </div>
              <div className="space-y-2">
                <Input type="password" value={formData.openaiApiKey || ''} onChange={(e) => updateField('openaiApiKey', e.target.value)} placeholder="sk-... (sua chave OpenAI)" className="bg-background/50 text-xs font-mono" />
                <p className="text-[10px] text-muted-foreground">💡 Configure sua chave API do ChatGPT para usar IA neste nó</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prompt do Sistema</Label>
              <Textarea value={formData.prompt || ''} onChange={(e) => updateField('prompt', e.target.value)} placeholder="Você é um assistente virtual especializado em..." className="bg-muted/50 resize-none min-h-[120px]" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Modelo de IA</Label>
              <Select value={formData.model || 'gpt-4o-mini'} onValueChange={(v) => updateField('model', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">⚡ GPT-4o Mini (Rápido)</SelectItem>
                  <SelectItem value="gpt-4o">🧠 GPT-4o (Inteligente)</SelectItem>
                  <SelectItem value="gpt-4-turbo">🚀 GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-5-mini">⭐ GPT-5 Mini (Novo)</SelectItem>
                  <SelectItem value="gemini-2.5-flash">💎 Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">💎 Gemini 2.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Temperatura: {formData.temperature ?? 0.7}</Label>
              <Slider value={[formData.temperature ?? 0.7]} onValueChange={(v) => updateField('temperature', v[0])} min={0} max={1} step={0.1} className="py-2" />
              <p className="text-[11px] text-muted-foreground">0 = Preciso | 1 = Criativo</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Max Tokens</Label>
              <Input type="number" min="100" max="4000" value={formData.maxTokens || 500} onChange={(e) => updateField('maxTokens', parseInt(e.target.value))} className="bg-muted/50" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <Label className="text-sm">Usar contexto</Label>
                  <p className="text-[11px] text-muted-foreground">Inclui histórico da conversa</p>
                </div>
                <Switch checked={formData.useContext ?? true} onCheckedChange={(v) => updateField('useContext', v)} />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <Label className="text-sm">Streaming</Label>
                  <p className="text-[11px] text-muted-foreground">Envia resposta gradualmente</p>
                </div>
                <Switch checked={formData.streaming ?? false} onCheckedChange={(v) => updateField('streaming', v)} />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <Label className="text-sm">Fallback</Label>
                  <p className="text-[11px] text-muted-foreground">Mensagem se IA falhar</p>
                </div>
                <Switch checked={formData.useFallback ?? false} onCheckedChange={(v) => updateField('useFallback', v)} />
              </div>
            </div>
            
            {formData.useFallback && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem de Fallback</Label>
                <Textarea value={formData.fallbackMessage || ''} onChange={(e) => updateField('fallbackMessage', e.target.value)} placeholder="Desculpe, não consegui processar sua mensagem..." className="bg-muted/50 resize-none" rows={2} />
              </div>
            )}
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
                  <Input type="number" min="1" max="99" value={formData.percentageA || 50} onChange={(e) => updateField('percentageA', parseInt(e.target.value))} className="bg-muted/50 w-20 text-center" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm flex-1">Caminho B</span>
                  <div className="w-20 text-center font-medium">{100 - (formData.percentageA || 50)}</div>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-green-500 transition-all duration-300" style={{ width: `${formData.percentageA || 50}%` }} />
              <div className="bg-red-500 transition-all duration-300" style={{ width: `${100 - (formData.percentageA || 50)}%` }} />
            </div>
          </div>
        );

      case 'goto':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <CornerDownRight className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground mb-1">Redirecionar para outro nó</p>
                  <p className="text-muted-foreground">Permite criar loops e reaproveitar partes do fluxo.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">ID do Nó Destino</Label>
              <Input value={formData.targetNodeId || ''} onChange={(e) => updateField('targetNodeId', e.target.value)} placeholder="trigger-123456789" className="bg-muted/50 font-mono text-sm" />
              <p className="text-[11px] text-muted-foreground">Cole o ID do nó para onde deseja redirecionar</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Limite de Loops</Label>
              <Input type="number" min="1" max="100" value={formData.maxLoops || 10} onChange={(e) => updateField('maxLoops', parseInt(e.target.value))} className="bg-muted/50" />
              <p className="text-[11px] text-muted-foreground">Máximo de vezes que pode redirecionar</p>
            </div>
          </div>
        );

      case 'variable':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome da Variável</Label>
              <Input value={formData.variableName || ''} onChange={(e) => updateField('variableName', e.target.value)} placeholder="nome_variavel" className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Origem do Valor</Label>
              <Select value={formData.source || 'static'} onValueChange={(v) => updateField('source', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">📝 Valor Fixo</SelectItem>
                  <SelectItem value="message">💬 Última Mensagem</SelectItem>
                  <SelectItem value="extract">🔍 Extrair do Texto</SelectItem>
                  <SelectItem value="api_response">🌐 Resposta de API</SelectItem>
                  <SelectItem value="expression">🔢 Expressão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <AnimatePresence mode="wait">
              {formData.source === 'static' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Valor</Label>
                  <Input value={formData.value || ''} onChange={(e) => updateField('value', e.target.value)} placeholder="Valor da variável" className="bg-muted/50" />
                </motion.div>
              )}
              
              {formData.source === 'extract' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Regex de Extração</Label>
                  <Input value={formData.extractRegex || ''} onChange={(e) => updateField('extractRegex', e.target.value)} placeholder="(\d{11})" className="bg-muted/50 font-mono" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'integration':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Integração</Label>
              <Select value={formData.integrationType || 'crm'} onValueChange={(v) => updateField('integrationType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">📊 CRM</SelectItem>
                  <SelectItem value="google_sheets">📗 Google Sheets</SelectItem>
                  <SelectItem value="notion">📓 Notion</SelectItem>
                  <SelectItem value="hubspot">🟠 HubSpot</SelectItem>
                  <SelectItem value="zapier">⚡ Zapier</SelectItem>
                  <SelectItem value="custom">🔧 Customizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ação</Label>
              <Select value={formData.action || 'create'} onValueChange={(v) => updateField('action', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">➕ Criar Registro</SelectItem>
                  <SelectItem value="update">✏️ Atualizar Registro</SelectItem>
                  <SelectItem value="read">👁️ Buscar Registro</SelectItem>
                  <SelectItem value="delete">🗑️ Excluir Registro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Dados (JSON)</Label>
              <Textarea value={formData.integrationData || ''} onChange={(e) => updateField('integrationData', e.target.value)} placeholder='{"nome": "{{nome}}", "email": "{{email}}"}' className="bg-muted/50 resize-none font-mono text-sm" rows={4} />
            </div>
          </div>
        );

      case 'note':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground mb-1">Nota Visual</p>
                  <p className="text-muted-foreground">Adicione comentários para documentar seu fluxo. Não afeta a execução.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Nota</Label>
              <Textarea value={formData.noteText || ''} onChange={(e) => updateField('noteText', e.target.value)} placeholder="Escreva sua anotação aqui..." className="bg-muted/50 resize-none" rows={4} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cor</Label>
              <div className="flex gap-2">
                {['yellow', 'blue', 'green', 'pink', 'purple'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateField('noteColor', color)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all',
                      color === 'yellow' && 'bg-yellow-500',
                      color === 'blue' && 'bg-blue-500',
                      color === 'green' && 'bg-green-500',
                      color === 'pink' && 'bg-pink-500',
                      color === 'purple' && 'bg-purple-500',
                      formData.noteColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-white scale-110'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Finalização</Label>
              <Select value={formData.endType || 'complete'} onValueChange={(v) => updateField('endType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">✅ Concluído</SelectItem>
                  <SelectItem value="transfer">🔄 Transferir para Humano</SelectItem>
                  <SelectItem value="error">❌ Erro</SelectItem>
                  <SelectItem value="abandon">🚫 Abandonado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.endType === 'transfer' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Departamento</Label>
                <Input value={formData.department || ''} onChange={(e) => updateField('department', e.target.value)} placeholder="Vendas, Suporte, etc." className="bg-muted/50" />
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Enviar mensagem final</Label>
                <p className="text-[11px] text-muted-foreground">Mensagem de despedida</p>
              </div>
              <Switch checked={formData.sendFinalMessage ?? false} onCheckedChange={(v) => updateField('sendFinalMessage', v)} />
            </div>
            
            {formData.sendFinalMessage && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem Final</Label>
                <Textarea value={formData.finalMessage || ''} onChange={(e) => updateField('finalMessage', e.target.value)} placeholder="Obrigado pelo contato!" className="bg-muted/50 resize-none" rows={2} />
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Marcar como atendido</Label>
                <p className="text-[11px] text-muted-foreground">Atualiza status no CRM</p>
              </div>
              <Switch checked={formData.markAsServed ?? true} onCheckedChange={(v) => updateField('markAsServed', v)} />
            </div>
          </div>
        );

      // ==================== WHATSAPP NATIVE NODES ====================
      case 'wa_start':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg">📱</div>
                <div>
                  <p className="text-sm font-medium">Início do Fluxo WhatsApp</p>
                  <p className="text-[11px] text-muted-foreground">Este nó inicia quando uma conversa começa</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gatilho</Label>
              <Select value={formData.startTrigger || 'first_message'} onValueChange={(v) => updateField('startTrigger', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_message">💬 Primeira mensagem</SelectItem>
                  <SelectItem value="keyword">🔑 Palavra-chave específica</SelectItem>
                  <SelectItem value="any_message">📨 Qualquer mensagem</SelectItem>
                  <SelectItem value="menu_return">↩️ Retorno ao menu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.startTrigger === 'keyword' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Palavras-chave</Label>
                <Textarea
                  value={formData.keywords || ''}
                  onChange={(e) => updateField('keywords', e.target.value)}
                  placeholder="menu, início, oi, olá"
                  className="bg-muted/50 resize-none"
                  rows={2}
                />
                <p className="text-[11px] text-muted-foreground">Separe por vírgula</p>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Salvar dados do contato</Label>
                <p className="text-[11px] text-muted-foreground">Nome e telefone em variáveis</p>
              </div>
              <Switch checked={formData.saveContactData ?? true} onCheckedChange={(v) => updateField('saveContactData', v)} />
            </div>
          </div>
        );

      case 'wa_send_text':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="text-lg">💬</div>
                <p className="text-sm font-medium">Enviar Mensagem de Texto</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"><Wand2 className="w-3 h-3" /> IA</Button>
              </div>
              <Textarea
                value={formData.message || ''}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Olá {{nome}}! Como posso ajudar?"
                className="bg-muted/50 resize-none min-h-[120px]"
              />
              <div className="flex flex-wrap gap-1.5">
                {['{{nome}}', '{{telefone}}', '{{data}}', '{{hora}}'].map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/20" onClick={() => updateField('message', (formData.message || '') + ' ' + variable)}>{variable}</Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">⌨️</div>
                <div>
                  <Label className="text-sm">Simular digitação</Label>
                  <p className="text-[11px] text-muted-foreground">Mostra "digitando..."</p>
                </div>
              </div>
              <Switch checked={formData.showTyping ?? true} onCheckedChange={(v) => updateField('showTyping', v)} />
            </div>
            
            {formData.showTyping && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Duração (ms)</Label>
                <Slider value={[formData.typingDuration || 2000]} onValueChange={(v) => updateField('typingDuration', v[0])} min={500} max={5000} step={100} className="py-2" />
                <p className="text-[11px] text-muted-foreground text-right">{formData.typingDuration || 2000}ms</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Anexar mídia (Opcional)</Label>
              <Select value={formData.mediaType || 'none'} onValueChange={(v) => updateField('mediaType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem mídia</SelectItem>
                  <SelectItem value="image">🖼️ Imagem</SelectItem>
                  <SelectItem value="video">🎬 Vídeo</SelectItem>
                  <SelectItem value="audio">🎵 Áudio</SelectItem>
                  <SelectItem value="document">📄 Documento</SelectItem>
                </SelectContent>
              </Select>
              {formData.mediaType && formData.mediaType !== 'none' && (
                <Input value={formData.mediaUrl || ''} onChange={(e) => updateField('mediaUrl', e.target.value)} placeholder="URL da mídia" className="bg-muted/50 mt-2" />
              )}
            </div>
          </div>
        );

      case 'wa_send_buttons':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="text-lg">🔘</div>
                <div>
                  <p className="text-sm font-medium">Enviar Botões Interativos</p>
                  <p className="text-[11px] text-muted-foreground">Máximo 3 botões por mensagem</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Mensagem</Label>
              <Textarea value={formData.message || ''} onChange={(e) => updateField('message', e.target.value)} placeholder="Escolha uma opção:" className="bg-muted/50 resize-none" rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título (Opcional)</Label>
              <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Menu Principal" className="bg-muted/50" maxLength={60} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rodapé (Opcional)</Label>
              <Input value={formData.footer || ''} onChange={(e) => updateField('footer', e.target.value)} placeholder="Powered by Genesis" className="bg-muted/50" maxLength={60} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Botões (máx. 3)</Label>
              <Textarea
                value={formData.buttonsConfig || ''}
                onChange={(e) => updateField('buttonsConfig', e.target.value)}
                placeholder="btn_1|✅ Confirmar&#10;btn_2|❌ Cancelar&#10;btn_3|❓ Ajuda"
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground">Formato: <code className="bg-muted px-1 rounded">id|texto</code> (um por linha, máx 20 caracteres)</p>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Aguardar resposta</Label>
                <p className="text-[11px] text-muted-foreground">Pausa fluxo até clique</p>
              </div>
              <Switch checked={formData.waitForResponse ?? true} onCheckedChange={(v) => updateField('waitForResponse', v)} />
            </div>
            
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-muted-foreground">Requer WhatsApp Business API ou backend v4.0.1+ conectado.</p>
              </div>
            </div>
          </div>
        );

      case 'wa_send_list':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="text-lg">📋</div>
                <div>
                  <p className="text-sm font-medium">Enviar Lista Interativa</p>
                  <p className="text-[11px] text-muted-foreground">Até 10 seções com 10 itens cada</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto da Mensagem</Label>
              <Textarea value={formData.message || ''} onChange={(e) => updateField('message', e.target.value)} placeholder="Veja nossas opções disponíveis:" className="bg-muted/50 resize-none" rows={3} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Título</Label>
              <Input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Menu de Serviços" className="bg-muted/50" maxLength={60} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto do Botão</Label>
              <Input value={formData.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} placeholder="Ver opções" className="bg-muted/50" maxLength={20} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Seções e Itens</Label>
              <Textarea
                value={formData.sectionsConfig || ''}
                onChange={(e) => updateField('sectionsConfig', e.target.value)}
                placeholder="# Produtos&#10;prod_1|Produto 1|Descrição do produto&#10;prod_2|Produto 2|Descrição&#10;# Serviços&#10;serv_1|Serviço 1|Descrição do serviço"
                className="bg-muted/50 resize-none font-mono text-sm"
                rows={8}
              />
              <p className="text-[11px] text-muted-foreground"># para seção, <code className="bg-muted px-1 rounded">id|título|descrição</code> para itens</p>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Aguardar seleção</Label>
                <p className="text-[11px] text-muted-foreground">Pausa fluxo até seleção</p>
              </div>
              <Switch checked={formData.waitForSelection ?? true} onCheckedChange={(v) => updateField('waitForSelection', v)} />
            </div>
          </div>
        );

      case 'wa_wait_response':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <div className="text-lg">⏳</div>
                <div>
                  <p className="text-sm font-medium">Aguardar Resposta</p>
                  <p className="text-[11px] text-muted-foreground">Pausa o fluxo até receber mensagem</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Resposta Esperada</Label>
              <Select value={formData.expectedType || 'any'} onValueChange={(v) => updateField('expectedType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">📨 Qualquer resposta</SelectItem>
                  <SelectItem value="text">💬 Texto</SelectItem>
                  <SelectItem value="button">🔘 Clique em botão</SelectItem>
                  <SelectItem value="list">📋 Seleção de lista</SelectItem>
                  <SelectItem value="media">🖼️ Mídia (imagem/vídeo/áudio)</SelectItem>
                  <SelectItem value="location">📍 Localização</SelectItem>
                  <SelectItem value="contact">👤 Contato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Timeout (segundos)</Label>
              <Input type="number" min="30" max="86400" value={formData.timeout || 300} onChange={(e) => updateField('timeout', parseInt(e.target.value))} className="bg-muted/50" />
              <p className="text-[11px] text-muted-foreground">Tempo máximo de espera (5 min = 300s)</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Salvar resposta em variável</Label>
              <Input value={formData.saveAs || ''} onChange={(e) => updateField('saveAs', e.target.value)} placeholder="resposta_usuario" className="bg-muted/50" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Mensagem de timeout</Label>
                <p className="text-[11px] text-muted-foreground">Enviar se não responder</p>
              </div>
              <Switch checked={formData.sendTimeoutMessage ?? false} onCheckedChange={(v) => updateField('sendTimeoutMessage', v)} />
            </div>
            
            {formData.sendTimeoutMessage && (
              <div className="space-y-2">
                <Textarea value={formData.timeoutMessage || ''} onChange={(e) => updateField('timeoutMessage', e.target.value)} placeholder="Não recebi sua resposta. Digite algo para continuar." className="bg-muted/50 resize-none" rows={2} />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Validação (Opcional)</Label>
              <Select value={formData.validation || 'none'} onValueChange={(v) => updateField('validation', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem validação</SelectItem>
                  <SelectItem value="email">📧 E-mail válido</SelectItem>
                  <SelectItem value="phone">📱 Telefone</SelectItem>
                  <SelectItem value="cpf">🆔 CPF</SelectItem>
                  <SelectItem value="number">🔢 Número</SelectItem>
                  <SelectItem value="regex">⟨⟩ Regex customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.validation === 'regex' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Padrão Regex</Label>
                <Input value={formData.validationRegex || ''} onChange={(e) => updateField('validationRegex', e.target.value)} placeholder="^\d{5}-?\d{3}$" className="bg-muted/50 font-mono" />
              </div>
            )}
            
            {formData.validation && formData.validation !== 'none' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mensagem de erro</Label>
                <Input value={formData.validationError || ''} onChange={(e) => updateField('validationError', e.target.value)} placeholder="Formato inválido. Tente novamente." className="bg-muted/50" />
              </div>
            )}
          </div>
        );

      case 'wa_receive':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className="text-lg">📥</div>
                <div>
                  <p className="text-sm font-medium">Processar Entrada</p>
                  <p className="text-[11px] text-muted-foreground">Captura e processa dados recebidos</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">O que capturar</Label>
              <Select value={formData.captureType || 'message'} onValueChange={(v) => updateField('captureType', v)}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">💬 Texto da mensagem</SelectItem>
                  <SelectItem value="button_id">🔘 ID do botão clicado</SelectItem>
                  <SelectItem value="list_id">📋 ID do item selecionado</SelectItem>
                  <SelectItem value="media_url">🖼️ URL da mídia</SelectItem>
                  <SelectItem value="location">📍 Coordenadas</SelectItem>
                  <SelectItem value="contact">👤 Dados do contato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Salvar como variável</Label>
              <Input value={formData.variableName || ''} onChange={(e) => updateField('variableName', e.target.value)} placeholder="dados_capturados" className="bg-muted/50" />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <Label className="text-sm">Transformar dados</Label>
                <p className="text-[11px] text-muted-foreground">Aplicar formatação</p>
              </div>
              <Switch checked={formData.transform ?? false} onCheckedChange={(v) => updateField('transform', v)} />
            </div>
            
            {formData.transform && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Transformação</Label>
                <Select value={formData.transformType || 'none'} onValueChange={(v) => updateField('transformType', v)}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uppercase">MAIÚSCULAS</SelectItem>
                    <SelectItem value="lowercase">minúsculas</SelectItem>
                    <SelectItem value="capitalize">Primeira Maiúscula</SelectItem>
                    <SelectItem value="trim">Remover espaços</SelectItem>
                    <SelectItem value="extract_numbers">Só números</SelectItem>
                    <SelectItem value="format_phone">Formatar telefone</SelectItem>
                    <SelectItem value="format_cpf">Formatar CPF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">Os dados capturados ficam disponíveis como <code className="bg-muted px-1 rounded">{'{{' + (formData.variableName || 'variavel') + '}}'}</code> nos próximos nós.</p>
              </div>
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
      className="w-[360px] bg-card/95 backdrop-blur-xl border-l flex flex-col h-full shadow-2xl fixed right-0 top-0 z-50"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${nodeColor}20` }}>
                <div className="w-5 h-5 rounded-lg" style={{ backgroundColor: nodeColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{formData.label || 'Configurar Nó'}</h3>
                <Badge variant="secondary" className="text-[10px]">{node.data.type}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="w-4 h-4" /></Button>
          </div>

          <TabsList className="w-full bg-muted/50 p-1 h-9">
            <TabsTrigger value="config" className="flex-1 text-xs gap-1.5 h-7"><Sparkles className="w-3 h-3" /> Configurar</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 text-xs gap-1.5 h-7"><Eye className="w-3 h-3" /> Preview</TabsTrigger>
            <TabsTrigger value="code" className="flex-1 text-xs gap-1.5 h-7"><Code className="w-3 h-3" /> JSON</TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="config" className="m-0 space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome do Nó</Label>
                <Input value={formData.label || ''} onChange={(e) => updateField('label', e.target.value)} placeholder="Nome do nó" className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</Label>
                <Input value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} placeholder="Breve descrição (opcional)" className="bg-muted/50" />
              </div>

              <div className="my-4 border-t" />

              {/* Type-specific config */}
              {renderConfigFields()}
            </TabsContent>

            <TabsContent value="preview" className="m-0">
              <div className="rounded-xl border bg-muted/30 p-4 min-h-[200px]">
                <p className="text-xs text-muted-foreground text-center">Preview da mensagem aparecerá aqui</p>
              </div>
            </TabsContent>

            <TabsContent value="code" className="m-0">
              <pre className="rounded-xl bg-muted/50 p-4 text-xs overflow-auto">{JSON.stringify(node.data, null, 2)}</pre>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/20 space-y-2">
        {hasChanges && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-amber-500 text-center mb-2">⚠️ Alterações não salvas</motion.div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onDuplicate?.(node.id)}><Copy className="w-3.5 h-3.5" />Duplicar</Button>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onDelete(node.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
        <Button size="sm" className="w-full gap-1.5" onClick={handleSave} disabled={!hasChanges}><Save className="w-3.5 h-3.5" />Salvar Alterações</Button>
      </div>
    </motion.div>
  );
};
