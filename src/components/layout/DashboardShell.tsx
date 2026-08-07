/**
 * DashboardShell — authenticated user layout.
 * Dark forest-green sidebar + topbar + floating chat FAB.
 */
import { useEffect } from 'react';
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
  Loader,
} from 'lucide-react';
import TopBar from './TopBar';
import ChatFAB from './ChatFAB';
import ProCard from '../dashboard/ProCard';
import './DashboardShell.css';

const NAV_ITEMS = [
  { to: DASHBOARD_ROUTES.HOME, label: 'Overview', icon: <LayoutDashboard size={16} />, exact: true },
  { to: DASHBOARD_ROUTES.CHATS, label: 'My Sessions', icon: <MessageSquare size={16} /> },
  { to: DASHBOARD_ROUTES.SAVED, label: 'Saved Insights', icon: <Bookmark size={16} /> },
  { to: DASHBOARD_ROUTES.EXPLORE, label: 'Explore', icon: <Compass size={16} /> },
  { to: DASHBOARD_ROUTES.PROFILES, label: 'Profiles', icon: <UserCog size={16} /> },
];

export default function DashboardShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
      <div className="dash-shell-loading">
        <Loader size={22} className="dash-shell-loading__icon" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.display_name ?? user.email ?? 'User';
  const firstInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dash-shell">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        {/* Logo */}
        <div className="dash-sidebar__logo">
          <svg className="dash-sidebar__logo-mark" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            {/* Hexagonal EMOS mark */}
            <path
              d="M14 2L25 8V20L14 26L3 20V8L14 2Z"
              fill="#1C3525"
              stroke="#4ADE8B"
              strokeWidth="1.5"
            />
            <path
              d="M14 6L22 10.5V19.5L14 24L6 19.5V10.5L14 6Z"
              fill="none"
              stroke="#4ADE8B"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            {/* Central dot */}
            <circle cx="14" cy="14" r="3" fill="#4ADE8B" />
          </svg>
          <div className="dash-sidebar__logo-text">
            <span className="dash-sidebar__logo-name">EMOS</span>
            <span className="dash-sidebar__logo-sub">Knowledge Platform</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="dash-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `dash-sidebar__nav-item${isActive ? ' dash-sidebar__nav-item--active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pro upgrade card */}
        <ProCard />

        {/* User + sign out */}
        <div className="dash-sidebar__footer">
          <div className="dash-sidebar__user">
            <div className="dash-sidebar__avatar">{firstInitial}</div>
            <div className="dash-sidebar__user-info">
              <span className="dash-sidebar__user-name">{displayName}</span>
              <span className="dash-sidebar__user-plan">Free Plan</span>
            </div>
          </div>
          <button
            className="dash-sidebar__signout"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="dash-main">
        <TopBar userName={displayName} />
        <div className="dash-main__content">
          <Outlet />
        </div>
      </div>

      {/* ── Floating action button ───────────────────────────────── */}
      <ChatFAB />
    </div>
  );
}
