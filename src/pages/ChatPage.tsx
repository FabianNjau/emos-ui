import { useState, useRef, useEffect } from 'react';
import { postChat, resetSession, type ChatMessage, type ChatResponse } from '../api/emos';
import { useContextStore } from '../store/useContextStore';
import { ClarificationPanel } from '../components/chat/ClarificationPanel';
import { Send, Bot, User, ChevronDown, ChevronUp, BookOpen, Loader, MessageSquare, PlusCircle, X, Brain } from 'lucide-react';
import { ResponseRenderer } from '../components/chat/ResponseRenderer';

function ThinkingBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n').filter(Boolean);

  if (!text) return null;

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 12, color: 'var(--accent-2)',
          fontFamily: 'var(--font-sans)', fontWeight: 600,
        }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        💭 Reasoning Steps ({lines.length})
      </button>
      {expanded && (
        <div style={{
          padding: '0 14px 12px',
          fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)',
          fontFamily: 'monospace', whiteSpace: 'pre-wrap',
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: 4 }}>
              {line.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Source {
  name: string;
  finding: string;
  url?: string;
}

interface EnrichedMessage extends ChatMessage {
  sources?: Source[];
  contextSnapshot?: Record<string, string>;
  scores?: {
    knowledge: number;
    reasoning: number;
    context_match: number;
    practical_utility: number;
    communication: number;
    overall: number;
    flags: string[];
    missing: string[];
  };
  priorityGuide?: {
    priority_concepts: { slug: string; reason: string; score: number }[];
    concepts_to_defer: { slug: string; reason: string }[];
    context_gaps: string[];
  };
  memory?: {
    facts: string[];
    discussed_concepts: string[];
    turn_count: number;
    session_id: string;
    user_id: string;
  };
}

function ContextBadge({ score }: { score: number }) {
  const label = score >= 4 ? 'Sufficient context' : score > 0 ? `${score}/6 context` : 'No context';
  const color = score >= 4 ? 'var(--accent)' : score > 0 ? '#8a6a20' : 'var(--text-tertiary)';
  const bg = score >= 4 ? 'rgba(12,123,138,0.08)' : score > 0 ? 'rgba(212,168,83,0.08)' : 'var(--surface-2)';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: color,
      background: bg, padding: '2px 8px', borderRadius: 999,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [sessionId] = useState(() => `emos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [userId] = useState(() => {
    // Try to restore from localStorage, or generate new
    const stored = localStorage.getItem('emos_user_id');
    if (stored) return stored;
    const id = `user-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('emos_user_id', id);
    return id;
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    budget, audience, productType, location, objective, stage,
    completenessScore, autoDetectFromQuestion, reset,
  } = useContextStore();

  // Auto-detect context from first user message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setShowContext(false);
  }, [messages]);

  const contextSnapshot = (): Record<string, string> | undefined => {
    const ctx: Record<string, string> = {};
    if (budget) ctx.budget = budget;
    if (audience) ctx.audience = audience;
    if (productType) ctx.productType = productType;
    if (location) ctx.location = location;
    if (objective) ctx.objective = objective;
    if (stage) ctx.stage = stage;
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    // Auto-detect context from question
    autoDetectFromQuestion(input.trim());

    const userMsg: EnrichedMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const contextSummary = contextSnapshot();
      const res: ChatResponse = await postChat(
        userMsg.content,
        messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        contextSummary || undefined,
        sessionId,
        userId,
      );
      const assistantMsg: EnrichedMessage = {
        role: 'assistant',
        content: res.response,
        thinking: res.thinking,
        sources: res.sources,
        contextSnapshot: contextSummary || undefined,
        scores: res.scores,
        priorityGuide: res.priority_guide,
        memory: res.memory,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = async () => {
    // Reset working memory on backend (keep persistent for cross-session recall)
    try { await resetSession(sessionId, false, userId); } catch { /* ignore */ }
    setMessages([]);
    reset();
    setShowContext(false);
  };

  const handleToggleContext = () => {
    setShowContext(v => !v);
  };

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - var(--topbar-height) - 4rem)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">AI Assistant</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.5rem' }}>
            Ask the Knowledge Base
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480 }}>
            EMOS reads your context before it answers. Add context below, then ask your question.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleContext}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${showContext ? 'var(--accent)' : isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: showContext ? 'var(--accent-soft)' : 'transparent',
              color: showContext ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🎯 Context {completenessScore > 0 && <span style={{ background: 'var(--accent)', color: 'white', borderRadius: 999, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{completenessScore}</span>}
          </button>
          <button
            onClick={handleNewChat}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <PlusCircle size={13} />
            New Chat
          </button>
        </div>
      </div>

      {/* Context panel — collapsible */}
      {showContext && (
        <div style={{ marginBottom: '1rem' }}>
          <ClarificationPanel />
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingRight: 8,
        marginBottom: '1rem',
      }}>
        {messages.length === 0 && !loading && (
          <div style={{
            textAlign: 'center', padding: '3rem 2rem',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', marginBottom: 8,
          }}>
            <Bot size={40} style={{ color: 'var(--accent)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              What are you trying to figure out?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 400, margin: '0 auto 1.5rem' }}>
              EMOS works best with context. Click <strong>Context</strong> above to add your situation, then ask your question.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380, margin: '0 auto' }}>
              {[
                'How can I get more customers for my restaurant?',
                'What\'s the best marketing strategy for a low-budget Kenyan startup?',
                'Should I focus on SEO or social media for my e-commerce brand?',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    autoDetectFromQuestion(s);
                    setInput(s);
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 10,
                    background: 'var(--accent-soft)', border: '1px solid var(--border)',
                    fontSize: 13, cursor: 'pointer', color: 'var(--accent)',
                    transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--accent-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {msg.role === 'user'
                ? <User size={16} color="white" />
                : <Bot size={16} color="white" />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Context indicator on first assistant message */}
              {msg.role === 'assistant' && msg.contextSnapshot && i === messages.findIndex(m => m.role === 'assistant') && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  fontSize: 11, color: 'var(--text-tertiary)', flexWrap: 'wrap',
                }}>
                  <ContextBadge score={completenessScore} />
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span style={{ fontStyle: 'italic' }}>
                    {Object.entries(msg.contextSnapshot).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                  </span>
                </div>
              )}

              {/* Thinking steps */}
              {msg.role === 'assistant' && msg.thinking && (
                <ThinkingBlock text={msg.thinking} />
              )}

              {/* Response — structured renderer */}
              <div style={{
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? 'var(--radius-md) var(--radius-md) 0 var(--radius-md)' : 'var(--radius-md) var(--radius-md) var(--radius-md) 0',
                padding: '0.875rem 1.125rem',
                fontSize: 14, lineHeight: 1.7,
                boxShadow: 'var(--shadow-sm)',
              }}>
                {msg.role === 'assistant'
                  ? <ResponseRenderer content={msg.content} />
                  : msg.content.split('\n').map((line, j) => (
                      <p key={j} style={{ margin: line ? '0 0 0.5em' : '0.25em 0' }}>{line || '\u00A0'}</p>
                    ))
                }
              </div>

              {/* Server-side quality scores */}
              {msg.role === 'assistant' && msg.scores && msg.scores.overall > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                  }}>
                    📊 Quality Audit
                  </div>
                  <div style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12,
                  }}>
                    {[['knowledge', 'Knowledge'], ['reasoning', 'Reasoning'], ['context_match', 'Context'], ['practical_utility', 'Utility'], ['communication', 'Communication']].map(([key, label]) => {
                      const val = (msg.scores![key as keyof typeof msg.scores] as number) || 0;
                      const color = val >= 75 ? '#27ae60' : val >= 60 ? '#e67e22' : '#c0392b';
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ width: 80, fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                          <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 999 }}>
                            <div style={{ width: `${Math.min(100, val)}%`, height: '100%', background: color, borderRadius: 999 }} />
                          </div>
                          <span style={{ width: 28, fontSize: 11, fontWeight: 700, color, textAlign: 'right' }}>{val}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>Overall</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: msg.scores.overall >= 75 ? '#27ae60' : msg.scores.overall >= 60 ? '#e67e22' : '#c0392b' }}>
                        {msg.scores.overall}/100
                      </span>
                    </div>
                    {msg.scores.flags && msg.scores.flags.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#e67e22' }}>
                        {msg.scores.flags.map((f, i) => (
                          <div key={i}>⚠️ {f}</div>
                        ))}
                      </div>
                    )}
                    {msg.priorityGuide && msg.priorityGuide.context_gaps && msg.priorityGuide.context_gaps.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Context gaps: {msg.priorityGuide.context_gaps.join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Memory indicator */}
              {msg.role === 'assistant' && msg.memory && msg.memory.facts && msg.memory.facts.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <details style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 12,
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--accent-2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <Brain size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Memory ({msg.memory.facts.length} facts, {msg.memory.discussed_concepts?.length || 0} concepts)
                    </summary>
                    <div style={{ marginTop: 8, paddingLeft: 4 }}>
                      {msg.memory.facts.map((f, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                          • {f}
                        </div>
                      ))}
                      {msg.memory.discussed_concepts && msg.memory.discussed_concepts.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Discussed: {msg.memory.discussed_concepts.join(', ')}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                  }}>
                    <BookOpen size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Evidence
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {msg.sources.map((s, j) => (
                      <div key={j} style={{
                        fontSize: 12, color: 'var(--text-secondary)',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-2)' }}>{s.name}</span>
                        <span style={{ marginLeft: 8 }}>{s.finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '14px 18px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                <Loader size={14} className="spin" />
                Analysing context and traversing knowledge graph...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--red-soft)', border: '1px solid var(--red)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            color: 'var(--red)', fontSize: 14,
          }}>
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a marketing question — the more specific, the better..."
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'var(--font-sans)',
              resize: 'none', lineHeight: 1.5,
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ flexShrink: 0, padding: '0.625rem 1rem' }}
          >
            <Send size={15} />
          </button>
        </div>
        {completenessScore > 0 && (
          <div style={{
            textAlign: 'right', marginTop: 5, fontSize: 11, color: 'var(--text-tertiary)',
          }}>
            Using {completenessScore}/6 context dimensions
          </div>
        )}
      </form>

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

function isDark() {
  return document.documentElement.classList.contains('dark');
}
