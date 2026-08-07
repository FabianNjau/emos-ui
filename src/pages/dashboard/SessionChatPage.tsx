/**
 * SessionChatPage — EMOS chat interface.
 * Route: /dashboard/chats/:sessionId
 * Spec: emoschatdirection.png — user right / AI left, 16px radii, mint bubbles
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSessionChat, useAppendMessage } from '../../hooks/useSessionChat';
import { useChatSessions } from '../../hooks/useChatSessions';
import { useAuth } from '../../hooks/useAuth';
import { DASHBOARD_ROUTES } from '../../constants/routes';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types/api';
import {
  ArrowLeft, Loader, Bookmark, BookmarkCheck, Send,
  Copy, Check, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  MessageSquare, Clock, Tag, Share2, MoreHorizontal,
  Lightbulb, BarChart2, Compass, BookOpen,
} from 'lucide-react';
import './SessionChatPage.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Suggestion chips data ──────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  { icon: <Lightbulb size={13} />, label: 'Give me an example' },
  { icon: <BarChart2 size={13} />, label: 'How does this compare?' },
  { icon: <Compass size={13} />, label: 'Add more frameworks' },
];

// ── Quick toolbar ──────────────────────────────────────────────────────────

const TOOLBAR_ITEMS = [
  { icon: <BookOpen size={14} />, label: 'Research' },
  { icon: <BarChart2 size={14} />, label: 'Summarize' },
  { icon: <Compass size={14} />, label: 'Explore' },
  { icon: <BookOpen size={14} />, label: 'Create' },
];

// ── MessageView ─────────────────────────────────────────────────────────────

interface MessageViewProps {
  msg: ChatMessage;
  onChip?: (text: string) => void;
}

function MessageView({ msg, onChip }: MessageViewProps) {
  const [showSources, setShowSources] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = msg.role === 'user';
  const bubbleClass = isUser ? 'chat-msg--user' : 'chat-msg--ai';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleBookmark = async () => {
    if (bookmarked) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !msg.sources?.length) return;
    const slug = msg.sources[0].concept_slug;
    const name = msg.sources[0].name;
    if (!slug) return;
    await supabase.from('bookmarks').upsert({
      user_id: user.id, concept_id: slug,
      concept_slug: slug, concept_name: name,
      domain: null, layer: null,
    }, { onConflict: 'user_id,concept_id' });
    setBookmarked(true);
  };

  return (
    <div className={`chat-msg ${bubbleClass}`}>

      {/* Avatar + sender + time */}
      <div className="chat-msg__header">
        <div className="chat-msg__avatar" aria-hidden="true">
          {isUser ? 'Y' : (
            <svg width="14" height="14" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 6 C13 6 7 11 7 16 C7 21 13 24 20 20 C27 16 33 19 33 24 C33 29 27 34 20 34" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 6 C27 6 33 11 33 16 C33 21 27 24 20 20 C13 16 7 19 7 24 C7 29 13 34 20 34" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <span className="chat-msg__sender">{isUser ? 'You' : 'EMOS AI'}</span>
        <span className="chat-msg__time">{timeLabel(msg.created_at ?? new Date().toISOString())}</span>
      </div>

      {/* Bubble */}
      <div className="chat-msg__bubble">
        <div className="chat-msg__content">
          {msg.content.split('\n').map((para, i, arr) => (
            <p key={i}>{para}{i < arr.length - 1 ? '' : ''}</p>
          ))}
        </div>

        {/* Sources toggle — AI only */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <>
            <button
              className="chat-msg__sources-toggle"
              onClick={() => setShowSources(v => !v)}
              aria-expanded={showSources}
            >
              <Tag size={11} aria-hidden="true" />
              Sources ({msg.sources.length})
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showSources && (
              <div className="chat-msg__sources">
                {msg.sources.map((s, i) => (
                  <div key={i} className="chat-msg__source-item">
                    <span className="chat-msg__source-name">{s.name}</span>
                    {s.finding && (
                      <span className="chat-msg__source-finding">— {s.finding}</span>
                    )}
                    {s.concept_slug && (
                      <>
                        <Link
                          to={`/concepts/${s.concept_slug}`}
                          className="chat-msg__source-link"
                        >
                          View →
                        </Link>
                        <button
                          className="chat-msg__action-btn"
                          onClick={handleBookmark}
                          title="Save concept"
                          style={{ opacity: bookmarked ? 1 : 0 }}
                          aria-label="Save concept"
                        >
                          {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Suggestion chips — AI only, last message */}
        {!isUser && onChip && (
          <div className="session-chat__chips" style={{ marginTop: '1rem' }}>
            {SUGGESTION_CHIPS.map((chip, i) => (
              <button
                key={i}
                className="session-chat__chip"
                onClick={() => onChip(chip.label)}
              >
                {chip.icon}
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions — AI only */}
      {!isUser && (
        <div className="chat-msg__footer">
          <button className="chat-msg__action-btn" onClick={handleCopy} title="Copy response" aria-label="Copy">
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button className="chat-msg__action-btn" title="Good response" aria-label="Like">
            <ThumbsUp size={13} />
          </button>
          <button className="chat-msg__action-btn" title="Poor response" aria-label="Dislike">
            <ThumbsDown size={13} />
          </button>
        </div>
      )}

      {/* Thinking toggle — AI only */}
      {!isUser && msg.thinking && (
        <>
          <button
            className="chat-msg__thinking-toggle"
            onClick={() => setShowThinking(v => !v)}
            aria-expanded={showThinking}
            style={{ marginLeft: 40 }}
          >
            {showThinking ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showThinking ? 'Hide reasoning' : 'Show reasoning'}
          </button>
          {showThinking && (
            <div className="chat-msg__thinking" role="region" aria-label="AI reasoning">
              {msg.thinking}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Loading indicator ─────────────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <div className="chat-msg chat-msg--ai chat-msg--loading">
      <div className="chat-msg__avatar" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
          <path d="M20 6 C13 6 7 11 7 16 C7 21 13 24 20 20 C27 16 33 19 33 24 C33 29 27 34 20 34" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20 6 C27 6 33 11 33 16 C33 21 27 24 20 20 C13 16 7 19 7 24 C7 29 13 34 20 34" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="chat-msg__bubble">
        <div className="loading-dots" aria-label="EMOS is thinking">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ── SessionChatPage ─────────────────────────────────────────────────────────

export default function SessionChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: sessions = [] } = useChatSessions();
  const session = sessions.find(s => s.id === sessionId);

  const { data: messages = [], isLoading } = useSessionChat(sessionId ?? '');
  const appendMessage = useAppendMessage();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTitleSet] = useState(!!session?.title);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate(DASHBOARD_ROUTES.CHATS, { replace: true });
  }, [sessionId, navigate]);

  const handleChip = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    // Set session title from first user message
    if (!sessionTitleSet) {
      void supabase.from('chat_sessions').update({ title: text.slice(0, 80) }).eq('id', sessionId);
    }

    const userMsg: ChatMessage = { role: 'user', content: text, created_at: new Date().toISOString() };
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Persist user message
      await appendMessage.mutateAsync({ sessionId, message: userMsg });

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
        created_at: new Date().toISOString(),
      };

      await appendMessage.mutateAsync({ sessionId, message: assistantMsg });

      // Update session discussed concepts
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

      void supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!sessionId) return null;

  if (isLoading) {
    return (
      <div className="session-chat">
        <div className="session-chat__topbar">
          <Link to={DASHBOARD_ROUTES.CHATS} className="session-chat__topbar-back">
            <ArrowLeft size={16} />
          </Link>
          <div className="session-chat__topbar-info">
            <div className="session-chat__topbar-title">Loading…</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader size={22} style={{ color: 'var(--emos-green-500)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  const isActive = (messages.filter(m => m.role === 'user').length ?? 0) > 0
    ? 'Active'
    : 'New';
  const messageCount = messages.filter(m => m.role === 'user').length ?? 0;

  return (
    <div className="session-chat">

      {/* Topbar */}
      <div className="session-chat__topbar">
        <Link to={DASHBOARD_ROUTES.CHATS} className="session-chat__topbar-back" aria-label="Back to sessions">
          <ArrowLeft size={16} />
        </Link>

        <div className="session-chat__topbar-info">
          <div className="session-chat__topbar-title">
            {session?.title ?? 'New conversation'}
          </div>
          <div className="session-chat__topbar-meta">
            <span className="session-chat__topbar-date">
              <Clock size={11} aria-hidden="true" />
              {session?.created_at ? dateLabel(session.created_at) : 'Just now'}
              {session?.created_at && session.updated_at !== session.created_at && (
                <> · {new Date(session.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</>
              )}
            </span>
            {messageCount > 0 && (
              <span className="session-chat__topbar-badge session-chat__topbar-badge--active">
                {isActive}
              </span>
            )}
          </div>
        </div>

        <div className="session-chat__topbar-actions">
          {messageCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--emos-text-muted)', fontFamily: 'var(--font-sans)' }}>
              {messageCount} message{messageCount !== 1 ? 's' : ''}
            </span>
          )}
          <button className="session-chat__topbar-icon-btn" aria-label="Share session">
            <Share2 size={16} strokeWidth={1.75} />
          </button>
          <button className="session-chat__topbar-icon-btn" aria-label="Session options">
            <MoreHorizontal size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="session-chat__messages" role="log" aria-live="polite" aria-label="Chat messages">

        {messages.length === 0 && !loading && (
          <div className="session-chat__empty">
            <div className="session-chat__empty-icon" aria-hidden="true">
              <MessageSquare size={28} strokeWidth={1.5} />
            </div>
            <p className="session-chat__empty-title">Start the conversation</p>
            <p className="session-chat__empty-body">
              Ask about any concept, topic, or idea. EMOS will search the knowledge base and provide sourced answers.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageView
            key={(msg as { id?: string }).id ?? i}
            msg={msg}
            onChip={i === messages.length - 1 && msg.role === 'assistant' ? handleChip : undefined}
          />
        ))}

        {loading && <LoadingIndicator />}

        {error && (
          <div className="chat-error" role="alert">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="session-chat__input-area">
        {/* Quick toolbar */}
        {messages.length === 0 && (
          <div className="session-chat__toolbar" role="toolbar" aria-label="Quick actions">
            {TOOLBAR_ITEMS.map((item, i) => (
              <button
                key={i}
                className="session-chat__toolbar-btn"
                onClick={() => { setInput(item.label); inputRef.current?.focus(); }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Input form */}
        <form className="session-chat__input-form" onSubmit={handleSend}>
          <div className="session-chat__textarea-wrap">
            <textarea
              ref={inputRef}
              className="session-chat__textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message EMOS…"
              rows={2}
              aria-label="Message input"
            />
          </div>
          <button
            type="submit"
            className="session-chat__send-btn"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </form>

        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.6875rem',
          color: 'var(--emos-text-muted)',
          marginTop: '0.5rem',
          paddingLeft: '0.25rem',
        }}>
          Press <kbd style={{ fontFamily: 'inherit' }}>Enter</kbd> to send · <kbd style={{ fontFamily: 'inherit' }}>Shift+Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
}
