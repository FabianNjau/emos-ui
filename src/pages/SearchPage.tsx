import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchConcepts } from '../api/emos';
import type { SearchResult } from '../api/emos';
import { Search, ArrowRight } from 'lucide-react';

const LAYER_COLORS: Record<string, string> = {
  L1: '#3B82F6', L2: '#8B5CF6', L3: '#10B981', L4: '#D97706',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchConcepts(query),
    enabled: query.trim().length > 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setQuery(input.trim());
  };

  const results: SearchResult[] = data?.results || [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow">Semantic Search</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.5rem' }}>
          Find Concepts
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Search by meaning, not just keywords. Powered by 768-dimensional vector embeddings.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute', left: '1rem', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 'mobile marketing for Kenyan SMEs' or 'customer retention strategies'"
            autoFocus
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.2s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions when empty */}
      {!query && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            Try searching for:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              'mobile marketing SME Kenya',
              'pricing psychology',
              'brand loyalty',
              'distribution channels',
              'customer acquisition',
              'content marketing strategy',
            ].map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); setQuery(s); }}
                style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease', fontFamily: 'var(--font-sans)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {(isLoading || isFetching) && query && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 100, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            Found {results.length} results for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>"
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((r) => (
              <div key={r.concept_id} className="search-result">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                        color: LAYER_COLORS[r.layer] || '#888',
                        background: `${LAYER_COLORS[r.layer] || '#888'}18`,
                        padding: '2px 8px', borderRadius: 999,
                      }}>
                        {r.layer}
                      </span>
                      <strong style={{ fontSize: 15 }}>{r.concept_name}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {r.domain.replace(/^\d+-/, '').replace(/-/g, ' ')}
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                        color: Math.round(r.score * 100) > 80 ? 'var(--green)' : 'var(--text-tertiary)',
                      }}>
                        {Math.round(r.score * 100)}% match
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {r.definition}
                    </p>
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Matched on: <em>{r.matched_on}</em>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query && !isLoading && !isFetching && results.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <Search size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>No results found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Try rephrasing or using different keywords.
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
