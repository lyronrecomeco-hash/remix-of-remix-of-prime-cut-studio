import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BusinessNiche, QuestionnaireAnswer, QuestionnaireState, BaseQuestion } from '../types';

export function useQuestionnaire(proposalId: string, companyName: string) {
  const [niches, setNiches] = useState<BusinessNiche[]>([]);
  const [state, setState] = useState<QuestionnaireState>({
    currentStep: 'niche',
    selectedNiche: null,
    answers: [],
    currentQuestionIndex: 0,
    aiFollowUp: null,
    isLoading: false,
  });

  // Carregar nichos disponíveis
  useEffect(() => {
    const fetchNiches = async () => {
      const { data, error } = await supabase
        .from('business_niches')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching niches:', error);
        toast.error('Erro ao carregar nichos');
        return;
      }

      // Parse base_questions from JSONB
      const parsed = (data || []).map(n => ({
        ...n,
        base_questions: (typeof n.base_questions === 'string' 
          ? JSON.parse(n.base_questions) 
          : n.base_questions) as BaseQuestion[]
      })) as BusinessNiche[];
      
      setNiches(parsed);
    };

    fetchNiches();
  }, []);

  // Selecionar nicho
  const selectNiche = useCallback(async (niche: BusinessNiche) => {
    setState(prev => ({
      ...prev,
      selectedNiche: niche,
      currentStep: 'questions',
      currentQuestionIndex: 0,
      answers: [],
    }));

    // Atualizar proposta com o nicho selecionado
    const { error } = await supabase
      .from('affiliate_proposals')
      .update({ niche_id: niche.id })
      .eq('id', proposalId);

    if (error) {
      console.error('Error updating proposal niche:', error);
    }
  }, [proposalId]);

  // Obter pergunta atual
  const getCurrentQuestion = useCallback((): BaseQuestion | null => {
    if (!state.selectedNiche) return null;
    
    const baseQuestions = state.selectedNiche.base_questions;
    
    // Se ainda está nas perguntas base
    if (state.currentQuestionIndex < baseQuestions.length) {
      return baseQuestions[state.currentQuestionIndex];
    }
    
    // Se tem pergunta de follow-up da IA
    if (state.aiFollowUp) {
      return {
        id: `ai_${state.currentQuestionIndex}`,
        question: state.aiFollowUp,
        type: 'text',
      };
    }
    
    return null;
  }, [state.selectedNiche, state.currentQuestionIndex, state.aiFollowUp]);

  // Responder pergunta
  const answerQuestion = useCallback(async (answer: string) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !state.selectedNiche) return;

    setState(prev => ({ ...prev, isLoading: true }));

    const newAnswer: QuestionnaireAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer,
      isAiGenerated: currentQuestion.id.startsWith('ai_'),
      timestamp: new Date().toISOString(),
    };

    const updatedAnswers = [...state.answers, newAnswer];
    const nextIndex = state.currentQuestionIndex + 1;
    const baseQuestionsCount = state.selectedNiche.base_questions.length;

    // Se ainda tem perguntas base
    if (nextIndex < baseQuestionsCount) {
      setState(prev => ({
        ...prev,
        answers: updatedAnswers,
        currentQuestionIndex: nextIndex,
        aiFollowUp: null,
        isLoading: false,
      }));
      await saveAnswers(updatedAnswers);
      return;
    }

    // Após perguntas base, chamar IA para follow-up
    try {
      const response = await supabase.functions.invoke('questionnaire-ai', {
        body: {
          niche: state.selectedNiche.name,
          answers: updatedAnswers.map(a => ({ question: a.question, answer: a.answer })),
          currentQuestionIndex: nextIndex,
          companyName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { followUpQuestion, isComplete } = response.data;

      if (isComplete || !followUpQuestion) {
        // Questionário completo
        setState(prev => ({
          ...prev,
          answers: updatedAnswers,
          currentStep: 'complete',
          aiFollowUp: null,
          isLoading: false,
        }));
        await saveAnswers(updatedAnswers, true);
        toast.success('Questionário concluído!');
      } else {
        setState(prev => ({
          ...prev,
          answers: updatedAnswers,
          currentQuestionIndex: nextIndex,
          aiFollowUp: followUpQuestion,
          isLoading: false,
        }));
        await saveAnswers(updatedAnswers);
      }
    } catch (error) {
      console.error('Error getting AI follow-up:', error);
      // Se IA falhar, marcar como completo
      setState(prev => ({
        ...prev,
        answers: updatedAnswers,
        currentStep: 'complete',
        isLoading: false,
      }));
      await saveAnswers(updatedAnswers, true);
    }
  }, [state, getCurrentQuestion, companyName]);

  // Salvar respostas no banco
  const saveAnswers = async (answers: QuestionnaireAnswer[], completed = false) => {
    // Convert to JSON-compatible format
    const answersJson = answers.map(a => ({
      questionId: a.questionId,
      question: a.question,
      answer: a.answer,
      isAiGenerated: a.isAiGenerated || false,
      timestamp: a.timestamp,
    }));
    
    const { error } = await supabase
      .from('affiliate_proposals')
      .update({
        questionnaire_answers: answersJson,
        questionnaire_completed: completed,
      })
      .eq('id', proposalId);

    if (error) {
      console.error('Error saving answers:', error);
    }
  };

  // Voltar para pergunta anterior
  const goBack = useCallback(() => {
    if (state.currentQuestionIndex === 0 && state.currentStep === 'questions') {
      setState(prev => ({ ...prev, currentStep: 'niche', selectedNiche: null }));
      return;
    }
    
    if (state.currentQuestionIndex > 0) {
      const newAnswers = state.answers.slice(0, -1);
      setState(prev => ({
        ...prev,
        answers: newAnswers,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        aiFollowUp: null,
      }));
    }
  }, [state.currentQuestionIndex, state.currentStep, state.answers]);

  const progress = state.selectedNiche
    ? Math.min(
        (state.currentQuestionIndex / Math.max(state.selectedNiche.base_questions.length + 3, 8)) * 100,
        100
      )
    : 0;

  return {
    niches,
    state,
    selectNiche,
    getCurrentQuestion,
    answerQuestion,
    goBack,
    progress,
  };
}
