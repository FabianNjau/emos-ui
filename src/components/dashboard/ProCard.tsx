import { Sparkles } from 'lucide-react';
import './ProCard.css';

interface ProCardProps {
  currentPlan?: 'free' | 'pro';
  onUpgrade?: () => void;
}

export default function ProCard({ currentPlan = 'free', onUpgrade }: ProCardProps) {
  if (currentPlan === 'pro') return null;

  return (
    <div className="pro-card">
      <div className="pro-card__icon">
        <Sparkles size={14} />
      </div>
      <div className="pro-card__body">
        <p className="pro-card__title">Unlock more with EMOS Pro</p>
        <p className="pro-card__sub">Unlimited insights &amp; profiles</p>
      </div>
      <button className="pro-card__btn" onClick={onUpgrade}>
        Upgrade
      </button>
    </div>
  );
}
