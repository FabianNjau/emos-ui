import { useState } from 'react';
import {
  Gift, Infinity, Brain, Share2, Headphones, Lock,
  ChevronDown, X, Check, Zap,
} from 'lucide-react';
import './UpgradePage.css';

// ── Types ───────────────────────────────────────────────────────────────────

type PlanId = 'free' | 'pro_monthly' | 'pro_max';

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  period: string;
  annualNote?: string;
  badge?: string;
  ctaLabel: string;
  ctaVariant: 'current' | 'upgrade' | 'secondary';
  features: { label: string; included: boolean; note?: string }[];
}

// ── Plan data ────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with the basics',
    price: 0,
    period: '/ month',
    ctaLabel: 'Current Plan',
    ctaVariant: 'current',
    features: [
      { label: '10 chat sessions / month', included: true },
      { label: '5 saved insights', included: true },
      { label: '1 active profile', included: true },
      { label: 'Standard AI responses', included: true },
      { label: 'Basic exploration', included: true },
      { label: 'Standard support', included: true },
      { label: 'Unlimited chat sessions', included: false },
      { label: 'Unlimited saved insights', included: false },
      { label: 'Advanced AI models', included: false },
      { label: 'Priority support', included: false },
      { label: 'Export & share insights', included: false },
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    tagline: 'Our most popular plan',
    price: 1500,
    period: '/ month',
    badge: 'Most Popular',
    ctaLabel: 'Upgrade to Pro',
    ctaVariant: 'upgrade',
    features: [
      { label: 'Unlimited chat sessions', included: true },
      { label: 'Unlimited saved insights', included: true },
      { label: 'Unlimited profiles', included: true },
      { label: 'Advanced AI responses', included: true },
      { label: 'Expanded exploration', included: true },
      { label: 'Priority support', included: true },
      { label: 'Export & share insights', included: true },
      { label: 'Early access to new features', included: true },
      { label: 'Advanced AI models', included: false, note: 'Coming soon' },
    ],
  },
  {
    id: 'pro_max',
    name: 'Pro Max',
    tagline: 'For power users and teams',
    price: 3000,
    period: '/ month',
    annualNote: 'Billed as KES 36,000 / year',
    ctaLabel: 'Choose Pro Max',
    ctaVariant: 'secondary',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Advanced AI models', included: true },
      { label: 'Team collaboration', included: true },
      { label: 'Custom export formats', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'API access', included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Chat sessions', free: '10 / month', pro: 'Unlimited', proMax: 'Unlimited' },
  { feature: 'Saved insights', free: '5', pro: 'Unlimited', proMax: 'Unlimited' },
  { feature: 'Profiles', free: '1', pro: 'Unlimited', proMax: 'Unlimited' },
  { feature: 'AI response quality', free: 'Standard', pro: 'Advanced', proMax: 'Advanced +' },
  { feature: 'Exploration depth', free: 'Basic', pro: 'Expanded', proMax: 'Full' },
  { feature: 'Export & share', free: '—', pro: '✓', proMax: '✓ + API' },
  { feature: 'Support', free: 'Standard', pro: 'Priority', proMax: 'Dedicated' },
  { feature: 'Early access', free: '—', pro: '✓', proMax: '✓' },
];

const FAQ_ITEMS = [
  {
    q: 'Can I cancel Pro at any time?',
    a: 'Yes. You can cancel your subscription at any time from your account settings. Your Pro benefits will remain active until the end of your current billing period.',
  },
  {
    q: 'What happens to my data if I downgrade to Free?',
    a: 'Your saved insights and profiles remain safe. If you have more than the Free limit, your existing data stays accessible but you won\'t be able to create new items until you\'re back within the limit.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed by Stripe, one of the most trusted payment providers in the world. EMOS never stores your card details directly.',
  },
  {
    q: 'What happens when the launch gift ends?',
    a: 'We\'ll notify you before your launch gift period ends. You can choose to subscribe to a Pro plan to continue enjoying expanded access, or your account will move to the Free plan.',
  },
  {
    q: 'Can I switch between Pro Monthly and Pro Max?',
    a: 'Yes, you can change your plan at any time. When upgrading, you\'ll be charged a prorated amount. When downgrading, the change takes effect at the start of your next billing cycle.',
  },
];

const SUMMARY_BENEFITS = [
  { icon: <Infinity size={16} />, title: 'Unlimited workspace', desc: 'No limits on sessions, insights, or profiles.' },
  { icon: <Brain size={16} />, title: 'Smarter AI', desc: 'Advanced models and deeper context understanding.' },
  { icon: <Share2 size={16} />, title: 'Export & share', desc: 'Take your knowledge anywhere, securely.' },
  { icon: <Headphones size={16} />, title: 'Priority support', desc: 'Get help faster when you need it most.' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n === 0 ? '0' : n.toLocaleString('en-KE');
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: (id: PlanId) => void;
}) {
  return (
    <div
      className={[
        'plan-card',
        plan.id !== 'free' ? 'plan-card--pro' : '',
        selected ? 'plan-card--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {plan.badge && <div className="plan-card__badge">{plan.badge}</div>}

      <div className="plan-card__name">{plan.name}</div>
      <div className="plan-card__tagline">{plan.tagline}</div>

      <div className="plan-card__price">
        <span className="plan-card__currency">KES</span>
        <span className="plan-card__amount">{formatPrice(plan.price)}</span>
        <span className="plan-card__period">{plan.period}</span>
      </div>

      {plan.annualNote && (
        <div className="plan-card__annual-note">{plan.annualNote}</div>
      )}

      <button
        className={`plan-card__cta plan-card__cta--${plan.ctaVariant}`}
        disabled={plan.ctaVariant === 'current'}
        onClick={() => {
          if (plan.ctaVariant === 'current') return;
          onSelect(plan.id);
        }}
      >
        {plan.ctaVariant === 'upgrade' && <Zap size={14} />}
        {plan.ctaLabel}
      </button>

      <div className="plan-card__divider" />

      <div className="plan-card__features">
        {plan.features.map((f, i) => (
          <div
            key={i}
            className={`plan-card__feature${f.included ? '' : ' plan-card__feature--disabled'}`}
          >
            <span className="plan-card__feature-icon">
              {f.included ? (
                <Check size={14} className="plan-card__feature-icon--check" />
              ) : (
                <span style={{ fontSize: 14, lineHeight: 1 }}>–</span>
              )}
            </span>
            <span>
              {f.label}
              {f.note && (
                <span style={{ color: '#B7C0BC', fontSize: '0.75rem', marginLeft: 4 }}>
                  ({f.note})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal__header">
          <div>
            <div className="upgrade-modal__title">Upgrade to EMOS Pro</div>
            <div className="upgrade-modal__subtitle">
              You're choosing the {plan.name} plan
            </div>
          </div>
          <button className="upgrade-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="upgrade-modal__plan-badge">
          <Check size={12} />
          EMOS {plan.name}
        </div>

        <div className="upgrade-modal__price">
          <span className="upgrade-modal__price-amount">
            KES {formatPrice(plan.price)}
          </span>
          <span className="upgrade-modal__price-period">{plan.period}</span>
        </div>

        <div className="upgrade-modal__benefits">
          {plan.features
            .filter((f) => f.included)
            .map((f, i) => (
              <div key={i} className="upgrade-modal__benefit">
                <Check size={14} className="upgrade-modal__benefit-icon" />
                {f.label}
              </div>
            ))}
        </div>

        <div className="upgrade-modal__billing-note">
          Billing starts today. Cancel anytime from your account settings.
        </div>

        <div className="upgrade-modal__actions">
          <button className="upgrade-modal__btn upgrade-modal__btn--secondary" onClick={onClose}>
            Back
          </button>
          <button
            className="upgrade-modal__btn upgrade-modal__btn--primary"
            onClick={() => {
              // TODO: wire Stripe checkout
              alert('Stripe checkout coming soon — ask Arc to wire this up.');
              onClose();
            }}
          >
            Continue to checkout
          </button>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div className="upgrade-page__summary-secure">
            <Lock size={11} />
            Secure checkout powered by Stripe
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button className="faq-item__question" onClick={() => setOpen((v) => !v)}>
        {item.q}
        <ChevronDown size={16} className="faq-item__icon" />
      </button>
      {open && <div className="faq-item__answer">{item.a}</div>}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro_monthly');
  const [giftEnabled, setGiftEnabled] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  const handlePlanSelect = (id: PlanId) => {
    setSelectedPlan(id);
    setShowCheckout(true);
  };

  const selected = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <div className="upgrade-page">
      {/* Hero */}
      <div className="upgrade-page__hero">
        <h1 className="upgrade-page__hero-heading">Upgrade to EMOS Pro</h1>
        <p className="upgrade-page__hero-desc">
          More insights. Smarter exploration. Unlimited potential.
        </p>
        <p className="upgrade-page__hero-sub">
          Choose the plan that fits your ambition.
        </p>

        {/* Decorative background logo */}
        <div className="upgrade-page__hero-bg-logo" aria-hidden="true">
          <img src="/assets/emos-logo-square.png" alt="" />
        </div>
      </div>

      <div className="upgrade-page__content">
        {/* Launch Gift Banner */}
        <div className="upgrade-page__gift-banner">
          <div className="upgrade-page__gift-icon">
            <Gift size={20} />
          </div>
          <div className="upgrade-page__gift-info">
            <div className="upgrade-page__gift-title">EMOS Launch Gift</div>
            <div className="upgrade-page__gift-desc">
              Enjoy Pro as our launch gift. This special access may be updated or disabled after the launch period.
            </div>
          </div>
          <div className="upgrade-page__gift-status">
            <button
              className={`upgrade-page__gift-pill${giftEnabled ? ' upgrade-page__gift-pill--on' : ' upgrade-page__gift-pill--off'}`}
              onClick={() => setGiftEnabled((v) => !v)}
              style={{ border: 'none', cursor: 'pointer' }}
              aria-pressed={giftEnabled}
            >
              {giftEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Plans + Summary */}
        <div className="upgrade-page__plans-section">
          {/* Plan cards */}
          <div className="upgrade-page__plans">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>

          {/* Summary sidebar */}
          <aside className="upgrade-page__summary">
            <h2 className="upgrade-page__summary-title">Your plan summary</h2>

            <div className="upgrade-page__summary-section">
              <div className="upgrade-page__summary-row">
                <span className="upgrade-page__summary-label">Plan</span>
                <span className="upgrade-page__summary-value upgrade-page__summary-value--green">
                  {selected.name}
                </span>
              </div>
              <div className="upgrade-page__summary-row">
                <span className="upgrade-page__summary-label">Billing</span>
                <span className="upgrade-page__summary-value">
                  KES {formatPrice(selected.price)} / month
                </span>
              </div>
              <div className="upgrade-page__summary-row">
                <span className="upgrade-page__summary-label">Next billing</span>
                <span className="upgrade-page__summary-value">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="upgrade-page__summary-row">
                <span className="upgrade-page__summary-label">Launch gift</span>
                <span className={`upgrade-page__summary-value ${giftEnabled ? 'upgrade-page__summary-value--green' : 'upgrade-page__summary-value--muted'}`}>
                  {giftEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="upgrade-page__summary-divider" />

            {giftEnabled && (
              <div className="upgrade-page__summary-gift-note">
                You're enjoying Pro as our launch gift.
              </div>
            )}

            <div className="upgrade-page__summary-divider" />

            <p className="upgrade-page__summary-benefits-title">What you get with Pro</p>

            {SUMMARY_BENEFITS.map((b, i) => (
              <div key={i} className="upgrade-page__summary-benefit">
                <div className="upgrade-page__summary-benefit-icon">{b.icon}</div>
                <div className="upgrade-page__summary-benefit-text">
                  <div className="upgrade-page__summary-benefit-title">{b.title}</div>
                  <div className="upgrade-page__summary-benefit-desc">{b.desc}</div>
                </div>
              </div>
            ))}

            <div className="upgrade-page__summary-divider" />

            <div className="upgrade-page__summary-secure">
              <Lock size={11} />
              Secure checkout powered by Stripe
            </div>
          </aside>
        </div>

        {/* Feature comparison */}
        <div className="upgrade-page__comparison">
          <h2 className="upgrade-page__comparison-title">All plan features</h2>
          <table className="comparison-table">
            <thead>
              <tr className="comparison-table__header">
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Pro Max</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} className="comparison-table__row">
                  <td>{row.feature}</td>
                  <td>
                    {row.free === '—' ? (
                      <span className="comparison-table__muted">—</span>
                    ) : row.free === '✓' ? (
                      <span className="comparison-table__check"><Check size={14} /></span>
                    ) : (
                      row.free
                    )}
                  </td>
                  <td>
                    {row.pro === '✓' ? (
                      <span className="comparison-table__check"><Check size={14} /></span>
                    ) : (
                      row.pro
                    )}
                  </td>
                  <td>
                    {row.proMax === '✓ + API' ? (
                      <span className="comparison-table__check"><Check size={14} /></span>
                    ) : row.proMax === '✓' ? (
                      <span className="comparison-table__check"><Check size={14} /></span>
                    ) : (
                      row.proMax
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="upgrade-page__faq">
          <h2 className="upgrade-page__faq-title">Frequently asked questions</h2>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal plan={selected} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}
