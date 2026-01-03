import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ValidationIssue {
  nodeId?: string;
  type: 'error' | 'warning';
  message: string;
  code: string;
}

interface FlowValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  onNavigateToNode: (nodeId: string) => void;
}

export const FlowValidationPanel = memo(({
  isOpen,
  onClose,
  errors,
  warnings,
  onNavigateToNode
}: FlowValidationPanelProps) => {
  const allIssues = [...errors, ...warnings];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-0 right-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-l shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                errors.length > 0 ? 'bg-destructive/10' : 'bg-yellow-500/10'
              )}>
                {errors.length > 0 ? (
                  <XCircle className="w-5 h-5 text-destructive" />
                ) : warnings.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Validação do Fluxo</h3>
                <p className="text-xs text-muted-foreground">
                  {allIssues.length === 0 
                    ? 'Nenhum problema encontrado'
                    : `${allIssues.length} problema(s) encontrado(s)`
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Issues List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {allIssues.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-medium text-green-600">Tudo certo!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O fluxo está válido e pronto para uso.
                  </p>
                </motion.div>
              ) : (
                <>
                  {errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                        <XCircle className="w-4 h-4" />
                        Erros ({errors.length})
                      </div>
                      {errors.map((error, index) => (
                        <IssueCard
                          key={`error-${index}`}
                          issue={error}
                          onNavigate={error.nodeId ? () => onNavigateToNode(error.nodeId!) : undefined}
                        />
                      ))}
                    </div>
                  )}
                  
                  {warnings.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        Avisos ({warnings.length})
                      </div>
                      {warnings.map((warning, index) => (
                        <IssueCard
                          key={`warning-${index}`}
                          issue={warning}
                          onNavigate={warning.nodeId ? () => onNavigateToNode(warning.nodeId!) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

interface IssueCardProps {
  issue: ValidationIssue;
  onNavigate?: () => void;
}

const IssueCard = ({ issue, onNavigate }: IssueCardProps) => {
  const isError = issue.type === 'error';
  
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md group',
        isError 
          ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
          : 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
      )}
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-relaxed">{issue.message}</p>
        {onNavigate && (
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
        )}
      </div>
      <Badge variant="outline" className="mt-2 text-[10px]">
        {issue.code}
      </Badge>
    </motion.div>
  );
};

FlowValidationPanel.displayName = 'FlowValidationPanel';
