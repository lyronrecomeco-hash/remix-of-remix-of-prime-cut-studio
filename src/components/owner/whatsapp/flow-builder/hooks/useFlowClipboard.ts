import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ClipboardNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export const useFlowClipboard = () => {
  const [clipboard, setClipboard] = useState<ClipboardNode[]>([]);

  const copyNodes = useCallback((nodes: ClipboardNode[]) => {
    if (nodes.length === 0) {
      toast.error('Selecione nós para copiar');
      return;
    }
    setClipboard(nodes.map(n => ({ ...n })));
    toast.success(`${nodes.length} nó(s) copiado(s)`);
  }, []);

  const pasteNodes = useCallback((offsetX = 50, offsetY = 50) => {
    if (clipboard.length === 0) {
      toast.error('Nada para colar');
      return [];
    }

    const timestamp = Date.now();
    const newNodes = clipboard.map((node, index) => ({
      ...node,
      id: `${node.data?.type || 'node'}-paste-${timestamp}-${index}`,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY
      },
      selected: true
    }));

    toast.success(`${newNodes.length} nó(s) colado(s)`);
    return newNodes;
  }, [clipboard]);

  const hasClipboard = clipboard.length > 0;

  return {
    copyNodes,
    pasteNodes,
    hasClipboard,
    clipboardCount: clipboard.length
  };
};
