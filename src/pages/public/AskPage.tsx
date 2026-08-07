/**
 * AskPage — public chat page. Creates/resumes a session, persists to Supabase.
 * Context profile from sessionStorage ('emos_context_profile') is read on mount
 * and sent with the first message to seed the EMOS engine.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppendMessage } from '../../hooks/useSessionChat';
import type { ChatMessage, ContextProfile } from '../../types/api';
import { PUBLIC_ROUTES, DASHBOARD_ROUTES } from '../../constants/routes';
import './AskPage.css';

export default function AskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    const userMsg: ChatMessage = { role: 'user', content: text };
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/chat`, {
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

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response ?? '',
        thinking: data.thinking,
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Persist assistant message
      if (sid) {
        await appendMessage.mutateAsync({ sessionId: sid, message: assistantMsg });

        // Track discussed concepts from sources
        if (data.sources?.length > 0) {
          const slugs = data.sources
            .map((s: { concept_slug?: string }) => s.concept_slug)
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
    // Clear session so next message creates a fresh session
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
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="chat-msg__sources">
                    <p className="chat-msg__sources-label">Sources:</p>
                    {msg.sources.map((s, k) => (
                      <p key={k} className="chat-msg__source-item">
                        <strong>{s.name}:</strong> {s.finding}
                      </p>
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
