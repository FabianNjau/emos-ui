import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Domain } from '../../types/api';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './TopicBrowser.css';

const DOMAIN_ICONS: Record<string, string> = {
  'Consumer Psychology': '🧠',
  'Research & Insight': '🔬',
  'Strategy & Positioning': '🎯',
  'Brand': '🏷️',
  'Content & Messaging': '✍️',
  'Channels & Distribution': '📣',
  'Pricing & Money': '💰',
  'Metrics & Measurement': '📊',
  'Customer Retention & Growth': '📈',
  'Local Context (Kenya / East Africa)': '🌍',
  'EMOS Proprietary': '🔒',
};

export default function TopicBrowser() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/domains`)
      .then((r) => r.json())
      .then((d) => setDomains(d.domains ?? []))
      .catch(() => {/* silently handle */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="topic-browser">
      <div className="topic-browser__inner">
        <div className="topic-browser__header">
          <h1 className="topic-browser__title">Browse by topic</h1>
          <p className="topic-browser__sub">
            Explore {domains.length || 'all'} marketing domains — from consumer psychology
            to pricing strategy, grounded in academic research.
          </p>
        </div>

        {loading && <p className="topic-browser__loading">Loading topics…</p>}

        {!loading && (
          <div className="topic-browser__grid">
            {domains.map((d) => (
              <button
                key={d.id}
                className="domain-card"
                onClick={() => navigate(`${PUBLIC_ROUTES.TOPICS}/${d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
              >
                <span className="domain-card__icon" aria-hidden="true">
                  {DOMAIN_ICONS[d.name] ?? '📁'}
                </span>
                <div>
                  <h2 className="domain-card__name">{d.name}</h2>
                  <p className="domain-card__desc">{d.description}</p>
                  <span className="domain-card__count">{d.concept_count} concepts</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
