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
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowToolbarProps {
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
}

export const FlowToolbar = memo(({
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
  onShowHelp
}: FlowToolbarProps) => {
  return (
    <>
      {/* Top Left - Navigation & Info */}
      <Panel position="top-left" className="flex items-center gap-2">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voltar para lista</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="px-2 flex items-center gap-2">
            <span className="font-semibold text-sm max-w-[150px] truncate">{ruleName}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              v{ruleVersion}
            </Badge>
            <Badge 
              variant={isActive ? 'default' : 'secondary'} 
              className={cn('text-[10px]', isActive && 'bg-green-500 hover:bg-green-600')}
            >
              {isActive ? '● ATIVO' : '○ PAUSADO'}
            </Badge>
          </div>
        </motion.div>

        {/* Validation Status */}
        {(validationErrors > 0 || validationWarnings > 0) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1.5"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onValidate}
                  className={cn(
                    'gap-1.5',
                    validationErrors > 0 && 'text-destructive hover:text-destructive'
                  )}
                >
                  {validationErrors > 0 ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors} erro(s)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>{validationWarnings} aviso(s)</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver problemas do fluxo</TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </Panel>

      {/* Top Right - Actions */}
      <Panel position="top-right" className="flex items-center gap-2">
        {/* Selection Actions */}
        {selectedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1.5"
          >
            <Badge variant="secondary" className="mr-1">{selectedCount} selecionado(s)</Badge>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar (⌘C)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={onDeleteSelected}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir (Del)</TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        {/* Main Toolbar */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-1 bg-card/95 backdrop-blur-xl rounded-xl border shadow-lg p-1.5"
        >
          {/* History */}
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
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Clipboard */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={onPaste}
                disabled={!hasClipboard}
              >
                <Clipboard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Colar (⌘V)</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Layout & Tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAutoLayout}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto-organizar</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onValidate}>
                <CheckCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Validar fluxo</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Import/Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImport}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar JSON</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar JSON</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* View Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleFullscreen}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Sair da Tela Cheia (Esc)' : 'Tela Cheia (F11)'}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowHelp}>
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atalhos de Teclado</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Status Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn('gap-1.5', isActive && 'text-green-500')}
                onClick={onToggleActive}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="hidden md:inline">Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden md:inline">Ativar</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isActive ? 'Pausar fluxo' : 'Ativar fluxo'}</TooltipContent>
          </Tooltip>
          
          {/* Save */}
          <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5 shadow-md ml-1">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </motion.div>
      </Panel>
    </>
  );
});

FlowToolbar.displayName = 'FlowToolbar';
