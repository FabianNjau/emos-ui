/**
 * useBookmarks — bookmark management for authenticated users.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import * as api from '../api/dashboard';
import type { Bookmark } from '../types/api';

export function useBookmarks() {
  return useQuery<Bookmark[], Error>({
    queryKey: ['bookmarks'],
    queryFn: api.listBookmarks,
    staleTime: 30_000,
  });
}

export function useBookmark(conceptId: string) {
  return useQuery<boolean, Error>({
    queryKey: ['bookmark-check', conceptId],
    queryFn: () => api.isBookmarked(conceptId),
    enabled: !!conceptId,
    staleTime: 60_000,
  });
}

export function useAddBookmark() {
  const qc = useQueryClient();
  return useMutation<void, Error, Omit<Bookmark, 'id' | 'user_id' | 'created_at' | 'notes' | 'evidence_count'>>({
    mutationFn: async (bookmark) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await api.addBookmark(
        user.id,
        bookmark.concept_id,
        bookmark.concept_slug,
        bookmark.concept_name,
        bookmark.domain,
        bookmark.layer,
      );
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ['bookmarks'] });
      void qc.invalidateQueries({ queryKey: ['bookmark-check', vars.concept_id] });
    },
  });
}

export function useRemoveBookmark() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: api.removeBookmark,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUpdateBookmarkNotes() {
  const qc = useQueryClient();
  return useMutation<void, Error, { bookmarkId: string; notes: string }>({
    mutationFn: ({ bookmarkId, notes }) => api.updateBookmarkNotes(bookmarkId, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
