import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Save, 
  Loader2, 
  Plus, 
  GitBranch, 
  Play, 
  Pause,
  ArrowLeft,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { FlowNode } from './FlowNode';
import { NodeSidebar } from './NodeSidebar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { 
  FlowNode as FlowNodeType, 
  FlowEdge, 
  FlowData, 
  AutomationRule, 
  NodeTemplate,
  NODE_COLORS 
} from './types';

const nodeTypes = {
  flowNode: FlowNode
};

interface WAFlowBuilderProps {
  onBack?: () => void;
}

export const WAFlowBuilder = ({ onBack }: WAFlowBuilderProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowNodeType | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      
      const typedRules = (data || []).map(rule => ({
        ...rule,
        trigger_config: rule.trigger_config || {},
        conditions: rule.conditions || [],
        actions: rule.actions || [],
        flow_data: rule.flow_data as unknown as FlowData || { nodes: [], edges: [] },
        canvas_position: rule.canvas_position as unknown as { x: number; y: number; zoom: number } || { x: 0, y: 0, zoom: 1 }
      })) as AutomationRule[];
      
      setRules(typedRules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Erro ao carregar fluxos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Load rule into canvas
  const loadRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    
    const flowData = rule.flow_data || { nodes: [], edges: [] };
    
    // Convert to React Flow format
    const rfNodes = flowData.nodes.map(n => ({
      id: n.id,
      type: 'flowNode',
      position: n.position,
      data: n.data
    }));
    
    const rfEdges = flowData.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      animated: true,
      style: { stroke: '#6b7280' }
    }));
    
    setNodes(rfNodes);
    setEdges(rfEdges);
    setSelectedNode(null);
  };

  // Create new rule
  const createRule = async () => {
    if (!newRuleName.trim()) {
      toast.error('Digite um nome para o fluxo');
      return;
    }

    setIsSaving(true);
    try {
      const initialFlow = {
        nodes: [{
          id: 'trigger-1',
          type: 'flowNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Início',
            type: 'trigger',
            config: { triggerType: 'keyword', keywords: [] },
            description: 'Gatilho inicial'
          }
        }],
        edges: []
      };

      const { data, error } = await supabase
        .from('whatsapp_automation_rules')
        .insert({
          name: newRuleName,
          description: '',
          trigger_type: 'keyword',
          trigger_config: {},
          conditions: [],
          actions: [],
          flow_data: initialFlow as any,
          priority: rules.length + 1
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Fluxo criado!');
      setIsCreateDialogOpen(false);
      setNewRuleName('');
      fetchRules();
      
      if (data) {
        loadRule({
          ...data,
          flow_data: initialFlow,
          canvas_position: { x: 0, y: 0, zoom: 1 }
        } as AutomationRule);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Erro ao criar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

  // Save current flow
  const saveFlow = async () => {
    if (!selectedRule) return;

    setIsSaving(true);
    try {
      const flowData = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type || 'flowNode',
          position: n.position,
          data: n.data as any
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: e.label as string | undefined
        }))
      };

      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({
          flow_data: flowData as any,
          flow_version: (selectedRule.flow_version || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRule.id);

      if (error) throw error;

      toast.success('Fluxo salvo!');
      setSelectedRule(prev => prev ? { 
        ...prev, 
        flow_data: flowData,
        flow_version: (prev.flow_version || 1) + 1 
      } : null);
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle rule active
  const toggleRuleActive = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;
      toast.success(rule.is_active ? 'Fluxo desativado' : 'Fluxo ativado');
      fetchRules();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  // Delete rule
  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      toast.success('Fluxo excluído');
      
      if (selectedRule?.id === ruleId) {
        setSelectedRule(null);
        setNodes([]);
        setEdges([]);
      }
      fetchRules();
    } catch (error) {
      toast.error('Erro ao excluir fluxo');
    }
  };

  // Handle edge connection
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      animated: true,
      style: { stroke: '#6b7280' }
    }, eds));
  }, [setEdges]);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node as FlowNodeType);
  }, []);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from sidebar
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const templateData = event.dataTransfer.getData('application/reactflow');
    if (!templateData) return;

    const template: NodeTemplate = JSON.parse(templateData);
    
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = {
      x: event.clientX - reactFlowBounds.left - 90,
      y: event.clientY - reactFlowBounds.top - 25
    };

    const newNode = {
      id: `${template.type}-${Date.now()}`,
      type: 'flowNode',
      position,
      data: {
        label: template.label,
        type: template.type,
        config: template.defaultConfig,
        description: template.description,
        icon: template.icon
      }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Handle drag start from sidebar
  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Update node data
  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
    setSelectedNode(null);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // List view when no rule selected
  if (!selectedRule) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Flow Builder Visual
                </CardTitle>
                <CardDescription>
                  Crie fluxos de automação arrastando e conectando blocos
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Fluxo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum fluxo criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro fluxo de automação visual
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Fluxo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map((rule) => (
                  <Card 
                    key={rule.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => loadRule(rule)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            rule.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <h3 className="font-medium">{rule.name}</h3>
                        </div>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {rule.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {rule.flow_data?.nodes?.length || 0} nós
                        </span>
                        <span>
                          {rule.execution_count || 0} execuções
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleRuleActive(rule)}
                        >
                          {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Fluxo de Automação</DialogTitle>
              <DialogDescription>
                Crie um novo fluxo visual para automatizar conversas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Fluxo</Label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ex: Atendimento Inicial"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createRule} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Fluxo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Flow Editor view
  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] rounded-xl border overflow-hidden bg-background">
      {/* Sidebar */}
      <NodeSidebar onDragStart={onDragStart} />

      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/30"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const type = (node.data as any)?.type;
              return NODE_COLORS[type as keyof typeof NODE_COLORS] || '#6b7280';
            }}
            className="!bg-card !border"
          />
          
          {/* Top Panel */}
          <Panel position="top-left" className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedRule(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="bg-card px-3 py-1.5 rounded-lg border">
              <span className="font-medium">{selectedRule.name}</span>
              <Badge variant={selectedRule.is_active ? 'default' : 'secondary'} className="ml-2">
                v{selectedRule.flow_version || 1}
              </Badge>
            </div>
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleRuleActive(selectedRule)}
            >
              {selectedRule.is_active ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
            <Button size="sm" onClick={saveFlow} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={updateNodeData}
          onDelete={deleteNode}
        />
      )}
    </div>
  );
};
