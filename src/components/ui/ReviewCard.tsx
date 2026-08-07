import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ReviewQueueItem } from '../../api/emos';

const LAYER_COLORS: Record<string, string> = {
  L1: '#3B82F6', L2: '#8B5CF6', L3: '#10B981', L4: '#D97706',
};
const EVIDENCE_COLORS: Record<string, string> = {
  high: '#10B981', medium: '#D97706', low: '#9E9A94',
};

interface ReviewCardProps {
  item: ReviewQueueItem;
  selected: boolean;
  processing: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function ReviewCard({
  item, selected, processing, onSelect, onApprove, onReject,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (item.item_type === 'concept') {
    const c = item.concept!;
    const evidence = item.evidence || [];
    const relCount = item.relationship_count || 0;

    return (
      <div
        className="review-card"
        style={{
          opacity: processing ? 0.6 : 1,
          borderColor: processing ? 'var(--green)' : undefined,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={selected}
            disabled={processing}
            onChange={() => onSelect(item.id)}
            style={{ marginTop: 4, cursor: 'pointer', width: 17, height: 17, accentColor: 'var(--accent)' }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: LAYER_COLORS[c.layer] || '#888',
                background: `${LAYER_COLORS[c.layer] || '#888'}18`,
                padding: '2px 8px', borderRadius: 999,
              }}>
                {c.layer}
              </span>
              <strong style={{ fontSize: 15 }}>{c.concept_name}</strong>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {c.domain.replace(/^\d+-/, '').replace(/-/g, ' ')}
              </span>
              {relCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--accent-2)' }}>
                  🔗 {relCount} rel{relCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Definition preview */}
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? undefined : 'hidden',
            }}>
              {c.definition}
            </p>

            {/* Evidence pills */}
            {evidence.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {evidence.slice(0, 3).map((ev, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: EVIDENCE_COLORS[ev.evidence_level] || '#888',
                    background: `${EVIDENCE_COLORS[ev.evidence_level] || '#888'}15`,
                    padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                  }}>
                    {ev.evidence_level} · {ev.source_type}
                  </div>
                ))}
                {evidence.length > 3 && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '2px 8px' }}>
                    +{evidence.length - 3} more
                  </div>
                )}
              </div>
            )}

            {/* Expanded details */}
            {expanded && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {evidence.map((ev, i) => (
                  <div key={i} style={{
                    background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px', marginBottom: 8, fontSize: 12, lineHeight: 1.6,
                  }}>
                    <div style={{ marginBottom: 4 }}>{ev.finding}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        color: EVIDENCE_COLORS[ev.evidence_level], fontWeight: 700, fontSize: 10,
                        background: `${EVIDENCE_COLORS[ev.evidence_level]}18`,
                        padding: '1px 6px', borderRadius: 999,
                      }}>{ev.evidence_level.toUpperCase()}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{ev.source_type}</span>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <strong>Slug:</strong> <code style={{ fontSize: 11 }}>{c.slug}</code>
                  &nbsp;&nbsp; <strong>Tags:</strong> {(c.tags || []).join(', ')}
                </div>
              </div>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: 12, padding: '6px 0',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Less' : 'More'}
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button
              className="btn btn-success btn-sm"
              disabled={processing}
              onClick={() => onApprove(item.id)}
              style={{ minWidth: 44 }}
            >
              <CheckCircle size={14} /> Approve
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={processing}
              onClick={() => onReject(item.id)}
              style={{ minWidth: 44 }}
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Relationship card
  const r = item.relationship!;
  return (
    <div className="review-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={selected}
          disabled={processing}
          onChange={() => onSelect(item.id)}
          style={{ marginTop: 4, cursor: 'pointer', width: 17, height: 17, accentColor: 'var(--accent)' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="badge badge-relationship">rel</span>
            <strong style={{ fontSize: 14 }}>{r.from_name || r.from_concept}</strong>
            <span style={{ color: 'var(--accent)', fontSize: 12 }}>→ {r.relationship_type} →</span>
            <strong style={{ fontSize: 14 }}>{r.to_name || r.to_concept}</strong>
          </div>
          {r.explanation && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {expanded ? r.explanation : r.explanation.substring(0, 120) + (r.explanation.length > 120 ? '…' : '')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-success btn-sm" disabled={processing} onClick={() => onApprove(item.id)}>
            <CheckCircle size={14} /> Approve
          </button>
          <button className="btn btn-danger btn-sm" disabled={processing} onClick={() => onReject(item.id)}>
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
