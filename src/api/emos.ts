const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Stats ────────────────────────────────────────────────────────────────────
export interface DBStats {
  sources: number;
  concepts: number;
  chunks: number;
  evidence: number;
  relationships: number;
  review_queue: number;
}

export const getStats = () => apiFetch<DBStats>('/stats');

// ── Review ───────────────────────────────────────────────────────────────────
export interface ConceptSummary {
  id: string;
  slug: string;
  concept_name: string;
  layer: string;
  domain: string;
  definition: string;
  purpose: string;
  quality_status: string;
  tags: string[];
}

export interface EvidenceItem {
  finding: string;
  evidence_level: string;
  source_type: string;
  applicability: string | null;
}

export interface RelationshipItem {
  id: string;
  from_concept: string;
  from_name: string;
  to_concept: string;
  to_name: string;
  relationship_type: string;
  explanation: string;
  status: string;
}

export interface ReviewQueueItem {
  id: string;
  item_type: 'concept' | 'relationship';
  item_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  concept?: ConceptSummary;
  evidence?: EvidenceItem[];
  relationship_count?: number;
  relationship?: RelationshipItem;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  pending_concepts: number;
  pending_relationships: number;
  domain_counts: Record<string, number>;
  rel_type_counts: Record<string, number>;
}

export interface PaginatedReview {
  items: ReviewQueueItem[];
  total: number;
  offset: number;
  limit: number;
}

export const getReviewStats = () => apiFetch<ReviewStats>('/review/stats');

export const getReviewQueue = (params: {
  offset?: number;
  limit?: number;
  item_type?: string;
  domain?: string;
  status?: string;
}) => {
  const q = new URLSearchParams();
  if (params.offset != null) q.set('offset', String(params.offset));
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.item_type) q.set('item_type', params.item_type);
  if (params.domain) q.set('domain', params.domain);
  if (params.status) q.set('status', params.status);
  return apiFetch<PaginatedReview>(`/review?${q.toString()}`);
};

export const approveItem = (id: string, notes?: string) =>
  apiFetch<{ status: string }>(`/review/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const rejectItem = (id: string, notes?: string) =>
  apiFetch<{ status: string }>(`/review/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

export const batchApprove = (ids: string[]) =>
  apiFetch<{ approved: number; errors: unknown[] }>('/review/batch/approve', {
    method: 'POST',
    body: JSON.stringify({ item_ids: ids }),
  });

export const batchReject = (ids: string[]) =>
  apiFetch<{ rejected: number; errors: unknown[] }>('/review/batch/reject', {
    method: 'POST',
    body: JSON.stringify({ item_ids: ids }),
  });

// ── Concepts ─────────────────────────────────────────────────────────────────
export const getConcepts = (params: { offset?: number; limit?: number; domain?: string; layer?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.offset != null) q.set('offset', String(params.offset));
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.domain) q.set('domain', params.domain);
  if (params.layer) q.set('layer', params.layer);
  return apiFetch<{ concepts: ConceptSummary[]; total: number }>(`/concepts?${q.toString()}`);
};

export interface ConceptEvidenceItem {
  id: string;
  finding: string;
  evidence_level: string;
  source_type: string;
  applicability: string | null;
}

export interface ConceptRelationship {
  id: string;
  from_concept_id: string;
  to_concept_id: string;
  from_name: string;
  to_name: string;
  relationship_type: string;
  explanation: string;
}

export interface ConceptDetail extends ConceptSummary {
  limitations: string;
  common_mistakes: string;
  version: number;
  evidence: ConceptEvidenceItem[];
  relationships: ConceptRelationship[];
}

export const getConceptDetail = (conceptId: string) =>
  apiFetch<ConceptDetail>(`/concepts/${conceptId}`);

// ── Relationships ─────────────────────────────────────────────────────────────
export const getRelationships = (params: { offset?: number; limit?: number; rel_type?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.offset != null) q.set('offset', String(params.offset));
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.rel_type) q.set('rel_type', params.rel_type);
  return apiFetch<{ relationships: RelationshipItem[]; total: number }>(`/relationships?${q.toString()}`);
};

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchResult {
  concept_id: string;
  slug: string;
  concept_name: string;
  layer: string;
  domain: string;
  definition: string;
  score: number;
  matched_on: string;
}

export const searchConcepts = (query: string) =>
  apiFetch<{ results: SearchResult[]; query: string }>(`/search?query=${encodeURIComponent(query)}`);

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  sources?: { name: string; finding: string; url?: string }[];
}

export interface ChatResponse {
  response: string;
  thinking: string;
  sources: { name: string; finding: string; url?: string }[];
  diagnosis?: Record<string, unknown>;
  concepts?: { slug: string; distance: number }[];
  evidence?: Record<string, unknown>[];
  priority_guide?: {
    priority_concepts: { slug: string; reason: string; score: number }[];
    concepts_to_defer: { slug: string; reason: string }[];
    context_gaps: string[];
    stage: string;
    layer_priority: string[];
  };
  scores?: {
    knowledge: number;
    reasoning: number;
    context_match: number;
    practical_utility: number;
    communication: number;
    overall: number;
    flags: string[];
    missing: string[];
  };
  memory?: {
    facts: string[];
    discussed_concepts: string[];
    turn_count: number;
    session_id: string;
  };
}

export const postChat = (
  message: string,
  history: ChatMessage[],
  context?: Record<string, string>,
  sessionId?: string,
  userId?: string,
) =>
  apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, context, session_id: sessionId, user_id: userId }),
  });

export const resetSession = (sessionId: string, clearPersistent = false, userId = 'default') =>
  apiFetch<{ status: string; session_id: string; user_id: string; persistent_cleared: boolean }>(
    `/chat/reset/${encodeURIComponent(sessionId)}?clear_persistent=${clearPersistent}&user_id=${encodeURIComponent(userId)}`,
    { method: 'POST' },
  );

export const listSessions = () =>
  apiFetch<{ sessions: { session_id: string; facts_count: number; discussed_count: number; last_active: number; turn_count: number }[] }>('/chat/sessions');
