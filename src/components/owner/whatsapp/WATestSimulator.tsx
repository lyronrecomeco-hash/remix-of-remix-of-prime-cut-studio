import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Play, 
  RotateCcw, 
  Smartphone, 
  MessageSquare, 
  MousePointer,
  Zap,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { WhatsAppPreview } from './preview/WhatsAppPreview';

interface Template {
  id: string;
  name: string;
  template_type: string;
  message_content: string;
  buttons: any[];
  list_sections: any[];
  footer_text: string | null;
  variables: string[];
}

interface SimulationStep {
  id: string;
  type: 'message_sent' | 'button_click' | 'state_change' | 'action_executed';
  timestamp: Date;
  data: any;
}

interface ConversationState {
  phone_number: string;
  current_state: string;
  context: any;
  last_template_id: string | null;
  last_button_clicked: string | null;
}

export function WATestSimulator() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('5511999999999');
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentState, setCurrentState] = useState<ConversationState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
      
      // Initialize variable values
      if (template?.variables) {
        const vars: Record<string, string> = {};
        template.variables.forEach((v: string) => {
          vars[v] = `Valor de ${v}`;
        });
        setVariableValues(vars);
      }
    } else {
      setSelectedTemplate(null);
      setVariableValues({});
    }
  }, [selectedTemplateId, templates]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('whatsapp_interactive_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast.error('Erro ao carregar templates');
      return;
    }

    setTemplates((data || []).map(t => ({
      id: t.id,
      name: t.name,
      template_type: t.template_type,
      message_content: t.message_content,
      buttons: (t.buttons as unknown as any[]) || [],
      list_sections: (t.list_sections as unknown as any[]) || [],
      footer_text: t.footer_text,
      variables: (t.variables as unknown as string[]) || []
    })));
  };

  const addStep = (type: SimulationStep['type'], data: any) => {
    const step: SimulationStep = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      data
    };
    setSimulationSteps(prev => [...prev, step]);
  };

  const simulateSendTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template');
      return;
    }

    setIsSimulating(true);

    // Simulate sending the template
    addStep('message_sent', {
      template_id: selectedTemplate.id,
      template_name: selectedTemplate.name,
      phone_number: testPhoneNumber,
      variables: variableValues
    });

    // Update/create conversation state
    const newState: ConversationState = {
      phone_number: testPhoneNumber,
      current_state: 'awaiting_response',
      context: { last_template: selectedTemplate.name, variables: variableValues },
      last_template_id: selectedTemplate.id,
      last_button_clicked: null
    };
    setCurrentState(newState);

    addStep('state_change', {
      from: currentState?.current_state || 'initial',
      to: 'awaiting_response',
      context: newState.context
    });

    toast.success(`Template "${selectedTemplate.name}" enviado para ${testPhoneNumber}`);
    setIsSimulating(false);
  };

  const simulateButtonClick = async (buttonId: string, buttonText: string) => {
    if (!selectedTemplate || !currentState) return;

    setIsSimulating(true);

    // Log button click
    addStep('button_click', {
      button_id: buttonId,
      button_text: buttonText,
      phone_number: testPhoneNumber,
      template_id: selectedTemplate.id
    });

    // Find associated action
    const { data: action } = await supabase
      .from('whatsapp_button_actions')
      .select('*')
      .eq('button_id', buttonId)
      .single();

    if (action) {
      addStep('action_executed', {
        action_type: action.action_type,
        action_config: action.action_config,
        description: action.description
      });

      // Simulate action effects
      const config = action.action_config as any;
      
      if (action.action_type === 'send_template' && config?.next_template_id) {
        const nextTemplate = templates.find(t => t.id === config.next_template_id);
        if (nextTemplate) {
          setSelectedTemplateId(nextTemplate.id);
          toast.info(`Próximo template: ${nextTemplate.name}`);
        }
      }

      if (action.action_type === 'update_state' && config?.new_state) {
        const newState: ConversationState = {
          ...currentState,
          current_state: config.new_state,
          last_button_clicked: buttonId,
          context: { ...currentState.context, last_action: action.action_type }
        };
        setCurrentState(newState);

        addStep('state_change', {
          from: currentState.current_state,
          to: config.new_state
        });
      }

      toast.success(`Ação executada: ${action.action_type}`);
    } else {
      toast.warning(`Nenhuma ação configurada para o botão: ${buttonId}`);
    }

    setIsSimulating(false);
  };

  const simulateListItemClick = async (rowId: string, rowTitle: string) => {
    simulateButtonClick(rowId, rowTitle);
  };

  const resetSimulation = () => {
    setSimulationSteps([]);
    setCurrentState(null);
    setSelectedTemplateId('');
    setSelectedTemplate(null);
    setVariableValues({});
    toast.info('Simulação resetada');
  };

  const getStepIcon = (type: SimulationStep['type']) => {
    switch (type) {
      case 'message_sent': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'button_click': return <MousePointer className="h-4 w-4 text-blue-500" />;
      case 'state_change': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'action_executed': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStepLabel = (type: SimulationStep['type']) => {
    switch (type) {
      case 'message_sent': return 'Mensagem Enviada';
      case 'button_click': return 'Clique em Botão';
      case 'state_change': return 'Mudança de Estado';
      case 'action_executed': return 'Ação Executada';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Modo Teste - Simulador WhatsApp
          </h2>
          <p className="text-muted-foreground">
            Simule fluxos completos sem enviar mensagens reais
          </p>
        </div>
        <Button variant="outline" onClick={resetSimulation}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Número de Teste (Fake)</Label>
              <Input
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="5511999999999"
              />
              <p className="text-xs text-muted-foreground">
                Número simulado, não será enviado nada real
              </p>
            </div>

            <div className="space-y-2">
              <Label>Template Inicial</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.template_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variáveis</Label>
                {selectedTemplate.variables.map((v: string) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">{`{{${v}}}`}</span>
                    <Input
                      value={variableValues[v] || ''}
                      onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                      placeholder={`Valor de ${v}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={simulateSendTemplate}
              disabled={!selectedTemplate || isSimulating}
            >
              <Play className="h-4 w-4 mr-2" />
              Simular Envio
            </Button>

            {/* Current State Display */}
            {currentState && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-sm">Estado Atual</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{currentState.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="outline">{currentState.current_state}</Badge>
                  </div>
                  {currentState.last_button_clicked && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último botão:</span>
                      <span className="text-xs">{currentState.last_button_clicked}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Preview WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <WhatsAppPreview
                templateType={selectedTemplate.template_type}
                messageContent={selectedTemplate.message_content}
                buttons={selectedTemplate.buttons}
                listSections={selectedTemplate.list_sections}
                buttonText="Ver opções"
                footerText={selectedTemplate.footer_text || ''}
                variables={variableValues}
                onButtonClick={(id) => { simulateButtonClick(id, id); }}
                onListItemClick={(id) => { simulateListItemClick(id, id); }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Smartphone className="h-12 w-12 mb-4 opacity-50" />
                <p>Selecione um template para visualizar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {simulationSteps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum evento ainda</p>
                  <p className="text-xs">Inicie a simulação</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {simulationSteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {index < simulationSteps.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          {getStepIcon(step.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{getStepLabel(step.type)}</span>
                            <span className="text-xs text-muted-foreground">
                              {step.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Example Flow Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Fluxo de Exemplo - Confirmação de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">1. Cliente faz pedido</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">2. Envia template</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MousePointer className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">3. Cliente clica botão</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">4. Webhook processa</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">5. Ação executada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
