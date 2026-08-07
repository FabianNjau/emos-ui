/**
 * DashboardShell — authenticated user layout with sidebar navigation.
 * Redirects to /auth/login if not authenticated.
 */
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { DASHBOARD_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  MessageSquare,
  Bookmark,
  Compass,
  UserCog,
  LogOut,
  ChevronRight,
  Loader,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: DASHBOARD_ROUTES.HOME, label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
  { to: DASHBOARD_ROUTES.CHATS, label: 'My Sessions', icon: <MessageSquare size={18} /> },
  { to: DASHBOARD_ROUTES.SAVED, label: 'Saved Insights', icon: <Bookmark size={18} /> },
  { to: DASHBOARD_ROUTES.EXPLORE, label: 'Explore', icon: <Compass size={18} /> },
  { to: DASHBOARD_ROUTES.PROFILES, label: 'Profiles', icon: <UserCog size={18} /> },
];

export default function DashboardShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader size={24} className="spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
            EMOS
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Knowledge Platform
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(193,125,60,0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.1s ease',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + sign out */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '0 0.25rem' }}>
            {user.display_name ?? user.email}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'color 0.1s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: 240,
        flex: 1,
        minHeight: '100vh',
        background: 'var(--bg)',
        overflowX: 'hidden',
      }}>
        {/* Inner content wrapper — fills space with comfortable max-width */}
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '2.5rem 2rem',
        }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
