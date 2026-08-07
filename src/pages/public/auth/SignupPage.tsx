import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PUBLIC_ROUTES } from '../../../constants/routes';
import './AuthPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await signUp(email, password, displayName || undefined);
      if (data.session) {
        // Email confirmation is disabled — logged in immediately
        navigate(PUBLIC_ROUTES.HOME);
      } else {
        // Email confirmation required — show success state
        setEmailSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__sub">
          Already have one?{' '}
          <Link to={PUBLIC_ROUTES.LOGIN}>Sign in</Link>
        </p>

        {error && <p className="auth-card__error">{error}</p>}

        {emailSent && (
          <div className="auth-card__notice">
            <strong>Check your email</strong>
            <p>
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__label">
            Name <span className="auth-form__optional">(optional)</span>
            <input
              type="text"
              className="auth-form__input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

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
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading || !email || !password}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
