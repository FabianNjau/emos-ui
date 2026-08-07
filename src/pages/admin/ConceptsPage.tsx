import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConcepts } from '../../api/emos';
import type { ConceptSummary } from '../../api/emos';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

const LAYER_COLORS: Record<string, string> = {
  L1: '#3B82F6', L2: '#8B5CF6', L3: '#10B981', L4: '#D97706',
};

export default function ConceptsPage() {
  const [page, setPage] = useState(0);
  const [domainFilter, setDomainFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const PAGE_SIZE = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['concepts', page, domainFilter],
    queryFn: () => getConcepts({ offset: page * PAGE_SIZE, limit: PAGE_SIZE, domain: domainFilter || undefined }),
  });

  const concepts: ConceptSummary[] = data?.concepts || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">Knowledge Base</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            All Concepts
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: 14, color: 'var(--text-secondary)' }}>
            {total} concepts across 10 domains · Click any concept to expand
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="form-select"
            value={domainFilter}
            onChange={e => { setDomainFilter(e.target.value); setPage(0); }}
            style={{ minWidth: 180 }}
          >
            <option value="">All Domains</option>
            {[
              ['01-consumer-psychology', 'Consumer Psychology'],
              ['02-research-insight', 'Research & Insight'],
              ['03-strategy-positioning', 'Strategy & Positioning'],
              ['04-brand', 'Brand'],
              ['05-content-messaging', 'Content & Messaging'],
              ['06-channels-distribution', 'Channels & Distribution'],
              ['07-pricing-money', 'Pricing & Money'],
              ['08-metrics-measurement', 'Metrics & Measurement'],
              ['09-customer-retention-growth', 'Customer Retention'],
              ['10-local-context', 'Local Context'],
            ].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              height: 100, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {concepts.map(c => (
            <div key={c.id}>
              <div
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                  background: `${LAYER_COLORS[c.layer] || '#888'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Layers size={15} style={{ color: LAYER_COLORS[c.layer] || '#888' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{c.concept_name}</strong>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: LAYER_COLORS[c.layer],
                      background: `${LAYER_COLORS[c.layer]}18`,
                      padding: '2px 7px', borderRadius: 999,
                    }}>{c.layer}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {c.domain.replace(/^\d+-/, '').replace(/-/g, ' ')}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-secondary)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.definition}
                  </p>
                </div>
                <div style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedId === c.id && (
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Definition</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.definition}</p>
                  </div>
                  {c.purpose && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Purpose</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.purpose}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 11, background: 'var(--surface)', padding: '2px 8px', borderRadius: 6, color: 'var(--accent-2)' }}>{c.slug}</code>
                    {(c.tags || []).slice(0, 8).map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, background: 'var(--surface)', padding: '2px 8px',
                        borderRadius: 6, color: 'var(--text-tertiary)', border: '1px solid var(--border)',
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1.5rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '0 8px' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
