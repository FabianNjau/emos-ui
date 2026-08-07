import { Search, Bell } from 'lucide-react';
import './TopBar.css';

interface TopBarProps {
  userName?: string;
  onSearchOpen?: () => void;
}

export default function TopBar({ userName, onSearchOpen }: TopBarProps) {
  return (
    <div className="topbar">
      {/* Search trigger */}
      <button className="topbar__search" onClick={onSearchOpen} aria-label="Search">
        <Search size={14} className="topbar__search-icon" />
        <span className="topbar__search-placeholder">Search anything…</span>
        <kbd className="topbar__search-kbd">⌘K</kbd>
      </button>

      {/* Right actions */}
      <div className="topbar__actions">
        {/* Notifications */}
        <button className="topbar__icon-btn" aria-label="Notifications">
          <Bell size={17} />
          <span className="topbar__notif-dot" aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div className="topbar__avatar" aria-label={userName ?? 'User'}>
          {userName
            ? userName.charAt(0).toUpperCase()
            : <span style={{ fontSize: 10, opacity: 0.7 }}>?</span>}
        </div>
      </div>
    </div>
  );
}
