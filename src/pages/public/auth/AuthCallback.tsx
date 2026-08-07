import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { PUBLIC_ROUTES } from '../../../constants/routes';

/** Handles Supabase auth redirect — exchanges code for session then redirects. */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Exchange auth code from URL for a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(PUBLIC_ROUTES.HOME);
      } else {
        // No session — redirect to login
        navigate(PUBLIC_ROUTES.LOGIN);
      }
    });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      Confirming your account…
    </div>
  );
}
