import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X } from 'lucide-react';
import './PublicHeader.css';

export default function PublicHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
                  className="public-header__btn public-header__btn--ghost public-header__btn--sm"
                  onClick={() => navigate(PUBLIC_ROUTES.LOGIN)}
                >
                  Sign in
                </button>
                <button
                  className="public-header__btn public-header__btn--primary public-header__btn--sm"
                  onClick={() => navigate(PUBLIC_ROUTES.SIGNUP)}
                >
                  Get started
                </button>
              </>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="public-header__hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="public-header__drawer">
          <nav className="public-header__drawer-nav">
            <Link to={PUBLIC_ROUTES.TOPICS} onClick={() => setMenuOpen(false)}>Topics</Link>
            <Link to={PUBLIC_ROUTES.ASK} onClick={() => setMenuOpen(false)}>Ask</Link>
            <Link to={PUBLIC_ROUTES.ABOUT} onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
          {!loading && !user && (
            <div className="public-header__drawer-auth">
              <button onClick={() => { navigate(PUBLIC_ROUTES.LOGIN); setMenuOpen(false); }}>Sign in</button>
              <button className="btn-primary" onClick={() => { navigate(PUBLIC_ROUTES.SIGNUP); setMenuOpen(false); }}>Get started</button>
            </div>
          )}
          {!loading && user && (
            <div className="public-header__drawer-auth">
              <button onClick={() => { navigate(PUBLIC_ROUTES.HOME); setMenuOpen(false); }}>My Account</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
