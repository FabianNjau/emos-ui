import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../../constants/routes';

/** Handles Supabase auth redirect — exchanges code for session then redirects. */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Exchange auth code from URL for a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Confirmed → send to user dashboard
        navigate(DASHBOARD_ROUTES.HOME, { replace: true });
      } else {
        navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      Confirming your account…
    </div>
  );
}
