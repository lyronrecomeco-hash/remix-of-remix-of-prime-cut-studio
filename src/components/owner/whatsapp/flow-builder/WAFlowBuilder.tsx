import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
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
  AlertCircle,
  Menu,
  X,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { FlowNode } from './FlowNode';
import { NodeSidebar } from './NodeSidebar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { MinimalToolbar } from './MinimalToolbar';
import { FlowStats } from './FlowStats';
import { FlowValidationPanel } from './FlowValidationPanel';
import { HelpModal } from './HelpModal';
import { LunaAIModal } from './LunaAIModal';
import { FlowTemplates } from './FlowTemplates';
import { FlowSimulator } from './FlowSimulator';
import { FlowControls } from './FlowControls';
import { WhatsAppPreviewPanel } from './WhatsAppPreviewPanel';
import { NodeSearch } from './NodeSearch';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ComponentsModal } from './ComponentsModal';
import { EmptyCanvasState } from './EmptyCanvasState';
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
import { useIsMobile } from '@/hooks/use-mobile';

import { CustomEdge } from './CustomEdge';
import { InstanceRequiredModal } from './InstanceRequiredModal';

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
  onEditingChange?: (isEditing: boolean) => void;
  onNavigateToInstances?: () => void;
}

const FlowBuilderContent = ({ onBack, onEditingChange, onNavigateToInstances }: WAFlowBuilderProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, zoomIn, zoomOut, setCenter, getNodes, getViewport, setViewport } = useReactFlow();
  const isMobile = useIsMobile();
  
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
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('pan');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [showFloatingTools, setShowFloatingTools] = useState(false);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  // Phase 5 - Require connected WhatsApp instance for activation
  const [showInstanceRequiredModal, setShowInstanceRequiredModal] = useState(false);
  const [instanceRequiredComponentName, setInstanceRequiredComponentName] = useState('');
  
  // Luna AI building state
  const [isLunaBuilding, setIsLunaBuilding] = useState(false);
  const [lunaBuildProgress, setLunaBuildProgress] = useState<{ current: number; total: number; currentNode?: string }>({ current: 0, total: 0 });
  
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

  // Mobile-first: default to Pan mode to allow dragging the background naturally
  useEffect(() => {
    if (isMobile) setInteractionMode('pan');
  }, [isMobile]);

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

  // Notify parent about editing state
  useEffect(() => {
    onEditingChange?.(!!selectedRule);
  }, [selectedRule, onEditingChange]);

  // Load rule into canvas
  const loadRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    const flowData = rule.flow_data || { nodes: [], edges: [] };

    const rfNodes = flowData.nodes.map(n => ({
      id: n.id,
      type: 'flowNode',
      position: n.position,
      data: n.data,
    }));

    const rfEdges = flowData.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      ...defaultEdgeOptions,
      data: { label: e.label ?? e?.data?.label },
      animated: e.animated ?? false,
      style: e.style,
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
    setSelectedNode(null);
    setHistory([{ nodes: rfNodes, edges: rfEdges }]);
    setHistoryIndex(0);

    const result = validateFlow(rfNodes, rfEdges);
    setValidationResult({ errors: result.errors, warnings: result.warnings });

    const vp = rule.canvas_position;
    setTimeout(() => {
      if (vp && typeof vp.zoom === 'number') {
        setViewport({ x: vp.x ?? 0, y: vp.y ?? 0, zoom: vp.zoom ?? 1 }, { duration: 300 });
      } else {
        fitView({ padding: 0.2 });
      }
    }, 80);
  };

  // Create new rule - flow starts empty, user clicks to enter
  const createRule = async () => {
    if (!newRuleName.trim()) { toast.error('Digite um nome para o fluxo'); return; }
    setIsSaving(true);
    try {
      // Empty flow - no initial node, user will add via EmptyCanvasState
      const initialFlow = { nodes: [], edges: [] };
      const { error } = await supabase.from('whatsapp_automation_rules').insert({ 
        name: newRuleName, 
        description: '', 
        trigger_type: 'keyword', 
        trigger_config: {}, 
        conditions: [], 
        actions: [], 
        flow_data: initialFlow as any, 
        priority: rules.length + 1 
      }).select().single();
      if (error) throw error;
      toast.success('Fluxo criado! Clique para editar.');
      setIsCreateDialogOpen(false);
      setNewRuleName('');
      fetchRules();
      // Don't auto-enter, let user click to enter
    } catch (error) { console.error('Error creating rule:', error); toast.error('Erro ao criar fluxo'); } finally { setIsSaving(false); }
  };

  // Save flow
  const saveFlow = async () => {
    if (!selectedRule) return;
    setIsSaving(true);
    try {
      const vp = getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
      const canvasPosition = { x: vp.x ?? 0, y: vp.y ?? 0, zoom: vp.zoom ?? 1 };

      const flowData = {
        nodes: nodes.map((n: any) => ({
          id: n.id,
          type: 'flowNode',
          position: n.position,
          data: n.data as any,
        })),
        edges: edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          label: (e?.data?.label ?? e.label) as string | undefined,
          animated: e.animated ?? false,
          style: e.style,
        })),
      };

      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({
          flow_data: flowData as any,
          canvas_position: canvasPosition as any,
          flow_version: (selectedRule.flow_version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRule.id);
      if (error) throw error;

      toast.success('Fluxo salvo!');
      // Sync local state and rules list
      setSelectedRule((prev) =>
        prev
          ? {
              ...prev,
              flow_data: flowData,
              canvas_position: canvasPosition,
              flow_version: (prev.flow_version || 1) + 1,
            }
          : null
      );
      // Update rules list to reflect saved data
      setRules((prevRules) =>
        prevRules.map((r) =>
          r.id === selectedRule.id
            ? { ...r, flow_data: flowData, canvas_position: canvasPosition, flow_version: (r.flow_version || 1) + 1 }
            : r
        )
      );
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRuleActive = async (rule: AutomationRule) => {
    try {
      // Phase 5: só ativa se existir uma instância conectada
      if (!rule.is_active) {
        const { data: instances, error: instError } = await supabase
          .from('genesis_instances')
          .select('id')
          .eq('status', 'connected')
          .limit(1);

        if (instError) throw instError;

        if (!instances || instances.length === 0) {
          setInstanceRequiredComponentName('Ativar Fluxo');
          setShowInstanceRequiredModal(true);
          toast.error('Conecte uma instância do WhatsApp para ativar este fluxo.');
          return;
        }
      }

      const { error } = await supabase
        .from('whatsapp_automation_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;
      toast.success(rule.is_active ? 'Fluxo pausado' : 'Fluxo ativado!');
      fetchRules();
      if (selectedRule?.id === rule.id) {
        setSelectedRule((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
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
  const onDragOver = useCallback((event: React.DragEvent) => { 
    event.preventDefault(); 
    event.dataTransfer.dropEffect = 'move'; 
    setIsDraggingOver(true);
  }, []);
  
  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only set false if leaving the canvas entirely
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = event;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsDraggingOver(false);
      }
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const templateData = event.dataTransfer.getData('application/reactflow');
    if (!templateData) return;
    const template: NodeTemplate = JSON.parse(templateData);
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    const position = { x: event.clientX - reactFlowBounds.left - 100, y: event.clientY - reactFlowBounds.top - 40 };
    const newNode = { id: `${template.type}-${Date.now()}`, type: 'flowNode', position, data: { label: template.label, type: template.type, config: template.defaultConfig, description: template.description, icon: template.icon } };
    setNodes((nds) => nds.concat(newNode));
    addToHistory();
    toast.success(`${template.label} adicionado!`);
  }, [setNodes, addToHistory]);

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => { event.dataTransfer.setData('application/reactflow', JSON.stringify(template)); event.dataTransfer.effectAllowed = 'move'; };
  const updateNodeData = (nodeId: string, newData: any) => { setNodes(nds => nds.map(node => node.id === nodeId ? { ...node, data: newData } : node)); setSelectedNode(null); addToHistory(); };
  const duplicateNode = (nodeId: string) => { const node = nodes.find(n => n.id === nodeId); if (!node) return; const newNode = { ...node, id: `${node.data.type}-${Date.now()}`, position: { x: node.position.x + 50, y: node.position.y + 50 } }; setNodes(nds => nds.concat(newNode)); addToHistory(); toast.success('Nó duplicado!'); };
  const deleteNode = (nodeId: string) => { setNodes(nds => nds.filter(node => node.id !== nodeId)); setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)); setSelectedNode(null); addToHistory(); };

  // Add component from modal
  const addComponentFromModal = useCallback((template: NodeTemplate) => {
    const centerX = 400 + Math.random() * 100;
    const centerY = 200 + nodes.length * 120;
    const newNode = { 
      id: `${template.type}-${Date.now()}`, 
      type: 'flowNode', 
      position: { x: centerX, y: centerY }, 
      data: { label: template.label, type: template.type, config: template.defaultConfig, description: template.description, icon: template.icon } 
    };
    setNodes((nds) => nds.concat(newNode));
    addToHistory();
    toast.success(`${template.label} adicionado!`);
    setTimeout(() => fitView({ padding: 0.3 }), 100);
  }, [nodes.length, setNodes, addToHistory, fitView]);

  const exportFlow = () => { const flowData = { name: selectedRule?.name, version: selectedRule?.flow_version, nodes, edges }; const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `flow-${selectedRule?.name || 'export'}-v${selectedRule?.flow_version || 1}.json`; a.click(); toast.success('Fluxo exportado!'); };
  const importFlow = () => fileInputRef.current?.click();
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); if (data.nodes && Array.isArray(data.nodes)) { setNodes(data.nodes); setEdges(data.edges || []); addToHistory(); toast.success('Fluxo importado!'); setTimeout(() => fitView({ padding: 0.2 }), 100); } else { toast.error('Arquivo inválido'); } } catch { toast.error('Erro ao ler arquivo'); } }; reader.readAsText(file); event.target.value = ''; };
  const handleAutoLayout = useCallback(() => { const layoutedNodes = calculateLayout(nodes, edges, 'TB'); setNodes(layoutedNodes); addToHistory(); setTimeout(() => fitView({ padding: 0.2 }), 100); toast.success('Layout reorganizado!'); }, [nodes, edges, calculateLayout, setNodes, addToHistory, fitView]);
  const handleValidate = useCallback(() => { const result = validateFlow(nodes, edges); setValidationResult({ errors: result.errors, warnings: result.warnings }); setShowValidation(true); if (result.isValid && result.warnings.length === 0) { toast.success('Fluxo válido!'); } else if (result.errors.length > 0) { toast.error(`${result.errors.length} erro(s) encontrado(s)`); } else { toast.warning(`${result.warnings.length} aviso(s) encontrado(s)`); } }, [nodes, edges, validateFlow]);
  const navigateToNode = useCallback((nodeId: string) => { const node = nodes.find(n => n.id === nodeId); if (node) { setCenter(node.position.x + 140, node.position.y + 60, { zoom: 1.5, duration: 500 }); setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId }))); setSelectedNode(node as any); } }, [nodes, setCenter, setNodes]);
  const handleCopy = useCallback(() => { if (selectedNodes.length > 0) { copyNodes(selectedNodes.map(n => ({ ...n, position: n.position, data: n.data }))); } }, [selectedNodes, copyNodes]);
  const handlePaste = useCallback(() => { const newNodes = pasteNodes(); if (newNodes.length > 0) { setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]); addToHistory(); } }, [pasteNodes, setNodes, addToHistory]);
  const handleDeleteSelected = useCallback(() => { if (selectedNodes.length > 0) { const idsToDelete = new Set(selectedNodes.map(n => n.id)); setNodes(nds => nds.filter(n => !idsToDelete.has(n.id))); setEdges(eds => eds.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target))); addToHistory(); toast.success(`${selectedNodes.length} nó(s) excluído(s)`); } }, [selectedNodes, setNodes, setEdges, addToHistory]);

  const handleApplyLunaFlow = useCallback(async (newNodes: FlowNodeType[], newEdges: FlowEdge[]) => {
    // Start Luna building animation on canvas
    setIsLunaBuilding(true);
    setLunaBuildProgress({ current: 0, total: newNodes.length });
    setNodes([]);
    setEdges([]);
    
    // Animate nodes being added one by one
    for (let i = 0; i < newNodes.length; i++) {
      const node = newNodes[i];
      const rfNode = { id: node.id, type: 'flowNode', position: node.position, data: { ...node.data, isNew: true } };
      
      setLunaBuildProgress({ current: i + 1, total: newNodes.length, currentNode: node.data.label });
      setNodes(nds => [...nds, rfNode]);
      
      // Add edges connected to this node
      const nodeEdges = newEdges.filter(e => e.source === node.id || e.target === node.id);
      const rfEdges = nodeEdges.map(e => ({ 
        id: e.id, source: e.source, target: e.target, 
        sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, 
        label: e.label, ...defaultEdgeOptions, style: getEdgeStyle(e.sourceHandle) 
      }));
      
      // Only add edges when both nodes exist
      setEdges(eds => {
        const newEdgesToAdd = rfEdges.filter(newEdge => {
          const sourceExists = [...newNodes.slice(0, i + 1)].some(n => n.id === newEdge.source);
          const targetExists = [...newNodes.slice(0, i + 1)].some(n => n.id === newEdge.target);
          const alreadyExists = eds.some(e => e.id === newEdge.id);
          return sourceExists && targetExists && !alreadyExists;
        });
        return [...eds, ...newEdgesToAdd];
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Finish animation
    setTimeout(() => {
      setIsLunaBuilding(false);
      setLunaBuildProgress({ current: 0, total: 0 });
      // Remove isNew flag
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isNew: false } })));
      addToHistory();
      fitView({ padding: 0.2 });
      toast.success('🎉 Fluxo construído pela Luna!', {
        description: `${newNodes.length} nós criados automaticamente`
      });
    }, 500);
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

  // List view when no rule selected - COMPACT & PROFESSIONAL
  if (!selectedRule) {
    return (
      <div className="space-y-6 w-full">
        {/* Compact Hero Header */}
        <Card className="border shadow-md bg-card overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Genesis Flow
                    <Badge variant="secondary" className="text-[10px]">Pro</Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Automações visuais para WhatsApp
                  </p>
                </div>
              </div>
              
              {/* Inline Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{rules.length}</p>
                  <p className="text-[10px] text-muted-foreground">Fluxos</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{rules.filter(r => r.is_active).length}</p>
                  <p className="text-[10px] text-muted-foreground">Ativos</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{rules.reduce((acc, r) => acc + (r.execution_count || 0), 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Execuções</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsLunaOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Luna IA</span>
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-2 shadow-md">
                  <Plus className="w-4 h-4" />
                  Novo Fluxo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flows Grid */}
        {rules.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Comece a automatizar</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">Crie seu primeiro fluxo de automação visual</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setIsLunaOpen(true)} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Criar com Luna IA
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Manualmente
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {rules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -2 }}
                >
                  <Card 
                    className={cn(
                      'cursor-pointer transition-all duration-200 group overflow-hidden h-full',
                      'hover:shadow-lg border',
                      rule.is_active ? 'border-primary/20' : 'border-border'
                    )}
                    onClick={() => loadRule(rule)}
                  >
                    {/* Status indicator bar */}
                    <div className={cn('h-0.5 w-full', rule.is_active ? 'bg-primary' : 'bg-muted-foreground/20')} />
                    
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', rule.is_active ? 'bg-primary/10' : 'bg-muted')}>
                            {rule.is_active ? <Zap className="w-5 h-5 text-primary" /> : <Pause className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{rule.name}</h3>
                            <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5 mt-1">
                              {rule.is_active ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          {rule.flow_data?.nodes?.length || 0} nós
                        </span>
                        <span className="flex items-center gap-1.5">
                          <PlayCircle className="w-4 h-4" />
                          {rule.execution_count || 0}x
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          v{rule.flow_version || 1}
                        </span>
                      </div>
                      
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="flex-1 h-9 text-sm gap-2" onClick={() => toggleRuleActive(rule)}>
                          {rule.is_active ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Ativar</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 text-sm gap-2 px-3" onClick={() => loadRule(rule)}>
                          <ArrowRight className="w-4 h-4" />
                          Abrir
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteRule(rule.id)}>
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

  // Flow Editor - Clean n8n-style canvas
  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex flex-col overflow-hidden bg-background relative w-full',
          isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100dvh-120px)] min-h-[520px] sm:min-h-[600px]'
        )}
      >
        <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileImport} />

        {/* Full Canvas - No sidebar */}
        <div 
          className="flex-1 h-full relative" 
          ref={reactFlowWrapper}
          onDragLeave={onDragLeave}
          data-allow-drag="true"
        >
              {/* Drop Zone Overlay */}
              <AnimatePresence>
                {isDraggingOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 pointer-events-none"
                  >
                    <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-2xl bg-primary/5 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-xl border border-primary/30"
                      >
                        <p className="text-primary font-medium flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Solte aqui para adicionar
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                // Mobile: permitir pan arrastando o fundo (touch)
                panOnDrag={isMobile || interactionMode === 'pan' ? true : [1, 2]}
                panOnScroll
                zoomOnScroll
                zoomOnDoubleClick
                // "infinite" pan (limite bem alto)
                translateExtent={[[-100000, -100000], [100000, 100000]]}
                nodesDraggable={!isCanvasLocked}
                nodesConnectable={!isCanvasLocked}
                elementsSelectable
                selectNodesOnDrag={false}
                selectionMode={SelectionMode.Partial}
                selectionOnDrag={!isMobile && interactionMode === 'select'}
                preventScrolling
                className={cn(
                  "!bg-gradient-to-br from-background via-background to-muted/20 touch-none",
                  isDraggingOver && "!cursor-copy"
                )}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.2)" />
                <MinimalToolbar
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
                  onBack={() => { fetchRules(); setSelectedRule(null); }}
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
                  onAddComponent={() => setShowComponentsModal(true)}
                  onOpenLuna={() => setIsLunaOpen(true)}
                />

                {/* Flow Controls - Zoom, Pan, Preview */}
                <FlowControls
                  isLocked={isCanvasLocked}
                  onToggleLock={() => setIsCanvasLocked(!isCanvasLocked)}
                  snapToGrid={snapToGrid}
                  onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                  interactionMode={interactionMode}
                  onToggleMode={() => setInteractionMode(m => m === 'select' ? 'pan' : 'select')}
                  showPreview={showWhatsAppPreview}
                  onTogglePreview={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                />

              </ReactFlow>

              {/* Empty Canvas State (overlay above canvas) */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 z-40">
                  <EmptyCanvasState 
                    onAddComponent={() => setShowComponentsModal(true)} 
                    onCreateWithLuna={() => setIsLunaOpen(true)} 
                  />
                </div>
              )}

              {/* Luna Building Overlay */}
              <AnimatePresence>
                {isLunaBuilding && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
                  >
                    <motion.div
                      initial={{ y: -20, scale: 0.9 }}
                      animate={{ y: 0, scale: 1 }}
                      className="flex items-center gap-4 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white/20"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Bot className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="text-white">
                        <p className="font-semibold text-sm">Luna está construindo...</p>
                        <p className="text-xs opacity-90">
                          {lunaBuildProgress.currentNode || 'Preparando'} ({lunaBuildProgress.current}/{lunaBuildProgress.total})
                        </p>
                      </div>
                      <div className="h-2 w-32 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-white rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(lunaBuildProgress.current / lunaBuildProgress.total) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <FlowValidationPanel isOpen={showValidation} onClose={() => setShowValidation(false)} errors={validationResult.errors} warnings={validationResult.warnings} onNavigateToNode={navigateToNode} />
            </div>

        {/* Config Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} onSave={updateNodeData} onDelete={deleteNode} onDuplicate={duplicateNode} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals - outside fullscreen container for proper z-index */}
      <InstanceRequiredModal
        open={showInstanceRequiredModal}
        onClose={() => setShowInstanceRequiredModal(false)}
        onNavigateToInstances={() => {
          setShowInstanceRequiredModal(false);
          onNavigateToInstances?.();
        }}
        componentName={instanceRequiredComponentName}
      />

      <ComponentsModal 
        open={showComponentsModal} 
        onClose={() => setShowComponentsModal(false)} 
        onSelectComponent={addComponentFromModal}
        onOpenLuna={() => { setShowComponentsModal(false); setIsLunaOpen(true); }}
        onNavigateToInstances={onNavigateToInstances}
      />
      <LunaAIModal open={isLunaOpen} onOpenChange={setIsLunaOpen} onApplyFlow={handleApplyLunaFlow} currentNodes={nodes as unknown as FlowNodeType[]} currentEdges={edges as unknown as FlowEdge[]} />
      <FlowTemplates open={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={handleApplyTemplate} />
      <FlowSimulator open={showSimulator} onClose={() => setShowSimulator(false)} nodes={nodes as unknown as FlowNodeType[]} edges={edges as unknown as FlowEdge[]} onNavigateToNode={navigateToNode} />
      <NodeSearch nodes={nodes as unknown as FlowNodeType[]} onNavigateToNode={navigateToNode} isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <KeyboardShortcutsPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      
      {/* WhatsApp Preview Panel */}
      <WhatsAppPreviewPanel
        isOpen={showWhatsAppPreview}
        onClose={() => setShowWhatsAppPreview(false)}
        nodes={nodes as unknown as FlowNodeType[]}
        selectedNode={selectedNode as unknown as FlowNodeType}
      />
    </TooltipProvider>
  );
};

export const WAFlowBuilder = (props: WAFlowBuilderProps) => (
  <ReactFlowProvider>
    <FlowBuilderContent {...props} />
  </ReactFlowProvider>
);
