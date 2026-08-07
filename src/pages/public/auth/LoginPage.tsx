import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../../constants/routes';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(DASHBOARD_ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Sign in to EMOS</h1>
        <p className="auth-card__sub">
          New here?{' '}
          <Link to={PUBLIC_ROUTES.SIGNUP}>Create an account</Link>
        </p>

        {error && <p className="auth-card__error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__label">
            Email
            <input
              type="email"
              className="auth-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-form__label">
            Password
            <input
              type="password"
              className="auth-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
