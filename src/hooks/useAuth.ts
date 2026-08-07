/**
 * useAuth — thin wrapper around Supabase auth + profile lookup.
 * Profile is_admin gates access to admin routes.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PublicUser } from '../types/api';

export interface AuthUser extends PublicUser {
  plan?: 'free' | 'pro';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUserId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, is_admin')
      .eq('id', authUserId)
      .single();
    return data;
  }, []);

  useEffect(() => {
    void (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const profile = await fetchProfile(authUser.id);
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          display_name: profile?.display_name ?? authUser.email?.split('@')[0] ?? null,
          is_admin: profile?.is_admin ?? false,
        });
      }
      setLoading(false);
    })();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        display_name: profile?.display_name ?? data.user.email?.split('@')[0] ?? null,
        is_admin: profile?.is_admin ?? false,
      });
    }
    return data;
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: displayName ?? '' },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, signOut };
}
