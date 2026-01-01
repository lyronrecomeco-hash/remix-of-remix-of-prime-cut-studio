import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useQuestionnaire,
  NicheSelector,
  QuestionForm,
  QuestionnaireComplete,
} from './questionnaire';
import type { AffiliateProposal } from './types';

interface ProposalQuestionnaireModalProps {
  open: boolean;
  onClose: () => void;
  proposal: AffiliateProposal;
  onComplete: () => void;
}

export function ProposalQuestionnaireModal({
  open,
  onClose,
  proposal,
  onComplete,
}: ProposalQuestionnaireModalProps) {
  const {
    niches,
    state,
    selectNiche,
    getCurrentQuestion,
    answerQuestion,
    goBack,
    progress,
  } = useQuestionnaire(proposal.id, proposal.company_name);

  const currentQuestion = getCurrentQuestion();

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {state.currentStep !== 'niche' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-foreground">
              {state.currentStep === 'niche' && 'Selecionar Nicho'}
              {state.currentStep === 'questions' && 'Questionário Inteligente'}
              {state.currentStep === 'complete' && 'Questionário Concluído'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          {state.currentStep === 'niche' && (
            <NicheSelector niches={niches} onSelect={selectNiche} />
          )}

          {state.currentStep === 'questions' && currentQuestion && state.selectedNiche && (
            <QuestionForm
              question={currentQuestion}
              onAnswer={answerQuestion}
              onBack={goBack}
              isLoading={state.isLoading}
              progress={progress}
              questionNumber={state.currentQuestionIndex + 1}
              nicheName={state.selectedNiche.name}
            />
          )}

          {state.currentStep === 'complete' && state.selectedNiche && (
            <QuestionnaireComplete
              answers={state.answers}
              nicheName={state.selectedNiche.name}
              companyName={proposal.company_name}
              onContinue={handleComplete}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
