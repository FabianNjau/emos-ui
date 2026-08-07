import { Link, useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './PublicHeader.css';

export default function PublicHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="public-header">
      <div className="public-header__inner">
        {/* Logo */}
        <Link to={PUBLIC_ROUTES.HOME} className="public-header__logo">
          EMOS
        </Link>

        {/* Nav */}
        <nav className="public-header__nav" aria-label="Main navigation">
          <Link to={PUBLIC_ROUTES.TOPICS} className="public-header__nav-link">
            Topics
          </Link>
          <Link to={PUBLIC_ROUTES.ASK} className="public-header__nav-link">
            Ask
          </Link>
          <Link to={PUBLIC_ROUTES.ABOUT} className="public-header__nav-link">
            About
          </Link>
        </nav>

        {/* Auth */}
        <div className="public-header__auth">
          {!loading && (
            user ? (
              <>
                <button
                  className="public-header__btn public-header__btn--ghost"
                  onClick={() => navigate(PUBLIC_ROUTES.HOME)}
                >
                  My Account
                </button>
              </>
            ) : (
              <>
                <button
                  className="public-header__btn public-header__btn--ghost"
                  onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}
                >
                  Sign in
                </button>
                <button
                  className="public-header__btn public-header__btn--primary"
                  onClick={() => navigate(PUBLIC_ROUTES.SIGNUP)}
                >
                  Get started
                </button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
