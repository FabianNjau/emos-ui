/**
 * SavedPage — grid of bookmarked concepts with notes.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { useBookmarks, useRemoveBookmark, useUpdateBookmarkNotes } from '../../hooks/useBookmarks';
import {
  Bookmark,
  Loader,
  Trash2,
  ExternalLink,
  Search,
  Layers,
} from 'lucide-react';

const DOMAIN_FILTERS = ['All', 'Pricing', 'Audience', 'Channels', 'Strategy', 'Product', 'Positioning', 'Content', 'Digital', 'Analytics'];

export default function SavedPage() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const removeBookmark = useRemoveBookmark();
  const updateNotes = useUpdateBookmarkNotes();

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const filtered = bookmarks.filter(b => {
    const matchesSearch = b.concept_name.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = domainFilter === 'All' || b.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const handleSaveNotes = (bookmarkId: string) => {
    updateNotes.mutate({ bookmarkId, notes: editNotes }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const handleRemove = (bookmarkId: string) => {
    if (!confirm('Remove this bookmark?')) return;
    removeBookmark.mutate(bookmarkId);
  };

  const startEdit = (bookmarkId: string, currentNotes: string) => {
    setEditingId(bookmarkId);
    setEditNotes(currentNotes ?? '');
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Saved Insights
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          {isLoading ? '...' : `${bookmarks.length} concept${bookmarks.length !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.6rem 0.875rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search saved concepts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 14,
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DOMAIN_FILTERS.map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                borderColor: domainFilter === d ? 'var(--accent)' : 'var(--border)',
                background: domainFilter === d ? 'rgba(193,125,60,0.1)' : 'var(--surface)',
                color: domainFilter === d ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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
          {bookmarks.length === 0
            ? 'No saved concepts yet. Browse the knowledge base and bookmark concepts you want to reference later.'
            : 'No concepts match your search.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(bookmark => (
            <div
              key={bookmark.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <Bookmark size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <Link
                    to={`/concepts/${bookmark.concept_slug}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={bookmark.concept_name}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  >
                    {bookmark.concept_name}
                  </Link>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <Link
                    to={`/concepts/${bookmark.concept_slug}`}
                    title="Open concept"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.2rem',
                      color: 'var(--text-tertiary)',
                      borderRadius: 4,
                    }}
                  >
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    onClick={() => handleRemove(bookmark.id)}
                    title="Remove bookmark"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.2rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Domain + layer */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}>
                  {bookmark.domain}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(91,106,191,0.1)',
                  color: '#5b6abf',
                  padding: '2px 7px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <Layers size={10} />
                  {bookmark.layer}
                </span>
              </div>

              {/* Notes */}
              {editingId === bookmark.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Add your notes..."
                    rows={3}
                    style={{
                      width: '100%',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '0.5rem',
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      background: 'var(--bg)',
                      fontFamily: 'var(--font-sans)',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleSaveNotes(bookmark.id)}
                      style={{
                        flex: 1, padding: '0.35rem',
                        background: 'var(--accent)', color: '#fff',
                        border: 'none', borderRadius: 5,
                        fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        flex: 1, padding: '0.35rem',
                        background: 'var(--surface-2)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', borderRadius: 5,
                        fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEdit(bookmark.id, bookmark.notes ?? '')}
                  style={{
                    fontSize: 13,
                    color: bookmark.notes ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    cursor: 'text',
                    minHeight: 40,
                    lineHeight: 1.5,
                    padding: '4px 0',
                  }}
                >
                  {bookmark.notes || (
                    <span style={{ fontStyle: 'italic' }}>Click to add notes…</span>
                  )}
                </div>
              )}

              {/* Saved date */}
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 'auto', paddingTop: 4 }}>
                Saved {new Date(bookmark.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
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
