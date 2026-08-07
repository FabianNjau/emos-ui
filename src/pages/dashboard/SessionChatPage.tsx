/**
 * SessionChatPage — EMOS comprehensive chat interface.
 * Route: /dashboard/chats/:sessionId
 * Spec: emoschatdirection.png (91 sections)
 *
 * Philosophy: The user message is a message.
 *             The EMOS response is a knowledge artifact.
 *             That distinction drives the entire design.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSessionChat, useAppendMessage } from '../../hooks/useSessionChat';
import { useChatSessions } from '../../hooks/useChatSessions';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types/api';
import { MessageContent } from '../../components/chat/MessageContent';
import {
  ArrowLeft, Loader, Bookmark, BookmarkCheck, Copy, Check,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  Share2, X, Edit3, Trash2,
  Send, Tag, BookOpen, BarChart2, Compass,
  Lightbulb, AlertCircle, Plus,
} from 'lucide-react';
import './SessionChatPage.css';

/* ── Constants ──────────────────────────────────────────────────────────── */

const DASHBOARD_CHATS = '/dashboard/chats';
const MAX_MSG_LEN = 4000;

const SUGGESTION_CHIPS = [
  { icon: <Lightbulb size={13} />, label: 'Give me an example' },
  { icon: <BarChart2 size={13} />, label: 'How does this compare?' },
  { icon: <Compass size={13} />, label: 'Add more frameworks' },
];

const TOOLBAR_ITEMS = [
  { icon: <BookOpen size={14} />, label: 'Research' },
  { icon: <BarChart2 size={14} />, label: 'Summarize' },
  { icon: <Compass size={14} />, label: 'Explore' },
  { icon: <Edit3 size={14} />, label: 'Create' },
];

