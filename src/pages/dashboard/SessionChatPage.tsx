/**
 * SessionChatPage — view + continue a specific chat session.
 * Route: /dashboard/chats/:sessionId
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSessionChat, useAppendMessage } from '../../hooks/useSessionChat';
import { useChatSessions } from '../../hooks/useChatSessions';
import { useAuth } from '../../hooks/useAuth';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../constants/routes';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types/api';
import {
  ArrowLeft,
  Loader,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Send,
  BarChart2,
  Clock,
  Tag,
} from 'lucide-react';

function MessageView({ msg }: { msg: ChatMessage }) {
  const [showThinking, setShowThinking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleBookmarkConcept = async (conceptSlug: string, conceptName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('bookmarks').upsert({
      user_id: user.id,
      concept_id: conceptSlug,
      concept_slug: conceptSlug,
      concept_name: conceptName,
      domain: null,
      layer: null,
    }, { onConflict: 'user_id,concept_id' });
    setBookmarked(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '0.75rem 0',
    }}>
      {/* Role label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: msg.role === 'user' ? '#5b6abf' : 'var(--accent)',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: msg.role === 'user' ? 'rgba(91,106,191,0.12)' : 'rgba(193,125,60,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: msg.role === 'user' ? '#5b6abf' : 'var(--accent)',
        }}>
          {msg.role === 'user' ? 'Y' : 'E'}
        </div>
        {msg.role === 'user' ? 'You' : 'EMOS'}
      </div>

      {/* Content */}
      <div style={{
        paddingLeft: 36,
        fontSize: 15,
        lineHeight: 1.65,
        color: 'var(--text-primary)',
      }}>
        {msg.content.split('\n').map((para, i) => (
          <p key={i} style={{ marginBottom: i < msg.content.split('\n').length - 1 ? '0.75em' : 0 }}>
            {para}
          </p>
        ))}
      </div>

      {/* Thinking toggle */}
      {msg.thinking && (
        <div style={{ paddingLeft: 36, marginTop: 4 }}>
          <button
            onClick={() => setShowThinking(s => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'var(--text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.2rem 0',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {showThinking ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showThinking ? 'Hide reasoning' : 'Show reasoning'}
          </button>
          {showThinking && (
            <div style={{
              marginTop: 8,
              padding: '0.75rem 1rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.thinking}
            </div>
          )}
        </div>
      )}

      {/* Sources */}
      {msg.sources && msg.sources.length > 0 && (
        <div style={{ paddingLeft: 36, marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Sources
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {msg.sources.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                  {s.finding && <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>— {s.finding}</span>}
                </div>
                {s.concept_slug && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Link
                      to={`/concepts/${s.concept_slug}`}
                      style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      View concept →
                    </Link>
                    <button
                      onClick={() => handleBookmarkConcept(s.concept_slug!, s.name)}
                      title="Save concept"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: bookmarked ? 'var(--accent)' : 'var(--text-tertiary)',
                        padding: 2,
                      }}
                    >
                      {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sessions = [] } = useChatSessions();

  const session = sessions.find(s => s.id === sessionId);

  const { data: messages = [], isLoading } = useSessionChat(sessionId ?? '');
  const appendMessage = useAppendMessage(sessionId ?? '');

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTitleSet, setSessionTitleSet] = useState(!!session?.title);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If no sessionId, redirect
  useEffect(() => {
    if (!sessionId) navigate(DASHBOARD_ROUTES.CHATS, { replace: true });
  }, [sessionId, navigate]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    // Set session title from first user message
    if (!sessionTitleSet) {
      void supabase.from('chat_sessions').update({ title: text.slice(0, 80) }).eq('id', sessionId);
      setSessionTitleSet(true);
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Persist user message
      await appendMessage.mutateAsync(userMsg);

      // Call EMOS API
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-20) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Request failed');

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response ?? '',
        thinking: data.thinking,
        sources: data.sources,
      };

      // Persist assistant message
      await appendMessage.mutateAsync(assistantMsg);

      // Update session discussed concepts if sources present
      if (data.sources?.length > 0) {
        const newSlugs = data.sources
          .map((s: { concept_slug?: string }) => s.concept_slug)
          .filter(Boolean) as string[];
        if (newSlugs.length > 0) {
          const existing = session?.discussed_concepts ?? [];
          void supabase.from('chat_sessions').update({
            discussed_concepts: [...new Set([...existing, ...newSlugs])],
          }).eq('id', sessionId);
        }
      }

      // Update session updated_at
      void supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!sessionId) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader size={24} className="spin" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top bar */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Link
          to={DASHBOARD_ROUTES.CHATS}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.title ?? 'Chat session'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {session ? new Date(session.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>
            {session?.discussed_concepts && session.discussed_concepts.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={11} />
                {session.discussed_concepts.length} concepts
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        {messages.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 14,
            padding: '3rem 1rem',
          }}>
            No messages yet. Start the conversation below.
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageView key={(msg as { id?: string }).id ?? i} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
            <Loader size={16} className="spin" />
            EMOS is thinking…
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8,
            color: 'var(--red)',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem 1.5rem 1.5rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            maxWidth: 800,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Continue the conversation…"
            rows={2}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 15,
              color: 'var(--text-primary)',
              background: 'var(--bg)',
              fontFamily: 'var(--font-sans)',
              resize: 'none',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 10,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-2)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              color: input.trim() && !loading ? '#fff' : 'var(--text-tertiary)',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <Send size={18} />
          </button>
        </form>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, maxWidth: 800 }}>
          Press Enter to send · Shift+Enter for new line
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
