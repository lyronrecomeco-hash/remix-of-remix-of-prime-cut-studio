import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>, targetUserId?: string) => Promise<void>;
  updateFeedbackStatus: (id: string, status: Feedback['status']) => Promise<void>;
  getPublishedFeedbacks: () => Feedback[];
  getNewFeedbacksCount: () => number;
  deleteFeedback: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshFeedbacks: () => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFeedbacks = useCallback(async () => {
    if (!user) {
      setFeedbacks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedbacks:', error);
        setFeedbacks([]);
      } else if (data) {
        setFeedbacks(data.map(f => ({
          id: f.id,
          name: f.name,
          rating: f.rating,
          text: f.text,
          createdAt: f.created_at,
          avatarType: f.avatar_type as AvatarType,
          avatarUrl: f.avatar_url || undefined,
          status: f.status as Feedback['status'],
          isAnonymous: f.is_anonymous,
        })));
      }
    } catch (e) {
      console.error('Error refreshing feedbacks:', e);
      setFeedbacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshFeedbacks();
  }, [refreshFeedbacks]);

  const addFeedback = useCallback(async (
    feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>,
    targetUserId?: string
  ) => {
    const userId = targetUserId || user?.id;
    if (!userId) {
      console.error('No user ID available for feedback');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: userId,
          name: feedback.name,
          rating: feedback.rating,
          text: feedback.text,
          avatar_type: feedback.avatarType,
          avatar_url: feedback.avatarUrl || null,
          is_anonymous: feedback.isAnonymous,
          status: 'new',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding feedback:', error);
        return;
      }

      if (data && user?.id === userId) {
        const newFeedback: Feedback = {
          id: data.id,
          name: data.name,
          rating: data.rating,
          text: data.text,
          createdAt: data.created_at,
          avatarType: data.avatar_type as AvatarType,
          avatarUrl: data.avatar_url || undefined,
          status: data.status as Feedback['status'],
          isAnonymous: data.is_anonymous,
        };
        setFeedbacks(prev => [newFeedback, ...prev]);
      }
    } catch (e) {
      console.error('Error adding feedback:', e);
    }
  }, [user]);

  const updateFeedbackStatus = useCallback(async (id: string, status: Feedback['status']) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error updating feedback status:', error);
        return;
      }

      setFeedbacks(prev =>
        prev.map(f => (f.id === id ? { ...f, status } : f))
      );
    } catch (e) {
      console.error('Error updating feedback status:', e);
    }
  }, []);

  const deleteFeedback = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feedback:', error);
        return;
      }

      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      console.error('Error deleting feedback:', e);
    }
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
        isLoading,
        refreshFeedbacks,
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
