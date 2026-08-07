// ── API Response Envelope ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
}

// ── Domain types ───────────────────────────────────────────────────────────────
export interface Domain {
  id: number;
  name: string;
  description: string;
  concept_count: number;
}

export interface PublicConceptSummary {
  id: string;
  slug: string;
  name: string;
  layer: string;
  layer_label: string;
  domain: string;
  domain_label: string;
  definition: string;
  purpose: string;
  evidence_count: number;
  source_count: number;
}

export interface PublicConceptDetail extends PublicConceptSummary {
  limitations: string;
  common_mistakes: string;
  evidence: EvidenceItem[];
  relationships: RelationshipItem[];
  tags: string[];
}

export interface EvidenceItem {
  id: string;
  finding: string;
  evidence_level: 'high' | 'medium' | 'low';
  source_type: string;
  source_title: string;
  source_year: number | null;
  applicability: 'universal' | 'african' | 'kenya-specific' | null;
}

export interface RelationshipItem {
  id: string;
  concept_slug: string;
  concept_name: string;
  relationship_type: 'extends' | 'prerequisite' | 'contrasts' | 'related';
  explanation: string;
}

export interface PublicSearchResult {
  concept_id: string;
  slug: string;
  name: string;
  layer: string;
  domain: string;
  definition: string;
  score: number;
  matched_on: string;
  evidence_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  sources?: ChatSource[];
}

export interface ChatSource {
  name: string;
  finding: string;
  url?: string;
}

export interface ChatResponse {
  response: string;
  thinking: string;
  sources: ChatSource[];
  diagnosis?: Record<string, unknown>;
  concepts?: { slug: string; distance: number }[];
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
    user_id: string;
  };
}

// ── Dashboard types ───────────────────────────────────────────────────────────

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  context_snapshot: ContextSnapshot | null;
  discussed_concepts: string[] | null;
  turn_count: number;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[] | null;
  quality_score: number | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  concept_id: string;
  concept_slug: string;
  concept_name: string;
  domain: string;
  layer: string;
  notes: string | null;
  created_at: string;
  evidence_count?: number;
}

export interface ContextProfile {
  id: string;
  user_id: string;
  name: string;
  budget: string | null;
  audience: string | null;
  product_type: string | null;
  location: string | null;
  objective: string | null;
  stage: string | null;
  is_default: boolean;
  created_at: string;
}

export type ContextSnapshot = {
  budget?: string;
  audience?: string;
  product_type?: string;
  location?: string;
  objective?: string;
  stage?: string;
};

export interface DashboardStats {
  total_sessions: number;
  total_bookmarks: number;
  concepts_explored: number;
  last_active: string | null;
}


// ── Auth types ─────────────────────────────────────────────────────────────────
export interface PublicUser {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: PublicUser;
  expires_at: number;
}
