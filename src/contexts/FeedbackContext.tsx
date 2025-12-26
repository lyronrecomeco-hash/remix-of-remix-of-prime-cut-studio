import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type AvatarType = 'male' | 'female' | 'custom';

export interface Feedback {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
  avatarType: AvatarType;
  avatarUrl?: string;
  status: 'new' | 'read' | 'published' | 'archived';
  isAnonymous: boolean;
}

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) => void;
  updateFeedbackStatus: (id: string, status: Feedback['status']) => void;
  getPublishedFeedbacks: () => Feedback[];
  getNewFeedbacksCount: () => number;
  deleteFeedback: (id: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

// Default published feedbacks for demo
const defaultFeedbacks: Feedback[] = [
  {
    id: '1',
    name: 'João Paulo',
    rating: 5,
    text: 'Ambiente impecável e atendimento nota 10. O Ricardo entende exatamente o que você quer e entrega ainda melhor.',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    avatarType: 'male',
    status: 'published',
    isAnonymous: false,
  },
  {
    id: '2',
    name: 'Marcelo Santos',
    rating: 5,
    text: 'Finalmente encontrei uma barbearia onde posso relaxar. O combo corte + barba é uma experiência única.',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    avatarType: 'male',
    status: 'published',
    isAnonymous: false,
  },
  {
    id: '3',
    name: 'Fernando Lima',
    rating: 5,
    text: 'Agendamento fácil, zero espera e resultado sempre consistente. Virei cliente fiel há 2 anos.',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    avatarType: 'male',
    status: 'published',
    isAnonymous: false,
  },
];

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() =>
    loadFromStorage('barbershop-feedbacks', defaultFeedbacks)
  );

  useEffect(() => {
    saveToStorage('barbershop-feedbacks', feedbacks);
  }, [feedbacks]);

  const addFeedback = useCallback((feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>) => {
    const newFeedback: Feedback = {
      ...feedback,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
  }, []);

  const updateFeedbackStatus = useCallback((id: string, status: Feedback['status']) => {
    setFeedbacks(prev =>
      prev.map(f => (f.id === id ? { ...f, status } : f))
    );
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  }, []);

  const getPublishedFeedbacks = useCallback(() => {
    return feedbacks.filter(f => f.status === 'published');
  }, [feedbacks]);

  const getNewFeedbacksCount = useCallback(() => {
    return feedbacks.filter(f => f.status === 'new').length;
  }, [feedbacks]);

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        addFeedback,
        updateFeedbackStatus,
        getPublishedFeedbacks,
        getNewFeedbacksCount,
        deleteFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
