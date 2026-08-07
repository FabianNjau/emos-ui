import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviewStats, getReviewQueue, approveItem, rejectItem, batchApprove, batchReject } from '../api/emos';
import type { ReviewQueueItem } from '../api/emos';
import ReviewCard from '../components/ui/ReviewCard';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;

export default function ReviewQueue() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const { data: statsData } = useQuery({
    queryKey: ['review-stats'],
    queryFn: getReviewStats,
    refetchInterval: 10000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['review-queue', page, typeFilter, domainFilter],
    queryFn: () => getReviewQueue({
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
      item_type: typeFilter || undefined,
      domain: domainFilter || undefined,
      status: 'pending',
    }),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveItem(id),
    onMutate: (id) => setProcessing(p => new Set(p).add(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onSettled: (_, __, id) => setProcessing(p => { const n = new Set(p); n.delete(id); return n; }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectItem(id),
    onMutate: (id) => setProcessing(p => new Set(p).add(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onSettled: (_, __, id) => setProcessing(p => { const n = new Set(p); n.delete(id); return n; }),
  });

  const batchApproveMutation = useMutation({
    mutationFn: batchApprove,
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });

  const batchRejectMutation = useMutation({
    mutationFn: batchReject,
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);
  const stats = statsData;

  const toggleSelect = useCallback((id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleSelectAll = () => {
    if (!data || !data.items) return;
    const allIds = data.items.map((i: ReviewQueueItem) => i.id);
    const allSelected = allIds.every((id: string) => selected.has(id));
    if (allSelected) {
      setSelected(s => { const n = new Set(s); allIds.forEach((id: string) => n.delete(id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); allIds.forEach((id: string) => n.add(id)); return n; });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">Quality Control</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            Review Queue
          </h1>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => qc.invalidateQueries({ queryKey: ['review-queue'] })}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.875rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Pending', value: stats.pending, color: 'var(--orange)', bg: 'var(--orange-soft)' },
            { label: 'Approved', value: stats.approved, color: 'var(--green)', bg: 'var(--green-soft)' },
            { label: 'Rejected', value: stats.rejected, color: 'var(--red)', bg: 'var(--red-soft)' },
            { label: 'Total', value: stats.total, color: 'var(--accent)', bg: 'var(--accent-soft)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-sm)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color }}>
                {value?.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="review-filters">
        <select
          className="form-select"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          style={{ minWidth: 140 }}
        >
          <option value="">All Types</option>
          <option value="concept">Concepts</option>
          <option value="relationship">Relationships</option>
        </select>

        <select
          className="form-select"
          value={domainFilter}
          onChange={e => { setDomainFilter(e.target.value); setPage(0); }}
          style={{ minWidth: 200 }}
        >
          <option value="">All Domains</option>
          {stats?.domain_counts && Object.entries(stats.domain_counts).map(([d, c]) => (
            <option key={d} value={d}>
              {d.replace(/^\d+-/, '').replace(/-/g, ' ')} ({c})
            </option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={(data?.items ?? []).length > 0 && (data?.items ?? []).every((i: ReviewQueueItem) => selected.has(i.id))}
            onChange={toggleSelectAll}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {stats && stats.total > 0 && (
        <div style={{
          height: 4, background: 'var(--surface-2)', borderRadius: 999,
          marginBottom: '1.5rem', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(stats.approved / stats.total) * 100}%`,
            background: 'var(--green)',
            borderRadius: 999,
            transition: 'width 0.8s cubic-bezier(0.32,0.72,0,1)',
          }} />
          <div style={{
            height: '100%',
            width: `${(stats.rejected / stats.total) * 100}%`,
            background: 'var(--red)',
            marginTop: -4,
            borderRadius: 999,
            transition: 'width 0.8s cubic-bezier(0.32,0.72,0,1)',
          }} />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              height: 120, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <CheckCircle size={48} style={{ color: 'var(--green)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>All clear!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            No items pending. Adjust filters or run extraction to add more.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data?.items?.map((item: ReviewQueueItem) => (
            <ReviewCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              processing={processing.has(item.id)}
              onSelect={toggleSelect}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            ← Prev
          </button>
          {[...Array(Math.min(7, totalPages))].map((_, i) => {
            const pageNum = Math.max(0, Math.min(totalPages - 7, page - 3)) + i;
            return (
              <button
                key={pageNum}
                className={pageNum === page ? 'active' : ''}
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            Next →
          </button>
        </div>
      )}

      {/* Batch bar */}
      <div className={`batch-bar${selected.size > 0 ? ' visible' : ''}`}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
          {selected.size} selected
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-success btn-sm"
          onClick={() => batchApproveMutation.mutate(Array.from(selected))}
          disabled={batchApproveMutation.isPending}
        >
          <CheckCircle size={14} />
          Approve All
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => batchRejectMutation.mutate(Array.from(selected))}
          disabled={batchRejectMutation.isPending}
        >
          <XCircle size={14} />
          Reject All
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelected(new Set())}
        >
          Clear
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
