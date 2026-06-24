import { type SupabaseClient } from '@supabase/supabase-js';
import { mapChatMessage, mapChatSession } from '@/lib/supabase/vault';

type ChatSessionInsert = {
  user_id: string;
  title: string;
  last_message_at?: string | null;
};

export async function listChatSessions(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapChatSession);
}

export async function getChatMessages(supabase: SupabaseClient, userId: string, sessionId: string) {
  await assertChatSessionOwnership(supabase, userId, sessionId);

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapChatMessage);
}

export async function createChatSession(
  supabase: SupabaseClient,
  userId: string,
  title = 'New chat'
) {
  const payload: ChatSessionInsert = {
    user_id: userId,
    title: title.trim() || 'New chat',
    last_message_at: null,
  };

  const { data, error } = await supabase.from('chat_sessions').insert(payload).select('*').single();

  if (error) {
    throw error;
  }

  return mapChatSession(data);
}

export async function getOrCreateLatestChatSession(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return mapChatSession(data);
  }

  return createChatSession(supabase, userId);
}

export async function assertChatSessionOwnership(supabase: SupabaseClient, userId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Chat session not found');
  }

  return data;
}

export async function touchChatSession(
  supabase: SupabaseClient,
  sessionId: string,
  title?: string,
  lastMessageAt?: string
) {
  const updates: Record<string, string> = {};

  if (title?.trim()) {
    updates.title = title.trim();
  }

  if (lastMessageAt) {
    updates.last_message_at = lastMessageAt;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error } = await supabase.from('chat_sessions').update(updates).eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export function buildChatSessionTitle(query: string) {
  const normalized = query.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return 'New chat';
  }

  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}
