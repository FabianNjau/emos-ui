/**
 * useChatSessions — list and manage a user's chat sessions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import * as api from '../api/dashboard';
import type { ChatSession, ContextSnapshot } from '../types/api';

export function useChatSessions() {
  return useQuery<ChatSession[], Error>({
    queryKey: ['chat-sessions'],
    queryFn: api.listSessions,
    staleTime: 30_000,
  });
}

export function useSession(sessionId: string) {
  return useQuery<ChatSession | null, Error>({
    queryKey: ['chat-session', sessionId],
    queryFn: () => api.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation<ChatSession, Error, { title: string; contextSnapshot?: ContextSnapshot }>({
    mutationFn: async ({ title, contextSnapshot }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return api.createSession(user.id, title, contextSnapshot);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation<void, Error, { sessionId: string; updates: Partial<ChatSession> }>({
    mutationFn: ({ sessionId, updates }) => api.updateSession(sessionId, updates),
    onSuccess: (_d, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
      void qc.invalidateQueries({ queryKey: ['chat-session', sessionId] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: api.deleteSession,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
