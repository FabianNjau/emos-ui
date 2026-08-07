import { Search, Bell } from 'lucide-react';
import './TopBar.css';

interface TopBarProps {
  userName?: string;
  onSearchOpen?: () => void;
  /** Pass a number to show a notification count badge */
  notificationCount?: number;
}

export default function TopBar({ userName, onSearchOpen, notificationCount = 0 }: TopBarProps) {
  const initial = userName ? userName.charAt(0).toUpperCase() : '?';

  return (
    <header className="topbar" role="banner">
      {/* Search trigger */}
      <button
        className="topbar__search"
        onClick={onSearchOpen}
        aria-label="Search EMOS"
      >
        <Search size={18} className="topbar__search-icon" aria-hidden="true" />
        <span className="topbar__search-placeholder">Search anything…</span>
        <kbd className="topbar__search-kbd" aria-label="Keyboard shortcut: Command K">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="topbar__actions">

        {/* Notification bell */}
        <button
          className="topbar__icon-btn topbar__notif-btn"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="topbar__notif-badge" aria-hidden="true">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar + dropdown chevron */}
        <button className="topbar__avatar-btn" aria-label="Account menu" aria-haspopup="menu">
          <div className="topbar__avatar" aria-hidden="true">{initial}</div>
          <svg className="topbar__avatar-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