const EMPTY_SUGGESTIONS = [
  'Analyze a business idea',
  'Help me research a topic',
  'Explain something difficult',
  'Develop a strategy',
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSessionMeta(iso: string): string {
  return `Started ${formatDate(iso)}`;
}

function countUserMessages(messages: ChatMessage[]): number {
  return messages.filter(m => m.role === 'user').length;
}

/** Extract plain text from AI response for follow-up chip generation */
function extractSuggestionsFromContent(_content: string): string[] {
  // Future: LLM-powered suggestion generation based on content
  // For now, return static contextual suggestions
  return [];
}

/* ── Toast system ───────────────────────────────────────────────────────── */

interface Toast {
  id: string;
  message: string;
  type: 'default' | 'success' | 'error';
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">
            {t.type === 'success' ? <Check size={15} /> :
             t.type === 'error' ? <AlertCircle size={15} /> : null}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Save modal ──────────────────────────────────────────────────────────── */

interface SaveInsightModalProps {
  content: string;
  sources: ChatMessage['sources'];
  onClose: () => void;
  onSave: (title: string, profile: string) => Promise<void>;
  saving: boolean;
}

function SaveInsightModal({ content, sources, onClose, onSave, saving }: SaveInsightModalProps) {
  const [title, setTitle] = useState('');
  const [profile, setProfile] = useState('General');

  const PROFILES = ['General', 'Product Strategy', 'Marketing', 'Research', 'Development', 'Personal'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSave(title.trim(), profile);
  };

  return (
    <div className="save-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="save-modal" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
        <h2 className="save-modal__title" id="save-modal-title">Save insight</h2>

        <form onSubmit={handleSubmit}>
          <div className="save-modal__field">
            <label className="save-modal__label" htmlFor="insight-title">Title</label>
            <input
              id="insight-title"
              className="save-modal__input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. JTBD for SaaS positioning"
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="save-modal__field">
            <label className="save-modal__label" htmlFor="insight-profile">Add to profile</label>
            <select
              id="insight-profile"
              className="save-modal__select"
              value={profile}
              onChange={e => setProfile(e.target.value)}
            >
              {PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{
            background: 'var(--emos-bg-subtle)',
            border: '1px solid var(--emos-border)',
            borderRadius: '10px',
            padding: '0.75rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8125rem',
            color: 'var(--emos-text-secondary)',
            lineHeight: 1.55,
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
            {content.slice(0, 300)}{content.length > 300 ? '…' : ''}
          </div>

          <div className="save-modal__actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!title.trim() || saving}>
              {saving ? 'Saving…' : 'Save insight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tool execution indicator (spec section 62) ─────────────────────────── */

interface ToolStep {
  label: string;
  done: boolean;
}

function ToolActivity({ steps }: { steps: ToolStep[] }) {
  return (
    <div className="chat-msg__tool-activity" aria-label="Research in progress">
      {steps.map((step, i) => (
        <div key={i} className="chat-msg__tool-step">
          <span className="chat-msg__tool-step-icon">
            {step.done
              ? <Check size={13} strokeWidth={2.5} />
              : <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          </span>
          {step.label}
        </div>
      ))}
    </div>
  );
}

/* ── AI Avatar ──────────────────────────────────────────────────────────── */

function EMOSAvatar({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      <img
        src="/assets/emos-logo-square.png"
        alt="EMOS"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => {
          // Fallback gradient if logo not loaded
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement!.style.background =
            'linear-gradient(135deg, var(--emos-green-500), var(--emos-purple-500))';
        }}
      />
    </div>
  );
}

function UserAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--emos-green-800)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      Y
    </div>
  );
}

/* ── MessageView ────────────────────────────────────────────────────────── */

interface MessageViewProps {
  msg: ChatMessage & { id?: string; created_at?: string };
  onChip?: (text: string) => void;
  onEdit?: (id: string, content: string) => void;
  onSave?: (msg: ChatMessage) => void;
  onDelete?: (id: string) => void;
  isSaved?: boolean;
}

function MessageView({ msg, onChip, onEdit, onSave, onDelete, isSaved }: MessageViewProps) {
  const [showSources, setShowSources] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [bookmarked, setBookmarked] = useState(isSaved ?? false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [likeState, setLikeState] = useState<'none' | 'up' | 'down'>('none');

  const isUser = msg.role === 'user';
  const msgId = (msg as { id?: string }).id ?? '';
  const time = msg.created_at ? formatTime(msg.created_at) : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBookmark = async () => {
    if (bookmarked || !onSave) return;
    onSave(msg);
    setBookmarked(true);
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== msg.content) {
      onEdit?.(msgId, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--ai'}${editing ? ' chat-msg--editing' : ''}`}>

      {/* Header: avatar + sender + time */}
      <div className="chat-msg__header">
        {isUser ? <UserAvatar size={32} /> : <EMOSAvatar size={32} />}
        <span className="chat-msg__sender">{isUser ? 'You' : 'EMOS AI'}</span>
        <span className="chat-msg__time">{time}</span>
      </div>

      {/* Bubble */}
      <div className="chat-msg__bubble">

        {/* Edit mode — spec section 66 */}
        {editing ? (
          <div className="chat-msg__edit-form">
            <textarea
              className="chat-msg__edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
              rows={4}
            />
            <div className="chat-msg__edit-actions">
              <button className="chat-msg__edit-cancel" onClick={() => { setEditing(false); setEditText(msg.content); }}>
                Cancel
              </button>
              <button className="chat-msg__edit-resend" onClick={handleEditSubmit}>
                Resend
              </button>
            </div>
          </div>
        ) : (
          isUser ? (
            <div className="chat-msg__content">{msg.content}</div>
          ) : (
            <MessageContent content={msg.content} />
          )
        )}

        {/* Status — spec section 22 */}
        {isUser && (
          <div className="chat-msg__status">
            <span className="chat-msg__status-text">Sent</span>
            <Check size={12} strokeWidth={2.5} style={{ color: 'var(--emos-green-500)' }} />
          </div>
        )}

        {/* Sources toggle — spec sections 38-39 */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <>
            <button
              className="chat-msg__sources-toggle"
              onClick={() => setShowSources(v => !v)}
              aria-expanded={showSources}
            >
              <Tag size={11} />
              Sources ({msg.sources.length})
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showSources && (
              <div className="chat-msg__sources" role="list" aria-label="Sources">
                <div className="chat-msg__sources-heading">Sources</div>
                {msg.sources.map((s, i) => (
                  <div key={i} className="chat-msg__source-item" role="listitem">
                    <div className="chat-msg__source-icon">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-msg__source-info">
                      <div className="chat-msg__source-name">{s.name}</div>
                      {s.finding && (
                        <div className="chat-msg__source-finding">{s.finding}</div>
                      )}
                    </div>
                    {s.concept_slug && (
                      <Link
                        to={`/concepts/${s.concept_slug}`}
                        className="chat-msg__source-link"
                        style={{ marginLeft: 'auto', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        View →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Suggestion chips — spec sections 47-48 */}
        {!isUser && onChip && (
          <div className="session-chat__chips">
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

      {/* Footer actions — spec sections 41-45 */}
      <div className="chat-msg__footer">
        {isUser ? (
          /* User: edit + delete */
          <>
            <button
              className="chat-msg__action-btn"
              onClick={() => setEditing(true)}
              title="Edit message"
              aria-label="Edit"
            >
              <Edit3 size={14} />
            </button>
            <button
              className="chat-msg__action-btn chat-msg__action-btn--danger"
              onClick={() => onDelete?.(msgId)}
              title="Delete message"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          /* AI: Copy, Like, Dislike, Save, Share */
          <>
            <button
              className={`chat-msg__action-btn${copied ? ' chat-msg__action-btn--active' : ''}`}
              onClick={handleCopy}
              title="Copy response"
              aria-label="Copy"
            >
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
            </button>
            <button
              className={`chat-msg__action-btn${likeState === 'up' ? ' chat-msg__action-btn--active' : ''}`}
              onClick={() => setLikeState(l => l === 'up' ? 'none' : 'up')}
              title="Good response"
              aria-label="Like"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              className={`chat-msg__action-btn${likeState === 'down' ? ' chat-msg__action-btn--active' : ''}`}
              onClick={() => setLikeState(l => l === 'down' ? 'none' : 'down')}
              title="Poor response"
              aria-label="Dislike"
            >
              <ThumbsDown size={14} />
            </button>
            <div className="chat-msg__action-sep" />
            <button
              className={`chat-msg__action-btn${bookmarked ? ' chat-msg__action-btn--active' : ''}`}
              onClick={handleBookmark}
              title="Save insight"
              aria-label="Save"
            >
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
            <button className="chat-msg__action-btn" title="Share" aria-label="Share">
              <Share2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Thinking/reasoning toggle — spec section 61 */}
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
            <div className="chat-msg__thinking" role="region" aria-label="EMOS reasoning">
              {msg.thinking}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Loading indicator — spec section 59-60 ─────────────────────────── */

function LoadingIndicator() {
  return (
    <div className="chat-msg chat-msg--ai chat-msg--loading">
      <EMOSAvatar size={32} />
      <div className="chat-msg__bubble">
        <span className="chat-msg__thinking-label">EMOS is thinking</span>
        <div className="loading-dots" aria-label="Thinking" style={{ marginTop: '0.5rem' }}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

/* ── Empty state — spec section 63 ──────────────────────────────────── */

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="session-chat__empty">
      <div className="session-chat__empty-logo">
        <img src="/assets/emos-logo-square.png" alt="EMOS" />
      </div>
      <h2 className="session-chat__empty-title">What would you like to explore?</h2>
      <p className="session-chat__empty-body">
        Ask a question, develop an idea, analyze information, or build knowledge.
      </p>
      <button
        className="session-chat__empty-prompt"
        onClick={() => onSuggestion('')}
      >
        <Plus size={15} />
        Start with an idea…
      </button>
      <div className="session-chat__empty-suggestions">
        {EMPTY_SUGGESTIONS.map((s, i) => (
          <button key={i} className="session-chat__chip" onClick={() => onSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Error state — spec section 64 ───────────────────────────────────── */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="chat-error" role="alert">
      <AlertCircle size={16} className="chat-error__icon" />
      <span className="chat-error__msg">{message}</span>
      <button className="chat-error__retry" onClick={onRetry}>Try again</button>
    </div>
  );
}

/* ── SessionChatPage ─────────────────────────────────────────────────────── */

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
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [saveTarget, setSaveTarget] = useState<ChatMessage | null>(null);
  const [saving, setSaving] = useState(false);

  const { toasts, addToast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const userMsgCount = countUserMessages(messages);

  // Auto-scroll
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate(DASHBOARD_CHATS, { replace: true });
  }, [sessionId, navigate]);

  const handleChip = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const handleSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleSaveInsight = async (title: string, profile: string) => {
    if (!saveTarget) return;
    setSaving(true);
    try {
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
      const { error: err } = await supabase.from('bookmarks').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        concept_id: slug,
        concept_slug: slug,
        concept_name: title,
        domain: profile !== 'General' ? profile : null,
        layer: null,
      }, { onConflict: 'user_id,concept_id' });
      if (err) throw err;
      addToast('Insight saved', 'success');
    } catch {
      addToast('Failed to save insight', 'error');
    } finally {
      setSaving(false);
      setSaveTarget(null);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!msgId || !sessionId) return;
    const { error: err } = await supabase.from('chat_messages').delete().eq('id', msgId);
    if (err) {
      addToast('Failed to delete message', 'error');
    } else {
      addToast('Message deleted', 'default');
    }
  };

  const handleSend = async (e?: React.FormEvent, initialInput?: string) => {
    e?.preventDefault();
    const text = (initialInput ?? input).trim();
    if (!text || loading || !sessionId) return;

    setInput('');
    setLoading(true);
    setError(null);
    setToolSteps([{ label: 'Analyzing your question', done: false }]);

    try {
      // Show tool activity
      setToolSteps([{ label: 'Analyzing your question', done: true }, { label: 'Reviewing relevant sources', done: false }]);

      // Persist user message
      const userMsg: ChatMessage = { role: 'user', content: text };
      await appendMessage.mutateAsync({ sessionId, message: userMsg });

      setToolSteps([
        { label: 'Analyzing your question', done: true },
        { label: 'Reviewing relevant sources', done: true },
        { label: 'Preparing response', done: false },
      ]);

      // Call EMOS API
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-20) }),
      });

      setToolSteps([{ label: 'Preparing response', done: true }]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Request failed');

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response ?? '',
        thinking: data.thinking,
        sources: data.sources,
      };

      await appendMessage.mutateAsync({ sessionId, message: assistantMsg });

      // Update session concepts
      if (data.sources?.length > 0) {
        const slugs = data.sources.map((s: { concept_slug?: string }) => s.concept_slug).filter(Boolean) as string[];
        if (slugs.length > 0) {
          const existing = (session as { discussed_concepts?: string[] })?.discussed_concepts ?? [];
          void supabase.from('chat_sessions').update({
            discussed_concepts: [...new Set([...existing, ...slugs])],
          }).eq('id', sessionId);
        }
      }

      void supabase.from('chat_sessions').update({
        updated_at: new Date().toISOString(),
        title: !session?.title ? text.slice(0, 80) : undefined,
      }).eq('id', sessionId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      addToast('Failed to get response', 'error');
    } finally {
      setLoading(false);
      setToolSteps([]);
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader size={22} style={{ color: 'var(--emos-green-500)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="session-chat">

      {/* Session context header — sits inside the scrolling viewport, not competing with DashboardShell TopBar */}
      <div className="session-chat__context">
        <Link to={DASHBOARD_CHATS} className="session-chat__back" aria-label="Back to sessions">
          <ArrowLeft size={15} />
        </Link>
        <div className="session-chat__context-info">
          <span className="session-chat__context-title">{session?.title ?? 'New chat'}</span>
          <span className="session-chat__context-meta">
            {session?.created_at ? formatSessionMeta(session.created_at) : ''}
            {userMsgCount > 0 ? ` · ${userMsgCount} message${userMsgCount !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </div>

      {/* Conversation viewport */}
      <div className="session-chat__viewport" ref={viewportRef} role="log" aria-live="polite" aria-label="Conversation">

        <div className="session-chat__conversation">

          {messages.length === 0 && !loading && (
            <EmptyState onSuggestion={handleSuggestion} />
          )}

          {messages.map((msg, i) => (
            <MessageView
              key={(msg as { id?: string }).id ?? i}
              msg={msg}
              onChip={i === messages.length - 1 && msg.role === 'assistant' ? handleChip : undefined}
              onEdit={async (id, content) => {
                // Edit: update message + branch (future: conversation branching)
                void id; void content;
                addToast('Message editing — conversation branching coming soon', 'default');
              }}
              onSave={(m) => setSaveTarget(m)}
              onDelete={handleDeleteMessage}
            />
          ))}

          {loading && <LoadingIndicator />}

          {error && (
            <ErrorState message={error} onRetry={() => { setError(null); void handleSend(); }} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer — spec sections 49-58 */}
      <div className="session-chat__input-area">
        <div className="session-chat__composer">

          {/* Toolbar — spec section 54 */}
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

          {/* Input form — spec section 50-53 */}
          <form
            className="session-chat__input-form"
            onSubmit={handleSend}
            aria-label="Message composer"
          >
            <div className="session-chat__textarea-wrap">
              <textarea
                ref={inputRef}
                className="session-chat__textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message EMOS…"
                rows={2}
                maxLength={MAX_MSG_LEN}
                aria-label="Message input"
                aria-multiline="true"
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

          <div className="session-chat__input-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>

      {/* Save modal */}
      {saveTarget && (
        <SaveInsightModal
          content={saveTarget.content}
          sources={saveTarget.sources}
          onClose={() => setSaveTarget(null)}
          onSave={handleSaveInsight}
          saving={saving}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
