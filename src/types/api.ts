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
