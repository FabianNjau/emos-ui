import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './Landing.css';

const FEATURED_DOMAINS = [
  { slug: 'strategy', label: 'Strategy & Positioning', desc: 'Blue Ocean, SWOT, competitive frames' },
  { slug: 'pricing', label: 'Pricing & Money', desc: 'Value-based pricing, anchoring, bundles' },
  { slug: 'psychology', label: 'Consumer Psychology', desc: 'Cognitive biases, decision heuristics' },
  { slug: 'retention', label: 'Customer Retention', desc: 'Churn, loyalty, lifetime value' },
  { slug: 'content', label: 'Content & Messaging', desc: 'Storytelling, copywriting, framing' },
  { slug: 'metrics', label: 'Metrics & Measurement', desc: 'KPIs, attribution, experimentation' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`${PUBLIC_ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-inner">
          <p className="landing__eyebrow">Evidence-based marketing intelligence</p>
          <h1 className="landing__headline">
            Marketing answers,<br />
            <span className="landing__headline-accent">grounded in research.</span>
          </h1>
          <p className="landing__sub">
            EMOS searches across academic papers, textbooks, and industry reports
            to answer your marketing questions — with citations, not opinions.
          </p>

          <form className="landing__search-form" onSubmit={handleSearch}>
            <input
              className="landing__search-input"
              type="search"
              placeholder="Try: How does decoy pricing work?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search EMOS"
            />
            <button className="landing__search-btn" type="submit">
              Search
            </button>
          </form>

          <div className="landing__how-it-works">
            <div className="landing__step">
              <span className="landing__step-num">1</span>
              <span>Ask a question</span>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <span className="landing__step-num">2</span>
              <span>Get evidence-backed answers</span>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <span className="landing__step-num">3</span>
              <span>See the sources</span>
            </div>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="landing__topics">
        <div className="landing__section-inner">
          <h2 className="landing__section-title">Browse by topic</h2>
          <div className="landing__topics-grid">
            {FEATURED_DOMAINS.map((d) => (
              <button
                key={d.slug}
                className="landing__topic-card"
                onClick={() => navigate(`${PUBLIC_ROUTES.TOPICS}/${d.slug}`)}
              >
                <span className="landing__topic-label">{d.label}</span>
                <span className="landing__topic-desc">{d.desc}</span>
              </button>
            ))}
          </div>
          <button
            className="landing__view-all"
            onClick={() => navigate(PUBLIC_ROUTES.TOPICS)}
          >
            View all topics →
          </button>
        </div>
      </section>

      {/* About strip */}
      <section className="landing__about-strip">
        <div className="landing__section-inner landing__about-strip-inner">
          <div>
            <h2 className="landing__section-title">Built on real research</h2>
            <p className="landing__about-text">
              Every answer in EMOS is backed by peer-reviewed papers, textbooks,
              and primary industry research. No vibes. No blog posts. Just evidence.
            </p>
            <button
              className="landing__about-cta"
              onClick={() => navigate(PUBLIC_ROUTES.ABOUT)}
            >
              How it works
            </button>
          </div>
          <div className="landing__stats">
            <div className="landing__stat">
              <span className="landing__stat-num">93</span>
              <span className="landing__stat-label">Sources</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-num">3,000+</span>
              <span className="landing__stat-label">Concepts</span>
            </div>
            <div className="landing__stat">
              <span className="landing__stat-num">11</span>
              <span className="landing__stat-label">Domains</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
