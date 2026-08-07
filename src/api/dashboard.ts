/**
 * Dashboard API — direct Supabase client calls for user-owned data.
 * All functions are user-scoped via RLS (Row Level Security).
 */
import { supabase } from '../lib/supabase';
import type {
  ChatSession,
  ChatMessageRecord,
  Bookmark,
  ContextProfile,
  DashboardStats,
  ContextSnapshot,
  ChatSource,
} from '../types/api';

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ChatSession[]) ?? [];
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error) return null;
  return data as ChatSession;
}

export async function createSession(
  userId: string,
  title: string,
  contextSnapshot?: ContextSnapshot,
): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title,
      context_snapshot: contextSnapshot ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChatSession;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<ChatSession, 'title' | 'context_snapshot' | 'discussed_concepts' | 'turn_count'>>,
): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

export async function touchSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) console.warn('[dashboard] touchSession:', error.message);
}

// ── Messages ───────────────────────────────────────────────────────────────────

export async function listMessages(sessionId: string): Promise<ChatMessageRecord[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ChatMessageRecord[]) ?? [];
}

export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: ChatSource[],
  qualityScore?: number,
): Promise<ChatMessageRecord> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      sources: sources ?? null,
      quality_score: qualityScore ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChatMessageRecord;
}

export async function getLastMessage(sessionId: string): Promise<ChatMessageRecord | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) return null;
  const rows = (data as ChatMessageRecord[]) ?? [];
  return rows[0] ?? null;
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

export async function listBookmarks(): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Bookmark[]) ?? [];
}

export async function addBookmark(
  userId: string,
  conceptId: string,
  conceptSlug: string,
  conceptName: string,
  domain: string,
  layer: string,
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .upsert(
      { user_id: userId, concept_id: conceptId, concept_slug: conceptSlug,
        concept_name: conceptName, domain, layer },
      { onConflict: 'user_id,concept_id' },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Bookmark;
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId);
  if (error) throw new Error(error.message);
}

export async function updateBookmarkNotes(
  bookmarkId: string,
  notes: string,
): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .update({ notes })
    .eq('id', bookmarkId);
  if (error) throw new Error(error.message);
}

export async function isBookmarked(conceptId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('concept_id', conceptId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ── Context Profiles ───────────────────────────────────────────────────────────

export async function listContextProfiles(): Promise<ContextProfile[]> {
  const { data, error } = await supabase
    .from('context_profiles')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ContextProfile[]) ?? [];
}

export async function createContextProfile(
  profile: Omit<ContextProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
): Promise<ContextProfile> {
  const { data, error } = await supabase
    .from('context_profiles')
    .insert(profile)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ContextProfile;
}

export async function updateContextProfile(
  profileId: string,
  updates: Partial<Omit<ContextProfile, 'id' | 'user_id' | 'created_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('context_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (error) throw new Error(error.message);
}

export async function deleteContextProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('context_profiles')
    .delete()
    .eq('id', profileId);
  if (error) throw new Error(error.message);
}

export async function setDefaultProfile(profileId: string): Promise<void> {
  // Unset all defaults for this user, then set the new one
  const { error: unsetError } = await supabase
    .from('context_profiles')
    .update({ is_default: false })
    .eq('is_default', true);
  if (unsetError) throw new Error(unsetError.message);

  const { error: setError } = await supabase
    .from('context_profiles')
    .update({ is_default: true })
    .eq('id', profileId);
  if (setError) throw new Error(setError.message);
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return { total_sessions: 0, total_bookmarks: 0, concepts_explored: 0, last_active: null };

  const [{ count: sessions }, { count: bookmarks }] = await Promise.all([
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
  ]);

  return {
    total_sessions: sessions ?? 0,
    total_bookmarks: bookmarks ?? 0,
    concepts_explored: 0, // computed from discussed_concepts union
    last_active: null,
  };
}
