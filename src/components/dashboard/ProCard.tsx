import { Sparkles } from 'lucide-react';
import './ProCard.css';

interface ProCardProps {
  /** 'free' | 'pro' — hidden when pro */
  plan?: 'free' | 'pro';
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function ProCard({ plan = 'free', onUpgrade, onDismiss }: ProCardProps) {
  if (plan === 'pro') return null;

  return (
    <div className="pro-card" role="complementary" aria-label="EMOS Pro upgrade">
      {/* Header row */}
      <div className="pro-card__header">
        <div className="pro-card__icon" aria-hidden="true">
          <Sparkles size={14} />
        </div>
        {onDismiss && (
          <button
            className="pro-card__close"
            onClick={onDismiss}
            aria-label="Dismiss Pro promotion"
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Copy */}
      <div className="pro-card__copy">
        <p className="pro-card__heading">Unlock more<br />with EMOS Pro</p>
        <p className="pro-card__body">
          Save insights, create profiles, and explore without limits.
        </p>
      </div>

      {/* CTA */}
      <button className="pro-card__btn" onClick={onUpgrade}>
        Upgrade Now
      </button>
    </div>
  );
}
