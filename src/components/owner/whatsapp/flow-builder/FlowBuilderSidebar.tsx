import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  LayoutTemplate, 
  PlayCircle, 
  Search, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NodeSidebar } from './NodeSidebar';
import { NodeTemplate } from './types';
import { cn } from '@/lib/utils';

interface FlowBuilderSidebarProps {
  onDragStart: (event: React.DragEvent, template: NodeTemplate) => void;
  onOpenTemplates: () => void;
  onOpenSimulator: () => void;
  onOpenSearch: () => void;
  onOpenLuna: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FlowBuilderSidebar = ({
  onDragStart,
  onOpenTemplates,
  onOpenSimulator,
  onOpenSearch,
  onOpenLuna,
  isCollapsed,
  onToggleCollapse
}: FlowBuilderSidebarProps) => {
  const [activeTab, setActiveTab] = useState('nodes');

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 56 }}
        animate={{ width: 56 }}
        className="bg-card/95 backdrop-blur-xl border-r flex flex-col h-full"
      >
        <div className="p-2 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-10 w-10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 py-2 flex flex-col gap-1 px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTab === 'nodes' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => { setActiveTab('nodes'); onToggleCollapse(); }}
                className="h-10 w-10"
              >
                <Layers className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Componentes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTemplates}
                className="h-10 w-10"
              >
                <LayoutTemplate className="w-5 h-5 text-blue-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Templates</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSimulator}
                className="h-10 w-10"
              >
                <PlayCircle className="w-5 h-5 text-green-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Simulador</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSearch}
                className="h-10 w-10"
              >
                <Search className="w-5 h-5 text-orange-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Buscar</TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenLuna}
                className="h-10 w-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Luna IA</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 320 }}
      animate={{ width: 320 }}
      className="bg-card/95 backdrop-blur-xl border-r flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold">Flow Builder</span>
          <Badge variant="secondary" className="text-[10px]">Pro</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b">
        <div className="grid grid-cols-4 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenTemplates}
                className="h-12 w-full hover:bg-blue-500/10 hover:border-blue-500/30"
              >
                <LayoutTemplate className="w-5 h-5 text-blue-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Templates</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenSimulator}
                className="h-12 w-full hover:bg-green-500/10 hover:border-green-500/30"
              >
                <PlayCircle className="w-5 h-5 text-green-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Simulador</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenSearch}
                className="h-12 w-full hover:bg-orange-500/10 hover:border-orange-500/30"
              >
                <Search className="w-5 h-5 text-orange-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar (Ctrl+F)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenLuna}
                className="h-12 w-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/30"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Luna IA</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 bg-muted/50">
          <TabsTrigger value="nodes" className="flex-1 gap-1.5">
            <Layers className="w-4 h-4" />
            Componentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-0">
              <NodeSidebar onDragStart={onDragStart} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Luna AI CTA */}
      <div className="p-3 border-t">
        <Button
          onClick={onOpenLuna}
          className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Criar com Luna IA
        </Button>
      </div>
    </motion.div>
  );
};
