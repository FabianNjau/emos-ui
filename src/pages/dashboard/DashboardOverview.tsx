/**
 * DashboardOverview — authenticated home page.
 * Matches the EMOS design mockup.
 */
import { Link } from 'react-router-dom';
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from '../../constants/routes';
import { useChatSessions, useDeleteSession } from '../../hooks/useChatSessions';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useContextProfiles } from '../../hooks/useContextProfiles';
import { useAuth } from '../../hooks/useAuth';
import {
  MessageSquare,
  Bookmark,
  Clock,
  Loader,
  Trash2,
  Compass,
  Sparkles,
  ChevronRight,
  BarChart3,
  BookmarkCheck,
} from 'lucide-react';
import './DashboardOverview.css';

function timeAgo(isoString: string): string {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading: sessionsLoading } = useChatSessions();
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarks();
  const { data: profiles = [], isLoading: profilesLoading } = useContextProfiles();
  const deleteSession = useDeleteSession();

  const displayName = user?.display_name ?? user?.email?.split('@')[0] ?? 'there';
  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="dash-overview">

      {/* Greeting */}
      <div className="dash-overview__greeting">
        <h1>Welcome back, {displayName} 👋</h1>
        <p>Your EMOS workspace — chat history, saved insights, and knowledge explorer.</p>
      </div>

      {/* CTA Banner */}
      <Link to={PUBLIC_ROUTES.ASK} className="dash-overview__cta">
        <div className="dash-overview__cta-left">
          <Sparkles size={18} />
          <span>Start a new conversation</span>
        </div>
        <span className="dash-overview__cta-btn">
          New Conversation <ChevronRight size={13} />
        </span>
      </Link>

      {/* Stats */}
      <div className="dash-overview__stats">
        {/* Sessions */}
        <div className="dash-overview__stat-card">
          <div
            className="dash-overview__stat-icon"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <MessageSquare size={18} />
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {sessionsLoading ? <Loader size={16} className="dash-overview__loading-icon" /> : sessions.length}
            </div>
            <div className="dash-overview__stat-label">Chat sessions</div>
            {sessions.length > 0 && (
              <div className="dash-overview__stat-sub">+{Math.min(sessions.length, sessions.filter(s => {
                const age = Date.now() - new Date(s.created_at).getTime();
                return age < 7 * 24 * 60 * 60 * 1000;
              }).length)} this week</div>
            )}
          </div>
        </div>

        {/* Saved */}
        <div className="dash-overview__stat-card">
          <div
            className="dash-overview__stat-icon"
            style={{ background: '#E8F2F0', color: '#3C7A6B' }}
          >
            <BookmarkCheck size={18} />
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {bookmarksLoading ? <Loader size={16} className="dash-overview__loading-icon" /> : bookmarks.length}
            </div>
            <div className="dash-overview__stat-label">Saved concepts</div>
            {bookmarks.length === 0 && (
              <div className="dash-overview__stat-sub">Start saving</div>
            )}
          </div>
        </div>

        {/* Profiles */}
        <div className="dash-overview__stat-card">
          <div
            className="dash-overview__stat-icon"
            style={{ background: '#EEF0F8', color: '#4F5E8C' }}
          >
            <BarChart3 size={18} />
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {profilesLoading ? <Loader size={16} className="dash-overview__loading-icon" /> : profiles.length}
            </div>
            <div className="dash-overview__stat-label">Context profiles</div>
            {profiles.length === 0 && (
              <div className="dash-overview__stat-sub">Create your first</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="dash-overview__sessions">
        <div className="dash-overview__section-header">
          <span className="dash-overview__section-title">Recent sessions</span>
          {sessions.length > 0 && (
            <Link to={DASHBOARD_ROUTES.CHATS} className="dash-overview__section-link">
              View all
            </Link>
          )}
        </div>

        {sessionsLoading ? (
          <div className="dash-overview__loading">
            <Loader size={20} className="dash-overview__loading-icon" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="dash-overview__empty">
            No sessions yet.{' '}
            <Link to={PUBLIC_ROUTES.ASK}>Start your first chat</Link>
          </div>
        ) : (
          <div className="dash-overview__sessions-list">
            {recentSessions.map(session => (
              <div key={session.id} className="dash-overview__session-card">
                <div className="dash-overview__session-info">
                  <MessageSquare size={14} className="dash-overview__session-icon" />
                  <div className="dash-overview__session-text">
                    <div className="dash-overview__session-title">
                      {session.title ?? 'Untitled session'}
                    </div>
                    <div className="dash-overview__session-meta">
                      <span className="dash-overview__session-time">
                        <Clock size={10} />
                        {timeAgo(session.updated_at)}
                      </span>
                      {session.turn_count > 0 && (
                        <span className="dash-overview__session-turns">
                          {session.turn_count} turns
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="dash-overview__session-actions">
                  <Link
                    to={`${DASHBOARD_ROUTES.CHATS}/${session.id}`}
                    className="dash-overview__resume-btn"
                  >
                    Resume
                  </Link>
                  <button
                    onClick={() => deleteSession.mutate(session.id)}
                    className="dash-overview__delete-btn"
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div className="dash-overview__quick-access">
        <div className="dash-overview__section-header" style={{ marginBottom: '0.75rem' }}>
          <span className="dash-overview__section-title">Quick access</span>
        </div>
        <div className="dash-overview__quick-grid">
          <Link to={DASHBOARD_ROUTES.SAVED} className="dash-overview__quick-card">
            <div
              className="dash-overview__quick-card-icon"
              style={{ background: '#E8F2F0', color: 'var(--accent)' }}
            >
              <Bookmark size={16} />
            </div>
            <span className="dash-overview__quick-card-label">Saved Insights</span>
          </Link>
          <Link to={DASHBOARD_ROUTES.EXPLORE} className="dash-overview__quick-card">
            <div
              className="dash-overview__quick-card-icon"
              style={{ background: '#EEF0F8', color: '#4F5E8C' }}
            >
              <Compass size={16} />
            </div>
            <span className="dash-overview__quick-card-label">Knowledge Explorer</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
