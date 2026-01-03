import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  ConnectionLineType,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Save, 
  Loader2, 
  Plus, 
  GitBranch, 
  Play, 
  Pause,
  Trash2,
  Sparkles,
  Activity,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Search,
  LayoutTemplate,
  PlayCircle,
  Clock,
  TrendingUp,
  Zap,
  MessageSquare,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { FlowNode } from './FlowNode';
import { NodeSidebar } from './NodeSidebar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { FlowToolbar } from './FlowToolbar';
import { FlowStats } from './FlowStats';
import { FlowValidationPanel } from './FlowValidationPanel';
import { HelpModal } from './HelpModal';
import { LunaAIModal } from './LunaAIModal';
import { FlowTemplates } from './FlowTemplates';
import { FlowSimulator } from './FlowSimulator';
import { FlowControls } from './FlowControls';
import { NodeSearch } from './NodeSearch';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { 
  FlowNode as FlowNodeType, 
  FlowEdge, 
  FlowData, 
  AutomationRule, 
  NodeTemplate,
  NODE_COLORS 
} from './types';
import { useFlowClipboard, useAutoLayout, useFlowValidation } from './hooks';
import { cn } from '@/lib/utils';

import { CustomEdge } from './CustomEdge';

const nodeTypes = { flowNode: FlowNode };
const edgeTypes = { custom: CustomEdge };

const defaultEdgeOptions = {
  type: 'custom',
  animated: false
};

const getEdgeStyle = (sourceHandle?: string | null) => {
  // Styles are now handled by CustomEdge component
  return {};
};

interface WAFlowBuilderProps {
  onBack?: () => void;
}

