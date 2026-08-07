import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { PublicSearchResult } from '../../types/api';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/search?query=${encodeURIComponent(query)}&limit=20`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError('Search failed. Please try again.');
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [query]);

  return (
    <div className="search-results">
      <div className="search-results__inner">
        <div className="search-results__header">
          <h1 className="search-results__title">
            {query ? (
              <>Results for <em>"{query}"</em></>
            ) : (
              'Browse all concepts'
            )}
          </h1>
          {!loading && results.length > 0 && (
            <p className="search-results__count">{results.length} concepts found</p>
          )}
        </div>

        {loading && <p className="search-results__loading">Searching…</p>}
        {error && <p className="search-results__error">{error}</p>}

        {!loading && !error && results.length === 0 && query && (
          <div className="search-results__empty">
            <p>No concepts match "{query}".</p>
            <p>Try different keywords or <Link to={PUBLIC_ROUTES.TOPICS}>browse topics</Link>.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="search-results__list">
            {results.map((r) => (
              <Link
                key={r.concept_id}
                to={`${PUBLIC_ROUTES.CONCEPT.replace(':slug', r.slug)}`}
                className="search-result-card"
              >
                <div className="search-result-card__top">
                  <span className="search-result-card__domain">{r.domain}</span>
                  <span className="search-result-card__layer">{r.layer}</span>
                </div>
                <h3 className="search-result-card__name">{r.name}</h3>
                <p className="search-result-card__def">{r.definition}</p>
                <div className="search-result-card__meta">
                  {r.evidence_count > 0 && (
                    <span>{r.evidence_count} evidence {r.evidence_count === 1 ? 'item' : 'items'}</span>
                  )}
                  <span className="search-result-card__score">Score: {r.score.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!query && (
          <p className="search-results__hint">
            <Link to={PUBLIC_ROUTES.TOPICS}>Browse topics</Link> or enter a search term above.
          </p>
        )}
      </div>
    </div>
  );
}
