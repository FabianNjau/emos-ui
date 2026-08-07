import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PublicConceptSummary } from '../../types/api';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './TopicPage.css';

export default function TopicPage() {
  const { domain } = useParams<{ domain: string }>();
  const [concepts, setConcepts] = useState<PublicConceptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/domains/${encodeURIComponent(domain)}/concepts?limit=50`)
      .then((r) => r.json())
      .then((d) => setConcepts(d.concepts ?? []))
      .catch(() => {/* silently handle */})
      .finally(() => setLoading(false));
  }, [domain]);

  const domainLabel = domain
    ? domain.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

  return (
    <div className="topic-page">
      <div className="topic-page__inner">
        <div className="topic-page__header">
          <Link to={PUBLIC_ROUTES.TOPICS} className="topic-page__back">← All topics</Link>
          <h1 className="topic-page__title">{domainLabel}</h1>
          {!loading && <p className="topic-page__count">{concepts.length} concepts</p>}
        </div>

        {loading && <p className="topic-page__loading">Loading…</p>}

        {!loading && concepts.length === 0 && (
          <div className="topic-page__empty">
            <p>No concepts in this topic yet.</p>
            <Link to={PUBLIC_ROUTES.ASK}>Ask a question</Link> instead.
          </div>
        )}

        {!loading && concepts.length > 0 && (
          <div className="topic-page__list">
            {concepts.map((c) => (
              <Link
                key={c.id}
                to={`${PUBLIC_ROUTES.CONCEPT.replace(':slug', c.slug)}`}
                className="topic-concept-card"
              >
                <div className="topic-concept-card__top">
                  <span className="topic-concept-card__layer">{c.layer_label ?? c.layer}</span>
                  <span className="topic-concept-card__evidence">{c.evidence_count} evidence</span>
                </div>
                <h2 className="topic-concept-card__name">{c.name}</h2>
                <p className="topic-concept-card__def">{c.definition}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
