/**
 * ExplorePage — authenticated knowledge explorer.
 * Browse concepts by domain, see which ones are bookmarked.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { useBookmarks } from '../../hooks/useBookmarks';
import type { Domain } from '../../types/api';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Layers,
  ChevronRight,
  Loader,
} from 'lucide-react';

const DOMAIN_ORDER = [
  'Pricing & Money',
  'Consumer Psychology',
  'Strategy & Positioning',
  'Brand',
  'Content & Messaging',
  'Channels & Distribution',
  'Customer Retention & Growth',
  'Metrics & Measurement',
  'Research & Insight',
  'Local Context (Kenya / East Africa)',
  'EMOS Proprietary',
];

export default function ExplorePage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [conceptsByDomain, setConceptsByDomain] = useState<Record<string, Domain['concept_count']>>({});
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<{ slug: string; name: string; layer: string }[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [search, setSearch] = useState('');

  const { data: bookmarks = [] } = useBookmarks();
  const bookmarkedSlugs = new Set(bookmarks.map(b => b.concept_slug));

  // Load domains on mount
  useEffect(() => {
    setLoadingDomains(true);
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/domains`)
      .then(r => r.json())
      .then(d => {
        const domainList: Domain[] = d.domains ?? [];
        setDomains(domainList.sort((a, b) => {
          const ai = DOMAIN_ORDER.indexOf(a.name);
          const bi = DOMAIN_ORDER.indexOf(b.name);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        }));
        // Build concept count map
        const counts: Record<string, number> = {};
        for (const dm of domainList) {
          counts[dm.name] = dm.concept_count;
        }
        setConceptsByDomain(counts);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoadingDomains(false));
  }, []);

  // Load concepts for selected domain
  useEffect(() => {
    if (!selectedDomain) { setConcepts([]); return; }
    setLoadingConcepts(true);
    const domain = domains.find(d => d.name === selectedDomain);
    if (!domain) { setLoadingConcepts(false); return; }

    const pageSize = domain.concept_count ?? 20;
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/concepts?domain=${encodeURIComponent(selectedDomain)}&limit=${pageSize}`)
      .then(r => r.json())
      .then(d => {
        setConcepts(d.concepts ?? []);
      })
      .catch(() => setConcepts([]))
      .finally(() => setLoadingConcepts(false));
  }, [selectedDomain, domains]);

  const filteredDomains = domains.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConcepts = concepts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Knowledge Explorer
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          Browse all marketing concepts by domain — bookmark the ones you want to reference.
        </p>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0.6rem 0.875rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '1.25rem',
      }}>
        <Search size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search domains or concepts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', fontSize: 14,
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Domain sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Domains ({loadingDomains ? '...' : domains.length})
          </div>
          {loadingDomains ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader size={18} className="spin" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredDomains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.name === selectedDomain ? null : domain.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: selectedDomain === domain.name ? 600 : 400,
                    color: selectedDomain === domain.name ? 'var(--accent)' : 'var(--text-secondary)',
                    background: selectedDomain === domain.name ? 'rgba(193,125,60,0.08)' : 'transparent',
                    transition: 'all 0.1s ease',
                    fontFamily: 'var(--font-sans)',
                    gap: 8,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {domain.name}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: selectedDomain === domain.name ? 'var(--accent)' : 'var(--text-tertiary)',
                    background: 'var(--surface-2)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}>
                    {domain.concept_count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Concept list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedDomain ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: 'var(--text-tertiary)',
              fontSize: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              Select a domain to browse its concepts.
            </div>
          ) : loadingConcepts ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader size={22} className="spin" />
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: 'var(--text-tertiary)',
              fontSize: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              No concepts found in this domain.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {selectedDomain} — {filteredConcepts.length} concepts
              </div>
              {filteredConcepts.map(concept => {
                const isBookmarked = bookmarkedSlugs.has(concept.slug);
                return (
                  <Link
                    key={concept.slug}
                    to={`/concepts/${concept.slug}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                      gap: 10,
                      transition: 'border-color 0.1s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {concept.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            background: 'rgba(91,106,191,0.1)',
                            color: '#5b6abf',
                            padding: '2px 7px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            <Layers size={10} />
                            {concept.layer}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {isBookmarked && (
                        <span title="Bookmarked"><BookmarkCheck size={15} style={{ color: 'var(--accent)' }} /></span>
                      )}
                      <ChevronRight size={15} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
