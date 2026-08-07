/**
 * DashboardOverview — authenticated home page after login.
 * Shows stats, recent sessions, quick actions.
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
  ChevronRight,
  Loader,
  Trash2,
  PlusCircle,
  BarChart3,
} from 'lucide-react';

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

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

  const recentSessions = sessions.slice(0, 5);

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}>
          Welcome back{user?.display_name ? `, ${user.display_name}` : ''}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Your EMOS workspace — chat history, saved insights, and knowledge explorer.
        </p>
      </div>

      {/* Quick start */}
      <Link
        to={PUBLIC_ROUTES.ASK}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius-lg)',
          textDecoration: 'none',
          marginBottom: '1.75rem',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PlusCircle size={20} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Start a new conversation</span>
        </div>
        <ChevronRight size={18} />
      </Link>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: '2rem' }}>
        <StatCard
          label="Chat sessions"
          value={sessionsLoading ? <Loader size={16} className="spin" /> : sessions.length}
          icon={<MessageSquare size={20} />}
          color="var(--accent)"
        />
        <StatCard
          label="Saved concepts"
          value={bookmarksLoading ? <Loader size={16} className="spin" /> : bookmarks.length}
          icon={<Bookmark size={20} />}
          color="#0f7b6c"
        />
        <StatCard
          label="Context profiles"
          value={profiles?.length ?? 0}
          icon={<BarChart3 size={20} />}
          color="#5b6abf"
        />
      </div>

      {/* Recent sessions */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Recent sessions
          </h2>
          {sessions.length > 0 && (
            <Link
              to={DASHBOARD_ROUTES.CHATS}
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View all
            </Link>
          )}
        </div>

        {sessionsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size={20} className="spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-tertiary)',
            fontSize: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            No sessions yet.{' '}
            <Link to={PUBLIC_ROUTES.ASK} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Start your first chat
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSessions.map(session => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <MessageSquare size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {session.title ?? 'Untitled session'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {timeAgo(session.updated_at)}
                      </span>
                      {session.turn_count > 0 && (
                        <span style={{
                          fontSize: 11,
                          background: 'var(--surface-2)',
                          color: 'var(--text-tertiary)',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}>
                          {session.turn_count} turns
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <Link
                    to={`${DASHBOARD_ROUTES.CHATS}/${session.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0.3rem 0.75rem',
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Resume
                  </Link>
                  <button
                    onClick={() => deleteSession.mutate(session.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.3rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      borderRadius: 4,
                    }}
                    title="Delete session"
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Quick access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link
            to={DASHBOARD_ROUTES.SAVED}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            <Bookmark size={16} style={{ color: '#0f7b6c' }} />
            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
              Saved Insights
            </span>
          </Link>
          <Link
            to={DASHBOARD_ROUTES.EXPLORE}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            <Compass size={16} style={{ color: '#5b6abf' }} />
            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
              Knowledge Explorer
            </span>
          </Link>
        </div>
      </div>

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
