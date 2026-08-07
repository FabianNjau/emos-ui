import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import {
  LayoutDashboard, CheckSquare, Share2, Search,
  MessageSquare, Database, Moon, Sun, Menu,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/admin/review', label: 'Review Queue', icon: <CheckSquare size={18} /> },
  { to: '/admin/knowledge-graph', label: 'Knowledge Graph', icon: <Share2 size={18} /> },
  { to: '/admin/search', label: 'Semantic Search', icon: <Search size={18} /> },
  { to: '/admin/chat', label: 'AI Chat', icon: <MessageSquare size={18} /> },
  { to: '/admin/concepts', label: 'Concepts', icon: <Database size={18} /> },
];

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">E</div>
          <div>
            <div className="sidebar-logo-text">EMOS</div>
            <div className="sidebar-logo-sub">Knowledge Factory</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Workspace</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <span className="link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={() => useThemeStore.getState().toggleTheme()}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <span className="topbar-breadcrumb">
              <strong>
                {NAV_ITEMS.find((n) =>
                  n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
                )?.label || 'EMOS'}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Evidence-Based Marketing OS
            </span>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.sidebar--open {
            transform: translateX(0);
          }
        }
        @media (min-width: 769px) {
          .sidebar-overlay { display: none !important; }
          .sidebar { transform: none !important; }
        }
      `}</style>
    </div>
  );
}
