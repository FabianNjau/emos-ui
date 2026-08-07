/**
 * useContextProfiles — CRUD for reusable context setups.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/dashboard';
import type { ContextProfile } from '../types/api';

export function useContextProfiles() {
  return useQuery<ContextProfile[], Error>({
    queryKey: ['context-profiles'],
    queryFn: api.listContextProfiles,
    staleTime: 30_000,
  });
}

export function useCreateContextProfile() {
  const qc = useQueryClient();
  return useMutation<ContextProfile, Error, Omit<ContextProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    mutationFn: api.createContextProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['context-profiles'] });
    },
  });
}

export function useUpdateContextProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, { profileId: string; updates: Partial<ContextProfile> }>({
    mutationFn: ({ profileId, updates }) => api.updateContextProfile(profileId, updates),
    onSuccess: (_d, { profileId }) => {
      void qc.invalidateQueries({ queryKey: ['context-profiles'] });
      void qc.invalidateQueries({ queryKey: ['context-profile', profileId] });
    },
  });
}

export function useDeleteContextProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: api.deleteContextProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['context-profiles'] });
    },
  });
}

export function useSetDefaultProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: api.setDefaultProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['context-profiles'] });
    },
  });
}
