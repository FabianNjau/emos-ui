/**
 * SessionsPage — paginated list of all user chat sessions.
 * Click a row to resume the session.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from '../../constants/routes';
import { useChatSessions, useDeleteSession } from '../../hooks/useChatSessions';
import {
  MessageSquare,
  Clock,
  Loader,
  Trash2,
  PlusCircle,
  ChevronRight,
  Search,
} from 'lucide-react';

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

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const PAGE_SIZE = 20;

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useChatSessions();
  const deleteSession = useDeleteSession();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = sessions.filter(s =>
    (s.title ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        // If on last page and now empty, go back
        if (paginated.length === 1 && page > 0) setPage(p => p - 1);
      },
    });
  };

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            My Sessions
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {isLoading ? '...' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Link
          to={PUBLIC_ROUTES.ASK}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.5rem 1rem',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <PlusCircle size={15} />
          New chat
        </Link>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0.6rem 0.875rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '1rem',
      }}>
        <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size={22} className="spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-tertiary)',
          fontSize: 14,
        }}>
          {search ? 'No sessions match your search.' : 'No sessions yet.'}{' '}
          {!search && (
            <Link to={PUBLIC_ROUTES.ASK} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Start a conversation →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paginated.map(session => (
              <Link
                key={session.id}
                to={`${DASHBOARD_ROUTES.CHATS}/${session.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  gap: 12,
                  transition: 'border-color 0.1s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <MessageSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {timeAgo(session.updated_at)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {formatDate(session.updated_at)}
                      </span>
                      {session.discussed_concepts && session.discussed_concepts.length > 0 && (
                        <span style={{
                          fontSize: 11,
                          background: 'rgba(193,125,60,0.1)',
                          color: 'var(--accent)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 500,
                        }}>
                          {session.discussed_concepts.length} concepts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={e => handleDelete(e, session.id)}
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
                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: '1.25rem',
            }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: '0.4rem 0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--surface)',
                  color: page === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '0.4rem 0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--surface)',
                  color: page >= totalPages - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

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
