/**
 * DashboardOverview — EMOS premium knowledge workspace home page.
 * Matches EMOS design specification exactly.
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
  Compass,
  Clock,
  Loader,
  Trash2,
  Sparkles,
  ChevronRight,
  BarChart3,
  BookmarkCheck,
  MoreVertical,
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

  const recentSessions = sessions.slice(0, 6);
  const weeklySessions = sessions.filter(s => {
    const age = Date.now() - new Date(s.created_at).getTime();
    return age < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="dash-overview">

      {/* ── Welcome header ─────────────────────────────────── */}
      <div className="dash-overview__welcome">
        <p className="dash-overview__welcome-label">Welcome back,</p>
        <h1 className="dash-overview__welcome-name">{displayName}</h1>
        <p className="dash-overview__welcome-sub">
          Your EMOS workspace — chat history, saved insights, and knowledge explorer.
        </p>
      </div>

      {/* ── New conversation hero ────────────────────────────── */}
      <Link to={PUBLIC_ROUTES.ASK} className="dash-overview__hero" aria-label="Start a new conversation">
        <div className="dash-overview__hero-left">
          {/* Circular icon container */}
          <div className="dash-overview__hero-icon" aria-hidden="true">
            <Sparkles size={24} />
          </div>
          <div className="dash-overview__hero-copy">
            <p className="dash-overview__hero-title">Start a new conversation</p>
            <p className="dash-overview__hero-body">
              Ask anything. Get insights. Save knowledge.
            </p>
          </div>
        </div>
        <div className="dash-overview__hero-cta">
          New Conversation
          <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </div>
      </Link>

      {/* ── Stats grid ──────────────────────────────────────── */}
      <div className="dash-overview__stats-grid">
        {/* Chat sessions */}
        <div className="dash-overview__stat-card">
          <div className="dash-overview__stat-icon-wrap" aria-hidden="true">
            <div className="dash-overview__stat-icon" style={{ background: 'var(--emos-mint-100)', color: 'var(--emos-green-800)' }}>
              <MessageSquare size={22} strokeWidth={1.75} />
            </div>
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {sessionsLoading
                ? <Loader size={18} className="animate-spin" style={{ color: 'var(--emos-text-muted)' }} />
                : sessions.length
              }
            </div>
            <div className="dash-overview__stat-label">Chat sessions</div>
            {sessions.length > 0 && (
              <div className="dash-overview__stat-sub">+{weeklySessions} this week</div>
            )}
          </div>
        </div>

        {/* Saved concepts */}
        <div className="dash-overview__stat-card">
          <div className="dash-overview__stat-icon-wrap" aria-hidden="true">
            <div className="dash-overview__stat-icon" style={{ background: 'var(--emos-purple-100)', color: 'var(--emos-purple-500)' }}>
              <BookmarkCheck size={22} strokeWidth={1.75} />
            </div>
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {bookmarksLoading
                ? <Loader size={18} className="animate-spin" style={{ color: 'var(--emos-text-muted)' }} />
                : bookmarks.length
              }
            </div>
            <div className="dash-overview__stat-label">Saved concepts</div>
            {bookmarks.length === 0 && (
              <div className="dash-overview__stat-sub">Start saving</div>
            )}
          </div>
        </div>

        {/* Context profiles */}
        <div className="dash-overview__stat-card">
          <div className="dash-overview__stat-icon-wrap" aria-hidden="true">
            <div className="dash-overview__stat-icon" style={{ background: 'var(--emos-purple-100)', color: 'var(--emos-purple-500)' }}>
              <BarChart3 size={22} strokeWidth={1.75} />
            </div>
          </div>
          <div className="dash-overview__stat-info">
            <div className="dash-overview__stat-num">
              {profilesLoading
                ? <Loader size={18} className="animate-spin" style={{ color: 'var(--emos-text-muted)' }} />
                : profiles.length
              }
            </div>
            <div className="dash-overview__stat-label">Context profiles</div>
            {profiles.length === 0 && (
              <div className="dash-overview__stat-sub">Create your first</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column lower grid ────────────────────────────── */}
      <div className="dash-overview__lower-grid">

        {/* Recent sessions */}
        <div className="dash-overview__sessions-card">
          <div className="dash-overview__card-header">
            <h2 className="dash-overview__card-title">Recent sessions</h2>
            {sessions.length > 0 && (
              <Link to={DASHBOARD_ROUTES.CHATS} className="dash-overview__card-link">
                View all
              </Link>
            )}
          </div>

          {sessionsLoading ? (
            <div className="dash-overview__sessions-loading">
              <Loader size={20} className="animate-spin" style={{ color: 'var(--emos-green-500)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="dash-overview__empty-state">
              <div className="dash-overview__empty-icon" aria-hidden="true">
                <MessageSquare size={28} strokeWidth={1.5} />
              </div>
              <p className="dash-overview__empty-title">Your knowledge workspace is ready</p>
              <p className="dash-overview__empty-body">
                Start a conversation to build your knowledge base.
              </p>
              <Link to={PUBLIC_ROUTES.ASK} className="dash-overview__empty-cta">
                Start a conversation
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="dash-overview__sessions-list">
              {recentSessions.map(session => (
                <div key={session.id} className="dash-overview__session-row">
                  <div className="dash-overview__session-icon" aria-hidden="true">
                    <MessageSquare size={16} strokeWidth={1.75} />
                  </div>
                  <div className="dash-overview__session-info">
                    <p className="dash-overview__session-title">
                      {session.title ?? 'Untitled session'}
                    </p>
                    <p className="dash-overview__session-meta">
                      <Clock size={10} aria-hidden="true" />
                      {timeAgo(session.updated_at)}
                      {session.turn_count > 0 && (
                        <>
                          <span className="dash-overview__session-dot" aria-hidden="true" />
                          {session.turn_count} turns
                        </>
                      )}
                    </p>
                  </div>
                  <div className="dash-overview__session-actions">
                    <Link
                      to={`${DASHBOARD_ROUTES.CHATS}/${session.id}`}
                      className="dash-overview__resume-btn"
                    >
                      Resume
                    </Link>
                    <button
                      className="dash-overview__more-btn"
                      onClick={() => deleteSession.mutate(session.id)}
                      aria-label={`Delete session: ${session.title ?? 'Untitled session'}`}
                      title="Delete session"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="dash-overview__quick-card">
          <div className="dash-overview__card-header">
            <h2 className="dash-overview__card-title">Quick access</h2>
          </div>
          <div className="dash-overview__quick-list">

            <Link to={DASHBOARD_ROUTES.SAVED} className="dash-overview__quick-tile">
              <div
                className="dash-overview__quick-tile-icon"
                style={{ background: 'var(--emos-mint-100)', color: 'var(--emos-green-800)' }}
                aria-hidden="true"
              >
                <Bookmark size={18} strokeWidth={1.75} />
              </div>
              <div className="dash-overview__quick-tile-text">
                <p className="dash-overview__quick-tile-title">Saved Insights</p>
                <p className="dash-overview__quick-tile-sub">View and manage your saved knowledge</p>
              </div>
              <ChevronRight size={14} className="dash-overview__quick-tile-arrow" aria-hidden="true" />
            </Link>

            <Link to={DASHBOARD_ROUTES.EXPLORE} className="dash-overview__quick-tile">
              <div
                className="dash-overview__quick-tile-icon"
                style={{ background: 'var(--emos-purple-100)', color: 'var(--emos-purple-500)' }}
                aria-hidden="true"
              >
                <Compass size={18} strokeWidth={1.75} />
              </div>
              <div className="dash-overview__quick-tile-text">
                <p className="dash-overview__quick-tile-title">Knowledge Explorer</p>
                <p className="dash-overview__quick-tile-sub">Discover, explore and learn from knowledge</p>
              </div>
              <ChevronRight size={14} className="dash-overview__quick-tile-arrow" aria-hidden="true" />
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}
