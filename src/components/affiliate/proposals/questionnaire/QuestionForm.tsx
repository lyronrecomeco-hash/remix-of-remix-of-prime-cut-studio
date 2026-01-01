import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import type { BaseQuestion } from './types';

interface QuestionFormProps {
  question: BaseQuestion;
  onAnswer: (answer: string) => void;
  onBack: () => void;
  isLoading: boolean;
  progress: number;
  questionNumber: number;
  nicheName: string;
}

export function QuestionForm({
  question,
  onAnswer,
  onBack,
  isLoading,
  progress,
  questionNumber,
  nicheName,
}: QuestionFormProps) {
  const [answer, setAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleSubmit = () => {
    if (question.type === 'multiselect') {
      onAnswer(selectedOptions.join(', '));
    } else if (question.type === 'select') {
      if (selectedOptions[0]) onAnswer(selectedOptions[0]);
    } else {
      if (answer.trim()) onAnswer(answer.trim());
    }
    setAnswer('');
    setSelectedOptions([]);
  };

  const toggleOption = (option: string) => {
    if (question.type === 'select') {
      setSelectedOptions([option]);
    } else {
      setSelectedOptions(prev =>
        prev.includes(option)
          ? prev.filter(o => o !== option)
          : [...prev, option]
      );
    }
  };

  const canSubmit = question.type === 'text' || question.type === 'multiselect'
    ? (question.type === 'text' ? answer.trim().length > 0 : selectedOptions.length > 0)
    : selectedOptions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Nicho: {nicheName}</span>
          <span>Pergunta {questionNumber}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-sm font-bold">?</span>
              </div>
              <p className="text-lg font-medium text-foreground pt-1">
                {question.question}
              </p>
            </div>

            {/* Answer Input */}
            {question.type === 'text' && (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Digite sua resposta..."
                className="min-h-[100px] bg-background border-border"
                disabled={isLoading}
              />
            )}

            {(question.type === 'select' || question.type === 'multiselect') && question.options && (
              <div className="space-y-2">
                {question.type === 'multiselect' && (
                  <p className="text-sm text-muted-foreground">
                    Selecione todas que se aplicam
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option) => {
                    const isSelected = selectedOptions.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleOption(option)}
                        disabled={isLoading}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          disabled={!canSubmit || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Continuar
              <Send className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
