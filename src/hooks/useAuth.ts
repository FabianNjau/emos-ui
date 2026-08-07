import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PublicUser } from '../types/api';
import { PUBLIC_ROUTES } from '../constants/routes';

/** Maps a Supabase session to a minimal user object. */
function sessionUser(session: import('@supabase/supabase-js').Session | null): PublicUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    display_name: session.user.user_metadata?.display_name ?? null,
    is_admin: false,
  };
}

/** Centralised auth hook. */
export function useAuth() {
  const navigate = useNavigate();
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(sessionUser(data.session));
    };
    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ses) => {
      setSession(ses);
      setUser(sessionUser(ses));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setLoading(false); throw error; }
    if (data.session) { setSession(data.session); setUser(sessionUser(data.session)); }
    setLoading(false);
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); throw error; }
    if (data.session) { setSession(data.session); setUser(sessionUser(data.session)); }
    setLoading(false);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setTimeout(() => navigate(PUBLIC_ROUTES.HOME), 0);
  }, [navigate]);

  const requireAuth = useCallback(() => {
    if (!session) {
      setTimeout(() => navigate(PUBLIC_ROUTES.LOGIN), 0);
      return false;
    }
    return true;
  }, [session, navigate]);

  const requireAdmin = useCallback(() => {
    if (!user?.is_admin) {
      setTimeout(() => navigate(PUBLIC_ROUTES.HOME), 0);
      return false;
    }
    return true;
  }, [user, navigate]);

  return { session, user, loading, signUp, signIn, signOut, requireAuth, requireAdmin };
}
