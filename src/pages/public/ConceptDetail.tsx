import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PublicConceptDetail } from '../../types/api';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './ConceptDetail.css';

const EVIDENCE_BADGE: Record<string, string> = {
  high: '🟢 High',
  medium: '🟡 Medium',
  low: '🔴 Low',
};

const APPLICABILITY_BADGE: Record<string, string> = {
  universal: '🌍 Universal',
  african: '🌍 African market',
  'kenya-specific': '🇰🇪 Kenya',
};

export default function ConceptDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [concept, setConcept] = useState<PublicConceptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/concepts/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Concept not found');
        return r.json();
      })
      .then((d) => setConcept(d.data ?? d))
      .catch((e) => setError(e.message ?? 'Failed to load concept'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="concept-detail"><div className="concept-detail__inner"><p className="concept-detail__loading">Loading…</p></div></div>;
  if (error) return <div className="concept-detail"><div className="concept-detail__inner"><p className="concept-detail__error">{error}</p></div></div>;
  if (!concept) return null;

  return (
    <div className="concept-detail">
      <div className="concept-detail__inner">
        {/* Breadcrumb */}
        <Link to={PUBLIC_ROUTES.TOPICS} className="concept-detail__back">← All topics</Link>

        {/* Header */}
        <div className="concept-detail__header">
          <div className="concept-detail__badges">
            <span className="concept-detail__badge concept-detail__badge--domain">{concept.domain_label ?? concept.domain}</span>
            <span className="concept-detail__badge concept-detail__badge--layer">{concept.layer_label ?? concept.layer}</span>
          </div>
          <h1 className="concept-detail__name">{concept.name}</h1>
          <p className="concept-detail__definition">{concept.definition}</p>
        </div>

        {/* Purpose */}
        {concept.purpose && (
          <section className="concept-detail__section">
            <h2 className="concept-detail__section-title">Why it matters</h2>
            <p className="concept-detail__purpose">{concept.purpose}</p>
          </section>
        )}

        {/* Evidence */}
        {concept.evidence && concept.evidence.length > 0 && (
          <section className="concept-detail__section">
            <h2 className="concept-detail__section-title">Evidence</h2>
            <div className="concept-detail__evidence-list">
              {concept.evidence.map((e) => (
                <div key={e.id} className="evidence-card">
                  <div className="evidence-card__badges">
                    <span className={`evidence-badge evidence-badge--${e.evidence_level}`}>
                      {EVIDENCE_BADGE[e.evidence_level] ?? e.evidence_level}
                    </span>
                    <span className="evidence-badge evidence-badge--type">{e.source_type}</span>
                    {e.applicability && (
                      <span className="evidence-badge evidence-badge--applic">
                        {APPLICABILITY_BADGE[e.applicability] ?? e.applicability}
                      </span>
                    )}
                  </div>
                  <p className="evidence-card__finding">{e.finding}</p>
                  <p className="evidence-card__source">
                    {e.source_title}
                    {e.source_year && <span> ({e.source_year})</span>}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Relationships */}
        {concept.relationships && concept.relationships.length > 0 && (
          <section className="concept-detail__section">
            <h2 className="concept-detail__section-title">Related concepts</h2>
            <div className="concept-detail__relationships">
              {concept.relationships.map((r) => (
                <Link
                  key={r.id}
                  to={`${PUBLIC_ROUTES.CONCEPT.replace(':slug', r.concept_slug)}`}
                  className="relationship-card"
                >
                  <span className="relationship-card__type">{r.relationship_type}</span>
                  <span className="relationship-card__name">{r.concept_name}</span>
                  {r.explanation && <p className="relationship-card__explanation">{r.explanation}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Limitations */}
        {concept.limitations && (
          <section className="concept-detail__section">
            <h2 className="concept-detail__section-title">Limitations</h2>
            <p className="concept-detail__limitations">{concept.limitations}</p>
          </section>
        )}

        {/* Common mistakes */}
        {concept.common_mistakes && (
          <section className="concept-detail__section">
            <h2 className="concept-detail__section-title">Common mistakes</h2>
            <p className="concept-detail__mistakes">{concept.common_mistakes}</p>
          </section>
        )}

        {/* CTA */}
        <div className="concept-detail__cta">
          <Link to={`${PUBLIC_ROUTES.ASK}?context=${encodeURIComponent(concept.name)}`} className="concept-detail__ask-btn">
            Ask about {concept.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}
