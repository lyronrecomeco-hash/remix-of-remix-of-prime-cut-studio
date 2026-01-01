// Tipos para FASE 2 - Questionário Inteligente

export interface BusinessNiche {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  base_questions: BaseQuestion[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BaseQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect';
  options?: string[];
}

export interface QuestionnaireAnswer {
  questionId: string;
  question: string;
  answer: string;
  isAiGenerated?: boolean;
  timestamp: string;
}

export interface QuestionnaireState {
  currentStep: 'niche' | 'questions' | 'complete';
  selectedNiche: BusinessNiche | null;
  answers: QuestionnaireAnswer[];
  currentQuestionIndex: number;
  aiFollowUp: string | null;
  isLoading: boolean;
}
