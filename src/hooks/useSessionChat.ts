/**
 * useSessionChat — load + append messages for a specific session.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatMessageRecord } from '../types/api';

export function useSessionChat(sessionId: string) {
  return useQuery<ChatMessage[], Error>({
    queryKey: ['session-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as ChatMessageRecord[])
        .map(r => ({ role: r.role, content: r.content, thinking: r.thinking ?? undefined, sources: r.sources ?? undefined }));
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

export function useAppendMessage(sessionId: string) {
  const qc = useQueryClient();

  return useMutation<void, Error, ChatMessage>({
    mutationFn: async (message) => {
      const { error } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
        thinking: message.thinking ?? null,
        sources: message.sources ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['session-messages', sessionId] });
    },
  });
}
