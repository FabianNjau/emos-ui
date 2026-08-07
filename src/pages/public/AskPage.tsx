import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ChatMessage } from '../../types/api';
import './AskPage.css';

export default function AskPage() {
  const [searchParams] = useSearchParams();
  const initialContext = searchParams.get('context') ?? '';
  const [input, setInput] = useState(initialContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
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
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-page">
      <div className="ask-page__inner">
        <div className="ask-page__header">
          <h1 className="ask-page__title">Ask EMOS</h1>
          <p className="ask-page__sub">
            Ask any marketing question. Get answers grounded in academic research and real evidence.
          </p>
        </div>

        {/* Chat */}
        <div className="ask-page__chat">
          {messages.length === 0 && !loading && (
            <div className="ask-page__empty-state">
              <p>Type a marketing question below to get started.</p>
              <p className="ask-page__example-hint">
                Examples:{" "}
                <button onClick={() => setInput('How does decoy pricing affect purchase decisions?')}>
                  decoy pricing
                </button>
                {", "}
                <button onClick={() => setInput('What is the best framework for positioning a new SaaS product?')}>
                  SaaS positioning
                </button>
              </p>
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
