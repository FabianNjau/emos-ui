import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/emos';
import StatCard from '../components/ui/StatCard';
import {
  Database, FileText, Share2, Lightbulb, CheckCircle,
  ArrowRight, BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card" style={{ height: 120, background: 'var(--surface-2)' }} />
        ))}
      </div>
    );
  }

  const rq = stats?.review_queue || 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div className="eyebrow">Knowledge Factory</div>
        <h1>Marketing Intelligence</h1>
        <p style={{ marginTop: '0.5rem', fontSize: 15, color: 'var(--text-secondary)' }}>
          Evidence-based marketing knowledge — curated from 34 academic & practitioner sources.
          Ask anything, search semantically, and build campaigns grounded in real research.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          label="Concepts"
          value={stats?.concepts?.toLocaleString() ?? '—'}
          subtitle="Marketing principles & frameworks"
          color="default"
          icon={<Database size={20} />}
        />
        <StatCard
          label="Evidence"
          value={stats?.evidence?.toLocaleString() ?? '—'}
          subtitle="Research-backed findings"
          color="green"
          icon={<FileText size={20} />}
        />
        <StatCard
          label="Relationships"
          value={stats?.relationships?.toLocaleString() ?? '—'}
          subtitle="Connected concept map"
          color="accent"
          icon={<Share2 size={20} />}
        />
        <StatCard
          label="Sources"
          value={stats?.sources?.toLocaleString() ?? '—'}
          subtitle="Academic & practitioner PDFs"
          color="default"
          icon={<BookOpen size={20} />}
        />
        <StatCard
          label="Pending Review"
          value={rq.toLocaleString()}
          subtitle="Awaiting your approval"
          color={rq > 500 ? 'orange' : 'green'}
          icon={<CheckCircle size={20} />}
        />
        <StatCard
          label="Chunks"
          value={stats?.chunks?.toLocaleString() ?? '—'}
          subtitle="Processed text segments"
          color="default"
          icon={<Lightbulb size={20} />}
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1rem' }}>
          Explore the Knowledge Base
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          <Link to="/chat" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <BookOpen size={18} />
            Ask the Knowledge Base
            <ArrowRight size={16} />
          </Link>
          <Link to="/search" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <Database size={18} />
            Semantic Search
          </Link>
          <Link to="/knowledge-graph" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <Share2 size={18} />
            Knowledge Graph
          </Link>
          <Link to="/review" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            <CheckCircle size={18} />
            Review Queue
            {rq > 0 && (
              <span className="sidebar-badge" style={{ marginLeft: 4 }}>{rq}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Coverage by domain - placeholder from memory */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem' }}>
          Concept Distribution by Domain
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { name: 'Strategy & Positioning', pct: 32, count: 142, color: 'var(--accent)' },
            { name: 'Channels & Distribution', pct: 24, count: 108, color: 'var(--accent-2)' },
            { name: 'Research & Insight', pct: 10, count: 43, color: '#3B82F6' },
            { name: 'Metrics & Measurement', pct: 9, count: 42, color: '#8B5CF6' },
            { name: 'Customer Retention & Growth', pct: 8, count: 36, color: 'var(--green)' },
            { name: 'Consumer Psychology', pct: 4, count: 19, color: '#F59E0B' },
            { name: 'Other Domains', pct: 13, count: 53, color: 'var(--text-tertiary)' },
          ].map(({ name, pct, count, color }) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{count} concepts</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: color,
                  borderRadius: 999,
                  transition: 'width 1s cubic-bezier(0.32,0.72,0,1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
