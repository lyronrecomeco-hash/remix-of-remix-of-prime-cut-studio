// =====================================================
// FLOW CONTROLS - Controles avançados de zoom e navegação
// =====================================================

import { memo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Target, 
  Lock, 
  Unlock,
  Grid3X3,
  MousePointer,
  Hand,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FlowControlsProps {
  isLocked?: boolean;
  onToggleLock?: () => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
  interactionMode?: 'select' | 'pan';
  onToggleMode?: () => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

export const FlowControls = memo(({ 
  isLocked = false, 
  onToggleLock,
  snapToGrid = false,
  onToggleSnap,
  interactionMode = 'select',
  onToggleMode,
  showPreview = false,
  onTogglePreview
}: FlowControlsProps) => {
  const { zoomIn, zoomOut, fitView, setCenter, getZoom, getViewport, setViewport } = useReactFlow();
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(100);

  // Update zoom display
  const updateZoomDisplay = () => {
    setCurrentZoom(Math.round(getZoom() * 100));
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
    setTimeout(updateZoomDisplay, 250);
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
    setTimeout(updateZoomDisplay, 250);
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
    setTimeout(updateZoomDisplay, 350);
  };

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
    setTimeout(updateZoomDisplay, 350);
  };

  const handleZoomChange = (value: number[]) => {
    const zoom = value[0] / 100;
    const viewport = getViewport();
    setViewport({ ...viewport, zoom }, { duration: 100 });
    setCurrentZoom(value[0]);
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
      {/* Main Controls */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-1 p-1.5 rounded-xl bg-card/90 backdrop-blur-sm border shadow-lg"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomIn}
              className="h-9 w-9"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom In (+)</TooltipContent>
        </Tooltip>

        {/* Zoom Percentage */}
        <motion.button
          onClick={() => setShowZoomSlider(!showZoomSlider)}
          className="h-9 w-9 flex items-center justify-center text-xs font-medium hover:bg-muted rounded-lg transition-colors"
        >
          {currentZoom}%
        </motion.button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomOut}
              className="h-9 w-9"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom Out (-)</TooltipContent>
        </Tooltip>

        <div className="h-px bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleFitView}
              className="h-9 w-9"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Ajustar à Tela</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleResetView}
              className="h-9 w-9"
            >
              <Target className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Centralizar</TooltipContent>
        </Tooltip>
      </motion.div>

      {/* Mode Controls */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-1 p-1.5 rounded-xl bg-card/90 backdrop-blur-sm border shadow-lg"
      >
        {onToggleMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={interactionMode === 'select' ? 'secondary' : 'ghost'}
                onClick={onToggleMode}
                className="h-9 w-9"
              >
                {interactionMode === 'select' ? (
                  <MousePointer className="w-4 h-4" />
                ) : (
                  <Hand className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {interactionMode === 'select' ? 'Modo Seleção (V)' : 'Modo Pan (H)'}
            </TooltipContent>
          </Tooltip>
        )}

        {onToggleSnap && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={snapToGrid ? 'secondary' : 'ghost'}
                onClick={onToggleSnap}
                className="h-9 w-9"
              >
                <Grid3X3 className={cn('w-4 h-4', snapToGrid && 'text-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {snapToGrid ? 'Snap Ativo' : 'Ativar Snap'}
            </TooltipContent>
          </Tooltip>
        )}

        {onToggleLock && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isLocked ? 'secondary' : 'ghost'}
                onClick={onToggleLock}
                className="h-9 w-9"
              >
                {isLocked ? (
                  <Lock className="w-4 h-4 text-destructive" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isLocked ? 'Canvas Bloqueado' : 'Bloquear Canvas'}
            </TooltipContent>
          </Tooltip>
        )}

        {onTogglePreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={showPreview ? 'secondary' : 'ghost'}
                onClick={onTogglePreview}
                className="h-9 w-9"
              >
                <Smartphone className={cn('w-4 h-4', showPreview && 'text-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {showPreview ? 'Ocultar Preview' : 'Preview WhatsApp'}
            </TooltipContent>
          </Tooltip>
        )}
      </motion.div>

      {/* Zoom Slider Popup */}
      <AnimatePresence>
        {showZoomSlider && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            className="absolute left-14 bottom-0 p-3 rounded-xl bg-card/95 backdrop-blur-sm border shadow-xl w-48"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <span className="text-sm font-medium">{currentZoom}%</span>
              </div>
              <Slider
                value={[currentZoom]}
                onValueChange={handleZoomChange}
                min={10}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10%</span>
                <span>200%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FlowControls.displayName = 'FlowControls';
