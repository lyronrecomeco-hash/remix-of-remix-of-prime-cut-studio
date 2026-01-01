import { CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { QuestionnaireAnswer } from './types';

interface QuestionnaireCompleteProps {
  answers: QuestionnaireAnswer[];
  nicheName: string;
  companyName: string;
  onContinue: () => void;
}

export function QuestionnaireComplete({
  answers,
  nicheName,
  companyName,
  onContinue,
}: QuestionnaireCompleteProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Questionário Concluído!
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Coletamos todas as informações necessárias sobre <strong>{companyName}</strong> 
          para gerar uma proposta personalizada para o segmento de <strong>{nicheName}</strong>.
        </p>
      </div>

      {/* Summary */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">
              Resumo das Respostas ({answers.length})
            </h4>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {answers.map((answer, index) => (
              <div 
                key={answer.questionId}
                className="p-3 bg-secondary/30 rounded-lg border border-border"
              >
                <p className="text-sm text-muted-foreground mb-1">
                  {index + 1}. {answer.question}
                  {answer.isAiGenerated && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      IA
                    </span>
                  )}
                </p>
                <p className="font-medium text-foreground">{answer.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="text-center">
        <Button size="lg" onClick={onContinue} className="gap-2">
          <FileText className="w-5 h-5" />
          Gerar Diagnóstico e ROI
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          O próximo passo irá analisar as respostas e gerar uma proposta comercial
        </p>
      </div>
    </div>
  );
}
