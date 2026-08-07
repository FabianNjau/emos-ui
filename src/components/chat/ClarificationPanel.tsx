import { useContextStore } from '../../store/useContextStore';
import { X, ChevronRight } from 'lucide-react';

const DIMENSIONS = [
  { key: 'budget', label: 'Monthly marketing budget', placeholder: 'e.g. KES 20,000, or no budget', options: ['No budget / organic only', 'KES 5,000 – 20,000', 'KES 20,000 – 100,000', 'KES 100,000+', 'I have a flexible budget'] },
  { key: 'audience', label: 'Who are your customers?', placeholder: 'e.g. Small business owners', options: ['Individual consumers (B2C)', 'Other businesses (B2B)', 'Government / public sector (B2G)', 'Mixed / Not sure'] },
  { key: 'productType', label: 'What do you sell?', placeholder: 'e.g. Handmade jewellery', options: ['Physical product', 'Digital product / SaaS', 'Service / consulting', 'Restaurant / food business', 'Retail / e-commerce', 'Other'] },
  { key: 'location', label: 'Where are your customers?', placeholder: 'e.g. Nairobi, Kenya', options: ['Kenya', 'East Africa (Uganda, Tanzania, Rwanda)', 'West Africa (Nigeria, Ghana)', 'Africa (general / pan-African)', 'Europe', 'USA / North America', 'Online / global / digital'] },
  { key: 'objective', label: 'What is your primary goal?', placeholder: 'e.g. Get more customers', options: ['Increase sales / revenue', 'Build brand awareness', 'Acquire new customers', 'Retain existing customers', 'Launch a new product', 'Improve customer loyalty'] },
  { key: 'stage', label: 'Where is your business right now?', placeholder: 'e.g. Just starting out', options: ['Pre-launch / haven\'t started selling yet', 'Early stage / first year', 'Scaling / growing steadily', 'Established / looking to optimise'] },
] as const;

interface ClarificationPanelProps {
  onComplete?: () => void;
}

export function ClarificationPanel({ onComplete }: ClarificationPanelProps) {
  const { budget, audience, productType, location, objective, stage, completenessScore, setDimension } = useContextStore();

  const values = { budget, audience, productType, location, objective, stage };
  const missingCount = DIMENSIONS.length - completenessScore;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Context Check
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440 }}>
            To give you a useful answer rather than generic advice, I need to understand your situation.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {missingCount === DIMENSIONS.length
                ? 'Answer a few questions below.'
                : missingCount === 0
                  ? 'You\'ve covered everything — looking good!'
                  : `${missingCount} question${missingCount > 1 ? 's' : ''} remaining.`}
            </strong>
          </p>
        </div>
        {/* Completeness meter */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>
            {completenessScore}<span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>/{DIMENSIONS.length}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>dimensions set</div>
          {completenessScore < 4 && (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Need 4+ for good advice
            </div>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DIMENSIONS.map(({ key, label, options }) => {
          const val = values[key];
          const isSet = val !== '';
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: isSet ? 'var(--accent-2)' : 'var(--text-secondary)' }}>
                  {label}
                  {isSet && <span style={{ marginLeft: 6, opacity: 0.6 }}>✓</span>}
                </label>
                {isSet && (
                  <button
                    onClick={() => setDimension(key, '')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', fontSize: 11, padding: '2px 4px',
                      borderRadius: 4,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDimension(key, opt)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: val === opt ? 600 : 400,
                      border: `1.5px solid ${val === opt ? 'var(--accent)' : 'var(--border)'}`,
                      background: val === opt ? 'var(--accent-soft)' : 'transparent',
                      color: val === opt ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {completenessScore >= 4 && (
        <div style={{
          marginTop: '1.25rem', padding: '0.875rem 1rem',
          background: 'rgba(12, 123, 138, 0.07)',
          border: '1px solid rgba(12, 123, 138, 0.2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <p style={{ fontSize: 13, color: 'var(--accent)', margin: 0 }}>
            <strong>Context sufficient.</strong> Submit your question above to get directed advice.
          </p>
        </div>
      )}

      {completenessScore > 0 && completenessScore < 4 && (
        <div style={{
          marginTop: '1.25rem', padding: '0.875rem 1rem',
          background: 'rgba(212, 168, 83, 0.07)',
          border: '1px solid rgba(212, 168, 83, 0.2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#8a6a20', margin: 0 }}>
            <strong>{4 - completenessScore} more dimension{4 - completenessScore > 1 ? 's' : ''} needed.</strong> Fill at least 4 to unlock directional advice.
          </p>
        </div>
      )}
    </div>
  );
}