const FlowBuilderContent = ({ onBack }: WAFlowBuilderProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, zoomIn, zoomOut, setCenter, getNodes } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowNodeType | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLunaOpen, setIsLunaOpen] = useState(false);
  
  // New features state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  
  // History
  const [history, setHistory] = useState<{ nodes: any[]; edges: any[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Validation
  const [showValidation, setShowValidation] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { validateFlow } = useFlowValidation();
  const [validationResult, setValidationResult] = useState({ errors: [] as any[], warnings: [] as any[] });
  
  // Clipboard & Layout
  const { copyNodes, pasteNodes, hasClipboard } = useFlowClipboard();
  const { calculateLayout } = useAutoLayout();

  // Selected nodes count
  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      reactFlowWrapper.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // History
  const addToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (isMeta && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (isMeta && e.key === 's') { e.preventDefault(); if (selectedRule) saveFlow(); }
      if (isMeta && e.key === 'c' && selectedNodes.length > 0) { e.preventDefault(); copyNodes(selectedNodes.map(n => ({ ...n, position: n.position, data: n.data }))); }
      if (isMeta && e.key === 'v') { e.preventDefault(); const newNodes = pasteNodes(); if (newNodes.length > 0) { setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]); addToHistory(); } }
      if (isMeta && e.key === 'a') { e.preventDefault(); setNodes(nds => nds.map(n => ({ ...n, selected: true }))); }
      if (isMeta && e.key === 'f') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedNodes.length > 0) { const idsToDelete = new Set(selectedNodes.map(n => n.id)); setNodes(nds => nds.filter(n => !idsToDelete.has(n.id))); setEdges(eds => eds.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target))); setSelectedNode(null); addToHistory(); } else if (selectedNode) { deleteNode(selectedNode.id); } }
      if (e.key === 'Escape') { setSelectedNode(null); setNodes(nds => nds.map(n => ({ ...n, selected: false }))); setShowValidation(false); setShowSearch(false); setShowShortcuts(false); }
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(true); }
      if (e.key === 'v' && !isMeta) setInteractionMode('select');
      if (e.key === 'h' && !isMeta) setInteractionMode('pan');
      if (e.key === 'g' && !isMeta) setSnapToGrid(s => !s);
      if (e.key === 'l' && !isMeta) handleAutoLayout();
      if (e.key === '0' && !isMeta) fitView({ padding: 0.2 });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedRule, selectedNode, selectedNodes, copyNodes, pasteNodes, setNodes, addToHistory, toggleFullscreen, fitView]);

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('whatsapp_automation_rules').select('*').order('priority', { ascending: true });
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

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // Load rule into canvas
  const loadRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    const flowData = rule.flow_data || { nodes: [], edges: [] };
    const rfNodes = flowData.nodes.map(n => ({ id: n.id, type: 'flowNode', position: n.position, data: n.data }));
    const rfEdges = flowData.edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, ...defaultEdgeOptions, style: getEdgeStyle(e.sourceHandle) }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    setSelectedNode(null);
    setHistory([{ nodes: rfNodes, edges: rfEdges }]);
    setHistoryIndex(0);
    const result = validateFlow(rfNodes, rfEdges);
    setValidationResult({ errors: result.errors, warnings: result.warnings });
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  // Create new rule
  const createRule = async () => {
    if (!newRuleName.trim()) { toast.error('Digite um nome para o fluxo'); return; }
    setIsSaving(true);
    try {
      const initialFlow = { nodes: [{ id: 'trigger-1', type: 'flowNode', position: { x: 400, y: 100 }, data: { label: 'Início do Fluxo', type: 'trigger', config: { triggerType: 'keyword', keywords: [] }, description: 'Gatilho inicial do fluxo' } }], edges: [] };
      const { data, error } = await supabase.from('whatsapp_automation_rules').insert({ name: newRuleName, description: '', trigger_type: 'keyword', trigger_config: {}, conditions: [], actions: [], flow_data: initialFlow as any, priority: rules.length + 1 }).select().single();
      if (error) throw error;
      toast.success('Fluxo criado com sucesso!');
      setIsCreateDialogOpen(false);
      setNewRuleName('');
      fetchRules();
      if (data) { loadRule({ ...data, flow_data: initialFlow, canvas_position: { x: 0, y: 0, zoom: 1 } } as AutomationRule); }
    } catch (error) { console.error('Error creating rule:', error); toast.error('Erro ao criar fluxo'); } finally { setIsSaving(false); }
  };

  // Save flow
  const saveFlow = async () => {
    if (!selectedRule) return;
    setIsSaving(true);
    try {
      const flowData = { nodes: nodes.map(n => ({ id: n.id, type: n.type || 'flowNode', position: n.position, data: n.data as any })), edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label as string | undefined })) };
      const { error } = await supabase.from('whatsapp_automation_rules').update({ flow_data: flowData as any, flow_version: (selectedRule.flow_version || 1) + 1, updated_at: new Date().toISOString() }).eq('id', selectedRule.id);
      if (error) throw error;
      toast.success('Fluxo salvo!');
      setSelectedRule(prev => prev ? { ...prev, flow_data: flowData, flow_version: (prev.flow_version || 1) + 1 } : null);
    } catch (error) { console.error('Error saving flow:', error); toast.error('Erro ao salvar fluxo'); } finally { setIsSaving(false); }
  };

  const toggleRuleActive = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase.from('whatsapp_automation_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
      if (error) throw error;
      toast.success(rule.is_active ? 'Fluxo pausado' : 'Fluxo ativado!');
      fetchRules();
      if (selectedRule?.id === rule.id) { setSelectedRule(prev => prev ? { ...prev, is_active: !prev.is_active } : null); }
    } catch (error) { toast.error('Erro ao alterar status'); }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from('whatsapp_automation_rules').delete().eq('id', ruleId);
      if (error) throw error;
      toast.success('Fluxo excluído');
      if (selectedRule?.id === ruleId) { setSelectedRule(null); setNodes([]); setEdges([]); }
      fetchRules();
    } catch (error) { toast.error('Erro ao excluir fluxo'); }
  };

  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;
    if (connection.source === connection.target) return false;
    const isDuplicate = edges.some(e => e.source === connection.source && e.target === connection.target && e.sourceHandle === connection.sourceHandle && e.targetHandle === connection.targetHandle);
    if (isDuplicate) return false;
    if (connection.sourceHandle === 'yes' || connection.sourceHandle === 'no') {
      const alreadyUsed = edges.some(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      if (alreadyUsed) return false;
    }
    return true;
  }, [edges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!isValidConnection(connection)) { toast.error('Conexão inválida'); return; }
    const edgeStyle = getEdgeStyle(connection.sourceHandle);
    const markerColor = connection.sourceHandle === 'yes' ? '#22c55e' : connection.sourceHandle === 'no' ? '#ef4444' : 'hsl(var(--primary))';
    setEdges((eds) => addEdge({ 
      ...connection, 
      type: 'custom',
      data: { label: connection.sourceHandle === 'yes' ? 'SIM' : connection.sourceHandle === 'no' ? 'NÃO' : undefined }
    }, eds));
    addToHistory();
  }, [setEdges, addToHistory, isValidConnection]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => { setSelectedNode(node as FlowNodeType); }, []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setNodes(nds => nds.map(n => ({ ...n, selected: false }))); }, [setNodes]);
  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const templateData = event.dataTransfer.getData('application/reactflow');
    if (!templateData) return;
    const template: NodeTemplate = JSON.parse(templateData);
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    const position = { x: event.clientX - reactFlowBounds.left - 100, y: event.clientY - reactFlowBounds.top - 40 };
    const newNode = { id: `${template.type}-${Date.now()}`, type: 'flowNode', position, data: { label: template.label, type: template.type, config: template.defaultConfig, description: template.description, icon: template.icon } };
    setNodes((nds) => nds.concat(newNode));
    addToHistory();
  }, [setNodes, addToHistory]);

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => { event.dataTransfer.setData('application/reactflow', JSON.stringify(template)); event.dataTransfer.effectAllowed = 'move'; };
  const updateNodeData = (nodeId: string, newData: any) => { setNodes(nds => nds.map(node => node.id === nodeId ? { ...node, data: newData } : node)); setSelectedNode(null); addToHistory(); };
  const duplicateNode = (nodeId: string) => { const node = nodes.find(n => n.id === nodeId); if (!node) return; const newNode = { ...node, id: `${node.data.type}-${Date.now()}`, position: { x: node.position.x + 50, y: node.position.y + 50 } }; setNodes(nds => nds.concat(newNode)); addToHistory(); toast.success('Nó duplicado!'); };
  const deleteNode = (nodeId: string) => { setNodes(nds => nds.filter(node => node.id !== nodeId)); setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)); setSelectedNode(null); addToHistory(); };

  const exportFlow = () => { const flowData = { name: selectedRule?.name, version: selectedRule?.flow_version, nodes, edges }; const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `flow-${selectedRule?.name || 'export'}-v${selectedRule?.flow_version || 1}.json`; a.click(); toast.success('Fluxo exportado!'); };
  const importFlow = () => fileInputRef.current?.click();
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); if (data.nodes && Array.isArray(data.nodes)) { setNodes(data.nodes); setEdges(data.edges || []); addToHistory(); toast.success('Fluxo importado!'); setTimeout(() => fitView({ padding: 0.2 }), 100); } else { toast.error('Arquivo inválido'); } } catch { toast.error('Erro ao ler arquivo'); } }; reader.readAsText(file); event.target.value = ''; };
  const handleAutoLayout = useCallback(() => { const layoutedNodes = calculateLayout(nodes, edges, 'TB'); setNodes(layoutedNodes); addToHistory(); setTimeout(() => fitView({ padding: 0.2 }), 100); toast.success('Layout reorganizado!'); }, [nodes, edges, calculateLayout, setNodes, addToHistory, fitView]);
  const handleValidate = useCallback(() => { const result = validateFlow(nodes, edges); setValidationResult({ errors: result.errors, warnings: result.warnings }); setShowValidation(true); if (result.isValid && result.warnings.length === 0) { toast.success('Fluxo válido!'); } else if (result.errors.length > 0) { toast.error(`${result.errors.length} erro(s) encontrado(s)`); } else { toast.warning(`${result.warnings.length} aviso(s) encontrado(s)`); } }, [nodes, edges, validateFlow]);
  const navigateToNode = useCallback((nodeId: string) => { const node = nodes.find(n => n.id === nodeId); if (node) { setCenter(node.position.x + 140, node.position.y + 60, { zoom: 1.5, duration: 500 }); setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId }))); setSelectedNode(node as any); } }, [nodes, setCenter, setNodes]);
  const handleCopy = useCallback(() => { if (selectedNodes.length > 0) { copyNodes(selectedNodes.map(n => ({ ...n, position: n.position, data: n.data }))); } }, [selectedNodes, copyNodes]);
  const handlePaste = useCallback(() => { const newNodes = pasteNodes(); if (newNodes.length > 0) { setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]); addToHistory(); } }, [pasteNodes, setNodes, addToHistory]);
  const handleDeleteSelected = useCallback(() => { if (selectedNodes.length > 0) { const idsToDelete = new Set(selectedNodes.map(n => n.id)); setNodes(nds => nds.filter(n => !idsToDelete.has(n.id))); setEdges(eds => eds.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target))); addToHistory(); toast.success(`${selectedNodes.length} nó(s) excluído(s)`); } }, [selectedNodes, setNodes, setEdges, addToHistory]);

  const handleApplyLunaFlow = useCallback((newNodes: FlowNodeType[], newEdges: FlowEdge[]) => {
    const rfNodes = newNodes.map(n => ({ id: n.id, type: 'flowNode', position: n.position, data: n.data }));
    const rfEdges = newEdges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, ...defaultEdgeOptions, style: getEdgeStyle(e.sourceHandle) }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    addToHistory();
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [setNodes, setEdges, addToHistory, fitView]);

  const handleApplyTemplate = useCallback((templateNodes: FlowNodeType[], templateEdges: FlowEdge[]) => {
    const rfNodes = templateNodes.map(n => ({ id: n.id, type: 'flowNode', position: n.position, data: n.data }));
    const rfEdges = templateEdges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, label: e.label, ...defaultEdgeOptions, style: getEdgeStyle(e.sourceHandle) }));
    setNodes(rfNodes);
    setEdges(rfEdges);
    addToHistory();
    setTimeout(() => fitView({ padding: 0.2 }), 100);
    toast.success('Template aplicado com sucesso!');
  }, [setNodes, setEdges, addToHistory, fitView]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  // List view when no rule selected - IMPROVED CARDS
  if (!selectedRule) {
    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <Card className="border shadow-xl bg-card overflow-hidden relative">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    Flow Builder
                    <Badge variant="secondary" className="text-xs">Pro</Badge>
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Crie automações visuais poderosas para WhatsApp
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="default" className="gap-2" onClick={() => setIsLunaOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  Luna IA
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="default" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Fluxo
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Stats Row */}
          <CardContent className="pb-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: GitBranch, label: 'Total de Fluxos', value: rules.length },
                { icon: CheckCircle2, label: 'Ativos', value: rules.filter(r => r.is_active).length },
                { icon: Activity, label: 'Execuções Hoje', value: rules.reduce((acc, r) => acc + (r.execution_count || 0), 0) },
                { icon: TrendingUp, label: 'Taxa de Sucesso', value: '98%' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-xl bg-muted/50 border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flows Grid */}
        {rules.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Comece a automatizar</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Crie seu primeiro fluxo de automação visual para responder mensagens automaticamente</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Criar Primeiro Fluxo
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {rules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <Card 
                    className={cn(
                      'cursor-pointer transition-all duration-300 group overflow-hidden',
                      'hover:shadow-xl border',
                      rule.is_active ? 'border-primary/20' : 'border-border'
                    )}
                    onClick={() => loadRule(rule)}
                  >
                    {/* Status indicator bar */}
                    <div className={cn('h-1 w-full', rule.is_active ? 'bg-primary' : 'bg-muted-foreground/20')} />
                    
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', rule.is_active ? 'bg-primary/10' : 'bg-muted')}>
                            {rule.is_active ? <Zap className="w-5 h-5 text-primary" /> : <Pause className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{rule.name}</h3>
                            <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                              {rule.is_active ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{rule.description || 'Sem descrição'}</p>
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-muted/50 text-center">
                          <p className="text-lg font-bold">{rule.flow_data?.nodes?.length || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Nós</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 text-center">
                          <p className="text-lg font-bold">{rule.execution_count || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Execuções</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 text-center">
                          <p className="text-lg font-bold">v{rule.flow_version || 1}</p>
                          <p className="text-[10px] text-muted-foreground">Versão</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => toggleRuleActive(rule)}>
                          {rule.is_active ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Ativar</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => loadRule(rule)}>
                          <ArrowRight className="w-4 h-4" /> Editar
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Novo Fluxo de Automação
              </DialogTitle>
              <DialogDescription>Crie um novo fluxo visual para automatizar conversas no WhatsApp</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Fluxo</Label>
                <Input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="Ex: Atendimento Inicial, FAQ, Vendas..." className="bg-muted/50" autoFocus onKeyDown={(e) => e.key === 'Enter' && createRule()} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createRule} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Fluxo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Luna AI Modal */}
        <LunaAIModal open={isLunaOpen} onOpenChange={setIsLunaOpen} onApplyFlow={handleApplyLunaFlow} currentNodes={[]} currentEdges={[]} />
      </div>
    );
  }

  // Flow Editor with Resizable Panels
  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex flex-col rounded-2xl border overflow-hidden bg-background shadow-2xl relative',
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[calc(100vh-180px)] min-h-[700px]'
        )}
      >
        <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileImport} />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar Panel */}
          <ResizablePanel defaultSize={22} minSize={15} maxSize={35} collapsible collapsedSize={4}>
            <div className="h-full bg-card/95 backdrop-blur-xl border-r overflow-hidden flex flex-col">
              {/* Quick Actions */}
              <div className="p-3 border-b space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Ferramentas</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setShowTemplates(true)} className="h-10 w-full hover:bg-blue-500/10 hover:border-blue-500/30">
                        <LayoutTemplate className="w-4 h-4 text-blue-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Templates</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setShowSimulator(true)} className="h-10 w-full hover:bg-green-500/10 hover:border-green-500/30">
                        <PlayCircle className="w-4 h-4 text-green-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Simulador</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setShowSearch(true)} className="h-10 w-full hover:bg-orange-500/10 hover:border-orange-500/30">
                        <Search className="w-4 h-4 text-orange-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Buscar (Ctrl+F)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsLunaOpen(true)} className="h-10 w-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/30">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Luna IA</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              {/* Node Sidebar */}
              <div className="flex-1 overflow-hidden">
                <NodeSidebar onDragStart={onDragStart} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Canvas Panel */}
          <ResizablePanel defaultSize={78}>
            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
              <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                  <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
              </svg>
              
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionLineStyle={{ stroke: 'hsl(var(--primary))', strokeWidth: 3, strokeDasharray: '8 4' }}
                fitView
                snapToGrid={snapToGrid}
                snapGrid={[20, 20]}
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable={!isCanvasLocked}
                nodesConnectable={!isCanvasLocked}
                elementsSelectable
                selectNodesOnDrag={false}
                selectionMode={SelectionMode.Partial}
                panOnDrag={[1, 2]}
                selectionOnDrag
                panOnScroll
                zoomOnScroll
                zoomOnDoubleClick
                preventScrolling
                className="!bg-gradient-to-br from-background via-background to-muted/20"
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.2)" />
                
                <FlowToolbar
                  ruleName={selectedRule.name}
                  ruleVersion={selectedRule.flow_version || 1}
                  isActive={selectedRule.is_active}
                  isSaving={isSaving}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                  hasClipboard={hasClipboard}
                  selectedCount={selectedNodes.length}
                  validationErrors={validationResult.errors.length}
                  validationWarnings={validationResult.warnings.length}
                  isFullscreen={isFullscreen}
                  onBack={() => setSelectedRule(null)}
                  onSave={saveFlow}
                  onUndo={undo}
                  onRedo={redo}
                  onExport={exportFlow}
                  onImport={importFlow}
                  onToggleActive={() => toggleRuleActive(selectedRule)}
                  onAutoLayout={handleAutoLayout}
                  onValidate={handleValidate}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
                  onDeleteSelected={handleDeleteSelected}
                  onToggleFullscreen={toggleFullscreen}
                  onShowHelp={() => setShowHelp(true)}
                />

                <FlowStats nodes={nodes} edges={edges} />

                <Panel position="bottom-right" className="flex flex-col gap-1 bg-card/90 backdrop-blur-xl rounded-xl border shadow-lg p-1">
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}><ZoomIn className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Zoom In</TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}><ZoomOut className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Zoom Out</TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView({ padding: 0.2 })}><Crosshair className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Centralizar</TooltipContent></Tooltip>
                </Panel>
                
                <MiniMap nodeColor={(node) => NODE_COLORS[(node.data as any)?.type as keyof typeof NODE_COLORS] || '#6b7280'} className="!bg-card/90 !backdrop-blur-xl !border !rounded-xl !shadow-lg" maskColor="hsl(var(--background) / 0.8)" pannable zoomable />
              </ReactFlow>

              <FlowControls isLocked={isCanvasLocked} onToggleLock={() => setIsCanvasLocked(!isCanvasLocked)} snapToGrid={snapToGrid} onToggleSnap={() => setSnapToGrid(!snapToGrid)} interactionMode={interactionMode} onToggleMode={() => setInteractionMode(m => m === 'select' ? 'pan' : 'select')} />
              <FlowValidationPanel isOpen={showValidation} onClose={() => setShowValidation(false)} errors={validationResult.errors} warnings={validationResult.warnings} onNavigateToNode={navigateToNode} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Config Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} onSave={updateNodeData} onDelete={deleteNode} onDuplicate={duplicateNode} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals - outside fullscreen container for proper z-index */}
      <LunaAIModal open={isLunaOpen} onOpenChange={setIsLunaOpen} onApplyFlow={handleApplyLunaFlow} currentNodes={nodes as unknown as FlowNodeType[]} currentEdges={edges as unknown as FlowEdge[]} />
      <FlowTemplates open={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={handleApplyTemplate} />
      <FlowSimulator open={showSimulator} onClose={() => setShowSimulator(false)} nodes={nodes as unknown as FlowNodeType[]} edges={edges as unknown as FlowEdge[]} onNavigateToNode={navigateToNode} />
      <NodeSearch nodes={nodes as unknown as FlowNodeType[]} onNavigateToNode={navigateToNode} isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <KeyboardShortcutsPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </TooltipProvider>
  );
};

export const WAFlowBuilder = (props: WAFlowBuilderProps) => (
  <ReactFlowProvider>
    <FlowBuilderContent {...props} />
  </ReactFlowProvider>
);
