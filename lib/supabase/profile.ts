import { type SupabaseClient } from '@supabase/supabase-js';
import { type DefaultVoiceSpeed, formatRelativeDate, type UserPreferences, type UserProfile } from '@/lib/db';

export const PROFILE_ASSETS_BUCKET = 'profile-assets';
const DEFAULT_PREFERENCES: UserPreferences = {
  brainResponseStyle: 'balanced',
  defaultVoiceSpeed: 1,
  reduceMotion: false,
  compactMode: false,
};

type JsonRecord = Record<string, unknown>;

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_path: string | null;
  preferences: unknown;
  created_at: string;
  updated_at: string;
};

type MinimalUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
  };
};

export function normalizeUserPreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PREFERENCES;
  }

  const raw = value as JsonRecord;
  const defaultVoiceSpeed = normalizeVoiceSpeed(raw.defaultVoiceSpeed);
  const brainResponseStyle = normalizeBrainResponseStyle(raw.brainResponseStyle);

  return {
    brainResponseStyle,
    defaultVoiceSpeed,
    reduceMotion: raw.reduceMotion === true,
    compactMode: raw.compactMode === true,
  };
}

export function getDefaultUserPreferences() {
  return { ...DEFAULT_PREFERENCES };
}

export function mapUserProfile(row: ProfileRow, avatarUrl?: string): UserProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    fullName: row.full_name ?? undefined,
    avatarPath: row.avatar_path ?? undefined,
    avatarUrl,
    preferences: normalizeUserPreferences(row.preferences),
    createdAt: formatRelativeDate(row.created_at),
    updatedAt: formatRelativeDate(row.updated_at),
  };
}

export async function getOrCreateProfile(supabase: SupabaseClient, user: MinimalUser) {
  const { data: existing, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existing) {
    return existing as ProfileRow;
  }

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name?.trim() || null,
      preferences: getDefaultUserPreferences(),
    })
    .select('*')
    .single();

  if (createError) {
    throw createError;
  }

  return created as ProfileRow;
}

export async function getProfileWithAvatarUrl(supabase: SupabaseClient, user: MinimalUser) {
  const row = await getOrCreateProfile(supabase, user);
  const avatarUrl = row.avatar_path ? await createSignedAvatarUrl(supabase, row.avatar_path) : undefined;
  return mapUserProfile(row, avatarUrl);
}

export async function createSignedAvatarUrl(supabase: SupabaseClient, avatarPath: string) {
  const { data, error } = await supabase.storage
    .from(PROFILE_ASSETS_BUCKET)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    console.error('Failed to create avatar signed URL:', error);
    return undefined;
  }

  return data?.signedUrl;
}

function normalizeVoiceSpeed(value: unknown): DefaultVoiceSpeed {
  if (value === 1 || value === 1.25 || value === 1.5) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (parsed === 1 || parsed === 1.25 || parsed === 1.5) {
      return parsed;
    }
  }

  return DEFAULT_PREFERENCES.defaultVoiceSpeed;
}

function normalizeBrainResponseStyle(value: unknown): UserPreferences['brainResponseStyle'] {
  return value === 'concise' || value === 'balanced' || value === 'detailed'
    ? value
    : DEFAULT_PREFERENCES.brainResponseStyle;
}
