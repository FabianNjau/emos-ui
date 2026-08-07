/**
 * DashboardShell — EMOS premium knowledge workspace layout.
 * Dark forest sidebar (272px) + topbar + floating chat FAB.
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
  Sparkles,
} from 'lucide-react';
import TopBar from './TopBar';
import ChatFAB from './ChatFAB';
import ProCard from '../dashboard/ProCard';
import './DashboardShell.css';

const NAV_ITEMS = [
  { to: DASHBOARD_ROUTES.HOME, label: 'Overview', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
  { to: DASHBOARD_ROUTES.CHATS, label: 'My Sessions', icon: <MessageSquare size={20} strokeWidth={1.75} /> },
  { to: DASHBOARD_ROUTES.SAVED, label: 'Saved Insights', icon: <Bookmark size={20} strokeWidth={1.75} /> },
  { to: DASHBOARD_ROUTES.EXPLORE, label: 'Explore', icon: <Compass size={20} strokeWidth={1.75} /> },
  { to: DASHBOARD_ROUTES.PROFILES, label: 'Profiles', icon: <UserCog size={20} strokeWidth={1.75} /> },
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

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="dash-sidebar">

        {/* Brand */}
        <div className="dash-sidebar__brand">
          <img
            src="/assets/emos-logo-square.png"
            alt="EMOS logo"
            className="dash-sidebar__logo-img"
            width={40}
            height={40}
          />
          <div className="dash-sidebar__brand-text">
            <span className="dash-sidebar__brand-name">EMOS</span>
            <span className="dash-sidebar__brand-sub">Knowledge Platform</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="dash-sidebar__nav" role="navigation" aria-label="Main navigation">
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

        {/* Spacer */}
        <div className="dash-sidebar__spacer" />

        {/* Pro promotion card */}
        <ProCard />

        {/* User account section */}
        <div className="dash-sidebar__account">
          <div className="dash-sidebar__user">
            <div className="dash-sidebar__avatar">{firstInitial}</div>
            <div className="dash-sidebar__user-info">
              <span className="dash-sidebar__user-name">{displayName}</span>
              <span className="dash-sidebar__user-plan">Free Plan</span>
            </div>
            <svg className="dash-sidebar__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <button
            className="dash-sidebar__signout"
            onClick={handleSignOut}
            title="Sign out of EMOS"
          >
            <LogOut size={17} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>

      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="dash-main">
        <TopBar userName={displayName} />
        <div className="dash-main__scroll">
          <div className="dash-page">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Floating chat FAB */}
      <ChatFAB />
    </div>
  );
}
