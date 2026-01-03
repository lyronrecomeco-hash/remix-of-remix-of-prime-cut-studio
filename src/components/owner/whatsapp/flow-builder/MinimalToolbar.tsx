import { memo } from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Loader2,
  Undo2,
  Redo2,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  LayoutGrid,
  CheckCircle,
  AlertTriangle,
  Copy,
  Clipboard,
  Trash2,
  HelpCircle,
  Plus,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MinimalToolbarProps {
  ruleName: string;
  ruleVersion: number;
  isActive: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasClipboard: boolean;
  selectedCount: number;
  validationErrors: number;
  validationWarnings: number;
  isFullscreen: boolean;
  onBack: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleActive: () => void;
  onAutoLayout: () => void;
  onValidate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDeleteSelected: () => void;
  onToggleFullscreen: () => void;
  onShowHelp: () => void;
  onAddComponent: () => void;
  onOpenLuna: () => void;
}

export const MinimalToolbar = memo(({
  ruleName,
  ruleVersion,
  isActive,
  isSaving,
  canUndo,
  canRedo,
  hasClipboard,
  selectedCount,
  validationErrors,
  validationWarnings,
  isFullscreen,
  onBack,
  onSave,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onToggleActive,
  onAutoLayout,
  onValidate,
  onCopy,
  onPaste,
  onDeleteSelected,
  onToggleFullscreen,
  onShowHelp,
  onAddComponent,
  onOpenLuna
}: MinimalToolbarProps) => {
  return (
    <>
      {/* Top Left - Back & Flow Info */}
      <Panel position="top-left" className="flex items-center gap-2">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg px-1.5 py-1"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 h-9">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voltar para lista de fluxos</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-5 mx-1" />
          
          <div className="px-2 flex items-center gap-2">
            <span className="font-medium text-sm max-w-[120px] truncate">{ruleName}</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5">v{ruleVersion}</Badge>
          </div>
        </motion.div>

        {/* Validation Badge */}
        {(validationErrors > 0 || validationWarnings > 0) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onValidate}
                  className={cn(
                    'gap-1.5 h-9 bg-card/95 backdrop-blur-xl border shadow-lg rounded-xl px-3',
                    validationErrors > 0 ? 'text-destructive' : 'text-yellow-500'
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {validationErrors > 0 ? validationErrors : validationWarnings}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {validationErrors > 0 ? `${validationErrors} erro(s)` : `${validationWarnings} aviso(s)`}
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </Panel>

      {/* Top Center - Genesis Flow Title + Components Button */}
      <Panel position="top-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1"
        >
          <span className="font-bold text-sm px-3 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Genesis Flow
          </span>
          <Separator orientation="vertical" className="h-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAddComponent} className="gap-2 h-8">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Componentes</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adicionar componente</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onOpenLuna} className="gap-2 h-8 text-purple-500 hover:text-purple-600">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Luna IA</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Criar com inteligência artificial</TooltipContent>
          </Tooltip>
        </motion.div>
      </Panel>

      {/* Top Right - Actions */}
      <Panel position="top-right" className="flex items-center gap-2">
        {/* Selection Actions */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1"
          >
            <Badge variant="secondary" className="h-7 px-2">{selectedCount}</Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDeleteSelected}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        {/* Main Actions */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1"
        >
          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (⌘⇧Z)</TooltipContent>
          </Tooltip>

          {/* Paste */}
          {hasClipboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPaste}>
                  <Clipboard className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Colar</TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-5" />

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onAutoLayout}>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Auto-organizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onValidate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validar fluxo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onImport}>
                <Upload className="w-4 h-4 mr-2" />
                Importar JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleFullscreen}>
                {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowHelp}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Atalhos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5" />

          {/* Status Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn('h-8 w-8', isActive && 'text-green-500')}
                onClick={onToggleActive}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isActive ? 'Pausar' : 'Ativar'}</TooltipContent>
          </Tooltip>

          {/* Save */}
          <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5 h-8 ml-1">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </motion.div>
      </Panel>
    </>
  );
});

MinimalToolbar.displayName = 'MinimalToolbar';
