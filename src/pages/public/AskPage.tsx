/**
 * AskPage — public chat page. Creates/resumes a session, persists to Supabase.
 * Context profile from sessionStorage ('emos_context_profile') is read on mount
 * and sent with the first message to seed the EMOS engine.
 *
 * Server response shape (ChatResponse) is identical to admin chat:
 *   response, thinking, sources (with concept_slug), scores, priority_guide,
 *   memory, diagnosis, concepts, evidence — all from the same /api/chat endpoint.
 * AskPage displays the structured response via ResponseRenderer + quality bar.
 * Admin chat (ChatPage.tsx) uses the same ResponseRenderer with additional
 * memory/evidence panels. Both consume the same server shape.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppendMessage } from '../../hooks/useSessionChat';
import { ResponseRenderer } from '../../components/chat/ResponseRenderer';
import type { ChatMessage, ContextProfile } from '../../types/api';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../constants/routes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './AskPage.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatSource {
  concept_slug?: string;
  name: string;
  finding: string;
  url?: string;
}

interface QualityScores {
  knowledge: number;
  reasoning: number;
  context_match: number;
  practical_utility: number;
  communication: number;
  overall: number;
  flags: string[];
  missing: string[];
}

interface EnrichedMessage extends ChatMessage {
  thinking?: string;
  sources?: ChatSource[];
  scores?: QualityScores;
  priority_guide?: {
    priority_concepts: { slug: string; reason: string; score: number }[];
    concepts_to_defer: { slug: string; reason: string }[];
    context_gaps: string[];
    stage: string;
    layer_priority: string[];
  };
}

// ── Thinking Block ─────────────────────────────────────────────────────────────

function ThinkingBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n').filter(Boolean);

  if (!text) return null;

  return (
    <div className="ask-thinking-block">
      <button
        className="ask-thinking-toggle"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        💭 Reasoning Steps ({lines.length})
      </button>
      {expanded && (
        <div className="ask-thinking-body">
          {lines.map((line, i) => (
            <div key={i} className="ask-thinking-line">{line.trim()}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quality Bar ────────────────────────────────────────────────────────────────

function QualityBar({ scores }: { scores: QualityScores }) {
  const color = (v: number) =>
    v >= 75 ? '#27ae60' : v >= 60 ? '#e67e22' : '#c0392b';

  const rows: [keyof QualityScores, string][] = [
    ['knowledge', 'Knowledge'],
    ['reasoning', 'Reasoning'],
    ['context_match', 'Context'],
    ['practical_utility', 'Utility'],
    ['communication', 'Communication'],
  ];

  return (
    <div className="ask-quality">
      <div className="ask-quality__header">📊 Quality Audit</div>
      <div className="ask-quality__bars">
        {rows.map(([key, label]) => {
          const val = scores[key] as number;
          return (
            <div key={key} className="ask-quality__row">
              <span className="ask-quality__label">{label}</span>
              <div className="ask-quality__track">
                <div
                  className="ask-quality__fill"
                  style={{ width: `${Math.min(100, val)}%`, background: color(val) }}
                />
              </div>
              <span className="ask-quality__val" style={{ color: color(val) }}>{val}</span>
            </div>
          );
        })}
      </div>
      <div className="ask-quality__overall">
        <span>Overall</span>
        <span style={{ color: color(scores.overall), fontWeight: 800 }}>
          {scores.overall}/100
        </span>
      </div>
      {scores.flags && scores.flags.length > 0 && (
        <div className="ask-quality__flags">
          {scores.flags.map((f, i) => <span key={i}>⚠️ {f}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Source Badge ────────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: ChatSource }) {
  return (
    <div className="ask-source-badge">
      <span className="ask-source-badge__slug">
        {source.concept_slug ?? source.name}
      </span>
      <span className="ask-source-badge__finding">{source.finding}</span>
    </div>
  );
}

// ── AskPage ────────────────────────────────────────────────────────────────────

export default function AskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contextProfile, setContextProfile] = useState<ContextProfile | null>(null);
  const [sessionTitleSet, setSessionTitleSet] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appendMessage = useAppendMessage();

  // Read context profile from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('emos_context_profile');
    if (stored) {
      try {
        setContextProfile(JSON.parse(stored) as ContextProfile);
      } catch {
        // ignore malformed JSON
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create or resume session in Supabase
  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;

    const { data, error: err } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user?.id ?? null,
        context_snapshot: contextProfile
          ? {
              budget: contextProfile.budget,
              audience: contextProfile.audience,
              product_type: contextProfile.product_type,
              location: contextProfile.location,
              objective: contextProfile.objective,
              stage: contextProfile.stage,
              profile_name: contextProfile.name,
            }
          : null,
      })
      .select('id')
      .single();

    if (err || !data) throw new Error(err?.message ?? 'Could not create session');
    setSessionId(data.id);
    return data.id;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: EnrichedMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    // Set session title from first message
    const title = sessionTitleSet ? undefined : text.slice(0, 80);
    if (!sessionTitleSet) setSessionTitleSet(true);

    try {
      let sid = sessionId;
      if (!sid) {
        sid = await ensureSession();
        await appendMessage.mutateAsync({ sessionId: sid, message: userMsg });
      } else {
        await appendMessage.mutateAsync({ sessionId: sid, message: userMsg });
      }

      // Update session title if first message
      if (title) {
        void supabase.from('chat_sessions').update({ title }).eq('id', sid);
      }

      // Build context payload
      const contextPayload = contextProfile
        ? {
            budget: contextProfile.budget,
            audience: contextProfile.audience,
            product_type: contextProfile.product_type,
            location: contextProfile.location,
            objective: contextProfile.objective,
            stage: contextProfile.stage,
          }
        : undefined;

      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-20),
          context: contextPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Request failed');

      // Full ChatResponse from server — same shape as admin chat
      const assistantMsg: EnrichedMessage = {
        role: 'assistant',
        content: data.response ?? '',
        thinking: data.thinking ?? '',
        sources: data.sources ?? [],
        scores: data.scores ?? undefined,
        priority_guide: data.priority_guide ?? undefined,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Persist assistant message to Supabase
      if (sid) {
        await appendMessage.mutateAsync({ sessionId: sid, message: assistantMsg });

        // Track discussed concepts from sources
        if (data.sources?.length > 0) {
          const slugs = data.sources
            .map((s: ChatSource) => s.concept_slug)
            .filter(Boolean) as string[];
          if (slugs.length > 0) {
            void supabase.from('chat_sessions').update({
              discussed_concepts: slugs,
            }).eq('id', sid);
          }
        }

        void supabase.from('chat_sessions').update({
          updated_at: new Date().toISOString(),
        }).eq('id', sid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    if (sessionId) {
      void supabase.from('chat_sessions').update({
        title: messages[0]?.content?.slice(0, 80) ?? null,
      }).eq('id', sessionId);
    }
    setSessionId(null);
    setMessages([]);
    setSessionTitleSet(false);
    sessionStorage.removeItem('emos_context_profile');
    setContextProfile(null);
  };

  return (
    <div className="ask-page">
      <div className="ask-page__inner">
        <div className="ask-page__header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 className="ask-page__title">Ask EMOS</h1>
              {contextProfile && (
                <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
                  Using context: <strong>{contextProfile.name}</strong>
                </p>
              )}
            </div>
            {user && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {sessionId && (
                  <button
                    onClick={handleNewChat}
                    style={{
                      padding: '0.4rem 0.875rem',
                      borderRadius: 7,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    New chat
                  </button>
                )}
                <button
                  onClick={() => navigate(DASHBOARD_ROUTES.CHATS)}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: 7,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  My sessions
                </button>
              </div>
            )}
          </div>
          <p className="ask-page__sub">
            Ask any marketing question. Get answers grounded in academic research and real evidence.
          </p>
        </div>

        {/* Chat */}
        <div className="ask-page__chat">
          {messages.length === 0 && !loading && (
            <div className="ask-page__empty-state">
              {contextProfile ? (
                <p>Context loaded from <strong>{contextProfile.name}</strong>. Ask your question to get started.</p>
              ) : (
                <p>Type a marketing question below to get started.</p>
              )}
              <p className="ask-page__example-hint">
                Examples:{' '}
                <button onClick={() => setInput('How does decoy pricing affect purchase decisions?')}>
                  decoy pricing
                </button>
                {", "}
                <button onClick={() => setInput('What is the best framework for positioning a new SaaS product?')}>
                  SaaS positioning
                </button>
              </p>
              {user && (
                <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Want to save context?{' '}
                  <button
                    onClick={() => navigate(DASHBOARD_ROUTES.PROFILES)}
                    style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}
                  >
                    Create a context profile →
                  </button>
                </p>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
              <div className="chat-msg__role">{msg.role === 'user' ? 'You' : 'EMOS'}</div>
              <div className="chat-msg__content">
                {/* Thinking block — collapsed by default */}
                {msg.role === 'assistant' && msg.thinking && (
                  <ThinkingBlock text={msg.thinking} />
                )}

                {/* Structured response — same ResponseRenderer as admin chat */}
                {msg.role === 'assistant'
                  ? <ResponseRenderer content={msg.content} />
                  : msg.content.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))
                }

                {/* Quality audit bar */}
                {msg.role === 'assistant' && msg.scores && msg.scores.overall > 0 && (
                  <QualityBar scores={msg.scores} />
                )}

                {/* Sources with concept_slug */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="ask-sources">
                    <div className="ask-sources__label">
                      📚 Evidence ({msg.sources.length})
                    </div>
                    {msg.sources.map((s, k) => (
                      <SourceBadge key={k} source={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-msg__role">EMOS</div>
              <div className="chat-msg__content">
                <p className="chat-msg__typing">Thinking…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-msg chat-msg--error">
              <p>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="ask-page__form" onSubmit={sendMessage}>
          <textarea
            className="ask-page__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask: How does social proof influence pricing?"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(e);
              }
            }}
          />
          <button
            className="ask-page__submit"
            type="submit"
            disabled={!input.trim() || loading}
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
}
